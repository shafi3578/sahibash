import "server-only";

import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const SENSITIVE_CHANGE_KEY_PATTERN =
  /(password|passcode|secret|token|api[_-]?key|service[_-]?role|authorization|cookie|otp|mfa[_-]?code|verification[_-]?code|phone|email)/i;

function redactSafeChangeValue(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") {
    return value.length > 500 ? `${value.slice(0, 500)}…` : value;
  }
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (depth >= 4) return "[redacted-depth]";

  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => redactSafeChangeValue(item, depth + 1));
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
        key,
        SENSITIVE_CHANGE_KEY_PATTERN.test(key) ? "[redacted]" : redactSafeChangeValue(nested, depth + 1),
      ])
    );
  }

  return "[redacted]";
}

export async function recordAuditEvent(params: {
  adminUserId: string;
  action: string;
  entityType: string;
  entityId?: string;
  safeChanges?: Record<string, unknown>;
  ipAddress?: string;
}): Promise<{ ok: boolean }> {
  const { adminUserId, action, entityType, entityId, safeChanges, ipAddress } = params;
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createSupabaseAdmin()
    : await createSupabaseServerClient();

  const { error } = await supabase.from("audit_logs").insert({
    admin_user_id: adminUserId,
    action,
    entity_type: entityType,
    entity_id: entityId ?? null,
    safe_changes: safeChanges ? redactSafeChangeValue(safeChanges) : null,
    ip_address: ipAddress ?? null,
  });

  if (error) {
    console.error("Audit event insert failed", {
      action,
      entityType,
      entityId: entityId ?? null,
      code: error.code,
    });
    return { ok: false };
  }

  return { ok: true };
}
