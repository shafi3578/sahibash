begin;

-- The posting picker must stop only on nodes that have no active children.
-- This repairs stale flags without removing or renaming any taxonomy data.
update public.category_nodes as node
set
  is_leaf = not exists (
    select 1
    from public.category_nodes as child
    where child.parent_id = node.id
      and child.is_active
  ),
  updated_at = now()
where node.is_active
  and node.is_leaf is distinct from not exists (
    select 1
    from public.category_nodes as child
    where child.parent_id = node.id
      and child.is_active
  );

-- iPhone sellers choose a model and storage capacity. Exposing a generic RAM
-- field here adds noise and is not a useful seller decision. Publish a new
-- immutable schema version and archive the former version for auditability.
do $$
declare
  target_node_id bigint;
  previous_version public.listing_schema_versions%rowtype;
  next_config jsonb;
  next_version integer;
begin
  select id
  into target_node_id
  from public.category_nodes
  where path = 'mobile-phones-tablets/mobile-phones/apple-iphone'
    and is_active
  limit 1;

  if target_node_id is null then
    return;
  end if;

  select *
  into previous_version
  from public.listing_schema_versions
  where category_node_id = target_node_id
    and status = 'published'
  order by version desc
  limit 1
  for update;

  if previous_version.id is null
    or not exists (
      select 1
      from jsonb_array_elements(coalesce(previous_version.config->'fields', '[]'::jsonb)) as field
      where field->>'key' = 'ram_gb'
    )
  then
    return;
  end if;

  select jsonb_set(
    previous_version.config,
    '{fields}',
    coalesce(
      jsonb_agg(field order by ordinal_position)
        filter (where field->>'key' <> 'ram_gb'),
      '[]'::jsonb
    ),
    true
  )
  into next_config
  from jsonb_array_elements(coalesce(previous_version.config->'fields', '[]'::jsonb))
    with ordinality as fields(field, ordinal_position);

  select coalesce(max(version), 0) + 1
  into next_version
  from public.listing_schema_versions
  where category_node_id = target_node_id;

  update public.listing_schema_versions
  set status = 'archived', archived_at = now()
  where id = previous_version.id;

  insert into public.listing_schema_versions (
    category_node_id,
    version,
    status,
    config,
    created_by,
    created_at,
    published_at,
    archived_at
  ) values (
    target_node_id,
    next_version,
    'published',
    next_config,
    previous_version.created_by,
    now(),
    now(),
    null
  );
end;
$$;

-- Replace broad inherited schemas where they expose controls that do not
-- describe the selected leaf. Source schemas are existing published,
-- multilingual configurations; every target receives a new immutable version.
do $$
declare
  mapping record;
  previous_version public.listing_schema_versions%rowtype;
  source_fields jsonb;
  next_config jsonb;
  next_version integer;
begin
  for mapping in
    select *
    from (values
      ('vehicles/bicycles/bicycle-parts', 'vehicles/vehicle-parts-accessories'),
      ('vehicles/motorcycles/motorcycle-parts', 'vehicles/vehicle-parts-accessories'),
      ('vehicles/rickshaws-three-wheelers/rickshaw-parts', 'vehicles/vehicle-parts-accessories'),
      ('mobile-phones-tablets/computer-parts', 'mobile-phones-tablets/other-electronics'),
      ('mobile-phones-tablets/networking-equipment', 'mobile-phones-tablets/other-electronics'),
      ('mobile-phones-tablets/printers-scanners', 'mobile-phones-tablets/other-electronics'),
      ('mobile-phones-tablets/storage-devices', 'mobile-phones-tablets/other-electronics'),
      ('mobile-phones-tablets/smart-watches', 'mobile-phones-tablets/other-electronics'),
      ('mobile-phones-tablets/gaming-consoles', 'mobile-phones-tablets/other-electronics'),
      ('mobile-phones-tablets/monitors', 'mobile-phones-tablets/tvs'),
      ('second-hand-items/clothing-personal-items/bags', 'second-hand-items/home-furniture-appliances/other-home-items'),
      ('second-hand-items/clothing-personal-items/bags-accessories', 'second-hand-items/home-furniture-appliances/other-home-items'),
      ('second-hand-items/clothing-personal-items/beauty-personal-care', 'second-hand-items/home-furniture-appliances/other-home-items'),
      ('second-hand-items/clothing-personal-items/jewelry-accessories', 'second-hand-items/home-furniture-appliances/other-home-items'),
      ('second-hand-items/clothing-personal-items/jewelry-watches', 'second-hand-items/home-furniture-appliances/other-home-items'),
      ('second-hand-items/clothing-personal-items/watches', 'second-hand-items/home-furniture-appliances/other-home-items'),
      ('second-hand-items/home-furniture-appliances/construction-materials', 'second-hand-items/home-furniture-appliances/other-home-items'),
      ('second-hand-items/electronics-computers/computer-parts-accessories', 'mobile-phones-tablets/other-electronics'),
      ('second-hand-items/electronics-computers/networking-wifi', 'mobile-phones-tablets/other-electronics'),
      ('second-hand-items/electronics-computers/printers-scanners', 'mobile-phones-tablets/other-electronics'),
      ('second-hand-items/electronics-computers/monitors', 'mobile-phones-tablets/tvs')
    ) as mappings(target_path, source_path)
  loop
    previous_version := null;
    source_fields := null;

    select source.config->'fields'
    into source_fields
    from public.category_nodes source_node
    join public.listing_schema_versions source
      on source.category_node_id = source_node.id
     and source.status = 'published'
    where source_node.path = mapping.source_path
      and source_node.is_active
    limit 1;

    select target.*
    into previous_version
    from public.category_nodes target_node
    join public.listing_schema_versions target
      on target.category_node_id = target_node.id
     and target.status = 'published'
    where target_node.path = mapping.target_path
      and target_node.is_active
    limit 1
    for update of target;

    if previous_version.id is null or source_fields is null then
      continue;
    end if;

    next_config := jsonb_set(previous_version.config, '{fields}', source_fields, true);
    if next_config = previous_version.config then
      continue;
    end if;

    select coalesce(max(version), 0) + 1
    into next_version
    from public.listing_schema_versions
    where category_node_id = previous_version.category_node_id;

    update public.listing_schema_versions
    set status = 'archived', archived_at = now()
    where id = previous_version.id;

    insert into public.listing_schema_versions (
      category_node_id, version, status, config, created_by,
      created_at, published_at, archived_at
    ) values (
      previous_version.category_node_id, next_version, 'published', next_config,
      previous_version.created_by, now(), now(), null
    );
  end loop;
end;
$$;

-- Electric motorcycles and rickshaws must not ask for petrol-engine details.
do $$
declare
  removal record;
  previous_version public.listing_schema_versions%rowtype;
  next_config jsonb;
  next_version integer;
begin
  for removal in
    select *
    from (values
      ('vehicles/motorcycles/electric-bikes', array['fuel_type', 'engine_size', 'engine_cc', 'start_type']::text[]),
      ('vehicles/motorcycles/electric-motorcycles', array['fuel_type', 'engine_size', 'engine_cc', 'start_type']::text[]),
      ('vehicles/rickshaws-three-wheelers/electric-rickshaw', array['fuel_type', 'engine_size', 'engine_cc', 'start_type']::text[]),
      ('mobile-phones-tablets/projectors', array['camera_type']::text[])
    ) as removals(target_path, field_keys)
  loop
    previous_version := null;

    select version_row.*
    into previous_version
    from public.category_nodes node
    join public.listing_schema_versions version_row
      on version_row.category_node_id = node.id
     and version_row.status = 'published'
    where node.path = removal.target_path
      and node.is_active
    limit 1
    for update of version_row;

    if previous_version.id is null then
      continue;
    end if;

    select jsonb_set(
      previous_version.config,
      '{fields}',
      coalesce(
        jsonb_agg(field order by ordinal_position)
          filter (where not ((field->>'key') = any(removal.field_keys))),
        '[]'::jsonb
      ),
      true
    )
    into next_config
    from jsonb_array_elements(coalesce(previous_version.config->'fields', '[]'::jsonb))
      with ordinality as fields(field, ordinal_position);

    if next_config = previous_version.config then
      continue;
    end if;

    select coalesce(max(version), 0) + 1
    into next_version
    from public.listing_schema_versions
    where category_node_id = previous_version.category_node_id;

    update public.listing_schema_versions
    set status = 'archived', archived_at = now()
    where id = previous_version.id;

    insert into public.listing_schema_versions (
      category_node_id, version, status, config, created_by,
      created_at, published_at, archived_at
    ) values (
      previous_version.category_node_id, next_version, 'published', next_config,
      previous_version.created_by, now(), now(), null
    );
  end loop;
end;
$$;

-- A SIM card/number is not a phone accessory. Publish concise carrier and
-- number-type controls while retaining the existing multilingual trade fields.
do $$
declare
  previous_version public.listing_schema_versions%rowtype;
  trade_fields jsonb;
  next_fields jsonb;
  next_config jsonb;
  next_version integer;
begin
  select version_row.*
  into previous_version
  from public.category_nodes node
  join public.listing_schema_versions version_row
    on version_row.category_node_id = node.id
   and version_row.status = 'published'
  where node.path = 'mobile-phones-tablets/sim-cards-numbers'
    and node.is_active
  limit 1
  for update of version_row;

  if previous_version.id is not null then
    select coalesce(jsonb_agg(field order by (field->>'order')::integer), '[]'::jsonb)
    into trade_fields
    from jsonb_array_elements(coalesce(previous_version.config->'fields', '[]'::jsonb)) field
    where field->>'key' in ('seller_type', 'delivery_available', 'exchange_possible');

    next_fields := jsonb_build_array(
      jsonb_build_object(
        'key', 'carrier', 'type', 'select', 'labels', jsonb_build_object('en', 'Mobile network', 'fa', 'شبکه مخابراتی', 'ps', 'مخابراتي شبکه'),
        'options', jsonb_build_array(
          jsonb_build_object('value', 'awcc', 'labels', jsonb_build_object('en', 'AWCC', 'fa', 'افغان بیسیم', 'ps', 'افغان بېسیم')),
          jsonb_build_object('value', 'etisalat', 'labels', jsonb_build_object('en', 'Etisalat', 'fa', 'اتصالات', 'ps', 'اتصالات')),
          jsonb_build_object('value', 'mtn', 'labels', jsonb_build_object('en', 'MTN', 'fa', 'ام‌تی‌ان', 'ps', 'اېم‌ټي‌اېن')),
          jsonb_build_object('value', 'roshan', 'labels', jsonb_build_object('en', 'Roshan', 'fa', 'روشن', 'ps', 'روشن')),
          jsonb_build_object('value', 'salaam', 'labels', jsonb_build_object('en', 'Salaam', 'fa', 'سلام', 'ps', 'سلام')),
          jsonb_build_object('value', 'other', 'labels', jsonb_build_object('en', 'Other', 'fa', 'سایر', 'ps', 'نور'))
        ),
        'unit', null, 'sectionKey', 'device', 'order', 20, 'required', true,
        'posting', true, 'filter', true, 'card', true, 'detail', true, 'active', true
      ),
      jsonb_build_object(
        'key', 'number_type', 'type', 'select', 'labels', jsonb_build_object('en', 'Number type', 'fa', 'نوع شماره', 'ps', 'د شمېرې ډول'),
        'options', jsonb_build_array(
          jsonb_build_object('value', 'regular', 'labels', jsonb_build_object('en', 'Regular number', 'fa', 'شماره عادی', 'ps', 'عادي شمېره')),
          jsonb_build_object('value', 'special', 'labels', jsonb_build_object('en', 'Special number', 'fa', 'شماره خاص', 'ps', 'ځانګړې شمېره'))
        ),
        'unit', null, 'sectionKey', 'device', 'order', 30, 'required', false,
        'posting', true, 'filter', true, 'card', true, 'detail', true, 'active', true
      )
    ) || trade_fields;

    next_config := jsonb_set(previous_version.config, '{fields}', next_fields, true);
    if next_config <> previous_version.config then
      select coalesce(max(version), 0) + 1
      into next_version
      from public.listing_schema_versions
      where category_node_id = previous_version.category_node_id;

      update public.listing_schema_versions
      set status = 'archived', archived_at = now()
      where id = previous_version.id;

      insert into public.listing_schema_versions (
        category_node_id, version, status, config, created_by,
        created_at, published_at, archived_at
      ) values (
        previous_version.category_node_id, next_version, 'published', next_config,
        previous_version.created_by, now(), now(), null
      );
    end if;
  end if;
end;
$$;

-- Abort atomically if any repaired invariant is not true on the live taxonomy.
do $$
begin
  if exists (
    select 1
    from public.category_nodes node
    where node.is_active
      and node.is_leaf is distinct from not exists (
        select 1 from public.category_nodes child
        where child.parent_id = node.id and child.is_active
      )
  ) then
    raise exception 'Active category leaf flags are inconsistent with active children';
  end if;

  if exists (
    select 1
    from public.category_nodes node
    join public.listing_schema_versions version_row
      on version_row.category_node_id = node.id and version_row.status = 'published'
    cross join lateral jsonb_array_elements(coalesce(version_row.config->'fields', '[]'::jsonb)) field
    where node.path = 'mobile-phones-tablets/mobile-phones/apple-iphone'
      and field->>'key' = 'ram_gb'
  ) then
    raise exception 'Apple iPhone schema still exposes RAM';
  end if;

  if exists (
    select 1
    from public.category_nodes node
    join public.listing_schema_versions version_row
      on version_row.category_node_id = node.id and version_row.status = 'published'
    cross join lateral jsonb_array_elements(coalesce(version_row.config->'fields', '[]'::jsonb)) field
    where node.path in (
      'vehicles/bicycles/bicycle-parts',
      'vehicles/motorcycles/motorcycle-parts',
      'vehicles/rickshaws-three-wheelers/rickshaw-parts'
    )
      and field->>'key' in ('mileage', 'fuel_type', 'transmission', 'engine_size', 'engine_cc')
  ) then
    raise exception 'A vehicle-parts leaf still exposes whole-vehicle controls';
  end if;

  if exists (
    select 1
    from public.category_nodes node
    join public.listing_schema_versions version_row
      on version_row.category_node_id = node.id and version_row.status = 'published'
    cross join lateral jsonb_array_elements(coalesce(version_row.config->'fields', '[]'::jsonb)) field
    where node.path in (
      'vehicles/motorcycles/electric-bikes',
      'vehicles/motorcycles/electric-motorcycles',
      'vehicles/rickshaws-three-wheelers/electric-rickshaw'
    )
      and field->>'key' in ('fuel_type', 'engine_size', 'engine_cc', 'start_type')
  ) then
    raise exception 'An electric vehicle leaf still exposes petrol-engine controls';
  end if;

  if exists (
    select 1
    from public.category_nodes node
    join public.listing_schema_versions version_row
      on version_row.category_node_id = node.id and version_row.status = 'published'
    cross join lateral jsonb_array_elements(coalesce(version_row.config->'fields', '[]'::jsonb)) field
    where (node.path = 'mobile-phones-tablets/projectors' and field->>'key' = 'camera_type')
       or (node.path = 'mobile-phones-tablets/sim-cards-numbers' and field->>'key' in ('condition', 'accessory_type', 'compatibility'))
  ) then
    raise exception 'An electronics leaf still exposes an unrelated inherited control';
  end if;
end;
$$;

commit;
