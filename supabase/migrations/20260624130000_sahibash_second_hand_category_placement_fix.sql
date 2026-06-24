begin;

create temporary table tmp_second_hand_move_map (
  slug text primary key,
  old_path text not null,
  new_path text not null,
  new_name text not null,
  new_order int not null
) on commit drop;

insert into tmp_second_hand_move_map (slug, old_path, new_path, new_name, new_order)
select
  n.slug,
  n.path,
  'second-hand-items/' || n.slug,
  case n.slug
    when 'electronics-computers' then 'Electronics & Computers'
    when 'home-furniture-appliances' then 'Home & Furniture'
    when 'clothing-personal-items' then 'Clothing & Personal Items'
    else n.name
  end,
  case n.slug
    when 'electronics-computers' then 1
    when 'home-furniture-appliances' then 2
    when 'clothing-personal-items' then 3
    else 99
  end
from public.category_nodes n
where n.parent_id is null
  and n.slug in ('electronics-computers', 'home-furniture-appliances', 'clothing-personal-items')
  and n.is_active = true;

with second_hand_root as (
  select id, category_id
  from public.category_nodes
  where path = 'second-hand-items'
  limit 1
)
update public.category_nodes n
set
  path = mm.new_path,
  parent_id = shr.id,
  category_id = shr.category_id,
  level = 2,
  name = mm.new_name,
  display_order = mm.new_order,
  sort_order = mm.new_order,
  is_active = true,
  updated_at = now()
from tmp_second_hand_move_map mm
cross join second_hand_root shr
where n.path = mm.old_path;

with second_hand_root as (
  select category_id
  from public.category_nodes
  where path = 'second-hand-items'
  limit 1
)
update public.category_nodes n
set
  path = mm.new_path || substring(n.path from char_length(mm.old_path) + 1),
  level = n.level + 1,
  category_id = shr.category_id,
  is_active = true,
  updated_at = now()
from tmp_second_hand_move_map mm
cross join second_hand_root shr
where n.path like mm.old_path || '/%';

with second_hand_root as (
  select id
  from public.category_nodes
  where path = 'second-hand-items'
  limit 1
)
update public.category_nodes n
set
  display_order = orders.display_order,
  sort_order = orders.display_order,
  is_active = true,
  updated_at = now()
from second_hand_root shr
join (
  values
    ('electronics-computers', 1),
    ('home-furniture-appliances', 2),
    ('clothing-personal-items', 3),
    ('furniture', 4),
    ('home-appliances', 5),
    ('clothing', 6),
    ('books', 7),
    ('tools', 8),
    ('other', 9)
) as orders(slug, display_order)
  on true
where n.parent_id = shr.id
  and n.slug = orders.slug;

with second_hand_root as (
  select category_id
  from public.category_nodes
  where path = 'second-hand-items'
  limit 1
)
update public.listings l
set
  category_id = shr.category_id,
  updated_at = now()
from public.category_nodes n
cross join second_hand_root shr
where l.category_node_id = n.id
  and (
    n.path = 'second-hand-items/electronics-computers'
    or n.path like 'second-hand-items/electronics-computers/%'
    or n.path = 'second-hand-items/home-furniture-appliances'
    or n.path like 'second-hand-items/home-furniture-appliances/%'
    or n.path = 'second-hand-items/clothing-personal-items'
    or n.path like 'second-hand-items/clothing-personal-items/%'
  )
  and l.category_id <> shr.category_id;

commit;
