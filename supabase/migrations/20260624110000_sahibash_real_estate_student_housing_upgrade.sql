-- Real Estate student housing upgrade:
-- 1) Simplify category structure with direct Dormitory node
-- 2) Add student housing columns on listings
-- 3) Add smart collection filters + search RPC

alter table public.listings
  add column if not exists suitable_for_students boolean not null default false,
  add column if not exists student_housing_type text,
  add column if not exists gender_allowed text,
  add column if not exists payment_period text,
  add column if not exists distance_to_university numeric(10,2);

alter table public.listings
  drop constraint if exists listings_student_housing_type_check;

alter table public.listings
  add constraint listings_student_housing_type_check
  check (
    student_housing_type is null
    or student_housing_type in ('house', 'apartment', 'room', 'dormitory')
  );

alter table public.listings
  drop constraint if exists listings_gender_allowed_check;

alter table public.listings
  add constraint listings_gender_allowed_check
  check (
    gender_allowed is null
    or lower(gender_allowed) in ('male', 'female', 'family', 'everyone')
  );

alter table public.listings
  drop constraint if exists listings_payment_period_check;

alter table public.listings
  add constraint listings_payment_period_check
  check (
    payment_period is null
    or lower(payment_period) in ('monthly', 'yearly', 'semester', 'daily', 'other')
  );

create index if not exists idx_listings_suitable_for_students on public.listings(suitable_for_students);
create index if not exists idx_listings_student_housing_type on public.listings(student_housing_type);
create index if not exists idx_listings_gender_allowed on public.listings(gender_allowed);
create index if not exists idx_listings_distance_to_university on public.listings(distance_to_university);

with real_estate_root as (
  select id, category_id, level
  from public.category_nodes
  where path = 'real-estate'
  limit 1
), desired_nodes as (
  select
    rr.category_id,
    rr.id as parent_id,
    rr.level + 1 as level,
    x.name,
    x.slug,
    x.path,
    x.display_order,
    x.description,
    x.icon
  from real_estate_root rr
  join (
    values
      ('Houses', 'houses', 'real-estate/houses', 1, 'Houses and villas.', 'home'),
      ('Apartments', 'apartments', 'real-estate/apartments', 2, 'Apartments and flats.', 'building'),
      ('Rooms', 'rooms', 'real-estate/rooms', 3, 'Rooms and shared rooms.', 'door-open'),
      ('Shops & Commercial', 'shops-commercial', 'real-estate/shops-commercial', 4, 'Shops and commercial spaces.', 'store'),
      ('Offices', 'offices', 'real-estate/offices', 5, 'Office spaces.', 'briefcase'),
      ('Land', 'land', 'real-estate/land', 6, 'Land and plots.', 'map'),
      ('Warehouses', 'warehouses', 'real-estate/warehouses', 7, 'Warehouses and storage spaces.', 'warehouse'),
      ('Gardens & Farms', 'gardens-farms', 'real-estate/gardens-farms', 8, 'Gardens and farms.', 'leaf'),
      ('Short-Term Rent', 'short-term-rent', 'real-estate/short-term-rent', 9, 'Daily and short-term rentals.', 'calendar-days'),
      ('Dormitory', 'dormitory', 'real-estate/dormitory', 10, 'Dormitory and hostel accommodation.', 'bed'),
      ('Room / House for Students', 'room-house-for-students', 'real-estate/room-house-for-students', 11, 'Student-friendly room and house listings.', 'graduation-cap'),
      ('Other Property', 'other-property', 'real-estate/other-property', 12, 'Other property listings.', 'building-2')
  ) as x(name, slug, path, display_order, description, icon) on true
)
insert into public.category_nodes (
  category_id,
  parent_id,
  name,
  slug,
  level,
  path,
  display_order,
  sort_order,
  is_active,
  description,
  icon
)
select
  category_id,
  parent_id,
  name,
  slug,
  level,
  path,
  display_order,
  display_order,
  true,
  description,
  icon
from desired_nodes
on conflict (path) do update
set
  parent_id = excluded.parent_id,
  name = excluded.name,
  slug = excluded.slug,
  level = excluded.level,
  display_order = excluded.display_order,
  sort_order = excluded.sort_order,
  is_active = true,
  description = excluded.description,
  icon = excluded.icon,
  updated_at = now();

-- Deactivate legacy student-accommodation root to prevent duplicate navigation roots.
update public.category_nodes
set
  is_active = false,
  updated_at = now()
where path = 'real-estate/student-accommodation-dormitories';

-- Move existing listings from legacy dormitory children to direct dormitory node.
with dormitory_direct as (
  select id
  from public.category_nodes
  where path = 'real-estate/dormitory'
  limit 1
), legacy_children as (
  select id
  from public.category_nodes
  where path like 'real-estate/dormitory/%'
     or path like 'real-estate/student-accommodation-dormitories/%'
)
update public.listings l
set
  category_node_id = dd.id,
  updated_at = now()
from dormitory_direct dd
where l.category_node_id in (select id from legacy_children)
  and l.category_node_id <> dd.id;

-- Dormitory must be a direct category only: remove nested dormitory children
delete from public.category_nodes
where path like 'real-estate/dormitory/%'
   or path like 'real-estate/student-accommodation-dormitories/%';

with node_map as (
  select id, path
  from public.category_nodes
  where path in (
    'real-estate/houses',
    'real-estate/apartments',
    'real-estate/rooms',
    'real-estate/dormitory',
    'real-estate/room-house-for-students'
  )
), source as (
  select
    nm.id as category_node_id,
    f.field_key,
    f.field_label,
    f.field_type,
    f.is_required,
    f.options_json,
    f.unit,
    f.display_order
  from node_map nm
  join (
    values
      ('real-estate/houses', 'suitable_for_students', 'Suitable for Students', 'boolean', false, null::jsonb, null::text, 510),
      ('real-estate/houses', 'gender_allowed', 'Gender Suitable', 'select', false, '["male","female","family","everyone"]'::jsonb, null::text, 511),
      ('real-estate/houses', 'distance_to_university', 'Distance to University', 'number', false, null::jsonb, 'km'::text, 512),
      ('real-estate/houses', 'furnished', 'Furnished', 'boolean', false, null::jsonb, null::text, 513),
      ('real-estate/houses', 'shared_allowed', 'Shared Allowed', 'boolean', false, null::jsonb, null::text, 514),
      ('real-estate/houses', 'students_allowed', 'Number of Students Allowed', 'number', false, null::jsonb, null::text, 515),

      ('real-estate/apartments', 'suitable_for_students', 'Suitable for Students', 'boolean', false, null::jsonb, null::text, 510),
      ('real-estate/apartments', 'gender_allowed', 'Gender Suitable', 'select', false, '["male","female","family","everyone"]'::jsonb, null::text, 511),
      ('real-estate/apartments', 'distance_to_university', 'Distance to University', 'number', false, null::jsonb, 'km'::text, 512),
      ('real-estate/apartments', 'furnished', 'Furnished', 'boolean', false, null::jsonb, null::text, 513),
      ('real-estate/apartments', 'shared_allowed', 'Shared Allowed', 'boolean', false, null::jsonb, null::text, 514),
      ('real-estate/apartments', 'students_allowed', 'Number of Students Allowed', 'number', false, null::jsonb, null::text, 515),

      ('real-estate/rooms', 'suitable_for_students', 'Suitable for Students', 'boolean', false, null::jsonb, null::text, 510),
      ('real-estate/rooms', 'gender_allowed', 'Gender Suitable', 'select', false, '["male","female","family","everyone"]'::jsonb, null::text, 511),
      ('real-estate/rooms', 'distance_to_university', 'Distance to University', 'number', false, null::jsonb, 'km'::text, 512),
      ('real-estate/rooms', 'furnished', 'Furnished', 'boolean', false, null::jsonb, null::text, 513),
      ('real-estate/rooms', 'shared_allowed', 'Shared Allowed', 'boolean', false, null::jsonb, null::text, 514),
      ('real-estate/rooms', 'students_allowed', 'Number of Students Allowed', 'number', false, null::jsonb, null::text, 515),

      ('real-estate/dormitory', 'payment_period', 'Payment Period', 'select', true, '["Monthly","Yearly","Semester","Daily","Other"]'::jsonb, null::text, 520),
      ('real-estate/dormitory', 'gender_allowed', 'Gender Allowed', 'select', true, '["Male","Female","Family","Everyone"]'::jsonb, null::text, 521),
      ('real-estate/dormitory', 'room_type', 'Room Type', 'select', true, '["Single Room","Shared Room","Private Room","Bed Space","Other"]'::jsonb, null::text, 522),
      ('real-estate/dormitory', 'number_of_beds', 'Number of Beds', 'number', false, null::jsonb, null::text, 523),
      ('real-estate/dormitory', 'meals_included', 'Meals Included', 'boolean', false, null::jsonb, null::text, 524),
      ('real-estate/dormitory', 'water', 'Water', 'boolean', false, null::jsonb, null::text, 525),
      ('real-estate/dormitory', 'electricity', 'Electricity', 'boolean', false, null::jsonb, null::text, 526),
      ('real-estate/dormitory', 'internet', 'Internet', 'boolean', false, null::jsonb, null::text, 527),
      ('real-estate/dormitory', 'heating', 'Heating', 'boolean', false, null::jsonb, null::text, 528),
      ('real-estate/dormitory', 'air_conditioning', 'Air Conditioning', 'boolean', false, null::jsonb, null::text, 529),
      ('real-estate/dormitory', 'security', 'Security', 'boolean', false, null::jsonb, null::text, 530),
      ('real-estate/dormitory', 'distance_to_university', 'Distance to University', 'number', false, null::jsonb, 'km'::text, 531),
      ('real-estate/dormitory', 'rules', 'Rules', 'text', false, null::jsonb, null::text, 532),
      ('real-estate/dormitory', 'contact_preferences', 'Contact Preferences', 'text', false, null::jsonb, null::text, 533),
      ('real-estate/dormitory', 'suitable_for_students', 'Suitable for Students', 'boolean', false, null::jsonb, null::text, 534),

      ('real-estate/room-house-for-students', 'student_housing_type', 'Property Type', 'select', true, '["house","apartment","room","dormitory"]'::jsonb, null::text, 540),
      ('real-estate/room-house-for-students', 'gender_allowed', 'Gender Suitable', 'select', false, '["male","female","family","everyone"]'::jsonb, null::text, 541),
      ('real-estate/room-house-for-students', 'distance_to_university', 'Distance to University', 'number', false, null::jsonb, 'km'::text, 542),
      ('real-estate/room-house-for-students', 'furnished', 'Furnished', 'boolean', false, null::jsonb, null::text, 543),
      ('real-estate/room-house-for-students', 'owner_type', 'Owner / Agent', 'select', false, '["owner","agent"]'::jsonb, null::text, 544),
      ('real-estate/room-house-for-students', 'rooms', 'Room Count', 'number', false, null::jsonb, null::text, 545)
  ) as f(path, field_key, field_label, field_type, is_required, options_json, unit, display_order)
    on f.path = nm.path
)
insert into public.category_fields (
  category_node_id,
  field_key,
  field_label,
  field_type,
  is_required,
  options_json,
  unit,
  display_order,
  is_active
)
select
  category_node_id,
  field_key,
  field_label,
  field_type,
  is_required,
  options_json,
  unit,
  display_order,
  true
from source
on conflict (category_node_id, field_key) do update
set
  field_label = excluded.field_label,
  field_type = excluded.field_type,
  is_required = excluded.is_required,
  options_json = excluded.options_json,
  unit = excluded.unit,
  display_order = excluded.display_order,
  is_active = true,
  updated_at = now();

with student_node as (
  select id
  from public.category_nodes
  where path = 'real-estate/room-house-for-students'
  limit 1
)
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
  sn.id,
  f.filter_key,
  f.filter_label,
  f.filter_type,
  f.options,
  f.source_table,
  f.source_column,
  f.sort_order,
  true
from student_node sn
join (
  values
    ('property_type', 'Property Type', 'select', '["house","apartment","room","dormitory"]'::jsonb, 'listings', 'student_housing_type', 1),
    ('rooms_min', 'Room Count Min', 'range', null::jsonb, 'listing_attributes', 'attribute_value_number', 2),
    ('gender_allowed', 'Gender Suitable', 'select', '["male","female","family","everyone"]'::jsonb, 'listings', 'gender_allowed', 3),
    ('furnished', 'Furnished', 'boolean', null::jsonb, 'listing_attributes', 'attribute_value_boolean', 4),
    ('owner_type', 'Owner / Agent', 'select', '["owner","agent"]'::jsonb, 'listing_attributes', 'attribute_value_text', 5),
    ('distance_to_university_max', 'Distance to University (Max KM)', 'range', null::jsonb, 'listings', 'distance_to_university', 6),
    ('photos_only', 'Photos Only', 'boolean', null::jsonb, 'listing_images', 'listing_id', 7)
) as f(filter_key, filter_label, filter_type, options, source_table, source_column, sort_order)
  on true
on conflict (category_node_id, filter_key) do update
set
  filter_label = excluded.filter_label,
  filter_type = excluded.filter_type,
  options = excluded.options,
  source_table = excluded.source_table,
  source_column = excluded.source_column,
  sort_order = excluded.sort_order,
  is_active = true;

create or replace function public.search_student_housing_listing_ids(
  collection_node_id bigint,
  category_scope text default 'subtree',
  province_filter text default null,
  district_filter text default null,
  price_min_filter numeric default null,
  price_max_filter numeric default null,
  property_type_filter text default null,
  rooms_min_filter numeric default null,
  furnished_filter boolean default null,
  owner_type_filter text default null,
  gender_allowed_filter text default null,
  distance_to_university_max_filter numeric default null,
  photos_only_filter boolean default null
)
returns table(listing_id uuid)
language sql
stable
security definer
set search_path = public
as $$
with collection as (
  select id, path
  from public.category_nodes
  where id = collection_node_id
),
scope_nodes as (
  select cn.id, cn.path
  from public.category_nodes cn
  join collection c on true
  where
    (
      lower(coalesce(category_scope, 'subtree')) = 'exact'
      and cn.id = c.id
    )
    or (
      lower(coalesce(category_scope, 'subtree')) <> 'exact'
      and (cn.id = c.id or cn.path like c.path || '/%')
    )
),
base as (
  select
    l.id as listing_id,
    l.province,
    l.district,
    l.price,
    lower(coalesce(l.student_housing_type, '')) as student_housing_type,
    lower(coalesce(l.gender_allowed, '')) as listing_gender_allowed,
    l.distance_to_university,
    coalesce(pn.path, cn.path) as effective_path
  from public.listings l
  join public.category_nodes cn on cn.id = l.category_node_id
  left join public.listing_category_path lcp on lcp.listing_id = l.id
  left join public.category_nodes pn on pn.id = lcp.child_category_id
  where l.status = 'approved'
    and (
      -- Listings posted directly in student collection
      l.category_node_id in (select id from scope_nodes)
      -- Dormitory listings always belong to student housing collection
      or coalesce(pn.path, cn.path) = 'real-estate/dormitory'
      -- Houses / Apartments / Rooms rental listings marked suitable for students
      or (
        (
          coalesce(pn.path, cn.path) like 'real-estate/houses%'
          or coalesce(pn.path, cn.path) like 'real-estate/apartments%'
          or coalesce(pn.path, cn.path) like 'real-estate/rooms%'
        )
        and coalesce(l.suitable_for_students, false) = true
        and exists (
          select 1
          from public.listing_attributes a
          where a.listing_id = l.id
            and a.attribute_key in ('listing_purpose', 'rental_type')
            and lower(coalesce(a.attribute_value_text, '')) = 'for rent'
        )
      )
    )
),
derived as (
  select
    b.listing_id,
    b.province,
    b.district,
    b.price,
    b.listing_gender_allowed,
    b.distance_to_university,
    case
      when b.student_housing_type <> '' then b.student_housing_type
      when b.effective_path = 'real-estate/dormitory' then 'dormitory'
      when b.effective_path like 'real-estate/houses%' then 'house'
      when b.effective_path like 'real-estate/apartments%' then 'apartment'
      when b.effective_path like 'real-estate/rooms%' then 'room'
      else null
    end as property_type
  from base b
),
filtered as (
  select d.listing_id
  from derived d
  where
    (province_filter is null or province_filter = '' or lower(coalesce(d.province, '')) = lower(province_filter))
    and (district_filter is null or district_filter = '' or lower(coalesce(d.district, '')) like '%' || lower(district_filter) || '%')
    and (price_min_filter is null or d.price >= price_min_filter)
    and (price_max_filter is null or d.price <= price_max_filter)
    and (
      property_type_filter is null
      or property_type_filter = ''
      or lower(coalesce(d.property_type, '')) = lower(property_type_filter)
    )
    and (
      rooms_min_filter is null
      or exists (
        select 1
        from public.listing_attributes a
        where a.listing_id = d.listing_id
          and a.attribute_key = 'rooms'
          and coalesce(a.attribute_value_number, 0) >= rooms_min_filter
      )
    )
    and (
      furnished_filter is null
      or exists (
        select 1
        from public.listing_attributes a
        where a.listing_id = d.listing_id
          and a.attribute_key = 'furnished'
          and a.attribute_value_boolean = furnished_filter
      )
    )
    and (
      owner_type_filter is null
      or owner_type_filter = ''
      or exists (
        select 1
        from public.listing_attributes a
        where a.listing_id = d.listing_id
          and a.attribute_key = 'owner_type'
          and lower(coalesce(a.attribute_value_text, '')) = lower(owner_type_filter)
      )
    )
    and (
      gender_allowed_filter is null
      or gender_allowed_filter = ''
      or lower(coalesce(d.listing_gender_allowed, '')) = lower(gender_allowed_filter)
      or exists (
        select 1
        from public.listing_attributes a
        where a.listing_id = d.listing_id
          and a.attribute_key = 'gender_allowed'
          and lower(coalesce(a.attribute_value_text, '')) = lower(gender_allowed_filter)
      )
    )
    and (
      distance_to_university_max_filter is null
      or coalesce(d.distance_to_university, 999999) <= distance_to_university_max_filter
      or exists (
        select 1
        from public.listing_attributes a
        where a.listing_id = d.listing_id
          and a.attribute_key = 'distance_to_university'
          and coalesce(a.attribute_value_number, 999999) <= distance_to_university_max_filter
      )
    )
    and (
      photos_only_filter is null
      or photos_only_filter = false
      or exists (
        select 1
        from public.listing_images li
        where li.listing_id = d.listing_id
      )
    )
)
select distinct f.listing_id
from filtered f;
$$;

grant execute on function public.search_student_housing_listing_ids(
  bigint,
  text,
  text,
  text,
  numeric,
  numeric,
  text,
  numeric,
  boolean,
  text,
  text,
  numeric,
  boolean
) to anon, authenticated;
