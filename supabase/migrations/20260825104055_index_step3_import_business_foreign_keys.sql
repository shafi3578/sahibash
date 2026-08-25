begin;

-- Step 3 import/business scale hardening: cover Advisor-reported foreign keys
-- on the 40k-import preparation paths. Do not remove existing FTS/trigram/
-- PostGIS/keyset indexes just because live traffic is still small.

create index if not exists idx_demand_signals_actor_user_id
  on public.demand_signals(actor_user_id);
create index if not exists idx_demand_signals_category_id
  on public.demand_signals(category_id);
create index if not exists idx_demand_signals_category_node_id
  on public.demand_signals(category_node_id);

create index if not exists idx_external_import_opt_outs_created_by
  on public.external_import_opt_outs(created_by);
create index if not exists idx_external_import_opt_outs_source_id
  on public.external_import_opt_outs(source_id);
create index if not exists idx_external_import_opt_outs_verified_by
  on public.external_import_opt_outs(verified_by);

create index if not exists idx_listing_claims_claimant_user_id
  on public.listing_claims(claimant_user_id);
create index if not exists idx_listing_claims_reviewed_by
  on public.listing_claims(reviewed_by);
create index if not exists idx_listing_claims_seller_entity_id
  on public.listing_claims(seller_entity_id);

create index if not exists idx_listing_contact_events_actor_user_id
  on public.listing_contact_events(actor_user_id);

create index if not exists idx_listing_duplicate_group_members_listing_id
  on public.listing_duplicate_group_members(listing_id);
create index if not exists idx_listing_duplicate_groups_canonical_listing_id
  on public.listing_duplicate_groups(canonical_listing_id);
create index if not exists idx_listing_duplicate_groups_created_by
  on public.listing_duplicate_groups(created_by);

create index if not exists idx_listing_freshness_policies_category_node_id
  on public.listing_freshness_policies(category_node_id);

create index if not exists idx_listing_ingest_candidates_candidate_listing_id
  on public.listing_ingest_candidates(candidate_listing_id);
create index if not exists idx_listing_ingest_candidates_category_node_id
  on public.listing_ingest_candidates(category_node_id);
create index if not exists idx_listing_ingest_candidates_duplicate_group_id
  on public.listing_ingest_candidates(duplicate_group_id);
create index if not exists idx_listing_ingest_candidates_source_id
  on public.listing_ingest_candidates(source_id);

create index if not exists idx_listing_ingest_jobs_approved_by
  on public.listing_ingest_jobs(approved_by);
create index if not exists idx_listing_ingest_jobs_created_by
  on public.listing_ingest_jobs(created_by);
create index if not exists idx_listing_ingest_jobs_source_id
  on public.listing_ingest_jobs(source_id);

create index if not exists idx_listing_provenance_events_actor_user_id
  on public.listing_provenance_events(actor_user_id);
create index if not exists idx_listing_provenance_events_job_id
  on public.listing_provenance_events(job_id);
create index if not exists idx_listing_provenance_events_listing_id
  on public.listing_provenance_events(listing_id);
create index if not exists idx_listing_provenance_events_source_observation_id
  on public.listing_provenance_events(source_observation_id);

create index if not exists idx_listing_share_outputs_listing_id
  on public.listing_share_outputs(listing_id);
create index if not exists idx_listing_share_outputs_user_id
  on public.listing_share_outputs(user_id);

create index if not exists idx_listing_source_observations_import_job_id
  on public.listing_source_observations(import_job_id);
create index if not exists idx_listing_source_observations_ingest_actor
  on public.listing_source_observations(ingest_actor);

create index if not exists idx_seller_entities_created_by
  on public.seller_entities(created_by);
create index if not exists idx_seller_entities_linked_user_id
  on public.seller_entities(linked_user_id);

commit;
