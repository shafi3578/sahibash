-- Keep the immutable source observation aligned with the listing's verified
-- original publication time. Do not fabricate a seller consent timestamp:
-- administrator-authorized forwarding and seller consent are distinct facts.

create or replace function public.set_external_observation_source_posted_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_candidate public.listing_ingest_candidates%rowtype;
begin
  if new.source_type <> 'external_indexed' or new.source_posted_at is not null then
    return new;
  end if;

  select listing.source_posted_at into new.source_posted_at
  from public.listings listing
  where listing.id = new.listing_id;

  if new.source_posted_at is null
     and coalesce(new.permission_record_id, '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    select * into v_candidate
    from public.listing_ingest_candidates
    where id = new.permission_record_id::uuid;

    if found then
      new.source_posted_at := public.extract_external_source_posted_at(
        v_candidate.raw_payload,
        v_candidate.normalized_payload
      );
    end if;
  end if;

  if new.source_posted_at is null then
    raise exception 'External source observation publication time is required';
  end if;

  return new;
end;
$$;

revoke all on function public.set_external_observation_source_posted_at()
  from public, anon, authenticated;
grant execute on function public.set_external_observation_source_posted_at()
  to service_role;

drop trigger if exists preserve_external_observation_source_posted_at
  on public.listing_source_observations;
create trigger preserve_external_observation_source_posted_at
before insert or update of source_type, source_posted_at, listing_id, permission_record_id
on public.listing_source_observations
for each row execute function public.set_external_observation_source_posted_at();

update public.listing_source_observations observation
set source_posted_at = listing.source_posted_at,
    updated_at = now()
from public.listings listing
where observation.listing_id = listing.id
  and observation.source_type = 'external_indexed'
  and observation.source_posted_at is null
  and listing.source_posted_at is not null;

comment on function public.set_external_observation_source_posted_at() is
  'Preserves the verified source publication time in external provenance observations without inventing seller consent.';
