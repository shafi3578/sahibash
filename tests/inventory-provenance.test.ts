import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { normalizeAfghanistanPhone, normalizePriceToAfn, assertSafeExternalUrl, candidateIdempotencyKey } from "../lib/inventory/normalization";
import { scoreDuplicateCandidate } from "../lib/inventory/deduplication";
import { getSourceTransparency, shouldShowInNormalDiscovery } from "../lib/inventory/provenance";
import { scoreMarketplaceListing } from "../lib/ranking/marketplace";

const migration = readFileSync(
  join(process.cwd(), "supabase", "migrations", "20260820123009_inventory_provenance_foundation.sql"),
  "utf8",
);

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
