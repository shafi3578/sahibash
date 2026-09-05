"use server";

import { revalidatePath } from "next/cache";
import { recordAuditEvent } from "@/lib/audit";
import { requireSuperAdministrator } from "@/lib/auth";

function productionOrigin() {
  const configured = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
    || process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured) return null;
  try {
    const url = new URL(configured.startsWith("http") ? configured : `https://${configured}`);
    if (url.protocol !== "https:" || url.username || url.password || url.pathname !== "/") return null;
    return url.origin;
  } catch {
    return null;
  }
}

export async function configureTelegramImportWebhookAction() {
  const actor = await requireSuperAdministrator();
  const token = process.env.TELEGRAM_IMPORT_BOT_TOKEN?.trim();
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  const origin = productionOrigin();
  const allowedChatIds = (process.env.TELEGRAM_IMPORT_ALLOWED_CHAT_IDS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (!token || !secret || secret.length < 16 || !origin || allowedChatIds.length === 0) {
    throw new Error("Telegram intake is not fully configured");
  }

  const webhookUrl = new URL("/api/telegram/webhook", origin).toString();
  const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      secret_token: secret,
      allowed_updates: ["message", "edited_message", "channel_post", "edited_channel_post"],
      drop_pending_updates: false,
      max_connections: 20,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  const result = await response.json().catch(() => null) as { ok?: unknown } | null;
  if (!response.ok || result?.ok !== true) throw new Error("Telegram webhook configuration failed");

  const audit = await recordAuditEvent({
    adminUserId: actor.id,
    action: "SETTING_CHANGED",
    entityType: "telegram_import_webhook",
    entityId: new URL(webhookUrl).hostname,
    safeChanges: { operation: "configured", target_origin: origin },
  });
  if (!audit.ok) throw new Error("Telegram webhook audit failed");
  revalidatePath("/admin/inventory");
}
