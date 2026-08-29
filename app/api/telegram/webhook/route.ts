import { NextResponse } from "next/server";

export const runtime = "nodejs";

const token = () => process.env.TELEGRAM_IMPORT_BOT_TOKEN?.trim();

async function reply(chatId: number | string, text: string) {
  const botToken = token();
  if (!botToken) throw new Error("Missing TELEGRAM_IMPORT_BOT_TOKEN");
  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Telegram sendMessage failed: ${response.status}`);
}

export async function POST(request: Request) {
  if (!token()) return NextResponse.json({ ok: false, error: "Telegram import bot is not configured" }, { status: 503 });
  let update: Record<string, unknown>;
  try { update = (await request.json()) as Record<string, unknown>; }
  catch { return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 }); }
  const message = (update.message as Record<string, unknown> | undefined) ?? (update.edited_message as Record<string, unknown> | undefined);
  const chat = message?.chat as Record<string, unknown> | undefined;
  const chatId = chat?.id as number | string | undefined;
  if (!chatId) return NextResponse.json({ ok: true });
  const text = (typeof message?.text === "string" && message.text) || (typeof message?.caption === "string" && message.caption) || "";
  try {
    await reply(chatId, text ? "آگهی دریافت شد. در مرحلهٔ بعد اطلاعات آن برای بررسی در Sahibash آماده می‌شود." : "پیام دریافت شد؛ لطفاً آگهی را همراه با متن یا توضیحات ارسال کن.");
  } catch (error) { console.error("Telegram webhook reply failed", error); return NextResponse.json({ ok: false }, { status: 502 }); }
  return NextResponse.json({ ok: true });
}

export async function GET() { return NextResponse.json({ ok: true, service: "telegram-import-webhook" }); }
