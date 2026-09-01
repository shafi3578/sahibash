import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { normalizeAfghanistanPhone, normalizePriceToAfn, assertSafeExternalUrl, candidateIdempotencyKey } from "../lib/inventory/normalization";
import { scoreDuplicateCandidate } from "../lib/inventory/deduplication";
import { getSourceTransparency, shouldShowInNormalDiscovery } from "../lib/inventory/provenance";
import { scoreMarketplaceListing } from "../lib/ranking/marketplace";
import {
  candidateMediaStoragePath,
  getTelegramTransferKey,
  selectLargestTelegramPhoto,
  telegramPhotoFingerprint,
} from "../lib/inventory/telegram-media";

const migration = readFileSync(
  join(process.cwd(), "supabase", "migrations", "20260820123009_inventory_provenance_foundation.sql"),
  "utf8",
);
const inventoryPage = readFileSync(
  join(process.cwd(), "app", "admin", "inventory", "page.tsx"),
  "utf8",
);
const inventoryCandidatePage = readFileSync(
  join(process.cwd(), "app", "admin", "inventory", "candidates", "[id]", "page.tsx"),
  "utf8",
);
const telegramMediaMigration = readFileSync(
  join(process.cwd(), "supabase", "migrations", "20260829194000_secure_telegram_candidate_media.sql"),
  "utf8",
);
const telegramWebhook = readFileSync(
  join(process.cwd(), "app", "api", "telegram", "webhook", "route.ts"),
  "utf8",
);
const inventoryActions = readFileSync(
  join(process.cwd(), "lib", "actions", "inventory-media.ts"),
  "utf8",
);
const candidatePublicationMigration = readFileSync(
  join(process.cwd(), "supabase", "migrations", "20260830013000_publish_reviewed_ingest_candidate.sql"),
  "utf8",
);
const candidatePublicationAction = readFileSync(
  join(process.cwd(), "lib", "actions", "inventory-publish.ts"),
  "utf8",
);
const candidatePublicationControl = readFileSync(
  join(process.cwd(), "components", "admin", "ingest-candidate-publish.tsx"),
  "utf8",
);
const externalReviewRetentionMigration = readFileSync(
  join(process.cwd(), "supabase", "migrations", "20260830202347_external_inventory_review_retention.sql"),
  "utf8",
);
const externalRetentionRpcFixMigration = readFileSync(
  join(process.cwd(), "supabase", "migrations", "20260830204406_fix_external_retention_rpc_ambiguity.sql"),
  "utf8",
);
const candidateResolutionMigration = readFileSync(
  join(process.cwd(), "supabase", "migrations", "20260901010000_resolve_external_ingest_candidate.sql"),
  "utf8",
);
const candidateResolutionFixMigration = readFileSync(
  join(process.cwd(), "supabase", "migrations", "20260901011000_fix_ingest_duplicate_group_resolution.sql"),
  "utf8",
);
const candidateReviewAction = readFileSync(
  join(process.cwd(), "lib", "actions", "inventory-review.ts"),
  "utf8",
);
const candidateReviewControl = readFileSync(
  join(process.cwd(), "components", "admin", "ingest-candidate-review-form.tsx"),
  "utf8",
);
const retentionRoute = readFileSync(
  join(process.cwd(), "app", "api", "cron", "external-inventory-retention", "route.ts"),
  "utf8",
);
const vercelConfig = JSON.parse(readFileSync(join(process.cwd(), "vercel.json"), "utf8")) as {
  crons?: Array<{ path: string; schedule: string }>;
};

test("Step 1 migration creates explicit provenance and ingestion objects with RLS", () => {
  for (const table of [
    "seller_entities",
    "listing_sources",
    "listing_source_observations",
    "listing_ingest_jobs",
    "listing_ingest_candidates",
    "external_import_opt_outs",
    "listing_claims",
    "listing_duplicate_groups",
    "listing_provenance_events",
    "listing_quality_signals",
    "listing_contact_events",
  ]) {
    assert.match(migration, new RegExp(`create table public\\.${table}`, "i"));
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`, "i"));
  }

  assert.match(migration, /alter column user_id drop not null/i);
  assert.match(migration, /source_type public\.listing_source_type not null default 'native'/i);
  assert.match(migration, /listings_external_no_fake_owner/i);
});

test("Afghanistan phone normalization preserves original and produces safe hint", () => {
  assert.deepEqual(normalizeAfghanistanPhone("0700 123 456"), {
    original: "0700 123 456",
    normalized: "+93700123456",
    hint: "+9370••••56",
  });
  assert.equal(normalizeAfghanistanPhone("+1 555 123").normalized, null);
});

test("URL guard rejects unsafe schemes and private network targets", () => {
  assert.equal(assertSafeExternalUrl("javascript:alert(1)").ok, false);
  assert.equal(assertSafeExternalUrl("http://127.0.0.1/admin").ok, false);
  assert.equal(assertSafeExternalUrl("https://example.com/listing?x=1#secret").ok, true);
});

test("candidate keys and price normalization support idempotent dry runs", () => {
  const first = candidateIdempotencyKey(["partner_feed", "ABC-1", " Toyota Corolla  ", "Kabul"]);
  const second = candidateIdempotencyKey(["partner_feed", "abc-1", "toyota corolla", "kabul"]);
  assert.equal(first, second);
  assert.deepEqual(normalizePriceToAfn("1,250,000", "AFN"), {
    originalText: "1,250,000",
    originalCurrency: "AFN",
    amountAfn: 1250000,
    amountOriginal: 1250000,
  });
});

test("duplicate scoring separates exact, review, possible, and low confidence bands", () => {
  assert.equal(scoreDuplicateCandidate({ sourceType: "partner_feed", sourceItemId: "1" }, { sourceType: "partner_feed", sourceItemId: "1" }).confidence, "exact");
  const review = scoreDuplicateCandidate(
    { phone: "+93700123456", title: "Toyota Corolla 2020 white", categoryNodeId: 5, province: "Kabul", district: "PD 3", price: 600000 },
    { phone: "+93700123456", title: "Toyota Corolla white 2020", categoryNodeId: 5, province: "Kabul", district: "PD 3", price: 620000 },
  );
  assert.equal(review.confidence, "high_review");
  assert.equal(scoreDuplicateCandidate({ title: "iPhone 13" }, { title: "Apartment rent" }).confidence, "low");
});

test("source transparency hides expired external inventory from normal discovery", () => {
  const external = getSourceTransparency({
    source_type: "external_indexed",
    freshness_status: "stale",
    ownership_status: "unclaimed",
    contact_phone: "+93700123456",
    allow_contact_display: true,
  }, "en");
  assert.equal(external.sourceLabel, "External listing");
  assert.equal(external.needsAvailabilityWarning, true);
  assert.equal(shouldShowInNormalDiscovery({ publication_status: "published", freshness_status: "expired", source_type: "external_indexed" }), false);
  assert.equal(shouldShowInNormalDiscovery({ publication_status: "published", freshness_status: "seller_confirmed", source_type: "native" }), true);
});

test("provenance ranking favors claimed/native inventory over unclaimed external equivalents", () => {
  const base = {
    textRelevance: 0.8,
    categoryRelevance: 0.9,
    locationRelevance: 0.8,
    freshness: 0.8,
    completeness: 0.8,
    sellerTrust: 0.6,
    engagement: 0.4,
    duplicatePenalty: 0,
    spamPenalty: 0,
    promotionBoost: 0,
  };
  const native = scoreMarketplaceListing({ ...base, sourceType: "native", ownershipStatus: "claimed", provenanceConfidence: 1 });
  const external = scoreMarketplaceListing({ ...base, sourceType: "external_indexed", ownershipStatus: "unclaimed", provenanceConfidence: 0.6 });
  assert.ok(native.finalScore > external.finalScore);
});

test("inventory control exposes transferred records and real listing drill-down links", () => {
  assert.match(inventoryPage, /href={`#\$\{id\}`}/);
  assert.match(inventoryPage, /candidate_listing_id/);
  assert.match(inventoryPage, /localizePath\(`\/listings\/\$\{candidate\.candidate_listing_id\}`/);
  assert.match(inventoryPage, /admin\/inventory\/candidates\/\$\{candidate\.id\}/);
  assert.match(inventoryPage, /Listing not created yet/);
  assert.match(inventoryPage, /\.neq\("source_type", "native"\)\.in\("freshness_status"/);
  assert.match(inventoryCandidatePage, /requirePermission\("listings\.view"\)/);
  assert.match(inventoryCandidatePage, /normalized_payload/);
  assert.match(inventoryCandidatePage, /listing_ingest_candidate_media/);
  assert.match(inventoryCandidatePage, /createSignedUrl/);
  assert.doesNotMatch(inventoryCandidatePage, /raw_payload/);
});

test("Telegram photo variants resolve to one largest actual image", () => {
  const selected = selectLargestTelegramPhoto([
    { file_id: "small", file_unique_id: "same", width: 90, height: 90, file_size: 1_000 },
    { file_id: "large", file_unique_id: "same", width: 1280, height: 960, file_size: 120_000 },
    { file_id: "medium", file_unique_id: "same", width: 640, height: 480, file_size: 50_000 },
  ]);
  assert.equal(selected?.fileId, "large");
  assert.equal(selected?.width, 1280);
  assert.equal(telegramPhotoFingerprint(selected!), telegramPhotoFingerprint({ ...selected!, fileId: "another-variant" }));
  assert.match(candidateMediaStoragePath("candidate-id", "29", "abc123", "jpg"), /^candidate-id\/29-abc123\.jpg$/);
});

test("Telegram album messages share one transfer identity and are no longer dropped", () => {
  const first = getTelegramTransferKey({ message_id: 29, media_group_id: "album-7" }, "100");
  const second = getTelegramTransferKey({ message_id: 30, media_group_id: "album-7" }, "101");
  assert.equal(first.idempotencyKey, second.idempotencyKey);
  assert.notEqual(first.sourceItemId, second.sourceItemId);
  assert.doesNotMatch(telegramWebhook, /if \(!text && photos\.length > 0\)/);
  assert.match(telegramWebhook, /selectLargestTelegramPhoto/);
  assert.match(telegramWebhook, /listing_ingest_candidate_media/);
});

test("Telegram intake rejects unsigned or unauthorized forwarding sources", () => {
  assert.match(telegramWebhook, /x-telegram-bot-api-secret-token/i);
  assert.match(telegramWebhook, /timingSafeEqual/);
  assert.match(telegramWebhook, /TELEGRAM_IMPORT_ALLOWED_CHAT_IDS/);
  assert.match(telegramWebhook, /allowedChats\.has\(String\(chatId\)\)/);
  assert.match(telegramWebhook, /content-length/);
  assert.match(telegramWebhook, /1_000_000/);
  assert.doesNotMatch(telegramWebhook, /console\.(log|error)/);
});

test("Telegram candidate photos use a private bucket and permission-protected metadata", () => {
  assert.match(telegramMediaMigration, /create table if not exists public\.listing_ingest_candidate_media/i);
  assert.match(telegramMediaMigration, /'listing-ingest-media'[\s\S]*false,[\s\S]*10485760/i);
  assert.match(telegramMediaMigration, /listing_ingest_candidate_media_admin_read[\s\S]*has_admin_permission[\s\S]*'listings\.view'/i);
  assert.match(telegramMediaMigration, /listing_ingest_media_admin_read[\s\S]*bucket_id = 'listing-ingest-media'/i);
  assert.match(telegramMediaMigration, /sync_listing_ingest_candidate_photo_count/i);
  assert.match(inventoryActions, /requirePermission\("listings\.moderate"\)/);
  assert.match(inventoryActions, /TELEGRAM_IMPORT_BOT_TOKEN/);
  assert.doesNotMatch(inventoryActions, /console\.(log|error)/);
});

test("reviewed candidate publication is atomic, auditable, and service-only", () => {
  assert.match(candidatePublicationMigration, /create or replace function public\.publish_reviewed_ingest_candidate/i);
  assert.match(candidatePublicationMigration, /security definer[\s\S]*set search_path = ''/i);
  assert.match(candidatePublicationMigration, /for update/i);
  assert.match(candidatePublicationMigration, /status <> 'publishable'/i);
  assert.match(candidatePublicationMigration, /external_import_opt_outs/i);
  assert.match(candidatePublicationMigration, /listing_source_observations[\s\S]*already linked to a listing/i);
  assert.match(candidatePublicationMigration, /storage\.objects[\s\S]*bucket_id = 'listing-images'/i);
  assert.match(candidatePublicationMigration, /Every retained candidate image must be published together/i);
  assert.match(candidatePublicationMigration, /Public listing text must not contain a phone number/i);
  assert.match(candidatePublicationMigration, /'external_indexed', 'unclaimed', 'fresh', 'permission_pending'/i);
  assert.match(candidatePublicationMigration, /true, true, encode\(extensions\.digest/i);
  assert.match(candidatePublicationMigration, /\('en', 'en'\), \('fa-AF', 'fa'\), \('ps-AF', 'ps'\)/i);
  assert.match(candidatePublicationMigration, /listing_provenance_events/i);
  assert.match(candidatePublicationMigration, /revoke all on function[\s\S]*from public, anon, authenticated/i);
  assert.match(candidatePublicationMigration, /grant execute on function[\s\S]*to service_role/i);
});

test("candidate publication action requires stepped-up moderation and cleans uploaded media on failure", () => {
  assert.match(candidatePublicationAction, /requirePermission\("listings\.moderate"\)/);
  assert.match(candidatePublicationAction, /PRIVATE_INGEST_BUCKET = "listing-ingest-media"/);
  assert.match(candidatePublicationAction, /PUBLIC_LISTING_BUCKET = "listing-images"/);
  assert.match(candidatePublicationAction, /publish_reviewed_ingest_candidate/);
  assert.match(candidatePublicationAction, /removeUploadedImages\(supabase, uploadedPaths\)/);
  assert.doesNotMatch(candidatePublicationAction, /console\.(log|error)/);
  assert.match(inventoryCandidatePage, /candidate\.status === "publishable"/);
  assert.match(inventoryCandidatePage, /IngestCandidatePublish/);
  assert.match(candidatePublicationControl, /useActionState/);
});

test("candidate review supports all active published leaf schemas and is super-admin-only", () => {
  assert.match(externalReviewRetentionMigration, /create or replace function public\.save_reviewed_ingest_candidate/i);
  assert.match(externalReviewRetentionMigration, /Candidate category must be an active leaf/i);
  assert.match(externalReviewRetentionMigration, /Candidate category is not open for marketplace publication/i);
  assert.match(externalReviewRetentionMigration, /jsonb_each\(v_details\)/i);
  assert.match(externalReviewRetentionMigration, /Required category details are incomplete/i);
  assert.doesNotMatch(externalReviewRetentionMigration, /Candidate vehicle brand is missing/i);
  assert.match(externalReviewRetentionMigration, /grant execute on function public\.save_reviewed_ingest_candidate[\s\S]*to service_role/i);
  assert.match(candidateReviewAction, /requireSuperAdministrator\(\)/);
  assert.match(candidateReviewAction, /normalizeListingSchemaConfig/);
  assert.match(candidateReviewAction, /normalizeAfghanistanPhone/);
  assert.match(candidateReviewControl, /\["en", "fa", "ps"\]/);
  assert.match(candidateReviewControl, /category-specific details/i);
  assert.match(candidateReviewControl, /VehicleDamageDiagram/);
  assert.match(candidateReviewAction, /normalizeVehicleDamageParts/);
  assert.match(externalReviewRetentionMigration, /insert into public\.vehicle_damage_reports/i);
  assert.match(externalReviewRetentionMigration, /insert into public\.vehicle_damage_parts/i);
  assert.match(inventoryCandidatePage, /IngestCandidateReviewForm/);
  assert.match(inventoryCandidatePage, /is_super_administrator/);
  assert.match(inventoryCandidatePage, /\.range\(offset, offset \+ LEAF_CATEGORY_PAGE_SIZE - 1\)/);
  assert.match(inventoryCandidatePage, /leafData\.push\(\.\.\.rows\)/);
  assert.doesNotMatch(inventoryCandidatePage, /\.limit\(1000\)/);
});

test("30-day cleanup is cron-protected and cannot touch normal user listings", () => {
  assert.match(externalReviewRetentionMigration, /now\(\) \+ interval '30 days'/i);
  assert.match(externalReviewRetentionMigration, /source_type = 'external_indexed'/i);
  assert.match(externalReviewRetentionMigration, /source_platform = 'telegram'/i);
  assert.match(externalReviewRetentionMigration, /ownership_status = 'unclaimed'/i);
  assert.match(externalReviewRetentionMigration, /provenance_status = 'permission_pending'/i);
  assert.match(externalReviewRetentionMigration, /private\.external_inventory_retention_tombstones/i);
  assert.match(externalReviewRetentionMigration, /revoke all on table private\.external_inventory_retention_tombstones from public, anon, authenticated/i);
  assert.match(externalReviewRetentionMigration, /if not v_has_user_history then[\s\S]*delete from public\.listings/i);
  assert.match(externalReviewRetentionMigration, /ownership_status = 'removed', provenance_status = 'blocked'/i);
  assert.match(retentionRoute, /authorization/i);
  assert.match(retentionRoute, /timingSafeEqual/);
  assert.match(retentionRoute, /expire_due_forwarded_external_ads/);
  assert.match(retentionRoute, /purge_expired_forwarded_external_ad/);
  assert.match(retentionRoute, /listing_ingest_candidate_media/);
  assert.match(retentionRoute, /storage\.from\(bucket\)\.remove/);
  assert.match(retentionRoute, /api\.telegram\.org\/bot\$\{token\}\/setWebhook/);
  assert.match(retentionRoute, /secret_token: secret/);
  assert.match(retentionRoute, /drop_pending_updates: false/);
  assert.deepEqual(vercelConfig.crons, [{
    path: "/api/cron/external-inventory-retention",
    schedule: "15 1 * * *",
  }]);
});

test("retention expiry RPC avoids PL/pgSQL output-column ambiguity", () => {
  assert.match(externalRetentionRpcFixMigration, /create or replace function public\.expire_due_forwarded_external_ads/i);
  assert.match(externalRetentionRpcFixMigration, /insert into public\.listing_provenance_events/i);
  assert.doesNotMatch(externalRetentionRpcFixMigration, /returning\s+listing_id/i);
  assert.match(externalRetentionRpcFixMigration, /revoke all on function[\s\S]*from public, anon, authenticated/i);
  assert.match(externalRetentionRpcFixMigration, /grant execute on function[\s\S]*to service_role/i);
});

test("candidate rejection and duplicate decisions are atomic, auditable, and service-only", () => {
  assert.match(candidateResolutionMigration, /create or replace function public\.resolve_ingest_candidate/i);
  assert.match(candidateResolutionFixMigration, /security definer[\s\S]*set search_path = ''/i);
  assert.match(candidateResolutionFixMigration, /public\.is_super_administrator\(p_actor_id\)/i);
  assert.match(candidateResolutionFixMigration, /public\.has_admin_permission\(p_actor_id, 'listings\.moderate'\)/i);
  assert.match(candidateResolutionFixMigration, /insert into public\.listing_duplicate_groups/i);
  assert.match(candidateResolutionFixMigration, /'canonical_candidate_id', v_canonical\.id/i);
  assert.match(candidateResolutionFixMigration, /insert into public\.listing_provenance_events/i);
  assert.match(candidateResolutionFixMigration, /candidate_marked_duplicate|candidate_rejected/i);
  assert.match(candidateResolutionFixMigration, /sync_ingest_duplicate_group_canonical/i);
  assert.match(candidateResolutionFixMigration, /revoke all on function[\s\S]*from public, anon, authenticated/i);
  assert.match(candidateResolutionFixMigration, /grant execute on function[\s\S]*to service_role/i);
});
