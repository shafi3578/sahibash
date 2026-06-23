begin;

-- Make select-style fields production-ready with explicit option sets.
-- This keeps category_fields dynamic while giving the UI deterministic choices.

-- Real Estate select options
update public.category_fields cf
set options_json = '["sale","rent"]'::jsonb,
    updated_at = now()
from public.category_nodes cn
join public.categories c on c.id = cn.category_id
where cf.category_node_id = cn.id
  and c.slug = 'real-estate'
  and cf.field_key = 'sale_or_rent';

-- Vehicles select options
update public.category_fields cf
set options_json = '["petrol","diesel","hybrid","electric","cng"]'::jsonb,
    updated_at = now()
from public.category_nodes cn
join public.categories c on c.id = cn.category_id
where cf.category_node_id = cn.id
  and c.slug = 'vehicles'
  and cf.field_key = 'fuel_type';

update public.category_fields cf
set options_json = '["manual","automatic"]'::jsonb,
    updated_at = now()
from public.category_nodes cn
join public.categories c on c.id = cn.category_id
where cf.category_node_id = cn.id
  and c.slug = 'vehicles'
  and cf.field_key = 'transmission';

update public.category_fields cf
set options_json = '["new","excellent","good","fair","for-parts"]'::jsonb,
    updated_at = now()
from public.category_nodes cn
join public.categories c on c.id = cn.category_id
where cf.category_node_id = cn.id
  and c.slug = 'vehicles'
  and cf.field_key = 'condition';

update public.category_fields cf
set options_json = '["owner","dealer"]'::jsonb,
    updated_at = now()
from public.category_nodes cn
join public.categories c on c.id = cn.category_id
where cf.category_node_id = cn.id
  and c.slug = 'vehicles'
  and cf.field_key = 'seller_type';

-- Phones & Electronics select options
update public.category_fields cf
set options_json = '["new","like-new","used","refurbished"]'::jsonb,
    updated_at = now()
from public.category_nodes cn
join public.categories c on c.id = cn.category_id
where cf.category_node_id = cn.id
  and c.slug = 'phones-electronics'
  and cf.field_key = 'condition';

-- Second-Hand select options
update public.category_fields cf
set options_json = '["new","like-new","used","needs-repair"]'::jsonb,
    updated_at = now()
from public.category_nodes cn
join public.categories c on c.id = cn.category_id
where cf.category_node_id = cn.id
  and c.slug = 'second-hand-items'
  and cf.field_key = 'condition';

-- Normalize field types for known select fields
update public.category_fields
set field_type = 'select',
    updated_at = now()
where field_key in ('sale_or_rent', 'fuel_type', 'transmission', 'condition', 'seller_type');

-- Add lightweight validator hints for numeric fields via options_json metadata
update public.category_fields
set options_json = coalesce(options_json, '{}'::jsonb) || jsonb_build_object('min', 0),
    updated_at = now()
where field_type = 'number'
  and field_key in ('rooms', 'size_m2', 'floor', 'total_floors', 'building_age', 'bathroom_count', 'year', 'mileage');

commit;
