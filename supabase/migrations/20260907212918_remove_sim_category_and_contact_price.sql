begin;

-- Preserve historical rows for referential integrity while removing SIM and
-- phone-number trading from every active taxonomy/schema surface.
with sim_nodes as (
  select id
  from public.category_nodes
  where slug = 'sim-cards-numbers'
     or path = 'mobile-phones-tablets/sim-cards-numbers'
     or path like 'mobile-phones-tablets/sim-cards-numbers/%'
), archived_schemas as (
  update public.listing_schema_versions schema_version
  set status = 'archived', archived_at = coalesce(schema_version.archived_at, now())
  where schema_version.category_node_id in (select id from sim_nodes)
    and schema_version.status = 'published'
  returning schema_version.id
)
update public.category_nodes node
set is_active = false,
    updated_at = now()
where node.id in (select id from sim_nodes);

-- Price is mandatory. Archive legacy zero-price and SIM listings rather than
-- deleting user data so the change is reversible and auditable.
with sim_nodes as (
  select id
  from public.category_nodes
  where slug = 'sim-cards-numbers'
     or path = 'mobile-phones-tablets/sim-cards-numbers'
     or path like 'mobile-phones-tablets/sim-cards-numbers/%'
)
update public.listings listing
set status = 'expired',
    publication_status = 'archived',
    freshness_status = 'expired',
    featured = false,
    featured_until = null,
    expires_at = least(listing.expires_at, now()),
    archived_at = coalesce(listing.archived_at, now()),
    removed_public_at = coalesce(listing.removed_public_at, now()),
    updated_at = now()
where listing.status = 'approved'
  and (
    coalesce(listing.price, 0) <= 0
    or listing.category_node_id in (select id from sim_nodes)
  );

do $$
begin
  if exists (
    select 1 from public.category_nodes
    where is_active
      and (slug = 'sim-cards-numbers' or path like '%/sim-cards-numbers%')
  ) then
    raise exception 'SIM category remains active';
  end if;

  if exists (
    select 1 from public.listings
    where status = 'approved' and coalesce(price, 0) <= 0
  ) then
    raise exception 'An approved zero-price listing remains public';
  end if;
end
$$;

commit;
