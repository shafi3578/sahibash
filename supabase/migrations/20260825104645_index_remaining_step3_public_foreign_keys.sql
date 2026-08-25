begin;

-- Step 3 scale follow-up: cover the remaining Advisor-reported public
-- single-column foreign keys in launch/import/business-seller pathways.
-- This is intentionally index-only and preserves existing RLS/policy behavior.

create index if not exists idx_listing_sources_created_by
  on public.listing_sources(created_by);

create index if not exists idx_listings_canonical_duplicate_group_id
  on public.listings(canonical_duplicate_group_id);

create index if not exists idx_market_cell_retirement_policies_updated_by
  on public.market_cell_retirement_policies(updated_by);

create index if not exists idx_market_cell_rollup_runs_created_by
  on public.market_cell_rollup_runs(created_by);

create index if not exists idx_organization_members_user_id
  on public.organization_members(user_id);

create index if not exists idx_organizations_created_by
  on public.organizations(created_by);

create index if not exists idx_scout_submissions_candidate_id
  on public.scout_submissions(candidate_id);

create index if not exists idx_scout_submissions_listing_id
  on public.scout_submissions(listing_id);

create index if not exists idx_scout_submissions_reviewed_by
  on public.scout_submissions(reviewed_by);

create index if not exists idx_scout_submissions_seller_entity_id
  on public.scout_submissions(seller_entity_id);

create index if not exists idx_seller_lead_summaries_user_id
  on public.seller_lead_summaries(user_id);

create index if not exists idx_wanted_requests_category_id
  on public.wanted_requests(category_id);

create index if not exists idx_wanted_requests_category_node_id
  on public.wanted_requests(category_node_id);

commit;
