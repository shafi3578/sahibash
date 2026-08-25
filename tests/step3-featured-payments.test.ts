import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();
const migration = readFileSync(
  join(root, "supabase", "migrations", "20260825001346_step3_featured_payments_ai_foundation.sql"),
  "utf8"
);
const performanceMigration = readFileSync(
  join(root, "supabase", "migrations", "20260825001557_index_step3_featured_ai_foreign_keys.sql"),
  "utf8"
);
const actions = readFileSync(join(root, "lib", "actions", "featured-payments.ts"), "utf8");
const data = readFileSync(join(root, "lib", "data", "featured-payments.ts"), "utf8");
const managePage = readFileSync(join(root, "app", "listings", "[id]", "manage", "page.tsx"), "utf8");
const myAdsPage = readFileSync(join(root, "app", "dashboard", "my-ads", "page.tsx"), "utf8");
const adminQueuePage = readFileSync(join(root, "app", "admin", "featured-payments", "page.tsx"), "utf8");
const superAdminPage = readFileSync(join(root, "app", "administrator", "promotions", "page.tsx"), "utf8");
const authorization = readFileSync(join(root, "lib", "authorization.ts"), "utf8");
const mfa = readFileSync(join(root, "lib", "auth", "mfa-authorization.ts"), "utf8");
const listingActions = readFileSync(join(root, "lib", "actions", "listings.ts"), "utf8");
const listingValidator = readFileSync(join(root, "lib", "validators", "listing.ts"), "utf8");

test("Step 3 migration creates a dedicated private payment request domain", () => {
  assert.match(migration, /create table if not exists public\.promotion_campaign_configs/);
  assert.match(migration, /create table if not exists public\.promotion_payment_requests/);
  assert.match(migration, /provider public\.promotion_payment_provider not null default 'hesabpay'/);
  assert.match(migration, /status public\.promotion_payment_request_status not null default 'pending_payment'/);
  assert.match(migration, /insert into storage\.buckets[\s\S]*'payment-receipts'[\s\S]*false/);
  assert.match(migration, /allowed_mime_types[\s\S]*image\/jpeg[\s\S]*application\/pdf/);
  assert.match(migration, /receipt_file_size integer check[\s\S]*5242880/);
  assert.match(migration, /promotion_payment_requests_one_pending_per_listing/);
  assert.match(migration, /listing_promotions_payment_request_id_unique/);
});

test("featured activation is server-reviewed, idempotent, audited, and time-bound", () => {
  assert.match(migration, /alter table public\.listings[\s\S]*featured_until timestamptz/);
  assert.match(migration, /create or replace function public\.approve_featured_payment_request/);
  assert.match(migration, /security invoker/);
  assert.match(migration, /for update/);
  assert.match(migration, /on conflict \(payment_request_id\)/);
  assert.match(migration, /set featured = true,[\s\S]*featured_until = v_featured_until/);
  assert.match(actions, /requirePermission\("payments\.review"\)/);
  assert.match(actions, /recordAuditEvent\(\{[\s\S]*FEATURED_PAYMENT_APPROVED/);
  assert.match(actions, /recordAuditEvent\(\{[\s\S]*FEATURED_PAYMENT_REJECTED/);
});

test("seller cannot set payment review fields or featured from client payload", () => {
  assert.match(migration, /guard_promotion_payment_request_mutation/);
  assert.match(migration, /client cannot set payment review status/);
  assert.match(migration, /client cannot change configured payment terms/);
  assert.match(migration, /client can only submit proof for review/);
  assert.doesNotMatch(listingValidator, /featured:\s*z\.coerce\.boolean/);
  assert.match(listingActions, /featured:\s*false/);
  assert.match(listingActions, /Featured promotion requires administrator approval/);
});

test("RLS/storage policies keep receipts private and owner/admin scoped", () => {
  assert.match(migration, /payment_receipts_owner_upload/);
  assert.match(migration, /payment_receipts_owner_read/);
  assert.match(migration, /payment_receipts_admin_read/);
  assert.doesNotMatch(migration, /payment_receipts_public/i);
  assert.match(migration, /promotion_payment_requests_owner_select/);
  assert.match(migration, /promotion_payment_requests_admin_select/);
  assert.match(migration, /promotion_payment_requests_admin_review/);
});

test("Step 3 foreign keys have covering indexes for Advisor performance", () => {
  for (const indexName of [
    "idx_promotion_campaign_configs_updated_by",
    "idx_promotion_payment_requests_campaign_config",
    "idx_ai_search_parse_events_actor_user_id",
    "idx_ai_moderation_reviews_ai_detection_log_id",
    "idx_ai_moderation_reviews_reviewed_by",
  ]) {
    assert.match(performanceMigration, new RegExp(indexName));
  }
});

test("seller and admin UI expose the Step 3 Featured workflow", () => {
  assert.match(managePage, /FeaturedPromotionPanel/);
  assert.match(myAdsPage, /requestFeaturedPromotionAction/);
  assert.match(adminQueuePage, /getAdminFeaturedPaymentQueue/);
  assert.match(adminQueuePage, /adminApproveFeaturedPaymentRequestAction/);
  assert.match(adminQueuePage, /adminRejectFeaturedPaymentRequestAction/);
  assert.match(superAdminPage, /updateFeaturedCampaignConfigAction/);
  assert.match(data, /createSignedUrl\(request\.receipt_storage_path/);
});

test("new payment permissions are typed and privileged writes require MFA", () => {
  for (const key of ["payments.view", "payments.review", "payments.configure", "ai.view", "ai.configure", "ai.moderate"]) {
    assert.match(authorization, new RegExp(key.replace(".", "\\.")));
  }
  assert.match(mfa, /"payments\.view"/);
  assert.match(mfa, /"ai\.view"/);
  assert.doesNotMatch(mfa, /"payments\.review"/);
  assert.doesNotMatch(mfa, /"payments\.configure"/);
});
