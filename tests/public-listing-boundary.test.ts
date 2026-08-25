import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const migration = readFileSync(
  join(process.cwd(), "supabase", "migrations", "20260824124823_phase1_public_listing_privacy_boundary.sql"),
  "utf8",
);
const childVisibilityMigration = readFileSync(
  join(process.cwd(), "supabase", "migrations", "20260824195045_repair_public_listing_child_visibility.sql"),
  "utf8",
);
const finalHardeningMigration = readFileSync(
  join(process.cwd(), "supabase", "migrations", "20260824201724_final_step1_security_location_hardening.sql"),
  "utf8",
);
const featuredUntilGrantMigration = readFileSync(
  join(process.cwd(), "supabase", "migrations", "20260825002333_grant_step3_featured_until_public_select.sql"),
  "utf8",
);

const queries = readFileSync(join(process.cwd(), "lib", "data", "queries.ts"), "utf8");
const contactActions = readFileSync(join(process.cwd(), "components", "listings", "listing-contact-actions.tsx"), "utf8");
const listingDetailPage = readFileSync(join(process.cwd(), "app", "listings", "[id]", "page.tsx"), "utf8");
const inventoryActions = readFileSync(join(process.cwd(), "lib", "actions", "inventory.ts"), "utf8");
const adminRbacData = readFileSync(join(process.cwd(), "lib", "data", "admin-rbac.ts"), "utf8");

function grantBlock(role: "anon" | "authenticated") {
  const match = migration.match(new RegExp(`grant select \\(([\\s\\S]*?)\\) on public\\.listings to ${role};`, "i"));
  assert.ok(match, `missing ${role} listing column grant`);
  return match[1];
}

test("listing Data API grants exclude private phone and exact location columns", () => {
  assert.match(migration, /revoke all on table public\.listings from anon/i);
  assert.match(migration, /revoke all on table public\.listings from authenticated/i);

  for (const role of ["anon", "authenticated"] as const) {
    const block = grantBlock(role);
    for (const sensitiveColumn of [
      "contact_phone",
      "seller_entity_id",
      "address_text",
      "latitude",
      "longitude",
      "location_accuracy",
      "location_source",
      "location_geog",
      "source_payload_hash",
    ]) {
      assert.doesNotMatch(block, new RegExp(`\\b${sensitiveColumn}\\b`, "i"), `${role} can select ${sensitiveColumn}`);
    }
  }
});

test("public listing queries use an explicit safe selector and sanitize returned DTOs", () => {
  const publicSelector = queries.slice(
    queries.indexOf("const PUBLIC_LISTING_SELECT"),
    queries.indexOf("const LISTING_DETAIL_PRIVATE_SELECT"),
  );

  assert.doesNotMatch(publicSelector, /\bcontact_phone\b/i);
  assert.doesNotMatch(publicSelector, /\bseller_entity_id\b/i);
  assert.doesNotMatch(publicSelector, /\blatitude\b/i);
  assert.doesNotMatch(publicSelector, /\blongitude\b/i);
  assert.doesNotMatch(publicSelector, /\baddress_text\b/i);
  assert.match(queries, /\.select\(PUBLIC_LISTING_SELECT(?:\s+as\s+string)?\)/);
  assert.match(queries, /sanitizePublicListingBoundaries/);
  assert.match(queries, /sanitizePublicListingBoundary\(listing\)/);
});

test("featured expiry stays publicly readable without widening listing grants", () => {
  const publicSelector = queries.slice(
    queries.indexOf("const PUBLIC_LISTING_SELECT"),
    queries.indexOf("const LISTING_DETAIL_PRIVATE_SELECT"),
  );

  assert.match(publicSelector, /\bfeatured_until\b/);
  assert.match(featuredUntilGrantMigration, /grant select \(featured_until\) on public\.listings to anon/i);
  assert.match(featuredUntilGrantMigration, /grant select \(featured_until\) on public\.listings to authenticated/i);
  assert.doesNotMatch(featuredUntilGrantMigration, /contact_phone|address_text|latitude|longitude|location_geog/i);
});

test("public listing child embeds use trusted visibility checks without exposing owner ids", () => {
  assert.match(childVisibilityMigration, /create or replace function public\.can_read_listing_children/i);
  assert.match(childVisibilityMigration, /security definer/i);

  assert.match(finalHardeningMigration, /create or replace function private\.can_read_listing_children/i);
  assert.match(finalHardeningMigration, /security definer/i);
  assert.match(finalHardeningMigration, /drop function if exists public\.can_read_listing_children\(uuid\)/i);
  assert.match(finalHardeningMigration, /revoke all on function private\.can_read_listing_children\(uuid\) from public/i);
  assert.match(finalHardeningMigration, /grant execute on function private\.can_read_listing_children\(uuid\) to anon, authenticated, service_role/i);
  assert.match(finalHardeningMigration, /using \(private\.can_read_listing_children\(listing_id\)\)/i);
  assert.doesNotMatch(finalHardeningMigration, /grant execute on function public\.can_read_listing_children/i);
});

test("phone reveal is server-side, rate-limited, and audited", () => {
  assert.match(contactActions, /revealListingPhoneAction/);
  assert.doesNotMatch(contactActions, /phone:string/);
  assert.doesNotMatch(listingDetailPage, /phone=\{listing\.contact_phone\}/);
  assert.doesNotMatch(listingDetailPage, /tel:\$\{listing\.contact_phone/);

  const revealAction = inventoryActions.slice(inventoryActions.indexOf("export async function revealListingPhoneAction"));
  assert.match(revealAction, /consumeRateLimit/);
  assert.match(revealAction, /status === "approved"/);
  assert.match(revealAction, /allow_contact_display === false/);
  assert.match(revealAction, /\.from\("listing_contact_events"\)\.insert/);
  assert.match(revealAction, /contactAuditError/);
  assert.match(revealAction, /privacy_boundary: "server_reveal"/);
  assert.match(revealAction, /resolveRevealPhone/);
  assert.match(revealAction, /contact_source: contactSource/);
});

test("contact audit rows cannot be forged directly by public clients", () => {
  assert.match(migration, /drop policy if exists listing_contact_events_public_insert/i);
  assert.match(migration, /revoke insert on table public\.listing_contact_events from anon, authenticated/i);
  assert.match(inventoryActions, /createTrustedServerClient/);
});

test("super-admin MFA readiness uses verified factors from the auth schema", () => {
  assert.match(adminRbacData, /getSuperAdminMfaReadinessRows/);
  assert.match(adminRbacData, /\.schema\("auth"\)\s*\.\s*from\("mfa_factors"\)/);
  assert.match(adminRbacData, /\.eq\("status", "verified"\)/);
});
