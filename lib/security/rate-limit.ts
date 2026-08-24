import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

type ConsumeRateLimitOptions = {
  scope: string;
  userId?: string | null;
  maxRequests: number;
  windowSeconds: number;
};

type RateLimitRpcRow = {
  allowed?: boolean | null;
  remaining?: number | null;
  reset_at?: string | null;
};

function sanitizeScope(scope: string) {
  return scope.replace(/[^a-zA-Z0-9_.:-]/g, "").slice(0, 96) || "general";
}

async function getRequestActor(userId: string | null | undefined, scope: string) {
  if (userId) {
    return `user:${userId}`;
  }

  try {
    const headerStore = await headers();
    const forwardedFor = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown-ip";
    const realIp = headerStore.get("x-real-ip")?.trim() || "";
    const userAgent = headerStore.get("user-agent")?.slice(0, 160) || "unknown-ua";
    return `ip:${forwardedFor}|real:${realIp}|ua:${userAgent}|scope:${scope}`;
  } catch {
    return `anonymous-unknown|scope:${scope}`;
  }
}

async function hashActor(userId: string | null | undefined, scope: string) {
  const actor = await getRequestActor(userId, scope);
  const salt = process.env.RATE_LIMIT_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY || "sahibash-rate-limit-v1";
  return createHash("sha256").update(`${salt}:${actor}`).digest("hex");
}

export async function consumeRateLimit(options: ConsumeRateLimitOptions) {
  const scope = sanitizeScope(options.scope);
  const maxRequests = Math.max(1, Math.min(Math.floor(options.maxRequests), 100000));
  const windowSeconds = Math.max(1, Math.min(Math.floor(options.windowSeconds), 86400));
  const actorHash = await hashActor(options.userId, scope);

  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return {
        allowed: true,
        remaining: null,
        resetAt: null,
        fallback: true,
      };
    }

    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase.rpc("consume_app_rate_limit", {
      p_scope: scope,
      p_actor_hash: actorHash,
      p_window_seconds: windowSeconds,
      p_max_requests: maxRequests,
    });

    if (error) {
      return {
        allowed: true,
        remaining: null,
        resetAt: null,
        fallback: true,
      };
    }

    const row = Array.isArray(data) ? (data[0] as RateLimitRpcRow | undefined) : (data as RateLimitRpcRow | null);
    return {
      allowed: row?.allowed !== false,
      remaining: typeof row?.remaining === "number" ? row.remaining : null,
      resetAt: row?.reset_at ?? null,
      fallback: false,
    };
  } catch {
    return {
      allowed: true,
      remaining: null,
      resetAt: null,
      fallback: true,
    };
  }
}
