import { NextResponse } from "next/server";
import {
  candidateMediaStoragePath,
  downloadTelegramPhoto,
  getTelegramTransferKey,
  selectLargestTelegramPhoto,
  TELEGRAM_MEDIA_BUCKET,
  telegramPhotoFingerprint,
} from "@/lib/inventory/telegram-media";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const botToken = () => process.env.TELEGRAM_IMPORT_BOT_TOKEN?.trim();

function asRecord(value: unknown): Record<string, unknown> | null {
  return Boolean(value) && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

async function sendMessage(chatId: number | string, text: string) {
  const token = botToken();
  if (!token) throw new Error("Missing TELEGRAM_IMPORT_BOT_TOKEN");

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error("Telegram acknowledgement failed");
}

export async function POST(request: Request) {
  const token = botToken();
  if (!token || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  let update: Record<string, unknown>;
  try {
    update = asRecord(await request.json()) ?? {};
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const message = asRecord(update.message) ?? asRecord(update.edited_message);
  const chat = asRecord(message?.chat);
  const chatId = chat?.id;

  if (!message || (typeof chatId !== "number" && typeof chatId !== "string")) {
    return NextResponse.json({ ok: true });
  }

  const text =
    (typeof message.text === "string" ? message.text.trim() : "") ||
    (typeof message.caption === "string" ? message.caption.trim() : "");
  const photo = selectLargestTelegramPhoto(message.photo);
  if (!text && !photo) return NextResponse.json({ ok: true });

  const updateId =
    typeof update.update_id === "number" && Number.isSafeInteger(update.update_id)
      ? String(update.update_id)
      : crypto.randomUUID();
  const { sourceItemId, mediaGroupId, idempotencyKey } = getTelegramTransferKey(message, updateId);
  const supabase = createSupabaseAdmin();

  const { data: source, error: sourceError } = await supabase
    .from("listing_sources")
    .upsert(
      {
        source_type: "external_indexed",
        name: "Telegram forwarded ads",
        slug: "telegram-forwarded",
        platform: "telegram",
        permission_basis: "owner_forwarded_message",
        ingest_method: "webhook",
        status: "active",
        kill_switch_enabled: false,
      },
      { onConflict: "slug" },
    )
    .select("id")
    .single();

  if (sourceError || !source) return NextResponse.json({ ok: false }, { status: 500 });

  const { data: job, error: jobError } = await supabase
    .from("listing_ingest_jobs")
    .upsert(
      {
        source_id: source.id,
        source_type: "external_indexed",
        source_version: "telegram-webhook-v2",
        idempotency_key: idempotencyKey,
        status: "awaiting_approval",
        dry_run: true,
        total_rows: 1,
        accepted_rows: 1,
      },
      { onConflict: "source_type,idempotency_key" },
    )
    .select("id")
    .single();

  if (jobError || !job) return NextResponse.json({ ok: false }, { status: 500 });

  const title = text.split("\n")[0]?.slice(0, 120) || "Telegram forwarded ad";
  const initialPayload: Record<string, unknown> = {
    title,
    description: text,
    source_platform: "telegram",
    photo_count: 0,
    ...(mediaGroupId ? { media_group_id: mediaGroupId } : {}),
  };

  const { error: insertError } = await supabase
    .from("listing_ingest_candidates")
    .upsert(
      {
        job_id: job.id,
        source_id: source.id,
        row_number: 1,
        source_item_id: sourceItemId,
        idempotency_key: idempotencyKey,
        status: "needs_review",
        raw_payload: update,
        normalized_payload: initialPayload,
        normalized_title: title,
      },
      { onConflict: "job_id,idempotency_key", ignoreDuplicates: true },
    );
  if (insertError) return NextResponse.json({ ok: false }, { status: 500 });

  const { data: candidate, error: candidateError } = await supabase
    .from("listing_ingest_candidates")
    .select("id,raw_payload,normalized_payload,normalized_title")
    .eq("job_id", job.id)
    .eq("idempotency_key", idempotencyKey)
    .single();
  if (candidateError || !candidate) return NextResponse.json({ ok: false }, { status: 500 });

  const existingPayload = asRecord(candidate.normalized_payload) ?? {};
  const existingRawPayload = asRecord(candidate.raw_payload) ?? {};
  const existingMessage = asRecord(existingRawPayload.message) ?? asRecord(existingRawPayload.edited_message);
  const existingText =
    (typeof existingMessage?.text === "string" ? existingMessage.text.trim() : "") ||
    (typeof existingMessage?.caption === "string" ? existingMessage.caption.trim() : "");
  const mergedPayload = {
    ...existingPayload,
    source_platform: "telegram",
    ...(mediaGroupId ? { media_group_id: mediaGroupId } : {}),
    ...(text ? { title, description: text } : {}),
  };

  const { error: mergeError } = await supabase
    .from("listing_ingest_candidates")
    .update({
      status: "needs_review",
      normalized_payload: mergedPayload,
      normalized_title: text ? title : candidate.normalized_title,
      ...(!existingText && text ? { raw_payload: update, source_item_id: sourceItemId } : {}),
    })
    .eq("id", candidate.id);
  if (mergeError) return NextResponse.json({ ok: false }, { status: 500 });

  if (photo) {
    let storagePath: string | null = null;
    try {
      const downloaded = await downloadTelegramPhoto(token, photo.fileId);
      const fingerprint = telegramPhotoFingerprint(photo);
      storagePath = candidateMediaStoragePath(candidate.id, sourceItemId, fingerprint, downloaded.extension);
      const { error: uploadError } = await supabase.storage
        .from(TELEGRAM_MEDIA_BUCKET)
        .upload(storagePath, downloaded.bytes, {
          cacheControl: "3600",
          contentType: downloaded.contentType,
          upsert: true,
        });
      if (uploadError) throw new Error("Candidate photo upload failed");

      const sortOrder = Number.parseInt(sourceItemId, 10);
      const { error: mediaError } = await supabase
        .from("listing_ingest_candidate_media")
        .upsert(
          {
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
          },
          { onConflict: "candidate_id,source_platform,source_item_id" },
        );
      if (mediaError) {
        await supabase.storage.from(TELEGRAM_MEDIA_BUCKET).remove([storagePath]);
        throw new Error("Candidate photo metadata write failed");
      }
    } catch {
      return NextResponse.json({ ok: false }, { status: 502 });
    }
  }

  if (text || !mediaGroupId) {
    await sendMessage(chatId, "آگهی دریافت و برای بررسی ادمین ذخیره شد.").catch(() => undefined);
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "telegram-import-webhook" });
}
