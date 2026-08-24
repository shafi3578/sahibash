begin;

-- STEP 1 foundation repair:
-- - profile phone/language source of truth
-- - deterministic taxonomy repairs for launch categories
-- - buyer-useful dorm/student filters
-- - public-safe category counts and nearby location RPC

alter table public.profiles
  add column if not exists phone_verified_at timestamptz,
  add column if not exists phone_verification_status text not null default 'unverified';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_phone_verification_status_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_phone_verification_status_check
      check (phone_verification_status in ('unverified', 'pending', 'verified'));
  end if;
end $$;

alter table public.profiles
  alter column preferred_language set default 'fa'::public.language_code;

create or replace function public.reset_profile_phone_verification_on_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.phone is distinct from old.phone then
    new.phone_verified_at := null;
    new.phone_verification_status := 'unverified';
  end if;

  return new;
end;
$$;

drop trigger if exists reset_profile_phone_verification_on_change on public.profiles;
create trigger reset_profile_phone_verification_on_change
before update of phone on public.profiles
for each row
execute function public.reset_profile_phone_verification_on_change();

revoke all on function public.reset_profile_phone_verification_on_change() from public, anon, authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  first_role public.profile_role;
  preferred public.language_code := 'fa'::public.language_code;
  raw_phone text;
  phone_digits text;
  normalized_phone text := null;
  clean_full_name text;
begin
  first_role := case
    when exists (select 1 from public.profiles where role = 'admin') then 'user'::public.profile_role
    else 'admin'::public.profile_role
  end;

  clean_full_name := nullif(
    btrim(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'fullName', '')),
    ''
  );

  preferred := case lower(coalesce(new.raw_user_meta_data ->> 'preferred_language', new.raw_user_meta_data ->> 'locale', 'fa'))
    when 'en' then 'en'::public.language_code
    when 'ps' then 'ps'::public.language_code
    when 'ps-af' then 'ps'::public.language_code
    else 'fa'::public.language_code
  end;

  raw_phone := coalesce(new.raw_user_meta_data ->> 'phone', new.raw_user_meta_data ->> 'mobile_phone', new.phone, '');
  phone_digits := regexp_replace(raw_phone, '\D', '', 'g');

  if phone_digits like '0093%' then
    phone_digits := substring(phone_digits from 3);
  end if;
  if phone_digits like '93%' then
    phone_digits := substring(phone_digits from 3);
  end if;
  if phone_digits like '0%' then
    phone_digits := substring(phone_digits from 2);
  end if;
  if phone_digits ~ '^7[0-9]{8}$' then
    normalized_phone := '+93' || phone_digits;
  end if;

  insert into public.profiles (
    id,
    full_name,
    phone,
    preferred_language,
    phone_verification_status,
    role
  )
  values (
    new.id,
    clean_full_name,
    normalized_phone,
    preferred,
    'unverified',
    first_role
  )
  on conflict (id) do update
    set full_name = coalesce(excluded.full_name, public.profiles.full_name),
        phone = coalesce(excluded.phone, public.profiles.phone),
        preferred_language = coalesce(public.profiles.preferred_language, excluded.preferred_language),
        updated_at = now();

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

grant update (
  full_name,
  phone,
  city,
  avatar_url,
  province,
  preferred_language,
  updated_at
) on public.profiles to authenticated;

comment on column public.profiles.phone_verification_status
  is 'Verification readiness for profile-owned seller phones. Users cannot mark this verified directly; phone changes reset it to unverified.';
comment on column public.profiles.phone_verified_at
  is 'Set only by a trusted future OTP/verification flow.';

with latest_native_contact as (
  select distinct on (l.user_id)
    l.user_id,
    nullif(btrim(l.contact_name), '') as contact_name,
    nullif(btrim(l.contact_phone), '') as raw_phone
  from public.listings l
  where l.user_id is not null
    and coalesce(l.source_type::text, 'native') = 'native'
    and nullif(btrim(l.contact_phone), '') is not null
  order by l.user_id, l.updated_at desc nulls last, l.created_at desc
), contact_digits as (
  select
    user_id,
    contact_name,
    regexp_replace(raw_phone, '\D', '', 'g') as digits
  from latest_native_contact
), without_international_prefix as (
  select
    user_id,
    contact_name,
    case when digits like '0093%' then substring(digits from 3) else digits end as digits
  from contact_digits
), without_country_prefix as (
  select
    user_id,
    contact_name,
    case when digits like '93%' then substring(digits from 3) else digits end as digits
  from without_international_prefix
), without_trunk_prefix as (
  select
    user_id,
    contact_name,
    case when digits like '0%' then substring(digits from 2) else digits end as digits
  from without_country_prefix
), normalized_contact as (
  select
    user_id,
    contact_name,
    case when digits ~ '^7[0-9]{8}$' then '+93' || digits else null end as normalized_phone
  from without_trunk_prefix
)
update public.profiles p
set phone = coalesce(nullif(btrim(p.phone), ''), n.normalized_phone),
    full_name = coalesce(nullif(btrim(p.full_name), ''), n.contact_name),
    updated_at = now()
from normalized_contact n
where p.id = n.user_id
  and (
    (nullif(btrim(p.phone), '') is null and n.normalized_phone is not null)
    or (nullif(btrim(p.full_name), '') is null and n.contact_name is not null)
  );

update public.categories
set name = 'Vehicles',
    updated_at = now()
where slug = 'vehicles'
  and name = 'Vehicles Updated';

with target_category as (
  select id
  from public.categories
  where slug = 'mobile-phones-tablets'
), desired_subcategories as (
  select *
  from (values
    (1, 'mobile-phones', 'Mobile Phones'),
    (2, 'tablets', 'Tablets'),
    (3, 'smart-watches', 'Smart Watches'),
    (4, 'phone-accessories', 'Phone Accessories')
  ) as desired(display_order, slug, name)
), missing_subcategories as (
  select
    (select coalesce(max(id), 0) from public.subcategories)
      + row_number() over (order by desired.display_order) as id,
    target_category.id as category_id,
    desired.name,
    desired.slug,
    desired.display_order
  from target_category
  cross join desired_subcategories desired
  where not exists (
    select 1
    from public.subcategories existing
    where existing.category_id = target_category.id
      and existing.slug = desired.slug
  )
)
insert into public.subcategories (
  id,
  category_id,
  name,
  slug,
  display_order,
  is_active,
  created_at,
  updated_at
)
select
  id,
  category_id,
  name,
  slug,
  display_order,
  true,
  now(),
  now()
from missing_subcategories
on conflict (category_id, slug) do update
set name = excluded.name,
    display_order = excluded.display_order,
    is_active = true,
    updated_at = now();

with legacy_phone_listings as (
  select
    l.id,
    lower(concat_ws(' ', l.title, l.description, cn.path)) as searchable_text,
    cn.path as old_path
  from public.listings l
  join public.category_nodes cn on cn.id = l.category_node_id
  where cn.path = 'phones-electronics'
     or cn.path like 'phones-electronics/%'
), mapped as (
  select
    id,
    case
      when searchable_text like '%tablet%' or searchable_text like '% tab %' then 'mobile-phones-tablets/tablets'
      when searchable_text like '%iphone%' or searchable_text like '%apple%' then 'mobile-phones-tablets/mobile-phones/apple-iphone'
      when searchable_text like '%samsung%' or searchable_text like '%galaxy%' then 'mobile-phones-tablets/mobile-phones/samsung'
      when searchable_text like '%xiaomi%' or searchable_text like '%redmi%' or searchable_text like '%poco%' then 'mobile-phones-tablets/mobile-phones/xiaomi'
      when searchable_text like '%huawei%' then 'mobile-phones-tablets/mobile-phones/huawei'
      when searchable_text like '%honor%' then 'mobile-phones-tablets/mobile-phones/honor'
      when searchable_text like '%oppo%' then 'mobile-phones-tablets/mobile-phones/oppo'
      when searchable_text like '%vivo%' then 'mobile-phones-tablets/mobile-phones/vivo'
      when searchable_text like '%nokia%' then 'mobile-phones-tablets/mobile-phones/nokia'
      when searchable_text like '%infinix%' then 'mobile-phones-tablets/mobile-phones/infinix'
      when searchable_text like '%tecno%' then 'mobile-phones-tablets/mobile-phones/tecno'
      when searchable_text like '%realme%' then 'mobile-phones-tablets/mobile-phones/realme'
      when searchable_text like '%oneplus%' then 'mobile-phones-tablets/mobile-phones/oneplus'
      when searchable_text like '%pixel%' or searchable_text like '%google%' then 'mobile-phones-tablets/mobile-phones/google-pixel'
      when searchable_text like '%watch%' then 'mobile-phones-tablets/smart-watches'
      when searchable_text like '%accessor%' or searchable_text like '%charger%' or searchable_text like '%case%' then 'mobile-phones-tablets/phone-accessories'
      else 'mobile-phones-tablets/mobile-phones/other-brand'
    end as target_path,
    case
      when searchable_text like '%tablet%' or searchable_text like '% tab %' then 'tablets'
      when searchable_text like '%watch%' then 'smart-watches'
      when searchable_text like '%accessor%' or searchable_text like '%charger%' or searchable_text like '%case%' then 'phone-accessories'
      else 'mobile-phones'
    end as target_subcategory_slug
  from legacy_phone_listings
)
update public.listings l
set category_id = target.category_id,
    subcategory_id = target_subcategory.id,
    category_node_id = target.id,
    updated_at = now()
from mapped m
join public.category_nodes target on target.path = m.target_path and target.is_active = true
join public.subcategories target_subcategory
  on target_subcategory.category_id = target.category_id
 and target_subcategory.slug = m.target_subcategory_slug
 and target_subcategory.is_active = true
where l.id = m.id
  and (
    l.category_id is distinct from target.category_id
    or l.subcategory_id is distinct from target_subcategory.id
    or l.category_node_id is distinct from target.id
  );

with rent_targets as (
  select
    sale_node.id as sale_node_id,
    rent_node.id as rent_node_id,
    rent_node.category_id as rent_category_id
  from public.category_nodes sale_node
  join public.category_nodes rent_node on rent_node.path = case sale_node.path
    when 'real-estate/residential/for-sale/house' then 'real-estate/residential/for-rent/house'
    else 'real-estate/house-for-rent'
  end
  where sale_node.path in ('real-estate/house-for-sale', 'real-estate/residential/for-sale/house')
)
update public.listings l
set category_id = rt.rent_category_id,
    category_node_id = rt.rent_node_id,
    updated_at = now()
from rent_targets rt
where l.category_node_id = rt.sale_node_id
  and concat_ws(' ', l.title, l.description) ~* '(rent|کرایه|کرایي|اجاره)'
  and concat_ws(' ', l.title, l.description) !~* '(for sale|sale only|فروش|پلور)';

update public.category_fields f
set is_active = false,
    is_required = false,
    updated_at = now()
from public.category_nodes n
where f.category_node_id = n.id
  and n.path like 'real-estate/land%'
  and f.field_key in (
    'rooms',
    'room',
    'bedrooms',
    'floor',
    'total_floors',
    'furnished',
    'heating',
    'bathroom_count',
    'bathrooms',
    'building_age',
    'balcony',
    'parking'
  );

insert into public.filter_definitions (
  category_node_id,
  filter_key,
  filter_label,
  filter_type,
  options,
  source_table,
  source_column,
  sort_order,
  is_active
)
select
  n.id,
  v.filter_key,
  v.filter_label,
  v.filter_type,
  v.options::jsonb,
  null,
  null,
  v.sort_order,
  true
from public.category_nodes n
join (
  values
    ('payment_period', 'Payment Period', 'select', '["monthly","semester","yearly","daily","other"]', 20),
    ('room_type', 'Room Type', 'select', '["private","shared","dormitory","family","other"]', 21),
    ('number_of_beds_min', 'Beds Min', 'range', null, 22),
    ('internet', 'Internet', 'boolean', null, 23),
    ('water', 'Hot Water / Water', 'boolean', null, 24),
    ('electricity', 'Electricity', 'boolean', null, 25),
    ('meals_included', 'Meals Included', 'boolean', null, 26),
    ('security', 'Security', 'boolean', null, 27),
    ('photos_only', 'Photos Only', 'boolean', null, 28)
) as v(filter_key, filter_label, filter_type, options, sort_order)
  on n.path in ('real-estate/dormitory', 'real-estate/room-house-for-students')
on conflict (category_node_id, filter_key) do update
set filter_label = excluded.filter_label,
    filter_type = excluded.filter_type,
    options = excluded.options,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

create or replace function public.get_category_listing_count(category_node_id bigint)
returns bigint
language sql
stable
set search_path = public, pg_temp
as $$
  with recursive tree as (
    select n.id
    from public.category_nodes n
    where n.id = category_node_id
      and n.is_active = true

    union all

    select c.id
    from public.category_nodes c
    join tree t on c.parent_id = t.id
    where c.is_active = true
  )
  select count(*)::bigint
  from public.listings l
  join public.categories c on c.id = l.category_id
  where l.status = 'approved'::public.listing_status
    and c.is_active = true
    and c.is_coming_soon = false
    and (l.publication_status is null or l.publication_status = 'published')
    and l.removed_public_at is null
    and coalesce(l.freshness_status::text, 'seller_confirmed') not in ('expired', 'source_missing', 'sold_confirmed')
    and l.category_node_id in (select id from tree);
$$;

create or replace function public.get_category_tree_counts(parent_node_id bigint default null)
returns table(node_id bigint, direct_count bigint, subtree_count bigint)
language sql
stable
set search_path = public, pg_temp
as $$
  with recursive roots as (
    select n.id
    from public.category_nodes n
    where (
      (parent_node_id is null and n.parent_id is null)
      or n.parent_id = parent_node_id
    )
      and n.is_active = true
  ), all_nodes as (
    with recursive tree as (
      select r.id from roots r

      union all

      select c.id
      from public.category_nodes c
      join tree t on c.parent_id = t.id
      where c.is_active = true
    )
    select distinct id from tree
  ), public_listings as (
    select l.category_node_id
    from public.listings l
    join public.categories c on c.id = l.category_id
    where l.status = 'approved'::public.listing_status
      and c.is_active = true
      and c.is_coming_soon = false
      and (l.publication_status is null or l.publication_status = 'published')
      and l.removed_public_at is null
      and coalesce(l.freshness_status::text, 'seller_confirmed') not in ('expired', 'source_missing', 'sold_confirmed')
      and l.category_node_id in (select id from all_nodes)
  ), direct as (
    select category_node_id as node_id, count(*)::bigint as cnt
    from public_listings
    group by category_node_id
  ), recursive_paths as (
    select n.id as ancestor_id, n.id as descendant_id
    from public.category_nodes n
    where n.id in (select id from all_nodes)

    union all

    select rp.ancestor_id, c.id
    from recursive_paths rp
    join public.category_nodes c on c.parent_id = rp.descendant_id
    where c.is_active = true
      and c.id in (select id from all_nodes)
  ), subtree as (
    select rp.ancestor_id as node_id, coalesce(sum(d.cnt), 0)::bigint as cnt
    from recursive_paths rp
    left join direct d on d.node_id = rp.descendant_id
    group by rp.ancestor_id
  )
  select
    n.id as node_id,
    coalesce(d.cnt, 0)::bigint as direct_count,
    coalesce(s.cnt, 0)::bigint as subtree_count
  from public.category_nodes n
  left join direct d on d.node_id = n.id
  left join subtree s on s.node_id = n.id
  where n.id in (select id from all_nodes);
$$;

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
  with public_points as (
    select
      l.id,
      l.title,
      l.price,
      l.currency,
      l.province_id,
      l.district_id,
      l.area_id,
      case
        when l.location_visibility = 'exact'::public.location_visibility then l.latitude::numeric
        when l.location_visibility = 'approximate'::public.location_visibility then round(l.latitude::numeric * 100) / 100
        else null::numeric
      end as public_latitude,
      case
        when l.location_visibility = 'exact'::public.location_visibility then l.longitude::numeric
        when l.location_visibility = 'approximate'::public.location_visibility then round(l.longitude::numeric * 100) / 100
        else null::numeric
      end as public_longitude,
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
      and (
        l.location_geog is null
        or extensions.ST_DWithin(
          l.location_geog,
          extensions.ST_SetSRID(
            extensions.ST_MakePoint(buyer_longitude::double precision, buyer_latitude::double precision),
            4326
          )::extensions.geography,
          greatest(radius_km, 0)::double precision * 1000
        )
      )
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

revoke all on function public.get_nearby_listings(numeric, numeric, numeric, text, bigint, integer) from public;
grant execute on function public.get_nearby_listings(numeric, numeric, numeric, text, bigint, integer) to anon, authenticated, service_role;

comment on function public.get_nearby_listings(numeric, numeric, numeric, text, bigint, integer)
  is 'Public-safe nearby listing RPC: exact coordinates only when seller selected exact; approximate listings return deterministic rounded coordinates; hidden/private points are not returned.';

commit;
