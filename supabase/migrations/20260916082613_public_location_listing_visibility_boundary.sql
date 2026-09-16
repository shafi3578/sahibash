-- Keep the legacy listing_status argument for caller compatibility, but these
-- public discovery RPCs must never return private, expired, or zero-price ads.
-- CREATE OR REPLACE preserves existing invoker security and execute grants.

CREATE OR REPLACE FUNCTION public.get_listings_by_location(province_filter_id bigint DEFAULT NULL::bigint, district_filter_id bigint DEFAULT NULL::bigint, area_filter_id bigint DEFAULT NULL::bigint, buyer_latitude numeric DEFAULT NULL::numeric, buyer_longitude numeric DEFAULT NULL::numeric, listing_status text DEFAULT 'approved'::text, category_filter_id bigint DEFAULT NULL::bigint, limit_count integer DEFAULT 50, offset_count integer DEFAULT 0)
 RETURNS TABLE(listing_id uuid, title text, price numeric, currency currency_code, province_id bigint, district_id bigint, area_id bigint, latitude numeric, longitude numeric, location_visibility location_visibility, distance_km numeric, created_at timestamp with time zone, user_id uuid)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
    where l.status = 'approved'::public.listing_status
      and c.is_active = true
      and c.is_coming_soon = false
      and (l.publication_status is null or l.publication_status = 'published')
      and l.removed_public_at is null
      and l.price > 0
      and (l.expires_at is null or l.expires_at > now())
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
    null::uuid as user_id
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
$function$;

CREATE OR REPLACE FUNCTION public.get_nearby_listings(buyer_latitude numeric, buyer_longitude numeric, radius_km numeric DEFAULT 10, listing_status text DEFAULT 'approved'::text, category_filter_id bigint DEFAULT NULL::bigint, limit_count integer DEFAULT 50)
 RETURNS TABLE(listing_id uuid, title text, price numeric, currency currency_code, province_id bigint, district_id bigint, area_id bigint, latitude numeric, longitude numeric, location_visibility location_visibility, distance_km numeric, created_at timestamp with time zone, user_id uuid)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
    where l.status = 'approved'::public.listing_status
      and c.is_active = true
      and c.is_coming_soon = false
      and (l.publication_status is null or l.publication_status = 'published')
      and l.removed_public_at is null
      and l.price > 0
      and (l.expires_at is null or l.expires_at > now())
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
    null::uuid as user_id
  from bounded b
  where b.dist <= greatest(radius_km, 0)
  order by b.dist asc
  limit greatest(least(limit_count, 100), 1);
end;
$function$;
