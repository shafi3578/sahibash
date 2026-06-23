begin;

update public.category_nodes
set name = 'Automobiles', updated_at = now()
where path = 'vehicles/cars';

insert into public.vehicle_feature_groups (name, slug, sort_order)
values
  ('Security', 'security', 1),
  ('Interior', 'interior', 2),
  ('Exterior', 'exterior', 3),
  ('Multimedia', 'multimedia', 4)
on conflict (slug) do update
set name = excluded.name,
    sort_order = excluded.sort_order;

with grouped_features as (
  select 'security'::text as group_slug, unnest(array[
    'ABS','EBD','Air Bag Driver','Air Bag Passenger','Blind Spot Detection','Children Lock','ESP / VSA',
    'Hill Holder','Immobilizer','Isofix','Lane Tracking System','Night Vision','Power Door Locks'
  ]) as feature_name
  union all
  select 'interior', unnest(array[
    'Air Conditioning','Cruise Control','Electric Windows','Functional Steering Wheel','Head-up Display',
    'Heated Wheel','Hydraulic Steering','Keyless Start','Leather Seat','Rear View Camera','Electric Seats',
    'Memory Seats','Heated Seats','Cooling Seats','Auto-darkening Rearview Mirror','Fabric Seat',
    'Front Seat Armrest','Start / Stop','Trip Computer'
  ])
  union all
  select 'exterior', unnest(array[
    'Adaptive Headlights','Electric Mirrors','Heated Mirrors','Parking Sensor Rear','Parking Sensor Front',
    'Parking Assistant','Sunroof','Glass Roof','Smart Boot Lid','Trailer Tow Bar'
  ])
  union all
  select 'multimedia', unnest(array[
    'Android Auto','Apple CarPlay','Bluetooth','USB / AUX','Touch Screen','Navigation','Sound System'
  ])
)
insert into public.vehicle_features (group_id, name, slug, sort_order, is_active)
select g.id,
       f.feature_name,
       lower(regexp_replace(regexp_replace(f.feature_name, '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g')),
       row_number() over (partition by g.id order by f.feature_name),
       true
from grouped_features f
join public.vehicle_feature_groups g on g.slug = f.group_slug
on conflict (slug) do update
set name = excluded.name,
    group_id = excluded.group_id,
    sort_order = excluded.sort_order,
    is_active = true;

insert into public.vehicle_brands (category_node_id, name, slug, display_order, is_active)
values
  ((select id from public.category_nodes where path = 'vehicles/cars/toyota'), 'Toyota', 'toyota', 1, true),
  ((select id from public.category_nodes where path = 'vehicles/cars/mercedes-benz'), 'Mercedes-Benz', 'mercedes-benz', 2, true),
  ((select id from public.category_nodes where path = 'vehicles/cars/hyundai'), 'Hyundai', 'hyundai', 4, true),
  ((select id from public.category_nodes where path = 'vehicles/cars/honda'), 'Honda', 'honda', 6, true)
on conflict (slug) do update
set category_node_id = excluded.category_node_id,
    name = excluded.name,
    display_order = excluded.display_order,
    is_active = true,
    updated_at = now();

insert into public.vehicle_series (brand_id, name, slug, display_order, is_active)
values
  ((select id from public.vehicle_brands where slug = 'hyundai'), 'Sonata', 'sonata', 1, true),
  ((select id from public.vehicle_brands where slug = 'toyota'), 'Corolla', 'corolla', 1, true),
  ((select id from public.vehicle_brands where slug = 'toyota'), 'Land Cruiser', 'land-cruiser', 2, true),
  ((select id from public.vehicle_brands where slug = 'honda'), 'Civic', 'civic', 1, true),
  ((select id from public.vehicle_brands where slug = 'mercedes-benz'), 'C-Class', 'c-class', 1, true)
on conflict (brand_id, slug) do update
set name = excluded.name,
    display_order = excluded.display_order,
    is_active = true,
    updated_at = now();

insert into public.vehicle_models (brand_id, series_id, name, slug, body_type, doors, seats, display_order, is_active)
values
  ((select id from public.vehicle_brands where slug = 'hyundai'), (select id from public.vehicle_series where slug = 'sonata' and brand_id = (select id from public.vehicle_brands where slug = 'hyundai')), 'Sonata', 'sonata', 'Sedan', 4, 5, 1, true),
  ((select id from public.vehicle_brands where slug = 'toyota'), (select id from public.vehicle_series where slug = 'corolla' and brand_id = (select id from public.vehicle_brands where slug = 'toyota')), 'Corolla', 'corolla', 'Sedan', 4, 5, 1, true),
  ((select id from public.vehicle_brands where slug = 'toyota'), (select id from public.vehicle_series where slug = 'land-cruiser' and brand_id = (select id from public.vehicle_brands where slug = 'toyota')), '300', '300', 'SUV', 5, 7, 2, true),
  ((select id from public.vehicle_brands where slug = 'honda'), (select id from public.vehicle_series where slug = 'civic' and brand_id = (select id from public.vehicle_brands where slug = 'honda')), 'Civic', 'civic', 'Sedan', 4, 5, 1, true),
  ((select id from public.vehicle_brands where slug = 'mercedes-benz'), (select id from public.vehicle_series where slug = 'c-class' and brand_id = (select id from public.vehicle_brands where slug = 'mercedes-benz')), 'C200', 'c200', 'Sedan', 4, 5, 1, true)
on conflict (brand_id, slug) do update
set series_id = excluded.series_id,
    name = excluded.name,
    body_type = excluded.body_type,
    doors = excluded.doors,
    seats = excluded.seats,
    display_order = excluded.display_order,
    is_active = true,
    updated_at = now();

insert into public.vehicle_generations (model_id, name, slug, year_start, year_end, display_order, is_active)
values
  ((select id from public.vehicle_models where brand_id = (select id from public.vehicle_brands where slug = 'hyundai') and slug = 'sonata'), '2.0 CRDi', '2-0-crdi', 2018, 2023, 1, true),
  ((select id from public.vehicle_models where brand_id = (select id from public.vehicle_brands where slug = 'toyota') and slug = 'corolla'), '1.8 Hybrid', '1-8-hybrid', 2020, 2025, 1, true),
  ((select id from public.vehicle_models where brand_id = (select id from public.vehicle_brands where slug = 'toyota') and slug = '300'), '300', '300', 2021, 2026, 1, true),
  ((select id from public.vehicle_models where brand_id = (select id from public.vehicle_brands where slug = 'honda') and slug = 'civic'), '1.5 Turbo', '1-5-turbo', 2019, 2025, 1, true),
  ((select id from public.vehicle_models where brand_id = (select id from public.vehicle_brands where slug = 'mercedes-benz') and slug = 'c200'), 'C200', 'c200', 2019, 2025, 1, true)
on conflict (model_id, slug) do update
set name = excluded.name,
    year_start = excluded.year_start,
    year_end = excluded.year_end,
    display_order = excluded.display_order,
    is_active = true,
    updated_at = now();

insert into public.vehicle_variants (generation_id, name, slug, fuel_type, transmission, body_type, engine_power, engine_capacity, wheel_drive, doors, seats, engine_size, drive_type, display_order, is_active)
values
  ((select id from public.vehicle_generations where slug = '2-0-crdi' and model_id = (select id from public.vehicle_models where slug = 'sonata' and brand_id = (select id from public.vehicle_brands where slug = 'hyundai'))), 'Style', 'style', 'Diesel', 'Automatic', 'Sedan', '185 HP', '1995 cc', 'FWD', 4, 5, '2.0', 'FWD', 1, true),
  ((select id from public.vehicle_generations where slug = '1-8-hybrid' and model_id = (select id from public.vehicle_models where slug = 'corolla' and brand_id = (select id from public.vehicle_brands where slug = 'toyota'))), 'Premium', 'premium', 'Hybrid', 'Automatic', 'Sedan', '140 HP', '1798 cc', 'FWD', 4, 5, '1.8', 'FWD', 1, true),
  ((select id from public.vehicle_generations where slug = '300' and model_id = (select id from public.vehicle_models where slug = '300' and brand_id = (select id from public.vehicle_brands where slug = 'toyota'))), 'VX-R', 'vx-r', 'Petrol', 'Automatic', 'SUV', '409 HP', '3445 cc', '4WD', 5, 7, '3.5', '4WD', 1, true),
  ((select id from public.vehicle_generations where slug = '1-5-turbo' and model_id = (select id from public.vehicle_models where slug = 'civic' and brand_id = (select id from public.vehicle_brands where slug = 'honda'))), 'EX', 'ex', 'Petrol', 'Automatic', 'Sedan', '180 HP', '1498 cc', 'FWD', 4, 5, '1.5', 'FWD', 1, true),
  ((select id from public.vehicle_generations where slug = 'c200' and model_id = (select id from public.vehicle_models where slug = 'c200' and brand_id = (select id from public.vehicle_brands where slug = 'mercedes-benz'))), 'AMG', 'amg', 'Petrol', 'Automatic', 'Sedan', '204 HP', '1496 cc', 'RWD', 4, 5, '1.5', 'RWD', 1, true)
on conflict (generation_id, slug) do update
set name = excluded.name,
    fuel_type = excluded.fuel_type,
    transmission = excluded.transmission,
    body_type = excluded.body_type,
    engine_power = excluded.engine_power,
    engine_capacity = excluded.engine_capacity,
    wheel_drive = excluded.wheel_drive,
    doors = excluded.doors,
    seats = excluded.seats,
    engine_size = excluded.engine_size,
    drive_type = excluded.drive_type,
    display_order = excluded.display_order,
    is_active = true,
    updated_at = now();

insert into public.vehicle_specifications (variant_id, spec_key, spec_label, spec_value, is_locked, sort_order)
select v.id, s.spec_key, s.spec_label, s.spec_value, true, s.sort_order
from public.vehicle_variants v
cross join lateral (
  values
    ('make', 'Make', case when v.slug = 'style' then 'Hyundai' when v.slug in ('premium', 'vx-r') then 'Toyota' when v.slug = 'ex' then 'Honda' else 'Mercedes-Benz' end, 1),
    ('series', 'Series', case when v.slug = 'style' then 'Sonata' when v.slug = 'premium' then 'Corolla' when v.slug = 'vx-r' then 'Land Cruiser' when v.slug = 'ex' then 'Civic' else 'C-Class' end, 2),
    ('model', 'Model', case when v.slug = 'style' then 'Sonata' when v.slug = 'premium' then 'Corolla' when v.slug = 'vx-r' then '300' when v.slug = 'ex' then 'Civic' else 'C200' end, 3),
    ('variant', 'Variant', v.name, 4),
    ('body_type', 'Body Type', coalesce(v.body_type, ''), 5),
    ('fuel_type', 'Fuel Type', coalesce(v.fuel_type, ''), 6),
    ('gear', 'Gear / Transmission', coalesce(v.transmission, ''), 7),
    ('engine_power', 'Engine Power', coalesce(v.engine_power, ''), 8),
    ('engine_capacity', 'Engine Capacity', coalesce(v.engine_capacity, v.engine_size, ''), 9),
    ('wheel_drive', 'Wheel Drive', coalesce(v.wheel_drive, v.drive_type, ''), 10),
    ('doors', 'Doors', coalesce(v.doors::text, ''), 11),
    ('seats', 'Seats', coalesce(v.seats::text, ''), 12)
) as s(spec_key, spec_label, spec_value, sort_order)
where v.slug in ('style', 'premium', 'vx-r', 'ex', 'amg')
on conflict (variant_id, spec_key) do update
set spec_label = excluded.spec_label,
    spec_value = excluded.spec_value,
    is_locked = true,
    sort_order = excluded.sort_order,
    updated_at = now();

commit;
