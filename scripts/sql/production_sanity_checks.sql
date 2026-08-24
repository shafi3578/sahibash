-- Sahibash production sanity checks.
-- Run read-only before launch/deploy reviews. Every query returns rows that
-- require review; an empty result is the desired state for most checks.

-- 1) Public fixture/smoke listings must never be approved.
select
  id,
  title,
  status,
  featured,
  created_at
from public.listings
where status = 'approved'
  and (
    title ~* '(e2e|fixpass|fixture|smoke[[:space:]_-]*test|admin[[:space:]_-]*test|test[[:space:]_-]*house|test[[:space:]_-]*vehicle)'
    or coalesce(description, '') ~* '(e2e|fixpass|fixture|smoke[[:space:]_-]*test|admin[[:space:]_-]*test|test[[:space:]_-]*house|test[[:space:]_-]*vehicle)'
  )
order by created_at desc;

-- 2) Featured listings must also be public/approved.
select
  id,
  title,
  status,
  featured,
  created_at
from public.listings
where featured is true
  and status <> 'approved'
order by created_at desc;

-- 3) Approved listings need usable price and currency.
select
  id,
  title,
  price,
  currency
from public.listings
where status = 'approved'
  and (
    price is null
    or price <= 0
    or currency not in ('AFN', 'USD')
  )
order by created_at desc;

-- 4) Public listings should point to active category records.
select
  l.id,
  l.title,
  l.category_id,
  l.category_node_id
from public.listings l
left join public.categories c on c.id = l.category_id
left join public.category_nodes cn on cn.id = l.category_node_id
where l.status = 'approved'
  and (c.id is null or cn.id is null or c.is_active is not true or c.is_coming_soon is true)
order by l.created_at desc;

-- 5) Public listing coordinates must be plausible when present.
select
  id,
  title,
  latitude,
  longitude,
  location_visibility
from public.listings
where status = 'approved'
  and (
    latitude is not null
    or longitude is not null
  )
  and (
    latitude is null
    or longitude is null
    or latitude < -90
    or latitude > 90
    or longitude < -180
    or longitude > 180
  )
order by created_at desc;

-- 6) Exact public location requires both coordinates.
select
  id,
  title,
  latitude,
  longitude,
  location_visibility
from public.listings
where status = 'approved'
  and location_visibility = 'exact'
  and (latitude is null or longitude is null)
order by created_at desc;

-- 7) Orphan listing images.
select
  li.id,
  li.listing_id,
  li.created_at
from public.listing_images li
left join public.listings l on l.id = li.listing_id
where l.id is null
order by li.created_at desc;

-- 8) Orphan listing attributes.
select
  la.id,
  la.listing_id,
  la.attribute_key
from public.listing_attributes la
left join public.listings l on l.id = la.listing_id
where l.id is null
order by la.id desc;

-- 9) Orphan promotions.
select
  lp.id,
  lp.listing_id,
  lp.status,
  lp.created_at
from public.listing_promotions lp
left join public.listings l on l.id = lp.listing_id
where l.id is null
order by lp.created_at desc;

-- 10) External listings require provenance and cautious indexing/contact state.
select
  id,
  title,
  source_type,
  source_url,
  source_platform,
  permission_basis,
  allow_contact_display,
  noindex_external
from public.listings
where source_type in ('external_indexed', 'partner_feed', 'scout')
  and (
    source_url is null
    or source_platform is null
    or permission_basis is null
    or (allow_contact_display is true and ownership_status <> 'claimed')
    or noindex_external is distinct from true
  )
order by created_at desc;
