begin;

-- Hide remaining legacy duplicate branches while preserving historical listing references.
update public.category_nodes
set is_active = false,
    updated_at = now()
where path in (
  'vehicles/spare-parts',
  'vehicles/trucks',
  'vehicles/vans',
  'vehicles/auto-parts',
  'vehicles/tires-wheels',
  'real-estate/residential',
  'real-estate/commercial',
  'real-estate/property-projects'
)
or path like 'vehicles/spare-parts/%'
or path like 'vehicles/trucks/%'
or path like 'vehicles/vans/%'
or path like 'vehicles/auto-parts/%'
or path like 'vehicles/tires-wheels/%'
or path like 'real-estate/residential/%'
or path like 'real-estate/commercial/%'
or path like 'real-estate/property-projects/%';

-- Keep motorcycle sort order aligned after adding Pamir and Zaranj.
update public.category_nodes
set sort_order = case path
      when 'vehicles/motorcycles/honda-cd70-honda-70' then 1
      when 'vehicles/motorcycles/honda-cg125-honda-125' then 2
      when 'vehicles/motorcycles/pamir-motorcycle' then 3
      when 'vehicles/motorcycles/zaranj-motorcycle' then 4
      when 'vehicles/motorcycles/chinese-motorcycles' then 5
      when 'vehicles/motorcycles/indian-motorcycles' then 6
      when 'vehicles/motorcycles/150cc-250cc-motorcycles' then 7
      when 'vehicles/motorcycles/sport-motorcycles' then 8
      when 'vehicles/motorcycles/dirt-bikes' then 9
      when 'vehicles/motorcycles/electric-motorcycles' then 10
      when 'vehicles/motorcycles/motorcycle-parts' then 11
      when 'vehicles/motorcycles/other-motorcycle' then 12
      else sort_order
    end,
    display_order = case path
      when 'vehicles/motorcycles/honda-cd70-honda-70' then 1
      when 'vehicles/motorcycles/honda-cg125-honda-125' then 2
      when 'vehicles/motorcycles/pamir-motorcycle' then 3
      when 'vehicles/motorcycles/zaranj-motorcycle' then 4
      when 'vehicles/motorcycles/chinese-motorcycles' then 5
      when 'vehicles/motorcycles/indian-motorcycles' then 6
      when 'vehicles/motorcycles/150cc-250cc-motorcycles' then 7
      when 'vehicles/motorcycles/sport-motorcycles' then 8
      when 'vehicles/motorcycles/dirt-bikes' then 9
      when 'vehicles/motorcycles/electric-motorcycles' then 10
      when 'vehicles/motorcycles/motorcycle-parts' then 11
      when 'vehicles/motorcycles/other-motorcycle' then 12
      else display_order
    end,
    updated_at = now()
where path like 'vehicles/motorcycles/%';

delete from public.category_aliases
where lower(alias) in (
  'hilux', 'honda 125', 'shop', 'apartment', 'house', 'land', 'solar'
);

insert into public.category_aliases (category_id, alias, language)
select node.id, alias_map.alias, alias_map.language
from public.category_nodes node
join (
  values
    ('vehicles/cars/toyota/hilux', 'Hilux', 'en'),
    ('vehicles/motorcycles/honda-cg125-honda-125', 'Honda 125', 'en'),
    ('real-estate/shops-commercial', 'Shop', 'en'),
    ('real-estate/apartments/apartment', 'Apartment', 'en'),
    ('real-estate/houses', 'House', 'en'),
    ('real-estate/land', 'Land', 'en'),
    ('electronics-computers/solar-power-equipment', 'Solar', 'en')
) as alias_map(path, alias, language) on alias_map.path = node.path
on conflict do nothing;

-- Ensure Afghan home items are filterable without exploding the category tree.
insert into public.filter_definitions (
  category_node_id, filter_key, filter_label, filter_type, options, source_table, source_column, sort_order, is_active
)
select node.id, def.filter_key, def.filter_label, def.filter_type, def.options::jsonb, def.source_table, def.source_column, def.sort_order, true
from public.category_nodes node
join (
  values
    ('home-furniture-appliances/home-appliances', 'home_item_type', 'Appliance Type', 'select', '["Fridge","Washing Machine","Generator","Solar Equipment","Water Pump","Oven","Microwave","Other"]', 'listing_attributes', 'home_item_type', 200),
    ('home-furniture-appliances/heating-cooling', 'heating_cooling_type', 'Heating / Cooling Type', 'select', '["Bukhari","Heater","Air Conditioner","Fan","Other"]', 'listing_attributes', 'heating_cooling_type', 201),
    ('home-furniture-appliances/carpets-rugs', 'carpet_rug_type', 'Carpet / Rug Type', 'select', '["Carpet","Rug","Other"]', 'listing_attributes', 'carpet_rug_type', 202)
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