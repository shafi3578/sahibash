-- Sahibash V7: category browsing metadata and recursive counts

begin;

alter table public.category_nodes add column if not exists description text;
alter table public.category_nodes add column if not exists icon text;
alter table public.category_nodes add column if not exists sort_order int not null default 0;
alter table public.category_nodes add column if not exists is_leaf boolean not null default false;

update public.category_nodes
set sort_order = coalesce(sort_order, display_order);

insert into public.categories (name, slug, description, display_order, is_active)
values
  ('Real Estate', 'real-estate', 'Homes, apartments, land, and commercial properties.', 1, true),
  ('Vehicles', 'vehicles', 'Cars, motorcycles, vans, and trucks.', 2, true),
  ('Auto Parts & Accessories', 'auto-parts-accessories', 'Auto parts, accessories, and wheels.', 3, false),
  ('Phones & Electronics', 'phones-electronics', 'Phones, laptops, TVs, cameras, and accessories.', 4, true),
  ('Second-Hand Items', 'second-hand-items', 'Used household and personal items.', 5, true),
  ('Services', 'services', 'Local services and professional help.', 6, false),
  ('Jobs', 'jobs', 'Job listings and hiring posts.', 7, false),
  ('Animals', 'animals', 'Pets and animal-related posts.', 8, false),
  ('Urgent Listings', 'urgent-listings', 'Urgent and highlighted posts.', 9, false),
  ('Last 48 Hours', 'last-48-hours', 'Recently posted listings.', 10, false)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  display_order = excluded.display_order,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.category_nodes (category_id, parent_id, name, slug, level, path, display_order, sort_order, is_active, is_leaf)
select c.id, null, c.name, c.slug, 1, c.slug, c.display_order, c.display_order, c.is_active, false
from public.categories c
where c.slug in ('real-estate', 'vehicles', 'phones-electronics', 'second-hand-items')
on conflict (path) do update
set
  name = excluded.name,
  display_order = excluded.display_order,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();

update public.category_nodes
set
  description = coalesce(description, case path
    when 'real-estate' then 'Browse homes, apartments, land, and projects.'
    when 'vehicles' then 'Browse cars, motorcycles, vans, and trucks.'
    when 'phones-electronics' then 'Browse phones, laptops, tablets, and devices.'
    when 'second-hand-items' then 'Browse furniture, tools, and home appliances.'
    else description
  end),
  icon = coalesce(icon, case path
    when 'real-estate' then 'home'
    when 'vehicles' then 'car'
    when 'phones-electronics' then 'smartphone'
    when 'second-hand-items' then 'box'
    when 'real-estate/residential' then 'building'
    when 'real-estate/commercial' then 'store'
    when 'real-estate/land' then 'map'
    when 'vehicles/cars' then 'car'
    when 'vehicles/motorcycles' then 'bike'
    when 'vehicles/trucks' then 'truck'
    when 'vehicles/vans' then 'van'
    when 'phones-electronics/mobile-phones' then 'smartphone'
    when 'phones-electronics/laptops' then 'laptop'
    when 'phones-electronics/tablets' then 'tablet'
    when 'phones-electronics/tvs' then 'tv'
    when 'second-hand-items/furniture' then 'sofa'
    when 'second-hand-items/home-appliances' then 'fridge'
    else icon
  end);

create or replace function public.refresh_category_leaf_flags()
returns void
language plpgsql
as $$
begin
  update public.category_nodes n
  set is_leaf = not exists (
    select 1
    from public.category_nodes c
    where c.parent_id = n.id
      and c.is_active = true
  );
end;
$$;

select public.refresh_category_leaf_flags();

create or replace function public.get_category_descendant_ids(root_node_id bigint)
returns table(node_id bigint)
language sql
stable
as $$
  with recursive tree as (
    select n.id
    from public.category_nodes n
    where n.id = root_node_id

    union all

    select c.id
    from public.category_nodes c
    join tree t on c.parent_id = t.id
    where c.is_active = true
  )
  select id as node_id from tree;
$$;

create or replace function public.get_category_listing_count(category_node_id bigint)
returns bigint
language sql
stable
as $$
  with recursive tree as (
    select n.id
    from public.category_nodes n
    where n.id = category_node_id

    union all

    select c.id
    from public.category_nodes c
    join tree t on c.parent_id = t.id
    where c.is_active = true
  )
  select count(*)::bigint
  from public.listings l
  where l.status = 'approved'
    and l.category_node_id in (select id from tree);
$$;

create or replace function public.get_category_tree_counts(parent_node_id bigint default null)
returns table(
  node_id bigint,
  direct_count bigint,
  subtree_count bigint
)
language sql
stable
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
  ), direct as (
    select l.category_node_id as node_id, count(*)::bigint as cnt
    from public.listings l
    where l.status = 'approved'
      and l.category_node_id in (select id from all_nodes)
    group by l.category_node_id
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

commit;
