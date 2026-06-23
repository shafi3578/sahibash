-- Sahibash Post Ad category tree and dynamic field seed

begin;

insert into public.categories (name, slug, description, display_order, is_active)
values
  ('Real Estate', 'real-estate', 'Homes, apartments, land, and commercial properties.', 1, true),
  ('Vehicles', 'vehicles', 'Cars, motorcycles, and transport listings.', 2, true),
  ('Phones & Electronics', 'phones-electronics', 'Phones, laptops, and consumer electronics.', 3, true),
  ('Second-Hand Items', 'second-hand-items', 'Used household and personal goods.', 4, true)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  display_order = excluded.display_order,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.category_nodes (category_id, parent_id, name, slug, level, path, display_order, is_active)
select c.id, null, c.name, c.slug, 1, c.slug, c.display_order, true
from public.categories c
on conflict (path) do update
set
  name = excluded.name,
  display_order = excluded.display_order,
  is_active = true,
  updated_at = now();

with real_estate_root as (
  select id, path, category_id
  from public.category_nodes
  where path = 'real-estate'
), real_estate_nodes as (
  insert into public.category_nodes (category_id, parent_id, name, slug, level, path, display_order, is_active)
  select r.category_id, r.id, v.name, v.slug, 2, r.path || '/' || v.slug, v.display_order, true
  from real_estate_root r
  cross join (values
    ('Residential', 'residential', 1),
    ('Commercial', 'commercial', 2),
    ('Land', 'land', 3),
    ('Property Projects', 'property-projects', 4)
  ) as v(name, slug, display_order)
  on conflict (path) do update
  set name = excluded.name, display_order = excluded.display_order, is_active = true, updated_at = now()
  returning *
), real_estate_paths as (
  select n.id, n.path
  from public.category_nodes n
  where n.path in (
    'real-estate/residential',
    'real-estate/commercial',
    'real-estate/land'
  )
), real_estate_leaf_specs as (
  select * from (values
    ('real-estate/residential', 'for-sale', 'For Sale', 1),
    ('real-estate/residential', 'for-rent', 'For Rent', 2),
    ('real-estate/residential', 'daily-rental', 'Daily Rental', 3),
    ('real-estate/commercial', 'for-sale', 'For Sale', 4),
    ('real-estate/commercial', 'for-rent', 'For Rent', 5),
    ('real-estate/land', 'for-sale', 'For Sale', 6)
  ) as t(parent_path, slug, name, display_order)
)
insert into public.category_nodes (category_id, parent_id, name, slug, level, path, display_order, is_active)
select parent_node.category_id, parent_node.id, spec.name, spec.slug, 3, parent_node.path || '/' || spec.slug, spec.display_order, true
from real_estate_leaf_specs spec
join public.category_nodes parent_node on parent_node.path = spec.parent_path
on conflict (path) do update
set name = excluded.name, display_order = excluded.display_order, is_active = true, updated_at = now();

insert into public.category_nodes (category_id, parent_id, name, slug, level, path, display_order, is_active)
select r.category_id, r.id, 'Property Projects', 'property-projects', 2, r.path || '/property-projects', 4, true
from public.category_nodes r
where r.path = 'real-estate'
on conflict (path) do update
set name = excluded.name, display_order = excluded.display_order, is_active = true, updated_at = now();

with real_estate_leaf_parent as (
  select id, path, category_id
  from public.category_nodes
  where level = 3 and path like 'real-estate/%/%'
)
insert into public.category_nodes (category_id, parent_id, name, slug, level, path, display_order, is_active)
select p.category_id, p.id, v.name, v.slug, 4, p.path || '/' || v.slug, v.display_order, true
from real_estate_leaf_parent p
cross join lateral (
  select * from (
    values
      ('Apartment', 'apartment', 1),
      ('House', 'house', 2),
      ('Villa', 'villa', 3),
      ('Duplex', 'duplex', 4),
      ('Room', 'room', 5),
      ('Shop', 'shop', 6),
      ('Office', 'office', 7),
      ('Warehouse', 'warehouse', 8),
      ('Restaurant', 'restaurant', 9),
      ('Hotel', 'hotel', 10),
      ('Residential Land', 'residential-land', 11),
      ('Commercial Land', 'commercial-land', 12),
      ('Agricultural Land', 'agricultural-land', 13),
      ('Garden', 'garden', 14),
      ('Farm', 'farm', 15)
  ) as x(name, slug, display_order)
) v
where (
  (p.path = 'real-estate/residential/for-sale' and v.slug in ('apartment', 'house', 'villa', 'duplex'))
  or (p.path = 'real-estate/residential/for-rent' and v.slug in ('apartment', 'house', 'villa', 'room'))
  or (p.path = 'real-estate/residential/daily-rental' and v.slug in ('apartment', 'house', 'villa'))
  or (p.path = 'real-estate/commercial/for-sale' and v.slug in ('shop', 'office', 'warehouse', 'restaurant', 'hotel'))
  or (p.path = 'real-estate/commercial/for-rent' and v.slug in ('shop', 'office', 'warehouse', 'restaurant', 'hotel'))
  or (p.path = 'real-estate/land' and v.slug in ('residential-land', 'commercial-land', 'agricultural-land', 'garden', 'farm'))
)
on conflict (path) do update
set name = excluded.name, display_order = excluded.display_order, is_active = true, updated_at = now();

insert into public.category_nodes (category_id, parent_id, name, slug, level, path, display_order, is_active)
select c.id, p.id, v.name, v.slug, 2, p.path || '/' || v.slug, v.display_order, true
from public.categories c
join public.category_nodes p on p.category_id = c.id and p.parent_id is null
cross join (values
  ('Cars', 'cars', 1),
  ('Motorcycles', 'motorcycles', 2),
  ('Trucks', 'trucks', 3),
  ('Vans', 'vans', 4),
  ('Auto Parts', 'auto-parts', 5),
  ('Tires & Wheels', 'tires-wheels', 6)
) as v(name, slug, display_order)
where c.slug = 'vehicles'
on conflict (path) do update
set name = excluded.name, display_order = excluded.display_order, is_active = true, updated_at = now();

insert into public.category_nodes (category_id, parent_id, name, slug, level, path, display_order, is_active)
select p.category_id, p.id, v.name, v.slug, 3, p.path || '/' || v.slug, v.display_order, true
from public.category_nodes p
join public.categories c on c.id = p.category_id
cross join (values
  ('Toyota', 'toyota', 1),
  ('Mercedes-Benz', 'mercedes-benz', 2),
  ('BMW', 'bmw', 3),
  ('Hyundai', 'hyundai', 4),
  ('Kia', 'kia', 5),
  ('Honda', 'honda', 6),
  ('Ford', 'ford', 7),
  ('Nissan', 'nissan', 8),
  ('Volkswagen', 'volkswagen', 9),
  ('Renault', 'renault', 10),
  ('Peugeot', 'peugeot', 11),
  ('Opel', 'opel', 12),
  ('Chevrolet', 'chevrolet', 13),
  ('Lexus', 'lexus', 14),
  ('Mazda', 'mazda', 15),
  ('Mitsubishi', 'mitsubishi', 16),
  ('Suzuki', 'suzuki', 17),
  ('Tesla', 'tesla', 18),
  ('Other', 'other', 19)
) as v(name, slug, display_order)
where c.slug = 'vehicles' and p.path = 'vehicles/cars'
on conflict (path) do update
set name = excluded.name, display_order = excluded.display_order, is_active = true, updated_at = now();

insert into public.category_nodes (category_id, parent_id, name, slug, level, path, display_order, is_active)
select p.category_id, p.id, v.name, v.slug, 3, p.path || '/' || v.slug, v.display_order, true
from public.category_nodes p
join public.categories c on c.id = p.category_id
cross join (values
  ('Apple', 'apple', 1),
  ('Dell', 'dell', 2),
  ('HP', 'hp', 3),
  ('Lenovo', 'lenovo', 4),
  ('Asus', 'asus', 5),
  ('Acer', 'acer', 6),
  ('Other', 'other', 7)
) as v(name, slug, display_order)
where c.slug = 'phones-electronics' and p.path = 'phones-electronics/laptops'
on conflict (path) do update
set name = excluded.name, display_order = excluded.display_order, is_active = true, updated_at = now();

insert into public.category_nodes (category_id, parent_id, name, slug, level, path, display_order, is_active)
select c.id, p.id, v.name, v.slug, 2, p.path || '/' || v.slug, v.display_order, true
from public.categories c
join public.category_nodes p on p.category_id = c.id and p.parent_id is null
cross join (values
  ('Mobile Phones', 'mobile-phones', 1),
  ('Laptops', 'laptops', 2),
  ('Tablets', 'tablets', 3),
  ('TVs', 'tvs', 4),
  ('Cameras', 'cameras', 5),
  ('Accessories', 'accessories', 6)
) as v(name, slug, display_order)
where c.slug = 'phones-electronics'
on conflict (path) do update
set name = excluded.name, display_order = excluded.display_order, is_active = true, updated_at = now();

insert into public.category_nodes (category_id, parent_id, name, slug, level, path, display_order, is_active)
select p.category_id, p.id, v.name, v.slug, 3, p.path || '/' || v.slug, v.display_order, true
from public.category_nodes p
join public.categories c on c.id = p.category_id
cross join (values
  ('iPhone', 'iphone', 1),
  ('Samsung', 'samsung', 2),
  ('Xiaomi', 'xiaomi', 3),
  ('Huawei', 'huawei', 4),
  ('Nokia', 'nokia', 5),
  ('Other', 'other', 6)
) as v(name, slug, display_order)
where c.slug = 'phones-electronics' and p.path = 'phones-electronics/mobile-phones'
on conflict (path) do update
set name = excluded.name, display_order = excluded.display_order, is_active = true, updated_at = now();

insert into public.category_nodes (category_id, parent_id, name, slug, level, path, display_order, is_active)
select c.id, p.id, v.name, v.slug, 2, p.path || '/' || v.slug, v.display_order, true
from public.categories c
join public.category_nodes p on p.category_id = c.id and p.parent_id is null
cross join (values
  ('Furniture', 'furniture', 1),
  ('Home Appliances', 'home-appliances', 2),
  ('Clothing', 'clothing', 3),
  ('Books', 'books', 4),
  ('Tools', 'tools', 5),
  ('Other', 'other', 6)
) as v(name, slug, display_order)
where c.slug = 'second-hand-items'
on conflict (path) do update
set name = excluded.name, display_order = excluded.display_order, is_active = true, updated_at = now();

insert into public.category_nodes (category_id, parent_id, name, slug, level, path, display_order, is_active)
select p.category_id, p.id, v.name, v.slug, 3, p.path || '/' || v.slug, v.display_order, true
from public.category_nodes p
join public.categories c on c.id = p.category_id
cross join (values
  ('Living Room', 'living-room', 1),
  ('Bedroom', 'bedroom', 2),
  ('Kitchen', 'kitchen', 3),
  ('Office Furniture', 'office-furniture', 4),
  ('Chairs', 'chairs', 5),
  ('Tables', 'tables', 6)
) as v(name, slug, display_order)
where c.slug = 'second-hand-items' and p.path = 'second-hand-items/furniture'
on conflict (path) do update
set name = excluded.name, display_order = excluded.display_order, is_active = true, updated_at = now();

insert into public.category_nodes (category_id, parent_id, name, slug, level, path, display_order, is_active)
select p.category_id, p.id, v.name, v.slug, 3, p.path || '/' || v.slug, v.display_order, true
from public.category_nodes p
join public.categories c on c.id = p.category_id
cross join (values
  ('Refrigerator', 'refrigerator', 1),
  ('Washing Machine', 'washing-machine', 2),
  ('Dishwasher', 'dishwasher', 3),
  ('Oven', 'oven', 4),
  ('Microwave', 'microwave', 5),
  ('Vacuum Cleaner', 'vacuum-cleaner', 6),
  ('Air Conditioner', 'air-conditioner', 7),
  ('Heater', 'heater', 8)
) as v(name, slug, display_order)
where c.slug = 'second-hand-items' and p.path = 'second-hand-items/home-appliances'
on conflict (path) do update
set name = excluded.name, display_order = excluded.display_order, is_active = true, updated_at = now();

insert into public.category_fields (category_node_id, field_key, field_label, field_type, is_required, options_json, unit, display_order, is_active)
select n.id, f.field_key, f.field_label, f.field_type, f.is_required, f.options_json, f.unit, f.display_order, true
from public.category_nodes n
join public.categories c on c.id = n.category_id
cross join (values
  ('listing_type', 'Listing Type', 'select', true, '["Sale","Rent","Daily Rental"]'::jsonb, null, 1),
  ('price', 'Price', 'number', true, null, null, 2),
  ('currency', 'Currency', 'select', true, '["AFN","USD"]'::jsonb, null, 3),
  ('province', 'Province', 'select', true, null, null, 4),
  ('district', 'District', 'text', true, null, null, 5),
  ('address', 'Address', 'text', true, null, null, 6),
  ('size_m2', 'Size in m²', 'number', false, null, 'm²', 7),
  ('rooms', 'Number of rooms', 'number', false, null, null, 8),
  ('bathrooms', 'Bathrooms', 'number', false, null, null, 9),
  ('floor', 'Floor', 'number', false, null, null, 10),
  ('total_floors', 'Total floors', 'number', false, null, null, 11),
  ('building_age', 'Building age', 'number', false, null, null, 12),
  ('furnished', 'Furnished', 'boolean', false, null, null, 13),
  ('heating', 'Heating', 'text', false, null, null, 14),
  ('balcony', 'Balcony', 'boolean', false, null, null, 15),
  ('parking', 'Parking', 'boolean', false, null, null, 16),
  ('title', 'Title', 'text', true, null, null, 17),
  ('description', 'Description', 'text', true, null, null, 18)
) as f(field_key, field_label, field_type, is_required, options_json, unit, display_order)
where c.slug = 'real-estate' and (
  n.path like 'real-estate/%/%/%'
  or n.path = 'real-estate/property-projects'
)
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

insert into public.category_fields (category_node_id, field_key, field_label, field_type, is_required, options_json, unit, display_order, is_active)
select n.id, f.field_key, f.field_label, f.field_type, f.is_required, f.options_json, f.unit, f.display_order, true
from public.category_nodes n
join public.categories c on c.id = n.category_id
cross join (values
  ('price', 'Price', 'number', true, null, null, 1),
  ('currency', 'Currency', 'select', true, '["AFN","USD"]'::jsonb, null, 2),
  ('province', 'Province', 'select', true, null, null, 3),
  ('district', 'District', 'text', true, null, null, 4),
  ('brand', 'Brand', 'text', true, null, null, 5),
  ('model', 'Model', 'text', true, null, null, 6),
  ('year', 'Year', 'number', false, null, null, 7),
  ('mileage', 'Mileage', 'number', false, null, 'km', 8),
  ('fuel_type', 'Fuel type', 'select', false, '["Petrol","Diesel","Hybrid","Electric","Other"]'::jsonb, null, 9),
  ('transmission', 'Transmission', 'select', false, '["Manual","Automatic"]'::jsonb, null, 10),
  ('color', 'Color', 'text', false, null, null, 11),
  ('body_type', 'Body type', 'select', false, '["Sedan","SUV","Hatchback","Van","Truck","Coupe","Wagon","Other"]'::jsonb, null, 12),
  ('condition', 'Condition', 'select', true, '["New","Used","Like new"]'::jsonb, null, 13),
  ('engine_size', 'Engine size', 'text', false, null, null, 14),
  ('title', 'Title', 'text', true, null, null, 15),
  ('description', 'Description', 'text', true, null, null, 16)
) as f(field_key, field_label, field_type, is_required, options_json, unit, display_order)
where c.slug = 'vehicles' and (
  n.path like 'vehicles/%/%'
  or n.path in (
    'vehicles/motorcycles',
    'vehicles/trucks',
    'vehicles/vans',
    'vehicles/auto-parts',
    'vehicles/tires-wheels'
  )
)
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

insert into public.category_fields (category_node_id, field_key, field_label, field_type, is_required, options_json, unit, display_order, is_active)
select n.id, f.field_key, f.field_label, f.field_type, f.is_required, f.options_json, f.unit, f.display_order, true
from public.category_nodes n
join public.categories c on c.id = n.category_id
cross join (values
  ('price', 'Price', 'number', true, null, null, 1),
  ('currency', 'Currency', 'select', true, '["AFN","USD"]'::jsonb, null, 2),
  ('province', 'Province', 'select', true, null, null, 3),
  ('district', 'District', 'text', true, null, null, 4),
  ('brand', 'Brand', 'text', true, null, null, 5),
  ('model', 'Model', 'text', true, null, null, 6),
  ('condition', 'Condition', 'select', true, '["New","Used","Open Box","Refurbished"]'::jsonb, null, 7),
  ('storage', 'Storage', 'text', false, null, null, 8),
  ('ram', 'RAM', 'text', false, null, null, 9),
  ('color', 'Color', 'text', false, null, null, 10),
  ('warranty', 'Warranty', 'boolean', false, null, null, 11),
  ('original_box', 'Original box', 'boolean', false, null, null, 12),
  ('title', 'Title', 'text', true, null, null, 13),
  ('description', 'Description', 'text', true, null, null, 14)
) as f(field_key, field_label, field_type, is_required, options_json, unit, display_order)
where c.slug = 'phones-electronics' and (
  n.path like 'phones-electronics/%/%'
  or n.path in (
    'phones-electronics/tablets',
    'phones-electronics/tvs',
    'phones-electronics/cameras',
    'phones-electronics/accessories'
  )
)
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

insert into public.category_fields (category_node_id, field_key, field_label, field_type, is_required, options_json, unit, display_order, is_active)
select n.id, f.field_key, f.field_label, f.field_type, f.is_required, f.options_json, f.unit, f.display_order, true
from public.category_nodes n
join public.categories c on c.id = n.category_id
cross join (values
  ('price', 'Price', 'number', true, null, null, 1),
  ('currency', 'Currency', 'select', true, '["AFN","USD"]'::jsonb, null, 2),
  ('province', 'Province', 'select', true, null, null, 3),
  ('district', 'District', 'text', true, null, null, 4),
  ('item_type', 'Item type', 'text', true, null, null, 5),
  ('brand', 'Brand', 'text', false, null, null, 6),
  ('condition', 'Condition', 'select', true, '["New","Used","Good","Fair"]'::jsonb, null, 7),
  ('used_duration', 'Used duration', 'text', false, null, null, 8),
  ('delivery_available', 'Delivery available', 'boolean', false, null, null, 9),
  ('title', 'Title', 'text', true, null, null, 10),
  ('description', 'Description', 'text', true, null, null, 11)
) as f(field_key, field_label, field_type, is_required, options_json, unit, display_order)
where c.slug = 'second-hand-items' and (
  n.path like 'second-hand-items/%/%'
  or n.path in (
    'second-hand-items/clothing',
    'second-hand-items/books',
    'second-hand-items/tools',
    'second-hand-items/other'
  )
)
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

commit;