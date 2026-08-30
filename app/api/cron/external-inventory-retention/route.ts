import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 300;

const BATCH_SIZE = 100;
const PUBLIC_LISTING_BUCKET = "listing-images";

type DueListing = {
  listing_id: string;
  candidate_id: string | null;
};

type StaleCandidate = {
  candidate_id: string;
};

type StorageObject = {
  storage_bucket: string;
  storage_path: string;
};

type TelegramWebhookStatus = "configured" | "not_configured" | "failed";

function hasValidCronAuthorization(request: Request) {
  const secret = process.env.CRON_SECRET?.trim() ?? "";
  const authorization = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  if (secret.length < 32 || authorization.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(authorization), Buffer.from(expected));
}

async function removeStorageObjects(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  objects: StorageObject[],
) {
  const byBucket = new Map<string, string[]>();
  for (const object of objects) {
    if (!object.storage_bucket || !object.storage_path) continue;
    const current = byBucket.get(object.storage_bucket) ?? [];
    current.push(object.storage_path);
    byBucket.set(object.storage_bucket, current);
  }

  for (const [bucket, paths] of byBucket) {
    const { error } = await supabase.storage.from(bucket).remove([...new Set(paths)]);
    if (error) return false;
  }
  return true;
}

async function candidateMedia(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  candidateId: string | null,
) {
  if (!candidateId) return [] as StorageObject[];
  const { data, error } = await supabase
    .from("listing_ingest_candidate_media")
    .select("storage_bucket,storage_path")
    .eq("candidate_id", candidateId);
  if (error) throw new Error("Candidate retention media lookup failed");
  return (data ?? []) as StorageObject[];
}

async function ensureTelegramWebhook(request: Request): Promise<TelegramWebhookStatus> {
  const token = process.env.TELEGRAM_IMPORT_BOT_TOKEN?.trim();
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  const allowedChatIds = (process.env.TELEGRAM_IMPORT_ALLOWED_CHAT_IDS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (!token || !secret || secret.length < 16 || allowedChatIds.length === 0) {
    return "not_configured";
  }

  try {
    const webhookUrl = new URL("/api/telegram/webhook", request.url).toString();
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
    if (!response.ok) return "failed";
    const body = await response.json() as { ok?: unknown };
    return body.ok === true ? "configured" : "failed";
  } catch {
    return "failed";
  }
}

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || process.env.CRON_SECRET.trim().length < 32) {
    return NextResponse.json({ ok: false, code: "not_configured" }, { status: 503 });
  }
  if (!hasValidCronAuthorization(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();
  const telegramWebhook = await ensureTelegramWebhook(request);
  const result = {
    expired: 0,
    deleted: 0,
    scrubbed: 0,
    staleCandidatesDeleted: 0,
    failed: 0,
    telegramWebhook,
  };
  if (telegramWebhook === "failed") result.failed += 1;

  const { data: dueData, error: dueError } = await supabase.rpc(
    "expire_due_forwarded_external_ads",
    { p_limit: BATCH_SIZE },
  );
  if (dueError) {
    return NextResponse.json({ ok: false, code: "expire_failed" }, { status: 500 });
  }

  const dueListings = (dueData ?? []) as DueListing[];
  result.expired = dueListings.length;
  for (const due of dueListings) {
    try {
      const [{ data: images, error: imageError }, retainedCandidateMedia] = await Promise.all([
        supabase
          .from("listing_images")
          .select("storage_path")
          .eq("listing_id", due.listing_id),
        candidateMedia(supabase, due.candidate_id),
      ]);
      if (imageError) throw new Error("Listing retention media lookup failed");

      const publicObjects: StorageObject[] = (images ?? []).map((image) => ({
        storage_bucket: PUBLIC_LISTING_BUCKET,
        storage_path: String(image.storage_path ?? ""),
      }));
      if (!(await removeStorageObjects(supabase, [...publicObjects, ...retainedCandidateMedia]))) {
        result.failed += 1;
        continue;
      }

      const { data: disposition, error: purgeError } = await supabase.rpc(
        "purge_expired_forwarded_external_ad",
        { p_listing_id: due.listing_id },
      );
      if (purgeError || (disposition !== "deleted" && disposition !== "scrubbed" && disposition !== "missing")) {
        result.failed += 1;
        continue;
      }
      if (disposition === "deleted") result.deleted += 1;
      if (disposition === "scrubbed") result.scrubbed += 1;
    } catch {
      result.failed += 1;
    }
  }

  const { data: staleData, error: staleError } = await supabase.rpc(
    "get_stale_forwarded_candidate_ids",
    { p_limit: BATCH_SIZE },
  );
  if (staleError) {
    return NextResponse.json({ ok: false, code: "candidate_scan_failed", ...result }, { status: 500 });
  }

  for (const stale of (staleData ?? []) as StaleCandidate[]) {
    try {
      const media = await candidateMedia(supabase, stale.candidate_id);
      if (!(await removeStorageObjects(supabase, media))) {
        result.failed += 1;
        continue;
      }
      const { data: purged, error } = await supabase.rpc("purge_stale_forwarded_candidate", {
        p_candidate_id: stale.candidate_id,
      });
      if (error || purged !== true) {
        result.failed += 1;
        continue;
      }
      result.staleCandidatesDeleted += 1;
    } catch {
      result.failed += 1;
    }
  }

  return NextResponse.json({ ok: result.failed === 0, ...result }, {
    status: result.failed === 0 ? 200 : 207,
    headers: { "cache-control": "no-store" },
  });
}
