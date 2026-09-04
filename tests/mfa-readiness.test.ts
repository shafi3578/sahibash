import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  canUseAdminPermissionWithAssurance,
  hasVerifiedAuthenticatorAssurance,
  requiresPrivilegedMfa,
} from "../lib/auth/mfa-authorization";

const auth = readFileSync(join(process.cwd(), "lib", "auth.ts"), "utf8");
const audit = readFileSync(join(process.cwd(), "lib", "audit.ts"), "utf8");
const accountSecurityAction = readFileSync(join(process.cwd(), "lib", "actions", "account-security.ts"), "utf8");
const accountSecurityPage = readFileSync(join(process.cwd(), "app", "dashboard", "account-security", "page.tsx"), "utf8");
const mfaPanel = readFileSync(join(process.cwd(), "components", "account", "mfa-setup-panel.tsx"), "utf8");

test("security step-up redirects users directly to account security MFA setup", () => {
  assert.match(auth, /\/dashboard\/account-security\?reason=\$\{reason\}/);
  assert.doesNotMatch(auth, /\/dashboard\?reason=\$\{reason\}/);
  assert.match(accountSecurityPage, /searchParams\?: Promise<\{ reason\?: string \}>/);
  assert.match(accountSecurityPage, /const resolvedSearchParams = await searchParams/);
  assert.match(accountSecurityPage, /securityRedirect=\{resolvedSearchParams\?\.reason === "security"\}/);
});

test("account security page exposes a complete Supabase MFA TOTP flow", () => {
  assert.match(accountSecurityPage, /<MfaSetupPanel/);
  assert.match(mfaPanel, /supabase\.auth\.mfa\.listFactors\(\)/);
  assert.match(mfaPanel, /supabase\.auth\.mfa\.getAuthenticatorAssuranceLevel\(\)/);
  assert.match(mfaPanel, /supabase\.auth\.mfa\.enroll\(\{\s*factorType: "totp"/);
  assert.match(mfaPanel, /data\.totp\.qr_code/);
  assert.match(mfaPanel, /data\.totp\.secret/);
  assert.match(mfaPanel, /from "next\/image"/);
  assert.match(mfaPanel, /supabase\.auth\.mfa\.challenge\(\{ factorId \}\)/);
  assert.match(mfaPanel, /supabase\.auth\.mfa\.verify\(\{/);
  assert.match(mfaPanel, /recordMfaAuditAction/);
  assert.doesNotMatch(mfaPanel, /user_metadata/i);
});

test("administrator MFA warning is never shown to normal users", () => {
  assert.match(mfaPanel, /isPrivilegedUser && \(securityRedirect \|\| !isAal2\)/);
  assert.doesNotMatch(mfaPanel, /securityRedirect \|\| \(isPrivilegedUser && !isAal2\)/);
});

test("a stale AAL2 administrator session can re-confirm its verified factor", () => {
  assert.match(mfaPanel, /firstVerifiedFactor && \(securityRedirect \|\| !isAal2\)/);
  assert.match(mfaPanel, /verifyFactor\(firstVerifiedFactor\.id, sessionCode, "MFA_SESSION_CONFIRMED"\)/);
});

test("MFA audit action records only verified AAL2 admin events", () => {
  assert.match(accountSecurityAction, /MFA_VERIFIED/);
  assert.match(accountSecurityAction, /MFA_SESSION_CONFIRMED/);
  assert.match(accountSecurityAction, /consumeRateLimit/);
  assert.match(accountSecurityAction, /is_admin/);
  assert.match(accountSecurityAction, /is_super_administrator/);
  assert.match(accountSecurityAction, /currentLevel === "aal2"/);
  assert.match(accountSecurityAction, /recordAuditEvent/);
});

test("AAL1 super admin can view read-only admin pages but cannot mutate until AAL2", () => {
  assert.equal(requiresPrivilegedMfa("roles.view"), false);
  assert.equal(requiresPrivilegedMfa("roles.manage"), true);
  assert.equal(hasVerifiedAuthenticatorAssurance("aal1"), false);
  assert.equal(hasVerifiedAuthenticatorAssurance("aal2"), true);

  assert.equal(
    canUseAdminPermissionWithAssurance({
      permission: "roles.view",
      hasPermission: true,
      currentLevel: "aal1",
    }),
    true,
    "RBAC-authorized AAL1 super admin can view read-only admin pages",
  );
  assert.equal(
    canUseAdminPermissionWithAssurance({
      permission: "roles.manage",
      hasPermission: true,
      currentLevel: "aal1",
    }),
    false,
    "RBAC-authorized AAL1 super admin cannot execute privileged mutations",
  );
  assert.equal(
    canUseAdminPermissionWithAssurance({
      permission: "roles.manage",
      hasPermission: true,
      currentLevel: "aal2",
    }),
    true,
    "RBAC-authorized AAL2 super admin can execute permitted privileged mutations",
  );
  assert.equal(
    canUseAdminPermissionWithAssurance({
      permission: "roles.manage",
      hasPermission: false,
      currentLevel: "aal2",
    }),
    false,
    "AAL2 never bypasses RBAC permission denial",
  );

  const permissionGate = auth.slice(
    auth.indexOf("export async function requirePermission"),
    auth.indexOf("export async function requireAdmin"),
  );
  assert.match(
    permissionGate,
    /if \(requiresPrivilegedMfa\(permission\)\) \{\s*const authenticationMethods = await requireVerifiedAuthenticatorAssurance\(supabase\);\s*await requireFreshPrimaryAuthentication\(user, authenticationMethods\);/,
    "fresh signed authentication-method evidence and AAL2 apply only to privileged permissions",
  );
  assert.doesNotMatch(
    permissionGate.slice(0, permissionGate.indexOf("if (requiresPrivilegedMfa(permission))")),
    /requireFreshPrimaryAuthentication/,
    "read-only permission checks do not require a fresh password sign-in",
  );
});

test("audit writer is server-only, service-role capable, and redacts unsafe changes", () => {
  assert.match(audit, /import "server-only"/);
  assert.match(audit, /createSupabaseAdmin/);
  assert.match(audit, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(audit, /SENSITIVE_CHANGE_KEY_PATTERN/);
  assert.match(audit, /redactSafeChangeValue/);
  assert.match(audit, /console\.error\("Audit event insert failed"/);
  assert.doesNotMatch(audit, /safe_changes: safeChanges \?\? null/);
});
