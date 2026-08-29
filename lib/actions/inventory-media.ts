"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import {
  candidateMediaStoragePath,
  downloadTelegramPhoto,
  selectLargestTelegramPhoto,
  TELEGRAM_MEDIA_BUCKET,
  telegramPhotoFingerprint,
} from "@/lib/inventory/telegram-media";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function asRecord(value: unknown): Record<string, unknown> | null {
  return Boolean(value) && typeof value === "object" ? value as Record<string, unknown> : null;
}

export type TelegramPhotoRecoveryState = {
  status: "idle" | "success" | "error";
  code: "idle" | "recovered" | "unavailable" | "configuration" | "storage" | "failed";
};

export async function recoverTelegramCandidatePhoto(
  candidateId: string,
  _previousState: TelegramPhotoRecoveryState,
): Promise<TelegramPhotoRecoveryState> {
  void _previousState;
  await requirePermission("listings.moderate");
  if (!UUID_PATTERN.test(candidateId)) return { status: "error", code: "failed" };

  const token = process.env.TELEGRAM_IMPORT_BOT_TOKEN?.trim();
  if (!token) return { status: "error", code: "configuration" };
  const supabase = createSupabaseAdmin();
  const { data: candidate, error: candidateError } = await supabase
    .from("listing_ingest_candidates")
    .select("id,source_item_id,raw_payload,normalized_payload")
    .eq("id", candidateId)
    .single();
  if (candidateError || !candidate) return { status: "error", code: "failed" };

  const payload = asRecord(candidate.normalized_payload);
  if (payload?.source_platform !== "telegram") return { status: "error", code: "failed" };
  const raw = asRecord(candidate.raw_payload);
  const message = asRecord(raw?.message) ?? asRecord(raw?.edited_message);
  const photo = selectLargestTelegramPhoto(message?.photo);
  if (!photo) return { status: "error", code: "unavailable" };

  const sourceItemId =
    typeof message?.message_id === "number" && Number.isSafeInteger(message.message_id)
      ? String(message.message_id)
      : candidate.source_item_id;
  if (!sourceItemId) return { status: "error", code: "failed" };

  const downloaded = await downloadTelegramPhoto(token, photo.fileId).catch(() => null);
  if (!downloaded) return { status: "error", code: "unavailable" };
  const fingerprint = telegramPhotoFingerprint(photo);
  const storagePath = candidateMediaStoragePath(candidate.id, sourceItemId, fingerprint, downloaded.extension);
  const { error: uploadError } = await supabase.storage
    .from(TELEGRAM_MEDIA_BUCKET)
    .upload(storagePath, downloaded.bytes, {
      cacheControl: "3600",
      contentType: downloaded.contentType,
      upsert: true,
    });
  if (uploadError) return { status: "error", code: "storage" };

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
    return { status: "error", code: "storage" };
  }

  revalidatePath(`/admin/inventory/candidates/${candidateId}`);
  return { status: "success", code: "recovered" };
}
