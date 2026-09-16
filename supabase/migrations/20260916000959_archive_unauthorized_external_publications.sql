-- Close the legacy-publication gap left by the initial source-permission
-- rollout. No row is deleted: unverifiable external listings are archived,
-- contacts are hidden, and an immutable provenance event records the change.

with unauthorized as materialized (
  select
    listing.id,
    jsonb_build_object(
      'status', listing.status,
      'publication_status', listing.publication_status,
      'provenance_status', listing.provenance_status,
      'permission_record_id', listing.permission_record_id,
      'allow_contact_display', listing.allow_contact_display
    ) as before_state
  from public.listings listing
  where listing.source_type = 'external_indexed'
    and (listing.status = 'approved' or listing.publication_status = 'published')
    and not exists (
      select 1
      from public.listing_ingest_candidates candidate
      join public.listing_sources source on source.id = candidate.source_id
      join public.listing_source_permissions permission
        on permission.source_id = source.id
       and permission.id::text = listing.permission_record_id
      where candidate.id = listing.ingest_candidate_id
        and source.status = 'active'
        and not source.kill_switch_enabled
        and source.slug <> 'telegram-forwarded'
        and permission.status = 'verified'
        and permission.verified_by is not null
        and permission.verified_at is not null
        and permission.valid_from <= now()
        and (permission.valid_until is null or permission.valid_until > now())
    )
), archived as (
  update public.listings listing
  set
    status = 'expired',
    publication_status = 'archived',
    provenance_status = 'permission_pending',
    allow_contact_display = false,
    noindex_external = true,
    removed_public_at = coalesce(listing.removed_public_at, now()),
    updated_at = now()
  from unauthorized
  where listing.id = unauthorized.id
  returning listing.id
)
insert into public.listing_provenance_events (
  listing_id, event_type, source_type, before_state, after_state, reason
)
select
  archived.id,
  'external_rights_publication_archived',
  'external_indexed',
  unauthorized.before_state,
  jsonb_build_object(
    'status', 'expired',
    'publication_status', 'archived',
    'provenance_status', 'permission_pending',
    'allow_contact_display', false,
    'noindex_external', true
  ),
  'External publication archived because no current source-scoped verified rights record could be proven'
from archived
join unauthorized on unauthorized.id = archived.id;

create or replace function public.enforce_external_listing_source_permission()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_candidate_id uuid;
  v_source_id uuid;
  v_permission public.listing_source_permissions%rowtype;
begin
  if new.source_type <> 'external_indexed'
     or (
       coalesce(new.status::text, '') <> 'approved'
       and coalesce(new.publication_status::text, '') <> 'published'
     ) then
    return new;
  end if;

  v_candidate_id := new.ingest_candidate_id;
  if v_candidate_id is null
     and coalesce(new.permission_record_id, '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
     and exists (
       select 1 from public.listing_ingest_candidates candidate
       where candidate.id::text = new.permission_record_id
     ) then
    v_candidate_id := new.permission_record_id::uuid;
  end if;
  if v_candidate_id is null then
    raise exception 'External listing ingest candidate is missing';
  end if;

  select candidate.source_id into v_source_id
  from public.listing_ingest_candidates candidate
  where candidate.id = v_candidate_id;
  if v_source_id is null then
    raise exception 'External listing source is missing';
  end if;

  select permission.* into v_permission
  from public.listing_sources source
  join public.listing_source_permissions permission
    on permission.id::text = source.permission_record_id
   and permission.source_id = source.id
  where source.id = v_source_id
    and source.status = 'active'
    and not source.kill_switch_enabled
    and source.slug <> 'telegram-forwarded'
    and permission.status = 'verified'
    and permission.verified_by is not null
    and permission.verified_at is not null
    and permission.valid_from <= now()
    and (permission.valid_until is null or permission.valid_until > now());

  if not found then
    raise exception 'Verified source rights permission is required before publication';
  end if;

  new.ingest_candidate_id := v_candidate_id;
  new.permission_record_id := v_permission.id::text;
  new.permission_basis := v_permission.permission_basis;
  new.provenance_status := 'authorized';
  new.provenance_confidence := greatest(coalesce(new.provenance_confidence, 0), 0.90);
  return new;
end;
$$;

revoke all on function public.enforce_external_listing_source_permission()
  from public, anon, authenticated;
grant execute on function public.enforce_external_listing_source_permission()
  to service_role;

drop trigger if exists zz_require_external_source_permission on public.listings;
create trigger zz_require_external_source_permission
before insert or update of
  source_type,
  ingest_candidate_id,
  permission_record_id,
  status,
  publication_status
on public.listings
for each row execute function public.enforce_external_listing_source_permission();

comment on function public.enforce_external_listing_source_permission() is
  'Blocks both new and legacy external publication unless the exact source has a current verified rights record.';
