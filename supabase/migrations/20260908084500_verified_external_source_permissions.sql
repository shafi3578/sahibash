-- External inventory may only be published from a specifically identified
-- source with an active, super-admin-verified rights record. A Telegram
-- forward proves provenance, but never proves seller consent by itself.

create table if not exists public.listing_source_permissions (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.listing_sources(id) on delete cascade,
  scope_identifier text not null check (char_length(btrim(scope_identifier)) between 2 and 240),
  permission_basis text not null check (permission_basis in (
    'source_owner_permission',
    'group_admin_permission',
    'content_license',
    'operator_attestation'
  )),
  attestation_text text not null check (char_length(btrim(attestation_text)) between 30 and 2000),
  evidence_url text,
  evidence_hash text,
  status text not null default 'pending' check (status in ('pending', 'verified', 'revoked', 'expired')),
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  verified_by uuid references auth.users(id) on delete set null,
  verified_at timestamptz,
  revoked_by uuid references auth.users(id) on delete set null,
  revoked_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint listing_source_permissions_valid_window check (
    valid_until is null or valid_until > valid_from
  ),
  constraint listing_source_permissions_verified_actor check (
    status <> 'verified' or (verified_by is not null and verified_at is not null)
  ),
  constraint listing_source_permissions_evidence_url check (
    evidence_url is null or evidence_url ~* '^https://'
  )
);

create index if not exists idx_listing_source_permissions_source_status
  on public.listing_source_permissions(source_id, status, valid_from, valid_until);
create unique index if not exists idx_listing_source_permissions_one_verified
  on public.listing_source_permissions(source_id)
  where status = 'verified';
create index if not exists idx_listing_source_permissions_verified_by
  on public.listing_source_permissions(verified_by)
  where verified_by is not null;
create index if not exists idx_listing_source_permissions_created_by
  on public.listing_source_permissions(created_by);

alter table public.listing_source_permissions enable row level security;

drop policy if exists listing_source_permissions_admin_read on public.listing_source_permissions;
create policy listing_source_permissions_admin_read
on public.listing_source_permissions
for select
to authenticated
using ((select public.has_admin_permission((select auth.uid()), 'listings.view')));

revoke all on table public.listing_source_permissions from public, anon, authenticated;
grant select on table public.listing_source_permissions to authenticated;

alter table public.listings
  add column if not exists ingest_candidate_id uuid
  references public.listing_ingest_candidates(id) on delete set null;
alter table public.listing_source_observations
  add column if not exists ingest_candidate_id uuid
  references public.listing_ingest_candidates(id) on delete set null;

create unique index if not exists idx_listings_ingest_candidate_id
  on public.listings(ingest_candidate_id)
  where ingest_candidate_id is not null;
create index if not exists idx_listing_observations_ingest_candidate_id
  on public.listing_source_observations(ingest_candidate_id)
  where ingest_candidate_id is not null;

-- Repair the historical overloading of permission_record_id. Existing UUIDs
-- in this field point to ingest candidates, not to permission evidence.
update public.listings listing
set ingest_candidate_id = candidate.id
from public.listing_ingest_candidates candidate
where listing.ingest_candidate_id is null
  and listing.permission_record_id = candidate.id::text;

update public.listing_source_observations observation
set ingest_candidate_id = candidate.id
from public.listing_ingest_candidates candidate
where observation.ingest_candidate_id is null
  and observation.permission_record_id = candidate.id::text;

update public.listings
set permission_record_id = null
where ingest_candidate_id is not null
  and provenance_status = 'permission_pending'
  and permission_record_id = ingest_candidate_id::text;

update public.listing_source_observations
set permission_record_id = null
where ingest_candidate_id is not null
  and consented_at is null
  and permission_record_id = ingest_candidate_id::text;

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
  if new.source_type <> 'external_indexed' then
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
before insert on public.listings
for each row execute function public.enforce_external_listing_source_permission();

create or replace function public.set_external_observation_permission()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_permission public.listing_source_permissions%rowtype;
begin
  if new.source_type <> 'external_indexed' then
    return new;
  end if;

  select permission.* into v_permission
  from public.listing_sources source
  join public.listing_source_permissions permission
    on permission.id::text = source.permission_record_id
   and permission.source_id = source.id
  where source.id = new.source_id
    and permission.status = 'verified'
    and permission.valid_from <= now()
    and (permission.valid_until is null or permission.valid_until > now());
  if not found then
    raise exception 'Verified source rights permission is required for an external observation';
  end if;

  if new.ingest_candidate_id is null
     and coalesce(new.permission_record_id, '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
     and exists (
       select 1 from public.listing_ingest_candidates candidate
       where candidate.id::text = new.permission_record_id
     ) then
    new.ingest_candidate_id := new.permission_record_id::uuid;
  end if;
  new.permission_record_id := v_permission.id::text;
  new.permission_basis := v_permission.permission_basis;
  new.provenance_confidence := greatest(coalesce(new.provenance_confidence, 0), 0.90);
  return new;
end;
$$;

revoke all on function public.set_external_observation_permission()
  from public, anon, authenticated;
grant execute on function public.set_external_observation_permission()
  to service_role;

drop trigger if exists zz_set_external_observation_permission on public.listing_source_observations;
create trigger zz_set_external_observation_permission
before insert on public.listing_source_observations
for each row execute function public.set_external_observation_permission();

create or replace function public.register_listing_source_permission_service(
  p_source_id uuid,
  p_actor_id uuid,
  p_scope_identifier text,
  p_permission_basis text,
  p_attestation_text text,
  p_evidence_url text default null,
  p_valid_until timestamptz default null,
  p_verify boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_source public.listing_sources%rowtype;
  v_permission_id uuid;
  v_scope text := btrim(coalesce(p_scope_identifier, ''));
  v_basis text := lower(btrim(coalesce(p_permission_basis, '')));
  v_attestation text := btrim(coalesce(p_attestation_text, ''));
  v_evidence_url text := nullif(btrim(coalesce(p_evidence_url, '')), '');
begin
  if p_actor_id is null
     or not public.is_super_administrator(p_actor_id)
     or not public.has_admin_permission(p_actor_id, 'listings.moderate') then
    raise exception 'Not authorized to manage source permissions';
  end if;
  if char_length(v_scope) not between 2 and 240
     or char_length(v_attestation) not between 30 and 2000
     or v_basis not in ('source_owner_permission', 'group_admin_permission', 'content_license', 'operator_attestation') then
    raise exception 'Source permission record is invalid';
  end if;
  if v_evidence_url is not null and v_evidence_url !~* '^https://' then
    raise exception 'Permission evidence must use HTTPS';
  end if;
  if p_valid_until is not null and p_valid_until <= now() then
    raise exception 'Permission expiry must be in the future';
  end if;

  select * into v_source
  from public.listing_sources
  where id = p_source_id
  for update;
  if not found or v_source.source_type <> 'external_indexed' then
    raise exception 'External listing source not found';
  end if;
  if p_verify and v_source.slug = 'telegram-forwarded' then
    raise exception 'A mixed generic Telegram source cannot receive blanket rights authorization';
  end if;
  if p_verify and v_basis <> 'operator_attestation' and v_evidence_url is null then
    raise exception 'Verifiable permission evidence URL is required';
  end if;

  if p_verify then
    update public.listing_source_permissions
    set status = 'revoked', revoked_by = p_actor_id, revoked_at = now(), updated_at = now()
    where source_id = p_source_id and status = 'verified';
  end if;

  insert into public.listing_source_permissions (
    source_id, scope_identifier, permission_basis, attestation_text,
    evidence_url, evidence_hash, status, valid_until,
    verified_by, verified_at, created_by
  ) values (
    p_source_id, v_scope, v_basis, v_attestation,
    v_evidence_url,
    case when v_evidence_url is null then null
      else encode(extensions.digest(v_evidence_url, 'sha256'), 'hex') end,
    case when p_verify then 'verified' else 'pending' end,
    p_valid_until,
    case when p_verify then p_actor_id end,
    case when p_verify then now() end,
    p_actor_id
  ) returning id into v_permission_id;

  if p_verify then
    update public.listing_sources
    set permission_basis = v_basis,
        permission_record_id = v_permission_id::text,
        updated_at = now()
    where id = p_source_id;
  end if;

  insert into public.audit_logs (
    admin_user_id, action, entity_type, entity_id, safe_changes
  ) values (
    p_actor_id,
    case when p_verify then 'LISTING_SOURCE_PERMISSION_VERIFIED' else 'LISTING_SOURCE_PERMISSION_RECORDED' end,
    'listing_source',
    p_source_id::text,
    jsonb_build_object(
      'permission_record_id', v_permission_id,
      'scope_identifier', v_scope,
      'permission_basis', v_basis,
      'status', case when p_verify then 'verified' else 'pending' end,
      'evidence_url_present', v_evidence_url is not null,
      'valid_until', p_valid_until
    )
  );

  return v_permission_id;
end;
$$;

revoke all on function public.register_listing_source_permission_service(
  uuid, uuid, text, text, text, text, timestamptz, boolean
) from public, anon, authenticated;
grant execute on function public.register_listing_source_permission_service(
  uuid, uuid, text, text, text, text, timestamptz, boolean
) to service_role;

-- Rights-authorized but still-unclaimed external ads retain the same strict
-- 30-day lifecycle as permission-pending imports.
drop index if exists public.idx_listings_forwarded_retention_due;
create index idx_listings_forwarded_retention_due
  on public.listings(expires_at, id)
  where source_type = 'external_indexed'
    and source_platform = 'telegram'
    and ownership_status = 'unclaimed'
    and provenance_status in ('permission_pending', 'authorized');

create or replace function public.expire_due_forwarded_external_ads(p_limit integer default 100)
returns table(listing_id uuid, candidate_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_limit < 1 or p_limit > 500 then raise exception 'Invalid retention batch size'; end if;

  return query
  with targets as (
    select listing.id
    from public.listings listing
    where listing.source_type = 'external_indexed'
      and listing.source_platform = 'telegram'
      and listing.ownership_status = 'unclaimed'
      and listing.provenance_status in ('permission_pending', 'authorized')
      and listing.expires_at <= now()
      and listing.status in ('approved', 'expired')
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
    returning listing_id
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

comment on table public.listing_source_permissions is
  'Auditable source-scoped rights records. Telegram provenance alone never creates a verified permission.';
comment on function public.enforce_external_listing_source_permission() is
  'Blocks new external publication unless the exact source has a current verified rights record.';
comment on function public.register_listing_source_permission_service(uuid, uuid, text, text, text, text, timestamptz, boolean) is
  'Service-only, super-admin-checked registration of pending or verified source rights evidence.';
