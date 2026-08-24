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

-- 11) Category nodes and listings must belong to the same top-level category.
select
  l.id,
  l.title,
  l.category_id,
  l.category_node_id,
  cn.category_id as node_category_id,
  cn.path
from public.listings l
left join public.category_nodes cn on cn.id = l.category_node_id
where l.status = 'approved'
  and cn.id is not null
  and l.category_id is distinct from cn.category_id
order by l.created_at desc;

-- 12) Public phone/tablet listings must use the live mobile taxonomy.
select
  l.id,
  l.title,
  c.slug as category_slug,
  cn.path
from public.listings l
left join public.categories c on c.id = l.category_id
left join public.category_nodes cn on cn.id = l.category_node_id
where l.status = 'approved'
  and (
    cn.path = 'phones-electronics'
    or cn.path like 'phones-electronics/%'
    or (
      (l.title ~* '(iphone|samsung|galaxy|tablet|xiaomi|redmi|mobile|phone)')
      and c.slug <> 'mobile-phones-tablets'
    )
  )
order by l.created_at desc;

-- 13) Rent-purpose listings must not sit under sale-only house nodes.
select
  l.id,
  l.title,
  cn.path
from public.listings l
join public.category_nodes cn on cn.id = l.category_node_id
where l.status = 'approved'
  and cn.path in ('real-estate/house-for-sale', 'real-estate/residential/for-sale/house')
  and concat_ws(' ', l.title, l.description) ~* '(rent|کرایه|کرایي|اجاره)'
order by l.created_at desc;

-- 14) Pure land posting fields must not expose house/apartment fields.
select
  cn.path,
  cf.field_key,
  cf.is_required,
  cf.is_active
from public.category_nodes cn
join public.category_fields cf on cf.category_node_id = cn.id
where cn.path like 'real-estate/land%'
  and cf.is_active is true
  and cf.field_key in ('rooms','room','bedrooms','floor','total_floors','furnished','heating','bathroom_count','bathrooms','building_age','balcony','parking')
order by cn.path, cf.display_order;

-- 15) The four launch roots should be live; extra roots should be coming soon.
select
  slug,
  name,
  is_active,
  is_coming_soon
from public.categories
where is_active is true
  and (
    (slug in ('vehicles','real-estate','mobile-phones-tablets','second-hand-items') and is_coming_soon is true)
    or (slug not in ('vehicles','real-estate','mobile-phones-tablets','second-hand-items') and is_coming_soon is false)
    or (slug = 'vehicles' and name <> 'Vehicles')
  )
order by display_order;

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
