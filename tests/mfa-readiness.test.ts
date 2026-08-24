import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

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

test("MFA audit action records only verified AAL2 admin events", () => {
  assert.match(accountSecurityAction, /MFA_VERIFIED/);
  assert.match(accountSecurityAction, /MFA_SESSION_CONFIRMED/);
  assert.match(accountSecurityAction, /consumeRateLimit/);
  assert.match(accountSecurityAction, /is_admin/);
  assert.match(accountSecurityAction, /is_super_administrator/);
  assert.match(accountSecurityAction, /currentLevel === "aal2"/);
  assert.match(accountSecurityAction, /recordAuditEvent/);
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
