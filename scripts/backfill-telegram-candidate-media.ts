import {
  candidateMediaStoragePath,
  downloadTelegramPhoto,
  selectLargestTelegramPhoto,
  TELEGRAM_MEDIA_BUCKET,
  telegramPhotoFingerprint,
} from "../lib/inventory/telegram-media";
import { createSupabaseAdmin } from "../lib/supabase/admin";

const candidateId = process.argv[2];
const token = process.env.TELEGRAM_IMPORT_BOT_TOKEN?.trim();
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function asRecord(value: unknown): Record<string, unknown> | null {
  return Boolean(value) && typeof value === "object" ? value as Record<string, unknown> : null;
}

async function main() {
  if (!candidateId || !UUID_PATTERN.test(candidateId)) throw new Error("A valid candidate UUID is required");
  if (!token) throw new Error("TELEGRAM_IMPORT_BOT_TOKEN is not configured");

  const supabase = createSupabaseAdmin();
  const { data: candidate, error: candidateError } = await supabase
    .from("listing_ingest_candidates")
    .select("id,source_item_id,raw_payload")
    .eq("id", candidateId)
    .single();
  if (candidateError || !candidate) throw new Error("Candidate was not found");

  const raw = asRecord(candidate.raw_payload);
  const message = asRecord(raw?.message) ?? asRecord(raw?.edited_message);
  const photo = selectLargestTelegramPhoto(message?.photo);
  if (!photo) throw new Error("The candidate has no recoverable Telegram photo reference");

  const sourceItemId =
    typeof message?.message_id === "number" && Number.isSafeInteger(message.message_id)
      ? String(message.message_id)
      : candidate.source_item_id;
  if (!sourceItemId) throw new Error("The candidate source item is missing");

  const downloaded = await downloadTelegramPhoto(token, photo.fileId);
  const fingerprint = telegramPhotoFingerprint(photo);
  const storagePath = candidateMediaStoragePath(candidate.id, sourceItemId, fingerprint, downloaded.extension);
  const { error: uploadError } = await supabase.storage
    .from(TELEGRAM_MEDIA_BUCKET)
    .upload(storagePath, downloaded.bytes, {
      cacheControl: "3600",
      contentType: downloaded.contentType,
      upsert: true,
    });
  if (uploadError) throw new Error("Photo upload failed");

  const sortOrder = Number.parseInt(sourceItemId, 10);
  const { error: mediaError } = await supabase
    .from("listing_ingest_candidate_media")
    .upsert({
      candidate_id: candidate.id,
      source_platform: "telegram",
      source_item_id: sourceItemId,
      source_file_fingerprint: fingerprint,
      storage_bucket: TELEGRAM_MEDIA_BUCKET,
      storage_path: storagePath,
      mime_type: downloaded.contentType,
      byte_size: downloaded.bytes.byteLength,
      width: photo.width,
      height: photo.height,
      sort_order: Number.isSafeInteger(sortOrder) ? sortOrder : 0,
      updated_at: new Date().toISOString(),
    }, { onConflict: "candidate_id,source_platform,source_item_id" });

  if (mediaError) {
    await supabase.storage.from(TELEGRAM_MEDIA_BUCKET).remove([storagePath]);
    throw new Error("Photo metadata write failed");
  }

  console.log(`Recovered one stored photo for candidate ${candidate.id}.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Telegram photo recovery failed");
  process.exitCode = 1;
});
