import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const botToken = () => process.env.TELEGRAM_IMPORT_BOT_TOKEN?.trim();

async function sendMessage(chatId: number | string, text: string) {
  const token = botToken();
  if (!token) throw new Error("Missing TELEGRAM_IMPORT_BOT_TOKEN");

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
    cache: "no-store",
  });
}

export async function POST(request: Request) {
  if (!botToken() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  let update: Record<string, unknown>;
  try {
    update = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const message =
    (update.message as Record<string, unknown> | undefined) ??
    (update.edited_message as Record<string, unknown> | undefined);

  const chat = message?.chat as Record<string, unknown> | undefined;
  const chatId = chat?.id as number | string | undefined;

  if (!message || !chatId) return NextResponse.json({ ok: true });

  const text =
    (typeof message.text === "string" ? message.text : "") ||
    (typeof message.caption === "string" ? message.caption : "");

  const photos = Array.isArray(message.photo) ? message.photo : [];

  if (!text && photos.length > 0) {
    return NextResponse.json({ ok: true });
  }

  const updateId =
    typeof update.update_id === "number"
      ? String(update.update_id)
      : crypto.randomUUID();

  const sourceItemId =
    typeof message.message_id === "number"
      ? String(message.message_id)
      : updateId;

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

  if (sourceError || !source) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  const { data: job, error: jobError } = await supabase
    .from("listing_ingest_jobs")
    .upsert(
      {
        source_id: source.id,
        source_type: "external_indexed",
        source_version: "telegram-webhook-v1",
        idempotency_key: `telegram:${updateId}`,
        status: "awaiting_approval",
        dry_run: true,
        total_rows: 1,
        accepted_rows: 1,
      },
      { onConflict: "source_type,idempotency_key" },
    )
    .select("id")
    .single();

  if (jobError || !job) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  const title = text.split("\\n")[0]?.slice(0, 120) || "Telegram forwarded ad";

  const { error: candidateError } = await supabase
    .from("listing_ingest_candidates")
    .upsert(
      {
        job_id: job.id,
        source_id: source.id,
        row_number: 1,
        source_item_id: sourceItemId,
        idempotency_key: `telegram:${sourceItemId}`,
        status: "needs_review",
        raw_payload: update,
        normalized_payload: {
          title,
          description: text,
          source_platform: "telegram",
          photo_count: photos.length,
        },
        normalized_title: title,
      },
      { onConflict: "job_id,idempotency_key" },
    );

  if (candidateError) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  await sendMessage(chatId, "آگهی دریافت و برای بررسی ادمین ذخیره شد.");

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "telegram-import-webhook",
  });
}
