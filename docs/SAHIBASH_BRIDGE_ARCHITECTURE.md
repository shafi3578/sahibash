# Sahibash Bridge Architecture

Date: 2026-08-24
Status: database foundation exists; operational bridge workflows are partially implemented and must remain controlled.

## Purpose

Sahibash Bridge is the external/partner/scout inventory system for bootstrapping supply while native Sahibash listings grow. It must not mass-republish third-party content blindly.

## Existing foundations

Tables and concepts present in the project/migrations:

- `seller_entities`
- `listing_sources`
- `listing_source_observations`
- `listing_ingest_jobs`
- `listing_ingest_candidates`
- `external_import_opt_outs`
- `listing_claims`
- `listing_duplicate_groups`
- `listing_duplicate_group_members`
- `listing_provenance_events`
- `listing_quality_signals`
- `listing_contact_events`
- `listing_freshness_policies`
- `market_cell_retirement_policies`
- `market_cell_rollup_runs`
- demand/price/network intelligence foundations

Application helpers:

- `lib/inventory/normalization.ts`
- `lib/inventory/deduplication.ts`
- `lib/inventory/provenance.ts`
- `lib/actions/inventory.ts`

Tests:

- `tests/inventory-provenance.test.ts`
- `tests/liquidity-foundation.test.ts`
- `tests/network-readiness.test.ts`

## Required lifecycle

1. Source discovery
   - Partner feed, permissioned source, or manual/scout submission.
   - Record `source_platform`, `source_url`, source item identity, permission basis, and first/last seen timestamps.

2. Normalization
   - Normalize phone, price, location, category, title, structured attributes.
   - Preserve original source values for audit/provenance.

3. Deduplication
   - Compare source item id, normalized phone, title similarity, category, price, location, and future image hashes.
   - Prevent the same item from appearing repeatedly.

4. Moderation
   - External inventory should not bypass moderation/compliance checks.
   - Provenance and contact policy must be visible to admins.

5. Publication
   - Public external listings require provenance.
   - External/unclaimed inventory should default to cautious contact and indexing settings.
   - `noindex_external` should remain true unless product/legal policy allows indexing.

6. Freshness
   - Recheck source availability.
   - Mark stale/expired entries.
   - Hide expired external inventory from normal discovery.

7. Claim flow
   - "I am the owner" starts a claim.
   - Claim states: submitted, verification required, under review, approved, rejected, withdrawn.
   - Approval links the listing to a verified Sahibash user while preserving provenance.

8. Opt-out/removal
   - External source owners must be able to request removal.
   - Keep audit trail.

9. Native conversion/retirement
   - As native/claimed supply grows in a market cell, reduce external inventory weight gradually.
   - Use market-cell policies, not a global cutoff.

## Current safety checks

Read-only sanity SQL checks external records for missing provenance/contact/indexing signals:

- `scripts/sql/production_sanity_checks.sql`

Current final sign-off blocker:

- The bridge is not yet proven as a full production ingestion operation. Keep large-scale ingestion disabled until staging tests and legal/product policy are finalized.
