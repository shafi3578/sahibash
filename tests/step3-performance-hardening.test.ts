import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const migration = readFileSync(
  join(process.cwd(), "supabase", "migrations", "20260825104055_index_step3_import_business_foreign_keys.sql"),
  "utf8"
);

const remainingForeignKeysMigration = readFileSync(
  join(process.cwd(), "supabase", "migrations", "20260825104645_index_remaining_step3_public_foreign_keys.sql"),
  "utf8"
);

const rlsPerformanceMigration = readFileSync(
  join(process.cwd(), "supabase", "migrations", "20260825105454_optimize_step3_high_frequency_rls_policies.sql"),
  "utf8"
);

const coreRlsPerformanceMigration = readFileSync(
  join(process.cwd(), "supabase", "migrations", "20260825110016_optimize_core_usage_rls_initplans.sql"),
  "utf8"
);

test("Step 3 performance migration covers import, demand, claims, duplicate, provenance, and seller FK paths", () => {
  for (const indexName of [
    "idx_demand_signals_actor_user_id",
    "idx_demand_signals_category_id",
    "idx_demand_signals_category_node_id",
    "idx_external_import_opt_outs_created_by",
    "idx_external_import_opt_outs_source_id",
    "idx_external_import_opt_outs_verified_by",
    "idx_listing_claims_claimant_user_id",
    "idx_listing_claims_reviewed_by",
    "idx_listing_claims_seller_entity_id",
    "idx_listing_contact_events_actor_user_id",
    "idx_listing_duplicate_group_members_listing_id",
    "idx_listing_duplicate_groups_canonical_listing_id",
    "idx_listing_duplicate_groups_created_by",
    "idx_listing_freshness_policies_category_node_id",
    "idx_listing_ingest_candidates_candidate_listing_id",
    "idx_listing_ingest_candidates_category_node_id",
    "idx_listing_ingest_candidates_duplicate_group_id",
    "idx_listing_ingest_candidates_source_id",
    "idx_listing_ingest_jobs_approved_by",
    "idx_listing_ingest_jobs_created_by",
    "idx_listing_ingest_jobs_source_id",
    "idx_listing_provenance_events_actor_user_id",
    "idx_listing_provenance_events_job_id",
    "idx_listing_provenance_events_listing_id",
    "idx_listing_provenance_events_source_observation_id",
    "idx_listing_share_outputs_listing_id",
    "idx_listing_share_outputs_user_id",
    "idx_listing_source_observations_import_job_id",
    "idx_listing_source_observations_ingest_actor",
    "idx_seller_entities_created_by",
    "idx_seller_entities_linked_user_id",
  ]) {
    assert.match(migration, new RegExp(indexName));
  }
});

test("Step 3 follow-up migration covers remaining launch-adjacent public FK warnings", () => {
  for (const indexName of [
    "idx_listing_sources_created_by",
    "idx_listings_canonical_duplicate_group_id",
    "idx_market_cell_retirement_policies_updated_by",
    "idx_market_cell_rollup_runs_created_by",
    "idx_organization_members_user_id",
    "idx_organizations_created_by",
    "idx_scout_submissions_candidate_id",
    "idx_scout_submissions_listing_id",
    "idx_scout_submissions_reviewed_by",
    "idx_scout_submissions_seller_entity_id",
    "idx_seller_lead_summaries_user_id",
    "idx_wanted_requests_category_id",
    "idx_wanted_requests_category_node_id",
  ]) {
    assert.match(remainingForeignKeysMigration, new RegExp(indexName));
  }
});

test("Step 3 RLS migration optimizes high-frequency policies without broadening access", () => {
  for (const policyName of [
    "subcategories_public_select_active",
    "favorites_delete_own_or_admin",
    "listing_images_insert_owner_or_admin",
    "listing_attributes_insert_owner_or_admin",
    "listing_drafts_owner_select",
    "messages_select_sender_or_recipient",
    "listing_views_select_owner_or_admin",
    "reports_select_own_or_admin",
    "search_alias_dictionary_select_active_or_admin",
    "category_fields_public_select_active",
    "filter_definitions_select_active_or_admin",
    "posting_category_config_select_active_or_admin",
    "product_specs_select_active_or_admin",
    "listing_translations_select_visible_or_admin",
    "electronics_listings_select_public_or_owner_or_admin",
    "listing_vehicle_features_visible_read",
    "vehicle_damage_reports_owner_read",
    "vehicle_damage_parts_owner_read",
  ]) {
    assert.match(rlsPerformanceMigration, new RegExp(policyName));
  }

  assert.match(rlsPerformanceMigration, /\(select auth\.uid\(\)\)/);
  assert.match(rlsPerformanceMigration, /\(select is_admin\(\(select auth\.uid\(\)\)\)\)/);
  assert.doesNotMatch(rlsPerformanceMigration, /is_admin\(auth\.uid\(\)\)/);
  assert.doesNotMatch(rlsPerformanceMigration, /= auth\.uid\(\)/);
});

test("Step 3 core RLS migration covers remaining profile, listing, messaging, search, and location hot paths", () => {
  for (const policyName of [
    "profiles_select_own_or_admin",
    "listings_insert_owner_only",
    "offers_select_participants_or_admin",
    "saved_searches_owner_only",
    "listing_notes_owner_only",
    "notifications_owner_only",
    "listing_price_history_select_owner_or_admin",
    "listing_promotions_select_owner_or_admin_or_public",
    "ai_detection_logs_owner_select",
    "Admins read search telemetry",
    "countries_admin_write",
    "provinces_admin_write",
    "districts_admin_write",
    "areas_admin_write",
    "area_suggestions_owner_or_admin_read",
    "category_aliases_admin_insert",
    "category_waitlists_select_own",
    "listing_category_path_owner_or_admin_read",
    "Admins manage translation jobs",
  ]) {
    assert.match(coreRlsPerformanceMigration, new RegExp(policyName));
  }

  assert.match(coreRlsPerformanceMigration, /\(select auth\.uid\(\)\)/);
  assert.match(coreRlsPerformanceMigration, /\(select is_admin\(\(select auth\.uid\(\)\)\)\)/);
  assert.doesNotMatch(coreRlsPerformanceMigration, /is_admin\(auth\.uid\(\)\)/);
  assert.doesNotMatch(coreRlsPerformanceMigration, /= auth\.uid\(\)/);
});
