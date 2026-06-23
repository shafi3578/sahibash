begin;

-- Soft-hide duplicate clothing branches that were too broad for the final browse tree.
update public.category_nodes
set is_active = false,
    updated_at = now()
where path in (
  'clothing-personal-items/bags-accessories',
  'clothing-personal-items/jewelry-watches',
  'clothing-personal-items/other-clothing-personal-items'
);

-- Tighten display ordering for corrected branches.
update public.category_nodes
set sort_order = case path
      when 'vehicles/cars' then 1
      when 'vehicles/motorcycles' then 2
      when 'vehicles/rickshaws-three-wheelers' then 3
      when 'vehicles/bicycles' then 4
      when 'vehicles/pickup-trucks' then 5
      when 'vehicles/vans-minibuses' then 6
      when 'vehicles/trucks-heavy-vehicles' then 7
      when 'vehicles/agricultural-vehicles' then 8
      when 'vehicles/vehicle-parts-accessories' then 9
      when 'vehicles/damaged-vehicles-for-parts' then 10
      when 'vehicles/other-vehicles' then 11
      when 'real-estate/short-term-rent' then 9
      when 'real-estate/student-accommodation-dormitories' then 10
      when 'real-estate/other-property' then 11
      when 'business-industry/medical-equipment' then 9
      when 'business-industry/other-business' then 10
      when 'farm-animals/agricultural-equipment' then 11
      when 'farm-animals/other-animals' then 12
      when 'clothing-personal-items/watches' then 5
      when 'clothing-personal-items/bags' then 6
      when 'clothing-personal-items/jewelry-accessories' then 7
      when 'clothing-personal-items/beauty-personal-care' then 8
      when 'clothing-personal-items/traditional-clothing' then 9
      when 'clothing-personal-items/other-clothing' then 10
      else sort_order
    end,
    display_order = case path
      when 'vehicles/cars' then 1
      when 'vehicles/motorcycles' then 2
      when 'vehicles/rickshaws-three-wheelers' then 3
      when 'vehicles/bicycles' then 4
      when 'vehicles/pickup-trucks' then 5
      when 'vehicles/vans-minibuses' then 6
      when 'vehicles/trucks-heavy-vehicles' then 7
      when 'vehicles/agricultural-vehicles' then 8
      when 'vehicles/vehicle-parts-accessories' then 9
      when 'vehicles/damaged-vehicles-for-parts' then 10
      when 'vehicles/other-vehicles' then 11
      when 'real-estate/short-term-rent' then 9
      when 'real-estate/student-accommodation-dormitories' then 10
      when 'real-estate/other-property' then 11
      when 'business-industry/medical-equipment' then 9
      when 'business-industry/other-business' then 10
      when 'farm-animals/agricultural-equipment' then 11
      when 'farm-animals/other-animals' then 12
      when 'clothing-personal-items/watches' then 5
      when 'clothing-personal-items/bags' then 6
      when 'clothing-personal-items/jewelry-accessories' then 7
      when 'clothing-personal-items/beauty-personal-care' then 8
      when 'clothing-personal-items/traditional-clothing' then 9
      when 'clothing-personal-items/other-clothing' then 10
      else display_order
    end,
    updated_at = now()
where path in (
  'vehicles/cars',
  'vehicles/motorcycles',
  'vehicles/rickshaws-three-wheelers',
  'vehicles/bicycles',
  'vehicles/pickup-trucks',
  'vehicles/vans-minibuses',
  'vehicles/trucks-heavy-vehicles',
  'vehicles/agricultural-vehicles',
  'vehicles/vehicle-parts-accessories',
  'vehicles/damaged-vehicles-for-parts',
  'vehicles/other-vehicles',
  'real-estate/short-term-rent',
  'real-estate/student-accommodation-dormitories',
  'real-estate/other-property',
  'business-industry/medical-equipment',
  'business-industry/other-business',
  'farm-animals/agricultural-equipment',
  'farm-animals/other-animals',
  'clothing-personal-items/watches',
  'clothing-personal-items/bags',
  'clothing-personal-items/jewelry-accessories',
  'clothing-personal-items/beauty-personal-care',
  'clothing-personal-items/traditional-clothing',
  'clothing-personal-items/other-clothing'
);

create temporary table desired_category_nodes_fix (
  parent_path text not null,
  path text primary key,
  name text not null,
  slug text not null,
  level int not null,
  sort_order int not null,
  is_leaf boolean not null,
  description text,
  icon text
) on commit drop;

insert into desired_category_nodes_fix (parent_path, path, name, slug, level, sort_order, is_leaf, description, icon)
values
  ('vehicles', 'vehicles/pickup-trucks', 'Pickup Trucks', 'pickup-trucks', 2, 5, true, 'Standalone pickup trucks and light cargo pickups.', 'pickup-truck'),
  ('vehicles/motorcycles', 'vehicles/motorcycles/pamir-motorcycle', 'Pamir Motorcycle', 'pamir-motorcycle', 3, 3, true, 'Pamir-branded motorcycles common in Afghanistan.', 'bike'),
  ('vehicles/motorcycles', 'vehicles/motorcycles/zaranj-motorcycle', 'Zaranj Motorcycle', 'zaranj-motorcycle', 3, 4, true, 'Zaranj motorcycles and locally marketed variants.', 'bike'),

  ('real-estate', 'real-estate/student-accommodation-dormitories', 'Student Accommodation / Dormitories', 'student-accommodation-dormitories', 2, 10, true, 'Dormitories, hostel beds, and student shared housing.', 'school'),

  ('mobile-phones-tablets/mobile-phones', 'mobile-phones-tablets/mobile-phones/google-pixel', 'Google Pixel', 'google-pixel', 3, 13, true, 'Google Pixel phones.', 'smartphone'),

  ('electronics-computers', 'electronics-computers/solar-power-equipment', 'Solar & Power Equipment', 'solar-power-equipment', 2, 12, false, 'Solar panels, inverters, batteries, generators, and UPS systems.', 'battery-charging'),
  ('electronics-computers/solar-power-equipment', 'electronics-computers/solar-power-equipment/solar-panels', 'Solar Panels', 'solar-panels', 3, 1, true, null, 'sun'),
  ('electronics-computers/solar-power-equipment', 'electronics-computers/solar-power-equipment/solar-inverters', 'Solar Inverters', 'solar-inverters', 3, 2, true, null, 'battery-charging'),
  ('electronics-computers/solar-power-equipment', 'electronics-computers/solar-power-equipment/batteries', 'Batteries', 'batteries', 3, 3, true, null, 'battery'),
  ('electronics-computers/solar-power-equipment', 'electronics-computers/solar-power-equipment/generators', 'Generators', 'generators', 3, 4, true, null, 'zap'),
  ('electronics-computers/solar-power-equipment', 'electronics-computers/solar-power-equipment/ups', 'UPS', 'ups', 3, 5, true, null, 'battery-charging'),
  ('electronics-computers/solar-power-equipment', 'electronics-computers/solar-power-equipment/other-power-equipment', 'Other Power Equipment', 'other-power-equipment', 3, 6, true, 'Manual entry for power equipment not covered above.', 'dots-horizontal'),

  ('clothing-personal-items', 'clothing-personal-items/watches', 'Watches', 'watches', 2, 5, true, null, 'watch'),
  ('clothing-personal-items', 'clothing-personal-items/bags', 'Bags', 'bags', 2, 6, true, null, 'briefcase'),
  ('clothing-personal-items', 'clothing-personal-items/jewelry-accessories', 'Jewelry & Accessories', 'jewelry-accessories', 2, 7, true, null, 'gem'),
  ('clothing-personal-items', 'clothing-personal-items/traditional-clothing', 'Traditional Clothing', 'traditional-clothing', 2, 9, true, 'Afghan traditional dress and cultural wear.', 'shirt'),
  ('clothing-personal-items', 'clothing-personal-items/other-clothing', 'Other Clothing', 'other-clothing', 2, 10, true, 'Manual entry for clothing that does not fit another branch.', 'dots-horizontal'),

  ('business-industry', 'business-industry/medical-equipment', 'Medical Equipment', 'medical-equipment', 2, 9, true, null, 'stethoscope'),
  ('farm-animals', 'farm-animals/agricultural-equipment', 'Agricultural Equipment', 'agricultural-equipment', 2, 11, true, null, 'tractor');

insert into public.category_nodes (category_id, parent_id, name, slug, level, path, display_order, sort_order, is_active, is_leaf, description, icon)
select parent.category_id, parent.id, node.name, node.slug, node.level, node.path, node.sort_order, node.sort_order, true, node.is_leaf, node.description, node.icon
from desired_category_nodes_fix node
join public.category_nodes parent on parent.path = node.parent_path
where node.level = 2
on conflict (path) do update
set name = excluded.name,
    slug = excluded.slug,
    display_order = excluded.display_order,
    sort_order = excluded.sort_order,
    is_active = true,
    is_leaf = excluded.is_leaf,
    description = excluded.description,
    icon = excluded.icon,
    updated_at = now();

insert into public.category_nodes (category_id, parent_id, name, slug, level, path, display_order, sort_order, is_active, is_leaf, description, icon)
select parent.category_id, parent.id, node.name, node.slug, node.level, node.path, node.sort_order, node.sort_order, true, node.is_leaf, node.description, node.icon
from desired_category_nodes_fix node
join public.category_nodes parent on parent.path = node.parent_path
where node.level = 3
on conflict (path) do update
set name = excluded.name,
    slug = excluded.slug,
    display_order = excluded.display_order,
    sort_order = excluded.sort_order,
    is_active = true,
    is_leaf = excluded.is_leaf,
    description = excluded.description,
    icon = excluded.icon,
    updated_at = now();

update public.category_nodes
set name = 'Xiaomi / Redmi',
    description = 'Xiaomi and Redmi phones.',
    updated_at = now()
where path = 'mobile-phones-tablets/mobile-phones/xiaomi';

delete from public.category_aliases
where lower(alias) in (
  'garawi', 'haveli', 'pamir', 'zaranj', 'redmi', 'google pixel',
  'solar panel', 'solar panels', 'solar inverter', 'generator', 'bukhari',
  'water pump', 'driver job', 'phone repair', 'villa', 'duplex', 'cow', 'chicken'
);

insert into public.category_aliases (category_id, alias, language)
select node.id, alias_map.alias, alias_map.language
from public.category_nodes node
join (
  values
    ('real-estate', 'Garawi', 'en'),
    ('real-estate/houses', 'Haveli', 'en'),
    ('vehicles/motorcycles/pamir-motorcycle', 'Pamir', 'en'),
    ('vehicles/motorcycles/zaranj-motorcycle', 'Zaranj', 'en'),
    ('mobile-phones-tablets/mobile-phones/xiaomi', 'Redmi', 'en'),
    ('mobile-phones-tablets/mobile-phones/google-pixel', 'Google Pixel', 'en'),
    ('electronics-computers/solar-power-equipment/solar-panels', 'Solar Panel', 'en'),
    ('electronics-computers/solar-power-equipment/solar-panels', 'Solar Panels', 'en'),
    ('electronics-computers/solar-power-equipment/solar-inverters', 'Solar Inverter', 'en'),
    ('electronics-computers/solar-power-equipment/generators', 'Generator', 'en'),
    ('home-furniture-appliances/heating-cooling', 'Bukhari', 'en'),
    ('home-furniture-appliances/home-appliances', 'Water Pump', 'en'),
    ('services/phone-repair', 'Phone Repair', 'en'),
    ('jobs/driver-jobs', 'Driver Job', 'en'),
    ('real-estate/houses/villa', 'Villa', 'en'),
    ('real-estate/houses/duplex', 'Duplex', 'en'),
    ('farm-animals/cows', 'Cow', 'en'),
    ('farm-animals/chickens', 'Chicken', 'en')
) as alias_map(path, alias, language) on alias_map.path = node.path
on conflict do nothing;

-- Replace overly broad property filters with narrower node-specific filters.
update public.filter_definitions fd
set is_active = false,
    updated_at = now()
from public.category_nodes node
where fd.category_node_id = node.id
  and node.path = 'real-estate'
  and fd.filter_key in (
    'rooms_min',
    'bathrooms_min',
    'property_size_min',
    'land_size_min',
    'furnished',
    'parking'
  );

insert into public.filter_definitions (
  category_node_id, filter_key, filter_label, filter_type, options, source_table, source_column, sort_order, is_active
)
select node.id, def.filter_key, def.filter_label, def.filter_type, def.options::jsonb, def.source_table, def.source_column, def.sort_order, true
from public.category_nodes node
join (
  values
    ('vehicles/cars', 'min_price', 'Price Min', 'range', null, 'listings', 'price', 18),
    ('vehicles/cars', 'max_price', 'Price Max', 'range', null, 'listings', 'price', 19),
    ('vehicles/cars', 'old_vehicle', 'Classic / Old Vehicle', 'boolean', null, 'listings', 'vehicle_is_classic', 37),
    ('vehicles/cars', 'older_than_1980', 'Older Than 1980', 'boolean', null, 'listings', 'vehicle_year', 38),
    ('vehicles/cars', 'imported_vehicle', 'Imported Vehicle', 'boolean', null, 'listings', 'vehicle_manual_specs.imported', 39),
    ('vehicles/cars', 'rebuilt_vehicle', 'Rebuilt Vehicle', 'boolean', null, 'listing_attributes', 'rebuilt_vehicle', 40),
    ('vehicles/cars', 'custom_vehicle', 'Custom / Modified Vehicle', 'boolean', null, 'listings', 'vehicle_is_custom', 41),
    ('vehicles/cars', 'documents_available', 'Documents Available', 'boolean', null, 'listing_attributes', 'documents_available', 42),
    ('vehicles/cars', 'engine_swapped', 'Engine Swapped', 'boolean', null, 'listing_attributes', 'engine_swapped', 43),

    ('vehicles/motorcycles', 'min_price', 'Price Min', 'range', null, 'listings', 'price', 39),
    ('vehicles/motorcycles', 'max_price', 'Price Max', 'range', null, 'listings', 'price', 40),

    ('vehicles/rickshaws-three-wheelers', 'min_price', 'Price Min', 'range', null, 'listings', 'price', 48),
    ('vehicles/rickshaws-three-wheelers', 'max_price', 'Price Max', 'range', null, 'listings', 'price', 49),

    ('real-estate', 'min_price', 'Price Min', 'range', null, 'listings', 'price', 68),
    ('real-estate', 'max_price', 'Price Max', 'range', null, 'listings', 'price', 69),
    ('real-estate', 'property_type', 'Property Type', 'text', null, 'listing_attributes', 'property_type', 70),
    ('real-estate', 'rental_type', 'Purpose', 'select', '["For Sale","For Rent","Gerawy / Rahn","Exchange","Wanted"]', 'listing_attributes', 'rental_type', 71),
    ('real-estate', 'owner_agent', 'Owner / Agent', 'select', '["owner","agent"]', 'listing_attributes', 'owner_type', 79),

    ('real-estate/houses', 'rooms_min', 'Rooms Min', 'range', null, 'listing_attributes', 'rooms', 80),
    ('real-estate/houses', 'bathrooms_min', 'Bathrooms Min', 'range', null, 'listing_attributes', 'bathrooms', 81),
    ('real-estate/houses', 'property_size_min', 'Property Size Min', 'range', null, 'listing_attributes', 'property_size', 82),
    ('real-estate/houses', 'land_size_min', 'Land Size Min', 'range', null, 'listing_attributes', 'land_size', 83),
    ('real-estate/houses', 'furnished', 'Furnished', 'boolean', null, 'listing_attributes', 'furnished', 84),
    ('real-estate/houses', 'parking', 'Parking', 'boolean', null, 'listing_attributes', 'parking', 85),

    ('real-estate/apartments', 'rooms_min', 'Rooms Min', 'range', null, 'listing_attributes', 'rooms', 80),
    ('real-estate/apartments', 'bathrooms_min', 'Bathrooms Min', 'range', null, 'listing_attributes', 'bathrooms', 81),
    ('real-estate/apartments', 'property_size_min', 'Property Size Min', 'range', null, 'listing_attributes', 'property_size', 82),
    ('real-estate/apartments', 'furnished', 'Furnished', 'boolean', null, 'listing_attributes', 'furnished', 83),
    ('real-estate/apartments', 'parking', 'Parking', 'boolean', null, 'listing_attributes', 'parking', 84),

    ('real-estate/rooms', 'rooms_min', 'Rooms Min', 'range', null, 'listing_attributes', 'rooms', 80),
    ('real-estate/rooms', 'furnished', 'Furnished', 'boolean', null, 'listing_attributes', 'furnished', 81),

    ('real-estate/shops-commercial', 'property_size_min', 'Property Size Min', 'range', null, 'listing_attributes', 'property_size', 80),
    ('real-estate/shops-commercial', 'parking', 'Parking', 'boolean', null, 'listing_attributes', 'parking', 81),

    ('real-estate/offices', 'property_size_min', 'Property Size Min', 'range', null, 'listing_attributes', 'property_size', 80),
    ('real-estate/offices', 'parking', 'Parking', 'boolean', null, 'listing_attributes', 'parking', 81),

    ('real-estate/land', 'land_size_min', 'Land Size Min', 'range', null, 'listing_attributes', 'land_size', 80),

    ('real-estate/warehouses', 'property_size_min', 'Property Size Min', 'range', null, 'listing_attributes', 'property_size', 80),
    ('real-estate/warehouses', 'parking', 'Parking', 'boolean', null, 'listing_attributes', 'parking', 81),

    ('real-estate/gardens-farms', 'land_size_min', 'Land Size Min', 'range', null, 'listing_attributes', 'land_size', 80),

    ('real-estate/short-term-rent', 'rooms_min', 'Rooms Min', 'range', null, 'listing_attributes', 'rooms', 80),
    ('real-estate/short-term-rent', 'bathrooms_min', 'Bathrooms Min', 'range', null, 'listing_attributes', 'bathrooms', 81),
    ('real-estate/short-term-rent', 'furnished', 'Furnished', 'boolean', null, 'listing_attributes', 'furnished', 82),
    ('real-estate/short-term-rent', 'parking', 'Parking', 'boolean', null, 'listing_attributes', 'parking', 83),

    ('real-estate/student-accommodation-dormitories', 'rooms_min', 'Rooms Min', 'range', null, 'listing_attributes', 'rooms', 80),
    ('real-estate/student-accommodation-dormitories', 'furnished', 'Furnished', 'boolean', null, 'listing_attributes', 'furnished', 81),

    ('mobile-phones-tablets/mobile-phones', 'min_price', 'Price Min', 'range', null, 'listings', 'price', 79),
    ('mobile-phones-tablets/mobile-phones', 'max_price', 'Price Max', 'range', null, 'listings', 'price', 80)
) as def(path, filter_key, filter_label, filter_type, options, source_table, source_column, sort_order)
  on def.path = node.path
on conflict (category_node_id, filter_key) do update
set filter_label = excluded.filter_label,
    filter_type = excluded.filter_type,
    options = excluded.options,
    source_table = excluded.source_table,
    source_column = excluded.source_column,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active,
    updated_at = now();

commit;