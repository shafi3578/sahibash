"use server";

import { getCurrentUser } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type MfaAuditEvent = "MFA_VERIFIED" | "MFA_SESSION_CONFIRMED";

const MFA_AUDIT_EVENTS = new Set<MfaAuditEvent>(["MFA_VERIFIED", "MFA_SESSION_CONFIRMED"]);

async function isCurrentUserAdmin(userId: string) {
  const supabase = await createSupabaseServerClient();
  const [{ data: isAdmin }, { data: isSuperAdmin }] = await Promise.all([
    supabase.rpc("is_admin", { uid: userId }),
    supabase.rpc("is_super_administrator", { uid: userId }),
  ]);

  return isAdmin === true || isSuperAdmin === true;
}

async function hasAal2Session() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  return !error && data?.currentLevel === "aal2";
}

export async function recordMfaAuditAction(event: MfaAuditEvent) {
  if (!MFA_AUDIT_EVENTS.has(event)) {
    return { ok: false, message: "Invalid security event." };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, message: "Sign in to continue." };
  }

  const rateLimit = await consumeRateLimit({
    scope: "account_security.mfa_audit",
    userId: user.id,
    maxRequests: 12,
    windowSeconds: 10 * 60,
  });
  if (!rateLimit.allowed) {
    return { ok: false, message: "Too many security updates. Please try again later." };
  }

  const [isAdmin, isAal2] = await Promise.all([
    isCurrentUserAdmin(user.id),
    hasAal2Session(),
  ]);

  if (!isAal2) {
    return { ok: false, message: "Confirm your MFA code first." };
  }

  if (!isAdmin) {
    return { ok: true };
  }

  const result = await recordAuditEvent({
    adminUserId: user.id,
    action: event,
    entityType: "auth_mfa_factor",
    entityId: user.id,
    safeChanges: {
      event,
      boundary: "supabase_auth_mfa",
      assurance_level: "aal2",
    },
  });

  return result.ok
    ? { ok: true }
    : { ok: false, message: "Security event could not be recorded." };
}
