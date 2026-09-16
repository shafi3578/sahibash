import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runInNewContext } from "node:vm";
import test from "node:test";
import { isFeaturedPaymentTargetEligible, type FeaturedPaymentTarget } from "@/lib/payments/featured-eligibility";

const root = process.cwd();
const migration = readFileSync(
  join(root, "supabase", "migrations", "20260825001346_step3_featured_payments_ai_foundation.sql"),
  "utf8"
);
const performanceMigration = readFileSync(
  join(root, "supabase", "migrations", "20260825001557_index_step3_featured_ai_foreign_keys.sql"),
  "utf8"
);
const aal2BoundaryMigration = readFileSync(
  join(root, "supabase", "migrations", "20260825072221_enforce_step3_payment_aal2_boundary.sql"),
  "utf8"
);
const actions = readFileSync(join(root, "lib", "actions", "featured-payments.ts"), "utf8");
const paymentSafetyMigration = readFileSync(
  join(root, "supabase", "migrations", "20260916135905_featured_payment_target_and_resubmission_safety.sql"),
  "utf8"
);
const paymentPanel = readFileSync(join(root, "components", "payments", "featured-promotion-panel.tsx"), "utf8");
const data = readFileSync(join(root, "lib", "data", "featured-payments.ts"), "utf8");
const managePage = readFileSync(join(root, "app", "listings", "[id]", "manage", "page.tsx"), "utf8");
const myAdsPage = readFileSync(join(root, "app", "dashboard", "my-ads", "page.tsx"), "utf8");
const homePage = readFileSync(join(root, "app", "page.tsx"), "utf8");
const featuredPage = readFileSync(join(root, "app", "featured", "page.tsx"), "utf8");
const listingCard = readFileSync(join(root, "components", "listing-card.tsx"), "utf8");
const adminQueuePage = readFileSync(join(root, "app", "admin", "featured-payments", "page.tsx"), "utf8");
const superAdminPage = readFileSync(join(root, "app", "administrator", "promotions", "page.tsx"), "utf8");
const authorization = readFileSync(join(root, "lib", "authorization.ts"), "utf8");
const mfa = readFileSync(join(root, "lib", "auth", "mfa-authorization.ts"), "utf8");
const listingActions = readFileSync(join(root, "lib", "actions", "listings.ts"), "utf8");
const listingValidator = readFileSync(join(root, "lib", "validators", "listing.ts"), "utf8");
const queries = readFileSync(join(root, "lib", "data", "queries.ts"), "utf8");

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
  assert.match(paymentSafetyMigration, /FEATURED_PAYMENT_APPROVED/);
  assert.match(paymentSafetyMigration, /FEATURED_PAYMENT_REJECTED/);
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

test("payment review and configuration writes require AAL2 at the database boundary", () => {
  assert.match(aal2BoundaryMigration, /create schema if not exists private/);
  assert.match(aal2BoundaryMigration, /create or replace function private\.is_aal2\(\)/);
  assert.match(aal2BoundaryMigration, /auth\.jwt\(\)\s*->>\s*'aal'[\s\S]*=\s*'aal2'/);
  assert.match(aal2BoundaryMigration, /create or replace function private\.require_aal2\(\)/);
  assert.match(aal2BoundaryMigration, /raise exception 'aal2 required' using errcode = '42501'/);
  assert.match(aal2BoundaryMigration, /revoke all on function private\.is_aal2\(\) from public, anon, authenticated/);
  assert.match(aal2BoundaryMigration, /revoke all on function private\.require_aal2\(\) from public, anon, authenticated/);

  assert.match(
    aal2BoundaryMigration,
    /create policy promotion_payment_requests_admin_review[\s\S]*private\.is_aal2\(\)[\s\S]*payments\.review/
  );
  assert.match(
    aal2BoundaryMigration,
    /create policy promotion_campaign_configs_admin_update[\s\S]*private\.is_aal2\(\)[\s\S]*(payments\.configure|settings\.update)/
  );
  assert.match(
    aal2BoundaryMigration,
    /create policy listing_promotions_admin_update[\s\S]*private\.is_aal2\(\)[\s\S]*(listings\.feature|payments\.review)/
  );
});

test("featured payment approval RPCs enforce RBAC plus AAL2 and are not anon executable", () => {
  for (const functionName of ["approve_featured_payment_request", "reject_featured_payment_request"]) {
    assert.match(
      aal2BoundaryMigration,
      new RegExp(`create or replace function public\\.${functionName}[\\s\\S]*has_admin_permission\\(v_actor, 'payments\\.review'\\)[\\s\\S]*perform private\\.require_aal2\\(\\)`)
    );
  }

  assert.match(
    aal2BoundaryMigration,
    /revoke all on function public\.approve_featured_payment_request\(uuid, text\) from public, anon, authenticated/
  );
  assert.match(
    aal2BoundaryMigration,
    /grant execute on function public\.approve_featured_payment_request\(uuid, text\) to authenticated, service_role/
  );
  assert.match(
    aal2BoundaryMigration,
    /revoke all on function public\.reject_featured_payment_request\(uuid, text, text\) from public, anon, authenticated/
  );
  assert.match(
    aal2BoundaryMigration,
    /grant execute on function public\.reject_featured_payment_request\(uuid, text, text\) to authenticated, service_role/
  );
  assert.doesNotMatch(aal2BoundaryMigration, /grant execute on function public\.approve_featured_payment_request\(uuid, text\) to anon/i);
  assert.doesNotMatch(aal2BoundaryMigration, /grant execute on function public\.reject_featured_payment_request\(uuid, text, text\) to anon/i);
});

test("seller proof submission remains allowed but cannot mutate privileged payment fields", () => {
  assert.match(aal2BoundaryMigration, /v_is_reviewer_aal2 := v_is_reviewer and private\.is_aal2\(\)/);
  assert.match(aal2BoundaryMigration, /if v_is_reviewer and not v_is_reviewer_aal2 then[\s\S]*aal2 required/);
  assert.match(aal2BoundaryMigration, /if v_is_reviewer_aal2 then[\s\S]*return new/);
  assert.match(aal2BoundaryMigration, /client can only submit proof for review/);
  assert.match(aal2BoundaryMigration, /client cannot change configured payment terms/);
  assert.match(aal2BoundaryMigration, /client cannot set review fields/);
  assert.match(aal2BoundaryMigration, /client cannot set provider status/);
  assert.match(actions, /\.update\(\{[\s\S]*status:\s*"pending_review"[\s\S]*receipt_storage_path[\s\S]*receipt_mime_type[\s\S]*receipt_file_size/);
  assert.doesNotMatch(actions, /submitFeaturedPaymentProofAction[\s\S]*provider_status:\s*/);
});

test("featured display derives from a valid future featured_until, not the stale boolean alone", () => {
  assert.match(data, /if \(!listing\.featured\) return false/);
  assert.match(data, /if \(!listing\.featured_until\) return false/);
  assert.match(data, /return !Number\.isNaN\(expiry\.getTime\(\)\) && expiry > new Date\(\)/);
  assert.match(homePage, /featured\.filter\(\(listing\) => isFeaturedCurrentlyActive\(listing\)\)/);
  assert.match(featuredPage, /\.filter\(\(listing\) => isFeaturedCurrentlyActive\(listing\)\)/);
  assert.match(listingCard, /const isFeatured = isFeaturedCurrentlyActive\(listing\)/);
  assert.doesNotMatch(queries, /featured[^\n]+order|order\([^\n]+featured/i);
});

test("homepage never presents ordinary latest listings as featured", () => {
  assert.match(homePage, /const featuredRow = featured\.filter\(\(listing\) => isFeaturedCurrentlyActive\(listing\)\)/);
  assert.doesNotMatch(homePage, /const featuredRow = featured\.length/);
  assert.match(homePage, /const heroListings = featuredRow\.slice\(0, 3\)/);
  assert.match(homePage, /getApprovedListings\(\{ locale, featuredOnly: true, limit: 4 \}\)/);
  assert.match(homePage, /\{featuredRow\.length > 0 \? <section/);
  assert.doesNotMatch(homePage, /No featured ads are active yet/);
});

test("paid promotion eligibility fails closed for expired or non-public targets", () => {
  const now = Date.parse("2026-09-16T12:00:00Z");
  const eligible: FeaturedPaymentTarget = {
    status: "approved", publication_status: "published", freshness_status: "seller_confirmed",
    removed_public_at: null, expires_at: "2026-09-17T12:00:00Z", price: 100,
  };
  assert.equal(isFeaturedPaymentTargetEligible(eligible, now), true);
  assert.equal(isFeaturedPaymentTargetEligible({ ...eligible, publication_status: null }, now), true);
  const blocked: Partial<FeaturedPaymentTarget>[] = [
    ...["pending", "draft", "rejected", "sold", "deleted"].map((status) => ({ status })),
    ...["archived", "removed", "pending_review", "hidden"].map((publication_status) => ({ publication_status })),
    ...["expired", "source_missing", "sold_confirmed"].map((freshness_status) => ({ freshness_status })),
    { removed_public_at: "2026-09-15T12:00:00Z" },
    { expires_at: "2026-09-15T12:00:00Z" }, { expires_at: "2026-09-16T12:00:00Z" },
    { expires_at: null }, { expires_at: "invalid" }, { price: 0 }, { price: null }, { price: -1 },
  ];
  for (const override of blocked) {
    assert.equal(isFeaturedPaymentTargetEligible({ ...eligible, ...override }, now), false, JSON.stringify(override));
  }
});

test("request, correction, and direct approval all enforce public target eligibility", () => {
  const submit = actions.slice(actions.indexOf("export async function submitFeaturedPaymentProofAction"), actions.indexOf("export async function adminApprove"));
  assert.match(actions, /if \(!isFeaturedPaymentTargetEligible\(listing\)\)/);
  assert.ok(submit.indexOf("isFeaturedPaymentTargetEligible(listing)") < submit.indexOf(".upload("));
  assert.match(submit, /category:categories!inner\(is_active,is_coming_soon\)/);
  assert.match(paymentSafetyMigration, /new\.status in \('pending_payment', 'pending_review', 'approved'\)[\s\S]*private\.is_featured_payment_target_eligible\(new\.listing_id\)/);
  for (const predicate of ["l.status = 'approved'", "l.removed_public_at is null", "l.expires_at > now()", "l.price > 0", "c.is_active = true", "c.is_coming_soon = false"]) {
    assert.ok(paymentSafetyMigration.includes(predicate), predicate);
  }
  assert.match(paymentSafetyMigration, /perform 1 from public\.listings where id = new\.listing_id for update/);
  assert.doesNotMatch(paymentSafetyMigration, /set\s+expires_at\s*=/i);
  assert.match(myAdsPage, /isFeaturedPaymentTargetEligible\(listing\)/);
  assert.match(paymentPanel, /config && canRequest && \["pending_payment", "rejected"\]/);
});

test("rejected proof correction clears only a real owner's prior review fields", () => {
  const guard = paymentSafetyMigration.slice(paymentSafetyMigration.indexOf("create or replace function public.guard_promotion"), paymentSafetyMigration.indexOf("create or replace function private.audit_featured"));
  assert.match(guard, /v_actor is null or old\.user_id <> v_actor or new\.user_id <> old\.user_id/);
  assert.match(guard, /old\.status not in \('pending_payment', 'rejected'\) or new\.status <> 'pending_review'/);
  assert.match(guard, /if old\.status = 'rejected' then/);
  for (const field of ["reviewed_at", "reviewed_by", "admin_note", "rejection_reason", "provider_status"]) {
    assert.ok(guard.includes(`new.${field} := null;`), field);
  }
  assert.match(guard, /new\.provider_status is distinct from old\.provider_status/);
  assert.match(guard, /new\.admin_note is distinct from old\.admin_note and new\.admin_note is not null/);
  assert.match(guard, /v_is_reviewer and not v_is_reviewer_aal2[\s\S]*aal2 required/);
  assert.match(guard, /client cannot change configured payment terms/);
});

test("every payment review transition is atomically audited without public definer access", () => {
  const audit = paymentSafetyMigration.slice(paymentSafetyMigration.indexOf("create or replace function private.audit_featured"));
  for (const event of ["FEATURED_PAYMENT_PROOF_SUBMITTED", "FEATURED_PAYMENT_PROOF_RESUBMITTED", "FEATURED_PAYMENT_APPROVED", "FEATURED_PAYMENT_REJECTED"]) {
    assert.ok(audit.includes(event), event);
  }
  assert.match(audit, /security definer\s+set search_path = ''/);
  assert.match(audit, /insert into public\.audit_logs/);
  assert.match(audit, /'previous_review',[\s\S]*'admin_note', old\.admin_note[\s\S]*'rejection_reason', old\.rejection_reason/);
  assert.match(audit, /'previous_proof',[\s\S]*'transaction_reference', old\.transaction_reference[\s\S]*'receipt_storage_path', old\.receipt_storage_path/);
  assert.match(audit, /'proof',[\s\S]*'transaction_reference', new\.transaction_reference[\s\S]*'receipt_storage_path', new\.receipt_storage_path/);
  assert.match(audit, /after update on public\.promotion_payment_requests/);
  assert.match(audit, /revoke all on function private\.audit_featured_payment_transition\(\) from public, anon, authenticated, service_role/);
  assert.doesNotMatch(audit, /exception\s+when/i);
  assert.doesNotMatch(actions, /action: "FEATURED_PAYMENT_(APPROVED|REJECTED)"/);
});

test("payment audit evidence stays restricted to payment-authorized administrators", () => {
  assert.match(paymentSafetyMigration, /create policy audit_logs_payment_evidence_read\s+on public\.audit_logs\s+as restrictive\s+for select\s+to authenticated/);
  assert.match(paymentSafetyMigration, /entity_type is distinct from 'promotion_payment_request'\s+or \(select public\.has_admin_permission\(auth\.uid\(\), 'payments\.view'\)\)\s+or \(select public\.has_admin_permission\(auth\.uid\(\), 'payments\.review'\)\)/);
  assert.doesNotMatch(paymentSafetyMigration, /drop policy if exists audit_logs_admin_only|alter policy audit_logs_admin_only|grant (?:select|all).*audit_logs/i);
});

test("proof action cannot notify or report success when its conditional update affects no row", async () => {
  const { transpileModule, ScriptTarget } = await import("typescript");
  const action = actions.slice(actions.indexOf("export async function submitFeaturedPaymentProofAction"), actions.indexOf("export async function adminApprove"));
  const executable = transpileModule(action.replace("export async function", "async function"), { compilerOptions: { target: ScriptTarget.ES2022 } }).outputText;
  for (const persisted of [false, true]) {
    let notifications = 0;
    let reads = 0;
    const mutationFilters: unknown[][] = [];
    const updateQuery = {
      eq: (...args: unknown[]) => { mutationFilters.push(["eq", ...args]); return updateQuery; },
      in: (...args: unknown[]) => { mutationFilters.push(["in", ...args]); return updateQuery; },
      select: (...args: unknown[]) => { mutationFilters.push(["select", ...args]); return updateQuery; },
      maybeSingle: async () => ({ data: persisted ? { id: "request" } : null, error: null }),
    };
    const readQuery = {
      select: () => readQuery,
      eq: () => readQuery,
      maybeSingle: async () => ({ data: reads++ === 0
        ? { id: "request", listing_id: "listing", user_id: "owner", status: "rejected", amount: 30, currency: "AFN" }
        : { title: "Listing", status: "approved", publication_status: "published", expires_at: "2099-01-01T00:00:00Z", price: 100 }, error: null }),
      update: () => updateQuery,
    };
    const invoke = runInNewContext(`${executable}\nsubmitFeaturedPaymentProofAction`, {
      requireUser: async () => ({ id: "owner" }),
      uuid: () => "request", text: () => "corrected-reference", File: class {},
      createSupabaseServerClient: async () => ({ from: () => readQuery }),
      isFeaturedPaymentTargetEligible,
      notifyAdminsForFeaturedReview: async () => { notifications++; },
      revalidatePath: () => {},
      redirect: (path: string) => { throw new Error(`redirect:${path}`); },
    }) as (formData: FormData) => Promise<void>;
    await assert.rejects(invoke(new FormData()), persisted ? /featured=submitted/ : /Unable to submit Featured payment proof/);
    assert.equal(notifications, persisted ? 1 : 0);
    assert.deepEqual(JSON.parse(JSON.stringify(mutationFilters)), [
      ["eq", "id", "request"], ["eq", "user_id", "owner"],
      ["in", "status", ["pending_payment", "rejected"]], ["select", "id"],
    ]);
  }
});
