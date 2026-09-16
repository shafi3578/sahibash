import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runInNewContext } from "node:vm";
import { createHash } from "node:crypto";
import test from "node:test";
import { isFeaturedPaymentTargetEligible, type FeaturedPaymentTarget } from "@/lib/payments/featured-eligibility";
import { FEATURED_EXTENSION_CONSENT_VERSION, featuredConsentRequiredMessage, featuredExtensionConsentCopy, getFeaturedPaymentInstructions, hasFeaturedExtensionConsent, isClosedFeaturedPaymentRequest, matchesFeaturedConsentTerms } from "@/lib/payments/featured-consent";
import { FEATURED_PAYMENT_UNAVAILABLE_COPY, isFeaturedPaymentDestinationReady } from "@/lib/payments/featured-readiness";

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
const consentMigration = readFileSync(join(root, "supabase", "migrations", "20260916144729_featured_full_term_extension_consent.sql"), "utf8");
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

test("Featured destination readiness rejects missing setup without imposing a merchant ID format", () => {
  const placeholder = "Configure merchant destination in Super Admin before launch";
  for (const value of [null, undefined, 0, {}, "", " \t\n\r", placeholder, placeholder.toUpperCase()]) {
    assert.equal(isFeaturedPaymentDestinationReady(value), false);
  }
  // Match ECMAScript whitespace in the SQL boundary, not locale-specific SQL \s.
  for (const codePoint of [9, 10, 11, 12, 13, 32, 0xa0, 0x1680, ...Array.from({ length: 11 }, (_, index) => 0x2000 + index), 0x2028, 0x2029, 0x202f, 0x205f, 0x3000, 0xfeff]) {
    const whitespace = String.fromCodePoint(codePoint);
    assert.equal(isFeaturedPaymentDestinationReady(whitespace), false);
    assert.equal(isFeaturedPaymentDestinationReady(`${whitespace}${placeholder.replaceAll(" ", whitespace)}${whitespace}`), false);
  }
  for (const value of ["MERCHANT-42", "account:afn/merchant_42", "+93700000000", "مقصد-۴۲", "  merchant account 42  "]) {
    assert.equal(isFeaturedPaymentDestinationReady(value), true);
  }
});

test("unavailable payment destinations have EN/FA/PS guidance without claiming merchant verification", () => {
  for (const audience of ["seller", "admin"] as const) {
    const messages = ["en", "fa", "ps"].map((locale) => FEATURED_PAYMENT_UNAVAILABLE_COPY[locale as "en" | "fa" | "ps"][audience]);
    assert.equal(new Set(messages).size, 3);
    assert.ok(messages.every((message) => message.length > 80));
  }
  assert.match(FEATURED_PAYMENT_UNAVAILABLE_COPY.en.seller, /Do not pay or upload proof/);
  assert.match(FEATURED_PAYMENT_UNAVAILABLE_COPY.en.seller, /Free posting remains available/);
  assert.match(FEATURED_PAYMENT_UNAVAILABLE_COPY.en.admin, /does not verify merchant ownership/);
});

test("destination readiness gates new requests and saved proof destinations without altering active promotions", () => {
  const requestAction = actions.slice(actions.indexOf("export async function requestFeaturedPromotionAction"), actions.indexOf("export async function submitFeaturedPaymentProofAction"));
  const proofAction = actions.slice(actions.indexOf("export async function submitFeaturedPaymentProofAction"), actions.indexOf("export async function adminApprove"));
  const requestGuard = requestAction.indexOf("!isFeaturedPaymentDestinationReady(config.merchant_reference)");
  const proofGuard = proofAction.indexOf("!isFeaturedPaymentDestinationReady(request.merchant_reference)");
  assert.ok(requestGuard > 0 && requestGuard < requestAction.indexOf(".insert("));
  assert.ok(proofGuard > 0 && proofGuard < proofAction.indexOf(".upload("));
  assert.ok(proofGuard < proofAction.indexOf(".update("));
  assert.match(paymentPanel, /campaignDestinationReady = isFeaturedPaymentDestinationReady\(config\?\.merchant_reference\)/);
  assert.match(paymentPanel, /requestDestinationReady = isFeaturedPaymentDestinationReady\(request\?\.merchant_reference\)/);
  assert.match(paymentPanel, /paymentDestinationReady = request \? requestDestinationReady : campaignDestinationReady/);
  assert.match(paymentPanel, /!isActive && !request && config && canRequest && campaignDestinationReady/);
  assert.match(paymentPanel, /!isActive && request && hasConsent && config && canRequest && requestDestinationReady/);
  assert.match(paymentPanel, /!isActive && \(request \|\| config\) && !paymentDestinationReady/);
  assert.match(paymentPanel, /\{isActive \? \([\s\S]*copy\.active/);
  assert.match(paymentPanel, /FEATURED_PAYMENT_UNAVAILABLE_COPY\[locale\]\.seller/);
  assert.match(superAdminPage, /!isFeaturedPaymentDestinationReady\(config\?\.merchant_reference\)/);
  assert.match(superAdminPage, /FEATURED_PAYMENT_UNAVAILABLE_COPY\[locale\]\.admin/);
});

test("database destination readiness remains a private insert-only guard without authorization or data rewrites", () => {
  const sql = readFileSync(join(root, "supabase", "migrations", "20260916220149_featured_merchant_destination_readiness.sql"), "utf8")
    .replace(/--[^\r\n]*/g, "");
  assert.match(sql, /create\s+function\s+private\.guard_featured_merchant_destination\s*\(\s*\)\s+returns\s+trigger/i);
  assert.match(sql, /security\s+invoker\s+set\s+search_path\s*=\s*''/i);
  assert.match(sql, /create\s+trigger\s+guard_featured_merchant_destination\s+before\s+insert\s+on\s+public\.promotion_payment_requests\s+for\s+each\s+row\s+execute\s+function\s+private\.guard_featured_merchant_destination\s*\(\s*\)/i);
  const revoked = sql.match(/revoke\s+all\s+on\s+function\s+private\.guard_featured_merchant_destination\s*\(\s*\)\s+from\s+([^;]+);/i);
  assert.ok(revoked, "the trigger must not become a callable privileged API");
  assert.deepEqual(revoked[1].split(",").map((role) => role.trim().toLowerCase()).sort(), ["anon", "authenticated", "public", "service_role"]);
  const body = sql.match(/as\s+\$\$([\s\S]*?)\$\$/i)?.[1] ?? "";
  assert.match(body, /coalesce\s*\(\s*new\.merchant_reference\s*,\s*''\s*\)/i);
  assert.match(body, /pg_catalog\.lower[\s\S]*pg_catalog\.btrim[\s\S]*pg_catalog\.regexp_replace/i);
  assert.match(body, /if\s+v_destination\s*=\s*''\s+or\s+v_destination\s*=\s*'configure merchant destination in super admin before launch'\s+then\s+raise\s+exception\s+'featured payment destination is not configured'\s+using\s+errcode\s*=\s*'22023'/i);
  assert.match(body, /return\s+new\s*;/i);
  assert.doesNotMatch(sql, /\b(?:security\s+definer|update|delete|truncate|insert\s+into|alter|grant|create\s+policy|drop)\b/i);
  assert.doesNotMatch(body, /new\.[a-z_]+\s*:=|\bauth\.|has_admin_permission|require_aal2|is_aal2/i);
});

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
  assert.match(myAdsPage, /href=\{`\/listings\/\$\{listing\.id\}\/manage`\}/);
  assert.doesNotMatch(myAdsPage, /requestFeaturedPromotionAction/);
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
  assert.match(paymentPanel, /config && canRequest && requestDestinationReady && \["pending_payment", "rejected"\]/);
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

test("proof action preserves invalid-destination evidence and requires a persisted update before notifying", async () => {
  const { transpileModule, ScriptTarget } = await import("typescript");
  const action = actions.slice(actions.indexOf("export async function submitFeaturedPaymentProofAction"), actions.indexOf("export async function adminApprove"));
  const executable = transpileModule(action.replace("export async function", "async function"), { compilerOptions: { target: ScriptTarget.ES2022 } }).outputText;
  for (const { persisted, merchantReference } of [
    { persisted: false, merchantReference: "MERCHANT-42" },
    { persisted: true, merchantReference: "MERCHANT-42" },
    { persisted: true, merchantReference: null },
    { persisted: true, merchantReference: "Configure merchant destination in Super Admin before launch" },
  ]) {
    const ready = isFeaturedPaymentDestinationReady(merchantReference);
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
        ? { id: "request", listing_id: "listing", user_id: "owner", status: "rejected", amount: 30, currency: "AFN", merchant_reference: merchantReference, extension_consent_version: FEATURED_EXTENSION_CONSENT_VERSION, extension_consented_at: "2026-09-16T00:00:00Z", purchased_duration_days: 30 }
        : { title: "Listing", status: "approved", publication_status: "published", expires_at: "2099-01-01T00:00:00Z", price: 100 }, error: null }),
      update: () => updateQuery,
    };
    const invoke = runInNewContext(`${executable}\nsubmitFeaturedPaymentProofAction`, {
      requireUser: async () => ({ id: "owner" }),
      uuid: () => "request", text: () => "corrected-reference", File: class {},
      createSupabaseServerClient: async () => ({ from: () => readQuery }),
      isFeaturedPaymentTargetEligible,
      hasFeaturedExtensionConsent,
      isFeaturedPaymentDestinationReady,
      notifyAdminsForFeaturedReview: async () => { notifications++; },
      revalidatePath: () => {},
      redirect: (path: string) => { throw new Error(`redirect:${path}`); },
    }) as (formData: FormData) => Promise<void>;
    await assert.rejects(invoke(new FormData()), !ready ? /featured=not-configured/ : persisted ? /featured=submitted/ : /Unable to submit Featured payment proof/);
    assert.equal(notifications, ready && persisted ? 1 : 0);
    assert.equal(reads, ready ? 2 : 1);
    assert.deepEqual(JSON.parse(JSON.stringify(mutationFilters)), ready ? [
      ["eq", "id", "request"], ["eq", "user_id", "owner"],
      ["in", "status", ["pending_payment", "rejected"]], ["select", "id"],
    ] : []);
  }
});

test("full-term consent is explicit, versioned, and bound to the displayed configured terms", () => {
  const form = new FormData();
  const config = { id: "campaign", updated_at: "2026-09-16T00:00:00Z", currency: "AFN", duration_days: 30, amount: 30 };
  form.set("consent_duration_days", "30");
  form.set("consent_amount", "30");
  form.set("consent_config_id", config.id);
  form.set("consent_config_updated_at", config.updated_at);
  form.set("consent_currency", config.currency);
  for (const choice of ["", "on", "true", "old-version"]) {
    form.set("extension_consent", choice);
    assert.equal(matchesFeaturedConsentTerms(form, config), false);
  }
  form.set("extension_consent", FEATURED_EXTENSION_CONSENT_VERSION);
  assert.equal(matchesFeaturedConsentTerms(form, config), true);
  assert.equal(matchesFeaturedConsentTerms(form, { ...config, duration_days: 7 }), false);
  assert.equal(matchesFeaturedConsentTerms(form, { ...config, amount: 31 }), false);
  assert.equal(matchesFeaturedConsentTerms(form, { ...config, currency: "USD" }), false);
  assert.equal(matchesFeaturedConsentTerms(form, { ...config, id: "replacement" }), false);
  assert.equal(matchesFeaturedConsentTerms(form, { ...config, updated_at: "2026-09-17T00:00:00Z" }), false);
  assert.equal(hasFeaturedExtensionConsent({}), false);
  const recorded = { extension_consent_version: FEATURED_EXTENSION_CONSENT_VERSION, extension_consented_at: "2026-09-16T00:00:00Z", purchased_duration_days: 30 };
  assert.equal(hasFeaturedExtensionConsent(recorded), true);
  for (const change of [{ extension_consent_version: "old" }, { extension_consented_at: null }, { extension_consented_at: "invalid" }, { purchased_duration_days: 0 }, { purchased_duration_days: 366 }, { purchased_duration_days: 2.5 }]) {
    assert.equal(hasFeaturedExtensionConsent({ ...recorded, ...change }), false);
  }
  for (const locale of ["en", "fa", "ps"] as const) {
    assert.ok(featuredExtensionConsentCopy(locale, 17).includes("17"));
    assert.notEqual(featuredExtensionConsentCopy(locale, 17), featuredExtensionConsentCopy(locale, 30));
  }
  const checkbox = paymentPanel.match(/<input type="checkbox"[^>]+>/)?.[0] ?? "";
  assert.match(checkbox, /name="extension_consent"[\s\S]*required/);
  assert.doesNotMatch(checkbox, /defaultChecked|\schecked/);
  assert.match(paymentPanel, /request && hasConsent && config && canRequest/);
  assert.match(actions, /matchesFeaturedConsentTerms\(formData, config\)/);
  assert.match(actions, /extension_consent_version: FEATURED_EXTENSION_CONSENT_VERSION,\s+purchased_duration_days: config\.duration_days/);
  assert.doesNotMatch(actions, /extension_consented_at:\s*new Date/);
  assert.equal(getFeaturedPaymentInstructions({ payment_instructions_snapshot: { en: "Original instructions" } }, "en"), "Original instructions");
  assert.match(paymentPanel, /getFeaturedPaymentInstructions\(request, locale\)/);
  assert.match(paymentPanel, /request\.merchant_reference/);
  assert.doesNotMatch(paymentPanel, /config\.merchant_reference|config\.payment_method|getCampaignInstructions\(config/);
});

test("database consent cannot be backfilled and every approval uses the immutable purchased term", () => {
  assert.match(consentMigration, /new\.extension_consented_at := clock_timestamp\(\)/);
  assert.match(consentMigration, /new\.purchased_duration_days := v_config\.duration_days/);
  assert.match(consentMigration, /only the listing owner can consent/);
  assert.match(consentMigration, /new\.extension_consent_version is distinct from old\.extension_consent_version/);
  assert.match(consentMigration, /new\.listing_id is distinct from old\.listing_id/);
  assert.match(consentMigration, /consent and purchased terms are immutable/);
  assert.match(consentMigration, /new\.status = 'approved' and old\.status <> 'approved'/);
  assert.match(consentMigration, /perform private\.require_aal2\(\)/);
  assert.match(consentMigration, /from public\.listings where id = new\.listing_id for update/);
  assert.match(consentMigration, /v_expiry <= v_approved_at/);
  assert.match(consentMigration, /v_featured_until := v_approved_at \+ make_interval\(days => new\.purchased_duration_days\)/);
  assert.match(consentMigration, /greatest\(v_expiry, v_featured_until\)/);
  assert.match(consentMigration, /'extension_consent',[\s\S]*'listing_expiry',[\s\S]*'before', new\.approval_expires_at_before, 'after', new\.approval_expires_at_after/);
  assert.doesNotMatch(consentMigration, /update public\.listings\s+set\s+(?:status|publication_status|freshness_status)/);
  assert.doesNotMatch(consentMigration, /create policy|alter policy|drop policy/);
});

test("consent-required redirects show only a localized safe alert and never preselect consent", () => {
  const messages = ["en", "fa", "ps"].map((locale) => featuredConsentRequiredMessage("consent-required", locale as "en" | "fa" | "ps"));
  assert.equal(new Set(messages).size, 3);
  assert.ok(messages.every((message) => typeof message === "string" && message.length > 80));
  assert.match(messages[0]!, /current price, duration and expiry-extension terms/);
  assert.match(messages[0]!, /unchecked consent box/);
  for (const status of [undefined, "", "requested", "pending_review", "<script>alert(1)</script>", ["consent-required"], ["consent-required", "requested"]]) {
    assert.equal(featuredConsentRequiredMessage(status, "en"), null);
  }
  assert.match(managePage, /searchParams: Promise<\{ featured\?: string \| string\[\] \}>/);
  assert.match(managePage, /featuredConsentRequiredMessage\(\(await searchParams\)\.featured, locale\)/);
  assert.match(managePage, /\{consentMessage \? \([\s\S]*role="alert"[\s\S]*\{consentMessage\}/);
  assert.doesNotMatch(managePage, /\{\s*\(await searchParams\)\.featured\s*\}/);
  const checkbox = paymentPanel.match(/<input type="checkbox"[^>]+>/)?.[0] ?? "";
  assert.match(checkbox, /name="extension_consent"[\s\S]*required/);
  assert.doesNotMatch(checkbox, /defaultChecked|\schecked/);
});

test("closed payment requests allow a new consent form without reopening pending or rejected evidence", () => {
  for (const status of ["approved", "cancelled", "expired"]) assert.equal(isClosedFeaturedPaymentRequest(status), true);
  for (const status of ["pending_payment", "pending_review", "rejected", "unknown", ""]) assert.equal(isClosedFeaturedPaymentRequest(status), false);
  assert.match(paymentPanel, /summary\.request && \(isActive \|\| !isClosedFeaturedPaymentRequest\(summary\.request\.status\)\) \? summary\.request : null/);
  assert.match(paymentPanel, /!isActive && !request && config && canRequest/);
  assert.match(paymentPanel, /request && hasConsent && config && canRequest && requestDestinationReady && \["pending_payment", "rejected"\]/);
});

test("repeat purchases use a new attempt key and duplicate failures cannot fabricate success", async () => {
  const { transpileModule, ScriptTarget } = await import("typescript");
  const keySource = actions.slice(actions.indexOf("function buildRequestIdempotencyKey"), actions.indexOf("function getAdminClient"));
  const actionSource = actions.slice(actions.indexOf("export async function requestFeaturedPromotionAction"), actions.indexOf("export async function submitFeaturedPaymentProofAction"));
  const executable = transpileModule(`${keySource}\n${actionSource.replace("export async function", "async function")}`, { compilerOptions: { target: ScriptTarget.ES2022 } }).outputText;
  const listingId = "10000000-0000-4000-8000-000000000001";
  const config = { id: "campaign", updated_at: "2026-09-16T00:00:00Z", currency: "AFN", duration_days: 30, amount: 30 };
  const form = new FormData();
  form.set("extension_consent", FEATURED_EXTENSION_CONSENT_VERSION);
  form.set("consent_config_id", config.id); form.set("consent_config_updated_at", config.updated_at);
  form.set("consent_currency", config.currency); form.set("consent_duration_days", "30"); form.set("consent_amount", "30");
  const run = async (status: string | null, previousId = "closed-request", duplicate?: "pending" | "missing", merchantReference: unknown = "MERCHANT-42") => {
    let insertCount = 0;
    let key = "";
    let reads = 0;
    const query = {
      select: () => query, eq: () => query, in: () => query, order: () => query,
      maybeSingle: async () => ({ data: { id: listingId, user_id: "owner", status: "approved", price: 100, expires_at: "2099-01-01T00:00:00Z" }, error: null }),
      limit: async () => ({ data: reads++ === 0 ? (status ? [{ id: previousId, status }] : []) : duplicate === "pending" ? [{ id: "racing-request", status: "pending_payment" }] : [], error: null }),
      insert: async (payload: { idempotency_key: string }) => { insertCount++; key = payload.idempotency_key; return { error: duplicate ? { code: "23505" } : null }; },
    };
    const invoke = runInNewContext(`${executable}\nrequestFeaturedPromotionAction`, {
      createHash, FEATURED_EXTENSION_CONSENT_VERSION, UUID_PATTERN: /^[0-9a-f-]{36}$/,
      requireUser: async () => ({ id: "owner" }), createSupabaseServerClient: async () => ({ from: () => query }),
      getActiveConfig: async () => ({ ...config, merchant_reference: merchantReference }), matchesFeaturedConsentTerms, isClosedFeaturedPaymentRequest, isFeaturedPaymentTargetEligible, isFeaturedPaymentDestinationReady,
      revalidatePath: () => {}, redirect: (path: string) => { throw new Error(`redirect:${path}`); },
    }) as (id: string, form: FormData) => Promise<void>;
    const ready = isFeaturedPaymentDestinationReady(merchantReference);
    const expected = !ready ? "featured=not-configured" : status && !isClosedFeaturedPaymentRequest(status) ? `featured=${status}`
      : duplicate === "pending" ? "featured=pending_payment" : duplicate === "missing" ? "Unable to create Featured payment request" : "featured=requested";
    await assert.rejects(invoke(listingId, form), new RegExp(expected));
    assert.equal(insertCount, !ready || status && !isClosedFeaturedPaymentRequest(status) ? 0 : 1);
    return key;
  };
  const first = await run(null);
  const repeated = await run("approved");
  assert.notEqual(first, repeated);
  assert.equal(repeated, await run("approved"));
  assert.notEqual(repeated, await run("approved", "next-closed-request"));
  for (const state of ["cancelled", "expired", "pending_payment", "pending_review", "rejected"]) await run(state);
  await run("cancelled", "closed-request", "pending");
  await run("cancelled", "closed-request", "missing");
  for (const destination of [null, "", "Configure merchant destination in Super Admin before launch", "  CONFIGURE\tmerchant destination\nIN super admin BEFORE launch  "]) {
    await run(null, "closed-request", undefined, destination);
  }
});
