-- Close the legacy-publication gap left by the initial source-permission
-- rollout. No row is deleted: unverifiable external listings are archived,
-- contacts are hidden, and an immutable provenance event records the change.
-- Keep the audit payload limited to publication fields (never contact details or
-- exact coordinates). The BEFORE triggers also change freshness/updated_at and
-- may recover source_posted_at, so capture their actual returned values too.

with unauthorized as materialized (
  select
    listing.id,
    jsonb_build_object(
      'status', listing.status,
      'publication_status', listing.publication_status,
      'provenance_status', listing.provenance_status,
      'permission_record_id', listing.permission_record_id,
      'allow_contact_display', listing.allow_contact_display,
      'noindex_external', listing.noindex_external,
      'removed_public_at', listing.removed_public_at,
      'updated_at', listing.updated_at,
      'freshness_status', listing.freshness_status,
      'source_posted_at', listing.source_posted_at
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
  for update of listing
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
  returning listing.id, jsonb_build_object(
    'status', listing.status,
    'publication_status', listing.publication_status,
    'provenance_status', listing.provenance_status,
    'permission_record_id', listing.permission_record_id,
    'allow_contact_display', listing.allow_contact_display,
    'noindex_external', listing.noindex_external,
    'removed_public_at', listing.removed_public_at,
    'updated_at', listing.updated_at,
    'freshness_status', listing.freshness_status,
    'source_posted_at', listing.source_posted_at
  ) as after_state
)
insert into public.listing_provenance_events (
  listing_id, event_type, source_type, before_state, after_state, reason
)
select
  archived.id,
  'external_rights_publication_archived',
  'external_indexed',
  unauthorized.before_state,
  archived.after_state,
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

-- The archive event is a narrowly scoped preservation hold until source-rights
-- review changes provenance_status away from permission_pending. In particular,
-- exclude held rows from the FIRST phase: the caller removes Storage objects
-- before invoking the purge RPC. Ordinary ads retain their existing expiry.
create or replace function public.expire_due_forwarded_external_ads(p_limit integer default 100)
returns table(listing_id uuid, candidate_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_limit is null or p_limit < 1 or p_limit > 500 then raise exception 'Invalid retention batch size'; end if;

  return query
  with targets as (
    select listing.id
    from public.listings listing
    where listing.source_type = 'external_indexed'
      and listing.source_platform = 'telegram'
      and listing.ownership_status = 'unclaimed'
      and listing.provenance_status in ('permission_pending', 'authorized')
      and listing.expires_at is not null
      and listing.expires_at <= now()
      and listing.status in ('approved', 'expired')
      and not (
        listing.provenance_status = 'permission_pending'
        and exists (
          select 1 from public.listing_provenance_events event
          where event.listing_id = listing.id
            and event.event_type = 'external_rights_publication_archived'
            and event.source_type = 'external_indexed'
            and event.actor_user_id is null
        )
      )
    order by listing.expires_at, listing.id
    limit p_limit
    for update skip locked
  ), expired as (
    update public.listings listing
    set status = 'expired', publication_status = 'archived', freshness_status = 'expired',
        allow_contact_display = false, noindex_external = true,
        removed_public_at = coalesce(listing.removed_public_at, now()), updated_at = now()
    from targets
    where listing.id = targets.id and listing.status = 'approved'
    returning listing.id
  ), logged as (
    insert into public.listing_provenance_events (
      listing_id, event_type, source_type, before_state, after_state, reason
    )
    select expired.id, 'external_retention_expired', 'external_indexed',
      jsonb_build_object('publication_status', 'published'),
      jsonb_build_object('publication_status', 'archived', 'retention_days', 30),
      'Forwarded external advertisement reached its 30-day retention limit'
    from expired
  )
  select targets.id, candidate.id
  from targets
  left join public.listing_ingest_candidates candidate on candidate.candidate_listing_id = targets.id;
end;
$$;

revoke all on function public.expire_due_forwarded_external_ads(integer)
  from public, anon, authenticated;
grant execute on function public.expire_due_forwarded_external_ads(integer)
  to service_role;

create or replace function public.purge_expired_forwarded_external_ad(p_listing_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_listing public.listings%rowtype;
  v_candidate public.listing_ingest_candidates%rowtype;
  v_has_user_history boolean;
  v_disposition text;
begin
  select * into v_listing from public.listings where id = p_listing_id for update;
  if not found then return 'missing'; end if;
  -- Positive, null-safe boundary: a missing expiry must never permit deletion.
  if (
    v_listing.source_type = 'external_indexed'
    and v_listing.source_platform = 'telegram'
    and v_listing.ownership_status = 'unclaimed'
    and v_listing.provenance_status in ('permission_pending', 'authorized')
    and v_listing.expires_at is not null
    and v_listing.expires_at <= now()
    and v_listing.status = 'expired'
    and v_listing.publication_status = 'archived'
  ) is not true then
    raise exception 'Listing is outside the forwarded-ad retention boundary';
  end if;

  if v_listing.provenance_status = 'permission_pending' and exists (
    select 1 from public.listing_provenance_events event
    where event.listing_id = v_listing.id
      and event.event_type = 'external_rights_publication_archived'
      and event.source_type = 'external_indexed'
      and event.actor_user_id is null
  ) then
    raise exception 'Listing is held for source-rights review';
  end if;

  select * into v_candidate
  from public.listing_ingest_candidates
  where candidate_listing_id = v_listing.id
  order by created_at limit 1
  for update;

  v_has_user_history :=
    exists(select 1 from public.messages where listing_id = v_listing.id)
    or exists(select 1 from public.offers where listing_id = v_listing.id)
    or exists(select 1 from public.favorites where listing_id = v_listing.id)
    or exists(select 1 from public.reports where listing_id = v_listing.id)
    or exists(select 1 from public.listing_claims where listing_id = v_listing.id)
    or exists(select 1 from public.listing_contact_events where listing_id = v_listing.id)
    or exists(select 1 from public.listing_promotions where listing_id = v_listing.id)
    or exists(select 1 from public.promotion_payment_requests where listing_id = v_listing.id);
  v_disposition := case when v_has_user_history then 'scrubbed' else 'deleted' end;

  insert into private.external_inventory_retention_tombstones (
    object_type, object_id, source_platform, source_item_hash, job_id,
    disposition, expired_at
  ) values (
    'published_listing', v_listing.id, 'telegram',
    encode(extensions.digest(coalesce(v_listing.source_item_id, ''), 'sha256'), 'hex'),
    v_candidate.job_id, v_disposition, v_listing.expires_at
  ) on conflict (object_type, object_id) do nothing;

  insert into public.listing_provenance_events (
    listing_id, event_type, source_type, after_state, reason, job_id
  ) values (
    v_listing.id, 'external_retention_purged', 'external_indexed',
    jsonb_build_object('retention_days', 30, 'disposition', v_disposition),
    'Expired forwarded advertisement payload and media were purged', v_candidate.job_id
  );

  if v_candidate.id is not null then
    delete from public.listing_ingest_candidates where id = v_candidate.id;
  end if;

  if not v_has_user_history then
    delete from public.listings where id = v_listing.id;
  else
    -- Keep the existing user-history shell and 30-day scrubbing behavior.
    delete from public.ai_moderation_reviews where listing_id = v_listing.id;
    delete from public.electronics_listings where listing_id = v_listing.id;
    delete from public.listing_category_path where listing_id = v_listing.id;
    delete from public.listing_images where listing_id = v_listing.id;
    delete from public.listing_attributes where listing_id = v_listing.id;
    delete from public.listing_translations where listing_id = v_listing.id;
    delete from public.listing_vehicle_features where listing_id = v_listing.id;
    delete from public.vehicle_damage_reports where listing_id = v_listing.id;
    delete from public.listing_notes where listing_id = v_listing.id;
    delete from public.listing_price_history where listing_id = v_listing.id;
    delete from public.listing_quality_signals where listing_id = v_listing.id;
    delete from public.listing_risk_signals where listing_id = v_listing.id;
    delete from public.listing_share_outputs where listing_id = v_listing.id;
    delete from public.listing_source_observations where listing_id = v_listing.id;
    delete from public.listing_translation_jobs where listing_id = v_listing.id;
    update public.listings
    set title = 'Expired external listing',
        description = 'This forwarded advertisement expired after the 30-day retention period.',
        original_title = 'Expired external listing',
        original_description = 'This forwarded advertisement expired after the 30-day retention period.',
        contact_phone = '', contact_name = null, whatsapp_enabled = false,
        province = null, district = null, neighborhood = null,
        address_optional = null, address_text = null,
        latitude = null, longitude = null, location_accuracy = null,
        source_item_id = null, source_url = null, source_payload_hash = null,
        vehicle_brand = null, vehicle_model = null, vehicle_year = null,
        ownership_status = 'removed', provenance_status = 'blocked',
        removed_public_at = coalesce(removed_public_at, now()), updated_at = now()
    where id = v_listing.id;
  end if;

  return v_disposition;
end;
$$;

revoke all on function public.purge_expired_forwarded_external_ad(uuid)
  from public, anon, authenticated;
grant execute on function public.purge_expired_forwarded_external_ad(uuid)
  to service_role;

comment on function public.expire_due_forwarded_external_ads(integer) is
  'Service-only first phase: expires due unclaimed Telegram external ads, excluding pending source-rights review holds before Storage cleanup.';
comment on function public.purge_expired_forwarded_external_ad(uuid) is
  'Service-only second phase: purges due unclaimed Telegram ads with known expiry and no pending source-rights review hold, preserving user interaction history.';
