alter table public.listings
  add column if not exists approval_rejected_reason text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'listings_approval_rejected_reason_length'
      and conrelid = 'public.listings'::regclass
  ) then
    alter table public.listings
      add constraint listings_approval_rejected_reason_length
      check (char_length(coalesce(approval_rejected_reason, '')) <= 2000);
  end if;
end $$;

create or replace function public.get_nearby_listings(
  buyer_latitude numeric,
  buyer_longitude numeric,
  radius_km numeric default 10,
  listing_status text default 'approved',
  category_filter_id bigint default null,
  limit_count integer default 50
)
returns table(
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
  select
    l.id,
    l.title,
    l.price,
    l.currency,
    l.province_id,
    l.district_id,
    l.area_id,
    l.latitude::numeric,
    l.longitude::numeric,
    l.location_visibility,
    (
      earth_radius_km * 2 * asin(sqrt(
        power(sin((l.latitude - buyer_latitude) * deg_2_rad_factor / 2), 2) +
        cos(buyer_latitude * deg_2_rad_factor) * cos(l.latitude * deg_2_rad_factor) *
        power(sin((l.longitude - buyer_longitude) * deg_2_rad_factor / 2), 2)
      ))
    )::numeric as dist,
    l.created_at,
    l.user_id
  from public.listings l
  where
    l.status = listing_status::public.listing_status
    and l.latitude is not null
    and l.longitude is not null
    and (category_filter_id is null or l.category_id = category_filter_id)
    and (
      earth_radius_km * 2 * asin(sqrt(
        power(sin((l.latitude - buyer_latitude) * deg_2_rad_factor / 2), 2) +
        cos(buyer_latitude * deg_2_rad_factor) * cos(l.latitude * deg_2_rad_factor) *
        power(sin((l.longitude - buyer_longitude) * deg_2_rad_factor / 2), 2)
      ))
    )::numeric <= radius_km
  order by dist asc
  limit limit_count;
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
returns table(
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
volatile
set search_path = public, pg_temp
as $$
declare
  deg_2_rad_factor numeric := pi()::numeric / 180.0;
  earth_radius_km numeric := 6371;
begin
  return query
  select
    l.id,
    l.title,
    l.price,
    l.currency,
    l.province_id,
    l.district_id,
    l.area_id,
    (
      case
        when l.location_visibility = 'hidden'::public.location_visibility then null
        when l.location_visibility = 'approximate'::public.location_visibility and buyer_latitude is not null
          then l.latitude + ((random() - 0.5) * 0.02)::numeric
        else l.latitude
      end
    )::numeric as lat_display,
    (
      case
        when l.location_visibility = 'hidden'::public.location_visibility then null
        when l.location_visibility = 'approximate'::public.location_visibility and buyer_longitude is not null
          then l.longitude + ((random() - 0.5) * 0.02)::numeric
        else l.longitude
      end
    )::numeric as lon_display,
    l.location_visibility,
    (
      case
        when buyer_latitude is not null and buyer_longitude is not null and l.latitude is not null and l.longitude is not null
          then earth_radius_km * 2 * asin(sqrt(
            power(sin((l.latitude - buyer_latitude) * deg_2_rad_factor / 2), 2) +
            cos(buyer_latitude * deg_2_rad_factor) * cos(l.latitude * deg_2_rad_factor) *
            power(sin((l.longitude - buyer_longitude) * deg_2_rad_factor / 2), 2)
          ))
        else null
      end
    )::numeric as dist,
    l.created_at,
    l.user_id
  from public.listings l
  where
    l.status = listing_status::public.listing_status
    and (province_filter_id is null or l.province_id = province_filter_id)
    and (district_filter_id is null or l.district_id = district_filter_id)
    and (area_filter_id is null or l.area_id = area_filter_id)
    and (category_filter_id is null or l.category_id = category_filter_id)
  order by l.created_at desc
  limit limit_count
  offset offset_count;
end;
$$;
