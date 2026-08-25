import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();
const administratorPage = readFileSync(join(root, "app", "administrator", "page.tsx"), "utf8");
const controlCenterData = readFileSync(join(root, "lib", "data", "control-center.ts"), "utf8");
const adminHome = readFileSync(join(root, "app", "admin", "page.tsx"), "utf8");
const accountNav = readFileSync(join(root, "lib", "account", "navigation.ts"), "utf8");

test("Super Admin Control Center is AAL2-gated and covers launch operations without exposing secrets", () => {
  assert.match(administratorPage, /requireSuperAdministrator\(\)/);
  assert.match(administratorPage, /getSuperAdminControlCenterSnapshot/);
  assert.match(administratorPage, /Production mapping|controlCopy\.deployment/);
  assert.match(administratorPage, /snapshot\.readiness/);
  assert.match(administratorPage, /snapshot\.operations/);
  assert.match(administratorPage, /snapshot\.security/);
  assert.match(administratorPage, /snapshot\.paymentsAi/);
  assert.match(administratorPage, /snapshot\.inventoryBusiness/);

  for (const secretKey of ["SUPABASE_SERVICE_ROLE_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "HUGGINGFACE_API_KEY"]) {
    assert.match(controlCenterData, new RegExp(secretKey));
    assert.doesNotMatch(administratorPage, new RegExp(secretKey));
  }
  assert.match(controlCenterData, /value is never rendered/i);
  assert.match(controlCenterData, /No secret values are rendered|never rendered|server-only/i);
});

test("Control Center includes the Step 3 payment, AI, import, business, advisor, and deployment readiness modules", () => {
  for (const requiredTerm of [
    "Security Advisor",
    "Performance Advisor",
    "Featured campaign",
    "Payment review queue",
    "AI parse events",
    "AI detection logs",
    "AI moderation reviews",
    "Risk / quality signals",
    "Import sources",
    "Import jobs",
    "Import candidates",
    "Claims pending",
    "Duplicate review",
    "Seller entities",
    "Organizations / members",
    "Schema versions",
    "Search aliases",
    "Rate-limit buckets",
    "Feature flags",
    "MFA/AAL2 status",
    "Git SHA",
    "Supabase ref",
  ]) {
    assert.match(`${administratorPage}\n${controlCenterData}`, new RegExp(requiredTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("Admin home remains operational and consumer account navigation remains admin-free", () => {
  for (const requiredTerm of [
    "pendingListings",
    "reportedListings",
    "featuredRequests",
    "importCandidates",
    "importFailures",
    "claimsPending",
    "duplicateReview",
    "usersRequiringReview",
    "recentModerationActions",
    "unreadOperationalAlerts",
    "listingsToday",
    "contactActionsToday",
  ]) {
    assert.match(adminHome, new RegExp(requiredTerm));
  }

  assert.doesNotMatch(accountNav, /\/admin|\/administrator/);
});
