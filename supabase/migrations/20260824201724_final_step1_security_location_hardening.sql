begin;

-- Keep the child-table visibility helper out of the exposed public RPC schema.
-- The helper is still needed by RLS policies because public clients do not have
-- direct SELECT on private listing columns such as user_id.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

create or replace function private.can_read_listing_children(target_listing_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.listings l
    where l.id = target_listing_id
      and (
        l.status = 'approved'::public.listing_status
        or (
          (select auth.uid()) is not null
          and l.user_id = (select auth.uid())
        )
        or (select public.is_admin((select auth.uid())))
      )
  );
$$;

revoke all on function private.can_read_listing_children(uuid) from public;
grant execute on function private.can_read_listing_children(uuid) to anon, authenticated, service_role;

drop policy if exists listing_images_select_visible on public.listing_images;
drop policy if exists listing_images_select_with_visible_listing on public.listing_images;

create policy listing_images_select_with_visible_listing
on public.listing_images
for select
to anon, authenticated
using (private.can_read_listing_children(listing_id));

drop policy if exists listing_attributes_select_visible on public.listing_attributes;
drop policy if exists listing_attributes_select_with_visible_listing on public.listing_attributes;

create policy listing_attributes_select_with_visible_listing
on public.listing_attributes
for select
to anon, authenticated
using (private.can_read_listing_children(listing_id));

drop function if exists public.can_read_listing_children(uuid);

comment on function private.can_read_listing_children(uuid)
  is 'Trusted RLS helper for public listing child embeds. It is intentionally outside the exposed public RPC schema to avoid direct public SECURITY DEFINER execution.';

-- One public-safe coordinate strategy for every listing/location API:
-- exact       -> exact stored coordinate, only when seller explicitly chose exact
-- approximate -> deterministic 2-decimal grid, never random and never exact
-- hidden/province_district/other -> no public coordinate
create or replace function public.sanitize_public_listing_coordinate(
  coordinate numeric,
  visibility public.location_visibility
)
returns numeric
language sql
immutable
security invoker
set search_path = public, pg_temp
as $$
  select case
    when coordinate is null then null::numeric
    when visibility = 'exact'::public.location_visibility then coordinate
    when visibility = 'approximate'::public.location_visibility then round(coordinate * 100) / 100
    else null::numeric
  end;
$$;

grant execute on function public.sanitize_public_listing_coordinate(numeric, public.location_visibility)
  to anon, authenticated, service_role;

comment on function public.sanitize_public_listing_coordinate(numeric, public.location_visibility)
  is 'Public coordinate sanitizer shared by listing location RPCs: exact only for exact visibility, approximate is deterministic 2-decimal grid, hidden/province_district returns null.';

create or replace function public.get_nearby_listings(
  buyer_latitude numeric,
  buyer_longitude numeric,
  radius_km numeric default 10,
  listing_status text default 'approved',
  category_filter_id bigint default null,
  limit_count integer default 50
)
returns table (
  listing_id uuid,
  title text,
  price numeric,
  currency public.currency_code,
  province_id bigint,
  district_id bigint,
  area_id bigint,
  latitude numeric,
  longitude numeric,
  location_visibility public.location_visibility,
  distance_km numeric,
  created_at timestamptz,
  user_id uuid
)
language plpgsql
stable
set search_path = public, pg_temp
as $$
declare
  deg_2_rad_factor numeric := pi()::numeric / 180.0;
  earth_radius_km numeric := 6371;
begin
  return query
  with public_points as (
    select
      l.id,
      l.title,
      l.price,
      l.currency,
      l.province_id,
      l.district_id,
      l.area_id,
      public.sanitize_public_listing_coordinate(l.latitude::numeric, l.location_visibility) as public_latitude,
      public.sanitize_public_listing_coordinate(l.longitude::numeric, l.location_visibility) as public_longitude,
      l.location_visibility,
      l.created_at,
      l.user_id
    from public.listings l
    join public.categories c on c.id = l.category_id
    where l.status = listing_status::public.listing_status
      and c.is_active = true
      and c.is_coming_soon = false
      and (l.publication_status is null or l.publication_status = 'published')
      and l.removed_public_at is null
      and coalesce(l.freshness_status::text, 'seller_confirmed') not in ('expired', 'source_missing', 'sold_confirmed')
      and l.location_visibility in ('exact'::public.location_visibility, 'approximate'::public.location_visibility)
      and l.latitude is not null
      and l.longitude is not null
      and (category_filter_id is null or l.category_id = category_filter_id)
  ), bounded as (
    select
      p.*,
      (
        earth_radius_km * 2 * asin(sqrt(
          power(sin((p.public_latitude - buyer_latitude) * deg_2_rad_factor / 2), 2) +
          cos(buyer_latitude * deg_2_rad_factor) * cos(p.public_latitude * deg_2_rad_factor) *
          power(sin((p.public_longitude - buyer_longitude) * deg_2_rad_factor / 2), 2)
        ))
      )::numeric as dist
    from public_points p
    where p.public_latitude is not null
      and p.public_longitude is not null
      and buyer_latitude is not null
      and buyer_longitude is not null
  )
  select
    b.id,
    b.title,
    b.price,
    b.currency,
    b.province_id,
    b.district_id,
    b.area_id,
    b.public_latitude,
    b.public_longitude,
    b.location_visibility,
    b.dist,
    b.created_at,
    b.user_id
  from bounded b
  where b.dist <= greatest(radius_km, 0)
  order by b.dist asc
  limit greatest(least(limit_count, 100), 1);
end;
$$;

create or replace function public.get_listings_by_location(
  province_filter_id bigint default null,
  district_filter_id bigint default null,
  area_filter_id bigint default null,
  buyer_latitude numeric default null,
  buyer_longitude numeric default null,
  listing_status text default 'approved',
  category_filter_id bigint default null,
  limit_count integer default 50,
  offset_count integer default 0
)
returns table (
  listing_id uuid,
  title text,
  price numeric,
  currency public.currency_code,
  province_id bigint,
  district_id bigint,
  area_id bigint,
  latitude numeric,
  longitude numeric,
  location_visibility public.location_visibility,
  distance_km numeric,
  created_at timestamptz,
  user_id uuid
)
language plpgsql
stable
set search_path = public, pg_temp
as $$
declare
  deg_2_rad_factor numeric := pi()::numeric / 180.0;
  earth_radius_km numeric := 6371;
begin
  return query
  with public_points as (
    select
      l.id,
      l.title,
      l.price,
      l.currency,
      l.province_id,
      l.district_id,
      l.area_id,
      public.sanitize_public_listing_coordinate(l.latitude::numeric, l.location_visibility) as public_latitude,
      public.sanitize_public_listing_coordinate(l.longitude::numeric, l.location_visibility) as public_longitude,
      l.location_visibility,
      l.created_at,
      l.user_id
    from public.listings l
    join public.categories c on c.id = l.category_id
    where l.status = listing_status::public.listing_status
      and c.is_active = true
      and c.is_coming_soon = false
      and (l.publication_status is null or l.publication_status = 'published')
      and l.removed_public_at is null
      and coalesce(l.freshness_status::text, 'seller_confirmed') not in ('expired', 'source_missing', 'sold_confirmed')
      and (province_filter_id is null or l.province_id = province_filter_id)
      and (district_filter_id is null or l.district_id = district_filter_id)
      and (area_filter_id is null or l.area_id = area_filter_id)
      and (category_filter_id is null or l.category_id = category_filter_id)
  )
  select
    p.id,
    p.title,
    p.price,
    p.currency,
    p.province_id,
    p.district_id,
    p.area_id,
    p.public_latitude,
    p.public_longitude,
    p.location_visibility,
    (
      case
        when buyer_latitude is not null
          and buyer_longitude is not null
          and p.public_latitude is not null
          and p.public_longitude is not null
        then earth_radius_km * 2 * asin(sqrt(
          power(sin((p.public_latitude - buyer_latitude) * deg_2_rad_factor / 2), 2) +
          cos(buyer_latitude * deg_2_rad_factor) * cos(p.public_latitude * deg_2_rad_factor) *
          power(sin((p.public_longitude - buyer_longitude) * deg_2_rad_factor / 2), 2)
        ))
        else null
      end
    )::numeric as dist,
    p.created_at,
    p.user_id
  from public_points p
  order by
    case
      when buyer_latitude is not null
        and buyer_longitude is not null
        and p.public_latitude is not null
        and p.public_longitude is not null
      then earth_radius_km * 2 * asin(sqrt(
        power(sin((p.public_latitude - buyer_latitude) * deg_2_rad_factor / 2), 2) +
        cos(buyer_latitude * deg_2_rad_factor) * cos(p.public_latitude * deg_2_rad_factor) *
        power(sin((p.public_longitude - buyer_longitude) * deg_2_rad_factor / 2), 2)
      ))
      else null
    end asc nulls last,
    p.created_at desc
  limit greatest(least(limit_count, 100), 1)
  offset greatest(offset_count, 0);
end;
$$;

revoke all on function public.get_nearby_listings(numeric,numeric,numeric,text,bigint,integer) from public;
grant execute on function public.get_nearby_listings(numeric,numeric,numeric,text,bigint,integer)
  to anon, authenticated, service_role;

revoke all on function public.get_listings_by_location(bigint,bigint,bigint,numeric,numeric,text,bigint,integer,integer) from public;
grant execute on function public.get_listings_by_location(bigint,bigint,bigint,numeric,numeric,text,bigint,integer,integer)
  to anon, authenticated, service_role;

comment on function public.get_nearby_listings(numeric,numeric,numeric,text,bigint,integer)
  is 'Public-safe nearby listing RPC. Distance and returned coordinates use sanitized public coordinates: exact only for exact visibility, deterministic grid for approximate, hidden omitted.';
comment on function public.get_listings_by_location(bigint,bigint,bigint,numeric,numeric,text,bigint,integer,integer)
  is 'Public-safe location listing RPC. Returned coordinates and distance calculations use the shared public coordinate sanitizer; hidden/province_district returns no coordinates.';

-- Production data-quality cleanup: archive confirmed garbage/smoke listings
-- without deleting user data. The target set is intentionally narrow:
-- 1) exact garbage title "Jgifj"; 2) duplicate "corola 2024 new" rows with
-- impossible vehicle year attributes.
with authorized_actor as (
  select aur.user_id
  from public.admin_user_roles aur
  join public.admin_roles ar on ar.id = aur.role_id
  where ar.name = 'super_administrator'
  order by aur.assigned_at desc nulls last, aur.user_id
  limit 1
), garbage_targets as (
  select distinct l.id, l.status as from_status
  from public.listings l
  left join public.listing_attributes year_attr
    on year_attr.listing_id = l.id
   and year_attr.attribute_key = 'year'
  where l.status = 'approved'::public.listing_status
    and coalesce(l.publication_status::text, 'published') = 'published'
    and (
      btrim(lower(l.title)) = 'jgifj'
      or (
        btrim(lower(l.title)) = 'corola 2024 new'
        and coalesce(year_attr.attribute_value_number, nullif(regexp_replace(coalesce(year_attr.attribute_value_text, ''), '[^0-9]', '', 'g'), '')::numeric) > 2100
      )
    )
), archived as (
  update public.listings l
  set status = 'rejected'::public.listing_status,
      publication_status = 'archived'::public.listing_publication_status,
      freshness_status = 'expired'::public.listing_freshness_status,
      archived_at = coalesce(l.archived_at, now()),
      removed_public_at = coalesce(l.removed_public_at, now()),
      rejection_reason = 'production_data_quality_garbage',
      approval_rejected_reason = 'Archived during Step 1 production hardening: confirmed garbage/test listing, not deleted.',
      updated_at = now()
  from garbage_targets gt
  where l.id = gt.id
  returning l.id, gt.from_status, l.status as to_status
), moderation_audit as (
  insert into public.listing_moderation_events (
    listing_id,
    actor_user_id,
    from_status,
    to_status,
    reason_code,
    internal_note,
    seller_explanation
  )
  select
    archived.id,
    authorized_actor.user_id,
    archived.from_status,
    archived.to_status,
    'production_data_quality_garbage',
    'Step 1 final hardening archived confirmed garbage/test listing. Row retained for auditability.',
    null
  from archived
  cross join authorized_actor
  returning listing_id
)
insert into public.audit_logs (
  admin_user_id,
  action,
  entity_type,
  entity_id,
  safe_changes
)
select
  authorized_actor.user_id,
  'PRODUCTION_LISTING_ARCHIVED',
  'listing',
  archived.id::text,
  jsonb_build_object(
    'reason', 'production_data_quality_garbage',
    'from_status', archived.from_status::text,
    'to_status', archived.to_status::text,
    'publication_status', 'archived',
    'deleted', false,
    'source', 'step1_final_hardening'
  )
from archived
cross join authorized_actor;

commit;
