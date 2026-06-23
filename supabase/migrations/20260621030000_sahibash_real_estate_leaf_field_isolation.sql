begin;

alter table public.category_fields
  add column if not exists sort_order int;

update public.category_fields
set sort_order = coalesce(sort_order, display_order)
where sort_order is null;

alter table public.category_fields
  alter column sort_order set default 0;

create index if not exists idx_category_fields_node_sort_order
  on public.category_fields(category_node_id, sort_order, display_order);

create temporary table tmp_leaf_profile_map (
  path text primary key,
  profile text not null
) on commit drop;

insert into tmp_leaf_profile_map (path, profile)
select mapped.path, mapped.profile
from (
  select n.path,
    case
      when n.path like 'real-estate/land/for-sale/%' then 'land_sale'
      when n.path like 'real-estate/land/for-lease/%' then 'land_lease'
      when n.path like 'real-estate/student-accommodation-dormitories/%' then 'dormitory'
      when n.path like 'real-estate/residential/for-sale/%' then 'res_sale'
      when n.path like 'real-estate/residential/for-rent/%' then 'res_rent'
      when n.path like 'real-estate/residential/gerawy-rahn/%' then 'res_gerawy'
      when n.path like 'real-estate/residential/gerawy-monthly-rent/%' then 'res_gerawy'
      when n.path like 'real-estate/commercial/for-sale/%' then 'com_sale'
      when n.path like 'real-estate/commercial/for-rent/%' then 'com_rent'
      when n.path like 'real-estate/commercial/gerawy-rahn/%' then 'com_rent'
      when n.path like 'real-estate/commercial/gerawy-monthly-rent/%' then 'com_rent'
      else null
    end as profile
  from public.category_nodes n
  where n.is_active = true
    and n.path like 'real-estate/%'
    and not exists (
      select 1
      from public.category_nodes c
      where c.parent_id = n.id
        and c.is_active = true
    )
) mapped
where mapped.profile is not null;

create temporary table tmp_leaf_field_defs (
  profile text not null,
  field_key text not null,
  field_label text not null,
  field_type text not null,
  is_required boolean not null,
  options_json jsonb,
  unit text,
  sort_order int not null,
  group_key text,
  primary key (profile, field_key)
) on commit drop;

insert into tmp_leaf_field_defs (profile, field_key, field_label, field_type, is_required, options_json, unit, sort_order, group_key)
values
  ('land_sale', 'land_size', 'Land Size', 'number', true, null, 'm2', 10, 'category_specific'),
  ('land_sale', 'land_type', 'Land Type', 'select', true, '["Residential Land","Commercial Land","Agricultural Land","Garden","Farm"]'::jsonb, null, 20, 'category_specific'),
  ('land_sale', 'document_type', 'Document Type', 'text', true, null, null, 30, 'category_specific'),
  ('land_sale', 'road_access', 'Road Access', 'boolean', false, null, null, 40, 'utilities'),
  ('land_sale', 'water_access', 'Water Access', 'boolean', false, null, null, 50, 'utilities'),
  ('land_sale', 'electricity_access', 'Electricity Access', 'boolean', false, null, null, 60, 'utilities'),
  ('land_sale', 'owner_type', 'Owner / Agent', 'select', true, '["owner","agent"]'::jsonb, null, 70, 'property_details'),

  ('land_lease', 'lease_price', 'Lease Price', 'number', true, null, null, 10, 'category_specific'),
  ('land_lease', 'lease_duration', 'Lease Duration', 'text', true, null, null, 20, 'category_specific'),
  ('land_lease', 'land_size', 'Land Size', 'number', true, null, 'm2', 30, 'category_specific'),
  ('land_lease', 'land_type', 'Land Type', 'select', true, '["Agricultural Land","Garden","Farm"]'::jsonb, null, 40, 'category_specific'),
  ('land_lease', 'document_type', 'Document Type', 'text', true, null, null, 50, 'category_specific'),
  ('land_lease', 'road_access', 'Road Access', 'boolean', false, null, null, 60, 'utilities'),
  ('land_lease', 'water_access', 'Water Access', 'boolean', false, null, null, 70, 'utilities'),
  ('land_lease', 'electricity_access', 'Electricity Access', 'boolean', false, null, null, 80, 'utilities'),
  ('land_lease', 'owner_type', 'Owner / Agent', 'select', true, '["owner","agent"]'::jsonb, null, 90, 'property_details'),

  ('dormitory', 'dormitory_type', 'Dormitory Type', 'select', true, '["Male Dormitory","Female Dormitory","Private Dormitory","University Dormitory","Shared Apartment","Shared Room","Family Room"]'::jsonb, null, 10, 'category_specific'),
  ('dormitory', 'gender', 'Gender', 'select', true, '["male","female","mixed"]'::jsonb, null, 20, 'category_specific'),
  ('dormitory', 'price_per_month', 'Price per Month', 'number', true, null, null, 30, 'property_details'),
  ('dormitory', 'deposit_amount', 'Deposit', 'number', false, null, null, 40, 'property_details'),
  ('dormitory', 'beds_available', 'Beds Available', 'number', false, null, null, 50, 'category_specific'),
  ('dormitory', 'room_capacity', 'Room Capacity', 'number', false, null, null, 60, 'category_specific'),
  ('dormitory', 'meals_included', 'Meals Included', 'boolean', false, null, null, 70, 'utilities'),
  ('dormitory', 'internet_included', 'Internet Included', 'boolean', false, null, null, 80, 'utilities'),
  ('dormitory', 'electricity_included', 'Electricity Included', 'boolean', false, null, null, 90, 'utilities'),
  ('dormitory', 'water_included', 'Water Included', 'boolean', false, null, null, 100, 'utilities'),
  ('dormitory', 'heating_cooling', 'Heating / Cooling', 'text', false, null, null, 110, 'utilities'),
  ('dormitory', 'bathroom_type', 'Bathroom Type', 'text', false, null, null, 120, 'category_specific'),
  ('dormitory', 'distance_from_university', 'Distance from University', 'number', false, null, 'km', 130, 'location_nearby'),
  ('dormitory', 'nearby_university', 'Nearby University or Area', 'text', false, null, null, 140, 'location_nearby'),
  ('dormitory', 'rules', 'Rules', 'text', false, null, null, 150, 'category_specific'),
  ('dormitory', 'owner_type', 'Owner / Manager', 'select', true, '["owner","manager"]'::jsonb, null, 160, 'property_details'),
  ('dormitory', 'available_from', 'Available From', 'date', false, null, null, 170, 'property_details'),

  ('res_sale', 'property_size', 'Property Size', 'number', true, null, 'm2', 10, 'category_specific'),
  ('res_sale', 'rooms', 'Rooms', 'number', true, null, null, 20, 'category_specific'),
  ('res_sale', 'bathrooms', 'Bathrooms', 'number', false, null, null, 30, 'category_specific'),
  ('res_sale', 'floor', 'Floor', 'number', false, null, null, 40, 'category_specific'),
  ('res_sale', 'total_floors', 'Total Floors', 'number', false, null, null, 50, 'category_specific'),
  ('res_sale', 'building_age', 'Building Age', 'text', false, null, null, 60, 'category_specific'),
  ('res_sale', 'furnished', 'Furnished', 'boolean', false, null, null, 70, 'interior_features'),
  ('res_sale', 'electricity', 'Electricity', 'boolean', false, null, null, 80, 'utilities'),
  ('res_sale', 'water', 'Water', 'boolean', false, null, null, 90, 'utilities'),
  ('res_sale', 'internet', 'Internet', 'boolean', false, null, null, 100, 'utilities'),
  ('res_sale', 'parking', 'Parking', 'boolean', false, null, null, 110, 'interior_features'),
  ('res_sale', 'owner_type', 'Owner / Agent', 'select', true, '["owner","agent"]'::jsonb, null, 120, 'property_details'),

  ('res_rent', 'monthly_rent_amount', 'Monthly Rent Amount', 'number', true, null, null, 10, 'property_details'),
  ('res_rent', 'deposit_amount', 'Deposit Amount', 'number', false, null, null, 20, 'property_details'),
  ('res_rent', 'contract_duration', 'Contract Duration', 'text', false, null, null, 30, 'property_details'),
  ('res_rent', 'property_size', 'Property Size', 'number', true, null, 'm2', 40, 'category_specific'),
  ('res_rent', 'rooms', 'Rooms', 'number', true, null, null, 50, 'category_specific'),
  ('res_rent', 'bathrooms', 'Bathrooms', 'number', false, null, null, 60, 'category_specific'),
  ('res_rent', 'floor', 'Floor', 'number', false, null, null, 70, 'category_specific'),
  ('res_rent', 'total_floors', 'Total Floors', 'number', false, null, null, 80, 'category_specific'),
  ('res_rent', 'furnished', 'Furnished', 'boolean', false, null, null, 90, 'interior_features'),
  ('res_rent', 'electricity', 'Electricity', 'boolean', false, null, null, 100, 'utilities'),
  ('res_rent', 'water', 'Water', 'boolean', false, null, null, 110, 'utilities'),
  ('res_rent', 'internet', 'Internet', 'boolean', false, null, null, 120, 'utilities'),
  ('res_rent', 'parking', 'Parking', 'boolean', false, null, null, 130, 'interior_features'),
  ('res_rent', 'owner_type', 'Owner / Agent', 'select', true, '["owner","agent"]'::jsonb, null, 140, 'property_details'),
  ('res_rent', 'available_from', 'Available From', 'date', false, null, null, 150, 'property_details'),

  ('res_gerawy', 'gerawy_rahn_amount', 'Gerawy / Rahn Amount', 'number', true, null, null, 10, 'property_details'),
  ('res_gerawy', 'monthly_rent_amount', 'Monthly Rent Amount', 'number', false, null, null, 20, 'property_details'),
  ('res_gerawy', 'contract_duration', 'Contract Duration', 'text', false, null, null, 30, 'property_details'),
  ('res_gerawy', 'refund_condition_note', 'Refund Condition Note', 'text', false, null, null, 40, 'property_details'),
  ('res_gerawy', 'property_size', 'Property Size', 'number', true, null, 'm2', 50, 'category_specific'),
  ('res_gerawy', 'rooms', 'Rooms', 'number', true, null, null, 60, 'category_specific'),
  ('res_gerawy', 'bathrooms', 'Bathrooms', 'number', false, null, null, 70, 'category_specific'),
  ('res_gerawy', 'floor', 'Floor', 'number', false, null, null, 80, 'category_specific'),
  ('res_gerawy', 'total_floors', 'Total Floors', 'number', false, null, null, 90, 'category_specific'),
  ('res_gerawy', 'furnished', 'Furnished', 'boolean', false, null, null, 100, 'interior_features'),
  ('res_gerawy', 'electricity', 'Electricity', 'boolean', false, null, null, 110, 'utilities'),
  ('res_gerawy', 'water', 'Water', 'boolean', false, null, null, 120, 'utilities'),
  ('res_gerawy', 'internet', 'Internet', 'boolean', false, null, null, 130, 'utilities'),
  ('res_gerawy', 'parking', 'Parking', 'boolean', false, null, null, 140, 'interior_features'),
  ('res_gerawy', 'owner_type', 'Owner / Agent', 'select', true, '["owner","agent"]'::jsonb, null, 150, 'property_details'),
  ('res_gerawy', 'available_from', 'Available From', 'date', false, null, null, 160, 'property_details'),

  ('com_sale', 'commercial_type', 'Commercial Type', 'text', true, null, null, 10, 'category_specific'),
  ('com_sale', 'property_size', 'Property Size', 'number', true, null, 'm2', 20, 'category_specific'),
  ('com_sale', 'floor', 'Floor', 'number', false, null, null, 30, 'category_specific'),
  ('com_sale', 'total_floors', 'Total Floors', 'number', false, null, null, 40, 'category_specific'),
  ('com_sale', 'electricity', 'Electricity', 'boolean', false, null, null, 50, 'utilities'),
  ('com_sale', 'water', 'Water', 'boolean', false, null, null, 60, 'utilities'),
  ('com_sale', 'internet', 'Internet', 'boolean', false, null, null, 70, 'utilities'),
  ('com_sale', 'parking', 'Parking', 'boolean', false, null, null, 80, 'interior_features'),
  ('com_sale', 'owner_type', 'Owner / Agent', 'select', true, '["owner","agent"]'::jsonb, null, 90, 'property_details'),

  ('com_rent', 'monthly_rent_amount', 'Monthly Rent Amount', 'number', true, null, null, 10, 'property_details'),
  ('com_rent', 'deposit_amount', 'Deposit', 'number', false, null, null, 20, 'property_details'),
  ('com_rent', 'contract_duration', 'Contract Duration', 'text', false, null, null, 30, 'property_details'),
  ('com_rent', 'commercial_type', 'Commercial Type', 'text', true, null, null, 40, 'category_specific'),
  ('com_rent', 'property_size', 'Property Size', 'number', true, null, 'm2', 50, 'category_specific'),
  ('com_rent', 'floor', 'Floor', 'number', false, null, null, 60, 'category_specific'),
  ('com_rent', 'total_floors', 'Total Floors', 'number', false, null, null, 70, 'category_specific'),
  ('com_rent', 'electricity', 'Electricity', 'boolean', false, null, null, 80, 'utilities'),
  ('com_rent', 'water', 'Water', 'boolean', false, null, null, 90, 'utilities'),
  ('com_rent', 'internet', 'Internet', 'boolean', false, null, null, 100, 'utilities'),
  ('com_rent', 'parking', 'Parking', 'boolean', false, null, null, 110, 'interior_features'),
  ('com_rent', 'owner_type', 'Owner / Agent', 'select', true, '["owner","agent"]'::jsonb, null, 120, 'property_details'),
  ('com_rent', 'available_from', 'Available From', 'date', false, null, null, 130, 'property_details');

update public.category_fields cf
set is_active = false,
    updated_at = now()
from public.category_nodes cn
join tmp_leaf_profile_map map on map.path = cn.path
where cf.category_node_id = cn.id;

insert into public.category_fields (
  category_node_id,
  field_key,
  field_label,
  field_type,
  is_required,
  options_json,
  unit,
  display_order,
  sort_order,
  group_key,
  visibility_rules,
  validation_rules,
  is_filterable,
  is_active
)
select
  cn.id,
  defs.field_key,
  defs.field_label,
  defs.field_type,
  defs.is_required,
  defs.options_json,
  defs.unit,
  defs.sort_order,
  defs.sort_order,
  defs.group_key,
  null,
  case when defs.field_type = 'number' then '{"min":0}'::jsonb else null end,
  true,
  true
from tmp_leaf_profile_map map
join public.category_nodes cn on cn.path = map.path
join tmp_leaf_field_defs defs on defs.profile = map.profile
on conflict (category_node_id, field_key) do update
set
  field_label = excluded.field_label,
  field_type = excluded.field_type,
  is_required = excluded.is_required,
  options_json = excluded.options_json,
  unit = excluded.unit,
  display_order = excluded.display_order,
  sort_order = excluded.sort_order,
  group_key = excluded.group_key,
  visibility_rules = excluded.visibility_rules,
  validation_rules = excluded.validation_rules,
  is_filterable = excluded.is_filterable,
  is_active = true,
  updated_at = now();

commit;
