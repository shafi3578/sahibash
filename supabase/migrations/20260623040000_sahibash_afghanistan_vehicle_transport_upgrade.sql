-- Afghanistan-specific vehicle & transport upgrade
-- Supports classic/old vehicles, motorcycles (Honda 70), rickshaws, bicycles,
-- commercial/agricultural transport, and manual fallback fields.

begin;

alter table public.listings
  add column if not exists vehicle_type text,
  add column if not exists vehicle_subtype text,
  add column if not exists vehicle_brand text,
  add column if not exists vehicle_model text,
  add column if not exists vehicle_year int,
  add column if not exists vehicle_is_manual boolean not null default false,
  add column if not exists vehicle_is_classic boolean not null default false,
  add column if not exists vehicle_is_custom boolean not null default false,
  add column if not exists vehicle_manual_specs jsonb not null default '{}'::jsonb;

create index if not exists idx_listings_vehicle_type on public.listings(vehicle_type);
create index if not exists idx_listings_vehicle_subtype on public.listings(vehicle_subtype);
create index if not exists idx_listings_vehicle_year on public.listings(vehicle_year);
create index if not exists idx_listings_vehicle_is_manual on public.listings(vehicle_is_manual);
create index if not exists idx_listings_vehicle_is_classic on public.listings(vehicle_is_classic);
create index if not exists idx_listings_vehicle_is_custom on public.listings(vehicle_is_custom);

-- Expand vehicles category tree for Afghanistan marketplace reality.
with vehicles_root as (
  select id, category_id
  from public.category_nodes
  where path = 'vehicles'
  limit 1
), inserted_top as (
  insert into public.category_nodes (category_id, parent_id, name, slug, level, path, display_order, is_active)
  select vr.category_id, vr.id, v.name, v.slug, 2, 'vehicles/' || v.slug, v.display_order, true
  from vehicles_root vr
  join (
    values
      ('Passenger Vehicles', 'passenger-vehicles', 5),
      ('Old Vehicles (1950-2000)', 'old-vehicles', 10),
      ('Imported Cars', 'imported-cars', 15),
      ('Rebuilt Cars', 'rebuilt-cars', 20),
      ('Custom / Modified Cars', 'custom-modified-cars', 25),
      ('Rickshaw / Three-Wheelers', 'rickshaw-three-wheelers', 30),
      ('Bicycles', 'bicycles', 35),
      ('Commercial Vehicles', 'commercial-vehicles', 40),
      ('Agricultural & Rural Vehicles', 'agricultural-rural-vehicles', 45),
      ('Other / Custom Vehicles', 'other-custom-vehicles', 50)
  ) as v(name, slug, display_order) on true
  where not exists (
    select 1 from public.category_nodes existing where existing.path = 'vehicles/' || v.slug
  )
  returning id
)
select count(*) from inserted_top;

-- Add Afghanistan-specific children under existing motorcycles node.
with motorcycles_node as (
  select id, category_id
  from public.category_nodes
  where path = 'vehicles/motorcycles'
  limit 1
), inserted_moto as (
  insert into public.category_nodes (category_id, parent_id, name, slug, level, path, display_order, is_active)
  select mn.category_id, mn.id, m.name, m.slug, 3, 'vehicles/motorcycles/' || m.slug, m.display_order, true
  from motorcycles_node mn
  join (
    values
      ('Honda 70', 'honda-70', 1),
      ('100cc-250cc Bikes', '100cc-250cc', 2),
      ('Chinese Motorcycles', 'chinese-motorcycles', 3),
      ('Indian Motorcycles', 'indian-motorcycles', 4),
      ('Electric Bikes', 'electric-bikes', 5),
      ('Dirt Bikes', 'dirt-bikes', 6),
      ('Unknown / Manual Motorcycle', 'manual-motorcycle', 7)
  ) as m(name, slug, display_order) on true
  where not exists (
    select 1 from public.category_nodes existing where existing.path = 'vehicles/motorcycles/' || m.slug
  )
  returning id
)
select count(*) from inserted_moto;

-- Add detail children for rickshaw, bicycles, commercial, agricultural, and other.
with parent_nodes as (
  select id, category_id, path
  from public.category_nodes
  where path in (
    'vehicles/rickshaw-three-wheelers',
    'vehicles/bicycles',
    'vehicles/commercial-vehicles',
    'vehicles/agricultural-rural-vehicles',
    'vehicles/other-custom-vehicles',
    'vehicles/passenger-vehicles',
    'vehicles/imported-cars'
  )
), child_rows as (
  select * from (
    values
      ('vehicles/rickshaw-three-wheelers', 'Auto Rickshaw (Passenger)', 'auto-rickshaw', 1),
      ('vehicles/rickshaw-three-wheelers', 'Cargo Rickshaw', 'cargo-rickshaw', 2),
      ('vehicles/rickshaw-three-wheelers', 'Passenger Rickshaw', 'passenger-rickshaw', 3),
      ('vehicles/rickshaw-three-wheelers', 'Electric Rickshaw', 'electric-rickshaw', 4),
      ('vehicles/rickshaw-three-wheelers', 'Modified Three-Wheeler', 'modified-three-wheeler', 5),
      ('vehicles/bicycles', 'Mountain Bikes', 'mountain-bikes', 1),
      ('vehicles/bicycles', 'City Bikes', 'city-bikes', 2),
      ('vehicles/bicycles', 'Electric Bikes', 'electric-bikes', 3),
      ('vehicles/bicycles', 'Cargo Bicycles', 'cargo-bicycles', 4),
      ('vehicles/commercial-vehicles', 'Pickup Trucks', 'pickup-trucks', 1),
      ('vehicles/commercial-vehicles', 'Vans', 'vans', 2),
      ('vehicles/commercial-vehicles', 'Buses', 'buses', 3),
      ('vehicles/commercial-vehicles', 'Small Trucks', 'small-trucks', 4),
      ('vehicles/commercial-vehicles', 'Heavy Trucks', 'heavy-trucks', 5),
      ('vehicles/agricultural-rural-vehicles', 'Tractors', 'tractors', 1),
      ('vehicles/agricultural-rural-vehicles', 'Small Farming Machines', 'small-farming-machines', 2),
      ('vehicles/agricultural-rural-vehicles', 'Modified Farm Vehicles', 'modified-farm-vehicles', 3),
      ('vehicles/other-custom-vehicles', 'Unknown Vehicles', 'unknown-vehicles', 1),
      ('vehicles/other-custom-vehicles', 'Handmade / Custom', 'handmade-custom', 2),
      ('vehicles/other-custom-vehicles', 'Imported Without Model Info', 'imported-without-model-info', 3),
      ('vehicles/passenger-vehicles', 'Cars (All Types)', 'cars-all-types', 1),
      ('vehicles/passenger-vehicles', 'Old Cars (1950-2000)', 'old-cars-1950-2000', 2),
      ('vehicles/passenger-vehicles', 'Imported Cars (Japan/Dubai/Europe)', 'imported-cars-japan-dubai-europe', 3),
      ('vehicles/passenger-vehicles', 'Rebuilt Cars', 'rebuilt-cars', 4),
      ('vehicles/passenger-vehicles', 'Custom / Modified Cars', 'custom-modified-cars', 5),
      ('vehicles/imported-cars', 'Japan Imports', 'japan-imports', 1),
      ('vehicles/imported-cars', 'Dubai Imports', 'dubai-imports', 2),
      ('vehicles/imported-cars', 'Europe Imports', 'europe-imports', 3)
  ) as t(parent_path, name, slug, display_order)
), inserted_children as (
  insert into public.category_nodes (category_id, parent_id, name, slug, level, path, display_order, is_active)
  select p.category_id, p.id, c.name, c.slug, 3, p.path || '/' || c.slug, c.display_order, true
  from parent_nodes p
  join child_rows c on c.parent_path = p.path
  where not exists (
    select 1 from public.category_nodes existing where existing.path = p.path || '/' || c.slug
  )
  returning id
)
select count(*) from inserted_children;

commit;
