import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();
const read = (...parts: string[]) => readFileSync(join(root, ...parts), "utf8");

const listingPage = read("app", "listings", "[id]", "page.tsx");
const inventoryPage = read("app", "admin", "inventory", "page.tsx");
const inventoryActions = read("lib", "actions", "inventory.ts");
const messageActions = read("lib", "actions", "messages.ts");
const offerActions = read("lib", "actions", "offers.ts");
const migration = read("supabase", "migrations", "20260830214320_external_listing_request_workflow.sql");
const hardeningMigration = read("supabase", "migrations", "20260830220713_harden_external_request_rpcs_service_only.sql");

test("unclaimed external listings do not expose in-app message or offer controls", () => {
  assert.match(listingPage, /const hasAccountSeller = Boolean\(listing\.user_id\)/);
  assert.match(listingPage, /const canUseSahibashSellerTools = !isOwner && hasAccountSeller/);
  assert.match(listingPage, /qp\.compose === "1" && canUseSahibashSellerTools/);
  assert.match(listingPage, /qp\.offerbox === "1" && canUseSahibashSellerTools/);
  assert.match(listingPage, /does not have a Sahibash inbox yet/);
  assert.doesNotMatch(listingPage, /remove_request_click/);
});

test("message and offer actions re-read accountable seller state", () => {
  for (const source of [messageActions, offerActions]) {
    assert.match(source, /publication_status, source_type, ownership_status/);
    assert.match(source, /const hasAccountSeller = Boolean\(listing\?\.user_id\)/);
    assert.match(source, /listing\?\.source_type === "native" \|\| listing\?\.ownership_status === "claimed"/);
    assert.match(source, /listing\.publication_status !== "published"/);
  }
});

test("claim and removal submissions are idempotent, authenticated, and auditable", () => {
  assert.match(migration, /create unique index if not exists idx_listing_claims_one_active_per_user/i);
  assert.match(migration, /create unique index if not exists idx_listing_removal_requests_one_pending_per_user/i);
  assert.match(migration, /create or replace function public\.submit_external_listing_claim/i);
  assert.match(migration, /create or replace function public\.submit_external_listing_removal_request/i);
  assert.match(migration, /security definer[\s\S]*set search_path = ''/i);
  assert.match(migration, /claim_submitted/);
  assert.match(migration, /removal_requested/);
  assert.match(hardeningMigration, /revoke all on function public\.submit_external_listing_claim\(uuid, text\)[\s\S]*from public, anon, authenticated/i);
  assert.match(hardeningMigration, /grant execute on function public\.submit_external_listing_claim_service\(uuid, text, uuid\)[\s\S]*to service_role/i);
  assert.doesNotMatch(hardeningMigration, /grant execute on function[\s\S]*to authenticated/i);
  assert.match(inventoryActions, /requireUser\(\)/);
  assert.match(inventoryActions, /submit_external_listing_claim_service/);
  assert.match(inventoryActions, /submit_external_listing_removal_request_service/);
  assert.match(inventoryActions, /p_actor_id: user\.id/);
});

test("administrator review is AAL2 and RBAC protected and never hard-deletes listings", () => {
  assert.match(inventoryActions, /requirePermission\("listings\.moderate"\)/);
  assert.match(inventoryActions, /reviewerNote\.length < 5 \|\| reviewerNote\.length > 2000/);
  assert.match(inventoryActions, /review_external_listing_claim_service/);
  assert.match(inventoryActions, /review_external_listing_removal_request_service/);
  assert.match(inventoryActions, /p_actor_id: actor\.id/);
  assert.match(migration, /not private\.is_aal2\(\)/);
  assert.match(migration, /has_admin_permission\(v_actor, 'listings\.moderate'\)/);
  assert.match(hardeningMigration, /jsonb_build_object\('sub', p_actor_id, 'role', 'authenticated', 'aal', 'aal2'\)/);
  assert.match(migration, /ownership_status = 'claimed'/);
  assert.match(migration, /insert into public\.seller_entities/);
  assert.match(migration, /seller_entity_id = v_seller_entity_id/);
  assert.match(migration, /extensions\.digest\('claimant_user:' \|\| v_claim\.claimant_user_id::text, 'sha256'\)/);
  assert.match(migration, /publication_status = 'removed'/);
  assert.match(migration, /insert into public\.external_import_opt_outs/);
  assert.doesNotMatch(migration, /delete from public\.listings/i);
  assert.match(inventoryPage, /ReviewControls kind="claim"/);
  assert.match(inventoryPage, /ReviewControls kind="removal"/);
});

test("database RLS blocks messages and offers without a real claimed seller", () => {
  assert.match(migration, /create policy messages_insert_sender_only[\s\S]*listing\.user_id is not null[\s\S]*listing\.ownership_status = 'claimed'/i);
  assert.match(migration, /create policy offers_insert_buyer_only[\s\S]*listing\.user_id = offers\.seller_user_id[\s\S]*listing\.ownership_status = 'claimed'/i);
  assert.match(migration, /listing\.publication_status = 'published'/i);
});
