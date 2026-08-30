-- Make reviewed Telegram inventory publishable across the live taxonomy and
-- enforce a narrowly scoped 30-day retention lifecycle. Native user listings
-- are deliberately excluded from every retention function in this migration.

-- listings.subcategory_id is still required by legacy readers. Ensure every
-- active level-two taxonomy branch has a matching legacy subcategory without
-- changing or deleting any existing row.
insert into public.subcategories (category_id, name, slug, display_order, is_active)
select
  node.category_id,
  node.name,
  node.slug,
  coalesce(node.display_order, node.sort_order, 0),
  node.is_active
from public.category_nodes node
where node.level = 2
  and node.is_active
on conflict do nothing;

create or replace function public.publish_reviewed_ingest_candidate(
  p_candidate_id uuid,
  p_actor_id uuid,
  p_listing_id uuid,
  p_images jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_candidate public.listing_ingest_candidates%rowtype;
  v_source public.listing_sources%rowtype;
  v_node public.category_nodes%rowtype;
  v_subcategory_id bigint;
  v_path_subcategory_node_id bigint;
  v_province public.provinces%rowtype;
  v_district public.districts%rowtype;
  v_payload jsonb;
  v_schema_config jsonb;
  v_details jsonb;
  v_title text;
  v_description text;
  v_original_language text;
  v_original_locale text;
  v_contact_phone text;
  v_price_mode text;
  v_price numeric;
  v_vehicle_brand text;
  v_vehicle_model text;
  v_vehicle_year int;
  v_vehicle_type text;
  v_vehicle_subtype text;
  v_image jsonb;
  v_image_count int;
  v_observation_id uuid;
  v_detail record;
  v_field jsonb;
  v_field_type text;
  v_field_label text;
  v_field_unit text;
  v_damage_parts jsonb;
  v_damage_part jsonb;
  v_damage_report_id bigint;
begin
  if p_candidate_id is null or p_actor_id is null or p_listing_id is null then
    raise exception 'Missing publication identity';
  end if;

  if not public.is_super_administrator(p_actor_id)
     or not public.has_admin_permission(p_actor_id, 'listings.moderate') then
    raise exception 'Not authorized to publish ingest candidates';
  end if;

  select * into v_candidate
  from public.listing_ingest_candidates
  where id = p_candidate_id
  for update;

  if not found then raise exception 'Candidate not found'; end if;
  if v_candidate.candidate_listing_id is not null then return v_candidate.candidate_listing_id; end if;
  if v_candidate.status <> 'publishable' then raise exception 'Candidate is not ready for publication'; end if;
  if v_candidate.source_id is null or nullif(btrim(v_candidate.source_item_id), '') is null then
    raise exception 'Candidate provenance identity is incomplete';
  end if;

  select * into v_source from public.listing_sources where id = v_candidate.source_id;
  if not found or v_source.status <> 'active' or v_source.kill_switch_enabled then
    raise exception 'Candidate source is not active';
  end if;

  if exists (
    select 1 from public.external_import_opt_outs opt_out
    where (v_candidate.contact_hash is not null and opt_out.contact_hash = v_candidate.contact_hash)
       or (v_candidate.normalized_phone is not null and opt_out.normalized_phone = v_candidate.normalized_phone)
  ) then
    raise exception 'Candidate contact has opted out of external publication';
  end if;

  if exists (
    select 1 from public.listing_source_observations observation
    where observation.source_id is not distinct from v_candidate.source_id
      and observation.source_item_id is not distinct from v_candidate.source_item_id
  ) then
    raise exception 'Candidate source item is already linked to a listing';
  end if;

  select * into v_node
  from public.category_nodes
  where id = v_candidate.category_node_id and is_active and is_leaf;
  if not found then raise exception 'Candidate category must be an active leaf'; end if;
  if not exists (
    select 1
    from public.categories category
    where category.id = v_node.category_id
      and category.is_active
      and not category.is_coming_soon
  ) then
    raise exception 'Candidate category is not open for marketplace publication';
  end if;

  select config into v_schema_config
  from public.listing_schema_versions
  where category_node_id = v_node.id and status = 'published';
  if v_schema_config is null then raise exception 'Candidate category has no published schema'; end if;

  select id into v_subcategory_id
  from public.subcategories
  where category_id = v_node.category_id
    and slug = split_part(v_node.path, '/', 2)
    and is_active
  limit 1;
  if v_subcategory_id is null then raise exception 'Legacy subcategory mapping is missing'; end if;
  select id into v_path_subcategory_node_id
  from public.category_nodes
  where category_id = v_node.category_id
    and path = case
      when v_node.level >= 2 then concat(split_part(v_node.path, '/', 1), '/', split_part(v_node.path, '/', 2))
      else v_node.path
    end
    and is_active
  limit 1;
  if v_path_subcategory_node_id is null then
    raise exception 'Category path mapping is missing';
  end if;

  v_payload := coalesce(v_candidate.normalized_payload, '{}'::jsonb);
  v_details := coalesce(v_payload->'details', '{}'::jsonb);
  if jsonb_typeof(v_details) <> 'object' then raise exception 'Candidate details are invalid'; end if;

  v_original_language := lower(coalesce(nullif(v_payload->>'original_language', ''), 'fa'));
  if v_original_language not in ('en', 'fa', 'ps') then raise exception 'Candidate original language is invalid'; end if;
  v_original_locale := case v_original_language when 'fa' then 'fa-AF' when 'ps' then 'ps-AF' else 'en' end;
  v_title := btrim(v_payload#>>array['translations', v_original_language, 'title']);
  v_description := btrim(v_payload#>>array['translations', v_original_language, 'description']);
  v_contact_phone := btrim(v_candidate.normalized_phone);
  v_price_mode := lower(coalesce(v_payload->>'price_mode', 'contact'));
  v_price := coalesce(v_candidate.normalized_price_afn, 0);

  if char_length(v_title) < 5 or char_length(v_title) > 120 then raise exception 'Candidate title is invalid'; end if;
  if char_length(v_description) < 20 or char_length(v_description) > 5000 then raise exception 'Candidate description is invalid'; end if;
  if concat_ws(' ',
      v_payload#>>'{translations,en,title}', v_payload#>>'{translations,en,description}',
      v_payload#>>'{translations,fa,title}', v_payload#>>'{translations,fa,description}',
      v_payload#>>'{translations,ps,title}', v_payload#>>'{translations,ps,description}'
    ) ~ '(?:\+?93|0)?7[0-9]{8}' then
    raise exception 'Public listing text must not contain a phone number';
  end if;
  if coalesce(v_contact_phone, '') !~ '^\+93[0-9]{9}$' then raise exception 'Candidate contact phone is invalid'; end if;
  if v_price_mode not in ('contact', 'fixed', 'negotiable') then raise exception 'Candidate price mode is invalid'; end if;
  if (v_price_mode = 'contact' and v_price <> 0) or (v_price_mode <> 'contact' and v_price <= 0) then
    raise exception 'Candidate price does not match its price mode';
  end if;

  if coalesce(v_payload->>'province_id', '') !~ '^[0-9]+$'
     or coalesce(v_payload->>'district_id', '') !~ '^[0-9]+$' then
    raise exception 'Candidate location is incomplete';
  end if;
  select * into v_province from public.provinces where id = (v_payload->>'province_id')::bigint and is_active;
  if not found then raise exception 'Candidate province is invalid'; end if;
  select * into v_district from public.districts
  where id = (v_payload->>'district_id')::bigint and province_id = v_province.id and is_active;
  if not found then raise exception 'Candidate district is invalid'; end if;

  if coalesce(v_payload#>>'{translations,en,title}', '') = ''
     or coalesce(v_payload#>>'{translations,en,description}', '') = ''
     or coalesce(v_payload#>>'{translations,fa,title}', '') = ''
     or coalesce(v_payload#>>'{translations,fa,description}', '') = ''
     or coalesce(v_payload#>>'{translations,ps,title}', '') = ''
     or coalesce(v_payload#>>'{translations,ps,description}', '') = '' then
    raise exception 'Reviewed translations are incomplete';
  end if;
  if exists (
    select 1
    from (values
      (v_payload#>>'{translations,en,title}', v_payload#>>'{translations,en,description}'),
      (v_payload#>>'{translations,fa,title}', v_payload#>>'{translations,fa,description}'),
      (v_payload#>>'{translations,ps,title}', v_payload#>>'{translations,ps,description}')
    ) translation(title, description)
    where char_length(btrim(translation.title)) not between 5 and 120
       or char_length(btrim(translation.description)) not between 20 and 5000
  ) then
    raise exception 'Reviewed translations have invalid lengths';
  end if;
  if coalesce(v_payload->>'source_url', v_payload->>'sourceUrl', '') <> ''
     and coalesce(v_payload->>'source_url', v_payload->>'sourceUrl') !~* '^https?://' then
    raise exception 'Candidate source URL is invalid';
  end if;

  -- Database-side validation mirrors the reviewer form and prevents a service
  -- client from publishing values outside the live schema.
  if exists (
    select 1
    from jsonb_array_elements(v_schema_config->'fields') field
    where coalesce((field->>'active')::boolean, true)
      and coalesce((field->>'posting')::boolean, true)
      and coalesce((field->>'required')::boolean, false)
      and (
        not (v_details ? (field->>'key'))
        or v_details->(field->>'key') = 'null'::jsonb
        or (jsonb_typeof(v_details->(field->>'key')) = 'string' and btrim(v_details->>(field->>'key')) = '')
      )
  ) then
    raise exception 'Required category details are incomplete';
  end if;

  for v_detail in select key, value from jsonb_each(v_details)
  loop
    select field into v_field
    from jsonb_array_elements(v_schema_config->'fields') field
    where field->>'key' = v_detail.key
      and coalesce((field->>'active')::boolean, true)
      and coalesce((field->>'posting')::boolean, true)
    limit 1;
    if v_field is null then raise exception 'Candidate contains an unsupported category detail'; end if;
    v_field_type := v_field->>'type';
    if v_field_type = 'number' and jsonb_typeof(v_detail.value) <> 'number' then
      raise exception 'A numeric candidate detail is invalid';
    elsif v_field_type = 'boolean' and jsonb_typeof(v_detail.value) <> 'boolean' then
      raise exception 'A boolean candidate detail is invalid';
    elsif v_field_type in ('text', 'select', 'date') and jsonb_typeof(v_detail.value) <> 'string' then
      raise exception 'A text candidate detail is invalid';
    end if;
    if jsonb_typeof(v_detail.value) = 'string'
       and char_length(v_detail.value#>>'{}') > 500 then
      raise exception 'A candidate detail is too long';
    end if;
    if v_field_type = 'date' and (v_detail.value#>>'{}') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
      raise exception 'A candidate date detail is invalid';
    end if;
    if v_field_type = 'select' and not exists (
      select 1 from jsonb_array_elements(coalesce(v_field->'options', '[]'::jsonb)) option
      where option->>'value' = v_detail.value#>>'{}'
    ) then
      raise exception 'A candidate select option is invalid';
    end if;
  end loop;

  if jsonb_typeof(p_images) <> 'array' or jsonb_array_length(p_images) < 1 or jsonb_array_length(p_images) > 15 then
    raise exception 'Candidate images are missing or invalid';
  end if;
  v_image_count := jsonb_array_length(p_images);
  if v_image_count <> (select count(*) from public.listing_ingest_candidate_media where candidate_id = p_candidate_id) then
    raise exception 'Every retained candidate image must be published together';
  end if;
  for v_image in select value from jsonb_array_elements(p_images)
  loop
    if coalesce(v_image->>'storage_path', '') not like p_listing_id::text || '/%'
       or coalesce(v_image->>'public_url', '') not like 'https://%/storage/v1/object/public/listing-images/%'
       or coalesce(v_image->>'sort_order', '') !~ '^[0-9]+$'
       or not exists (select 1 from storage.objects where bucket_id = 'listing-images' and name = v_image->>'storage_path') then
      raise exception 'A published image is invalid or missing';
    end if;
  end loop;
  if (select count(distinct image.value->>'storage_path') from jsonb_array_elements(p_images) image(value)) <> v_image_count
     or (select count(distinct image.value->>'sort_order') from jsonb_array_elements(p_images) image(value)) <> v_image_count
     or (select min((image.value->>'sort_order')::int) from jsonb_array_elements(p_images) image(value)) <> 0
     or (select max((image.value->>'sort_order')::int) from jsonb_array_elements(p_images) image(value)) <> v_image_count - 1 then
    raise exception 'Candidate image order must be unique and contiguous';
  end if;

  v_vehicle_brand := nullif(btrim(coalesce(v_details->>'make', v_details->>'brand', v_details->>'vehicle_brand', v_payload#>>'{vehicle,brand}')), '');
  v_vehicle_model := nullif(btrim(coalesce(v_details->>'model', v_details->>'vehicle_model', v_payload#>>'{vehicle,model}')), '');
  if coalesce(v_details->>'year', v_details->>'vehicle_year', v_payload#>>'{vehicle,year}', '') ~ '^[0-9]{4}$' then
    v_vehicle_year := coalesce(v_details->>'year', v_details->>'vehicle_year', v_payload#>>'{vehicle,year}')::int;
  end if;
  v_vehicle_type := case when v_node.path like 'vehicles/%' then split_part(v_node.path, '/', 2) else null end;
  v_vehicle_subtype := case when v_node.path like 'vehicles/%/%' then split_part(v_node.path, '/', 3) else null end;
  if split_part(v_node.path, '/', 1) = 'vehicles'
     and split_part(v_node.path, '/', 2) not in ('', 'parts', 'bicycles') then
    v_damage_parts := v_payload#>'{vehicle_damage,parts}';
    if jsonb_typeof(v_damage_parts) <> 'array'
       or jsonb_array_length(v_damage_parts) <> 13
       or (select count(distinct part->>'key') from jsonb_array_elements(v_damage_parts) part) <> 13
       or exists (
         select 1 from jsonb_array_elements(v_damage_parts) part
         where coalesce(part->>'key', '') not in (
           'hood', 'roof', 'trunk', 'front_bumper', 'rear_bumper',
           'front_left_fender', 'front_right_fender', 'rear_left_fender', 'rear_right_fender',
           'front_left_door', 'front_right_door', 'rear_left_door', 'rear_right_door'
         )
         or coalesce(part->>'condition', '') not in ('original', 'local_painted', 'painted', 'repaired', 'changed', 'damaged')
       ) then
      raise exception 'Vehicle body-condition report is invalid';
    end if;
  end if;

  insert into public.listings (
    id, user_id, category_id, subcategory_id, category_node_id,
    title, description, original_title, original_description, original_language, original_locale,
    price, currency, province, district, province_id, district_id,
    contact_phone, contact_name, whatsapp_enabled, negotiable,
    status, publication_status, published_at, approved_by, approved_at,
    vehicle_type, vehicle_subtype, vehicle_brand, vehicle_model, vehicle_year,
    location_visibility, is_location_confirmed,
    source_type, ownership_status, freshness_status, provenance_status,
    source_platform, source_item_id, source_url, source_first_seen_at, source_last_seen_at,
    permission_basis, permission_record_id, provenance_confidence,
    allow_contact_display, noindex_external, source_payload_hash,
    featured, urgent, expires_at
  ) values (
    p_listing_id, null, v_node.category_id, v_subcategory_id, v_node.id,
    v_title, v_description, v_title, v_description, v_original_language, v_original_locale,
    v_price, 'AFN', v_province.name, v_district.name, v_province.id, v_district.id,
    v_contact_phone, null, false, v_price_mode = 'negotiable',
    'approved', 'published', now(), p_actor_id, now(),
    v_vehicle_type, v_vehicle_subtype, v_vehicle_brand, v_vehicle_model, v_vehicle_year,
    'province_district', true,
    'external_indexed', 'unclaimed', 'fresh', 'permission_pending',
    coalesce(v_source.platform, 'telegram'), v_candidate.source_item_id,
    nullif(coalesce(v_payload->>'source_url', v_payload->>'sourceUrl'), ''),
    v_candidate.created_at, now(),
    'administrator_authorized_forward', p_candidate_id::text, 0.75,
    true, true, encode(extensions.digest(v_candidate.raw_payload::text, 'sha256'), 'hex'),
    false, false, now() + interval '30 days'
  );

  insert into public.listing_images (listing_id, storage_path, public_url, is_primary, sort_order)
  select p_listing_id, value->>'storage_path', value->>'public_url', ordinality = 1, (value->>'sort_order')::int
  from jsonb_array_elements(p_images) with ordinality as image(value, ordinality);

  insert into public.listing_category_path (
    listing_id, main_category_id, subcategory_id, child_category_id
  ) values (
    p_listing_id, v_node.category_id, v_path_subcategory_node_id, v_node.id
  );

  if v_damage_parts is not null then
    insert into public.vehicle_damage_reports (listing_id, all_original, notes)
    values (
      p_listing_id,
      not exists (
        select 1 from jsonb_array_elements(v_damage_parts) part
        where part->>'condition' <> 'original'
      ),
      nullif(btrim(v_payload#>>'{vehicle,body_condition_note}'), '')
    )
    returning id into v_damage_report_id;

    for v_damage_part in select value from jsonb_array_elements(v_damage_parts)
    loop
      insert into public.vehicle_damage_parts (
        damage_report_id, part_key, part_label, condition
      ) values (
        v_damage_report_id,
        v_damage_part->>'key',
        case v_damage_part->>'key'
          when 'hood' then 'Hood' when 'roof' then 'Roof' when 'trunk' then 'Trunk'
          when 'front_bumper' then 'Front bumper' when 'rear_bumper' then 'Rear bumper'
          when 'front_left_fender' then 'Front-left fender'
          when 'front_right_fender' then 'Front-right fender'
          when 'rear_left_fender' then 'Rear-left fender'
          when 'rear_right_fender' then 'Rear-right fender'
          when 'front_left_door' then 'Front-left door'
          when 'front_right_door' then 'Front-right door'
          when 'rear_left_door' then 'Rear-left door'
          when 'rear_right_door' then 'Rear-right door'
        end,
        v_damage_part->>'condition'
      );
    end loop;
  end if;

  insert into public.listing_attributes (
    listing_id, attribute_key, attribute_value_text, attribute_value_number,
    attribute_value_boolean, attribute_value_json, unit, field_label, is_locked
  ) values (
    p_listing_id, 'price_mode', v_price_mode, null, null, null, null, 'Price mode', true
  );

  for v_detail in select key, value from jsonb_each(v_details)
  loop
    select field into v_field
    from jsonb_array_elements(v_schema_config->'fields') field
    where field->>'key' = v_detail.key limit 1;
    v_field_type := v_field->>'type';
    v_field_label := coalesce(v_field#>>'{labels,en}', replace(v_detail.key, '_', ' '));
    v_field_unit := nullif(v_field->>'unit', '');
    insert into public.listing_attributes (
      listing_id, attribute_key, attribute_value_text, attribute_value_number,
      attribute_value_boolean, attribute_value_json, unit, field_label, is_locked
    ) values (
      p_listing_id,
      v_detail.key,
      case when v_field_type in ('text', 'select', 'date') then v_detail.value#>>'{}' end,
      case when v_field_type = 'number' then (v_detail.value#>>'{}')::numeric end,
      case when v_field_type = 'boolean' then (v_detail.value#>>'{}')::boolean end,
      case when v_field_type not in ('text', 'select', 'date', 'number', 'boolean') then v_detail.value end,
      v_field_unit,
      v_field_label,
      false
    )
    on conflict (listing_id, attribute_key) do update set
      attribute_value_text = excluded.attribute_value_text,
      attribute_value_number = excluded.attribute_value_number,
      attribute_value_boolean = excluded.attribute_value_boolean,
      attribute_value_json = excluded.attribute_value_json,
      unit = excluded.unit,
      field_label = excluded.field_label,
      updated_at = now();
  end loop;

  insert into public.listing_translations (
    listing_id, language_code, title, description,
    translation_status, translated_by, translation_quality, is_stale
  )
  select
    p_listing_id,
    translation.language_code,
    v_payload#>>array['translations', translation.payload_key, 'title'],
    v_payload#>>array['translations', translation.payload_key, 'description'],
    'completed', 'human', 'admin_reviewed', false
  from (values ('en', 'en'), ('fa-AF', 'fa'), ('ps-AF', 'ps')) translation(language_code, payload_key);

  insert into public.listing_source_observations (
    listing_id, source_id, source_type, source_platform, source_item_id,
    source_url, import_job_id, first_seen_at, last_seen_at, permission_basis,
    permission_record_id, ingest_actor, ingest_version, normalized_payload, provenance_confidence
  ) values (
    p_listing_id, v_candidate.source_id, 'external_indexed', coalesce(v_source.platform, 'telegram'),
    v_candidate.source_item_id, nullif(coalesce(v_payload->>'source_url', v_payload->>'sourceUrl'), ''),
    v_candidate.job_id, v_candidate.created_at, now(), 'administrator_authorized_forward',
    p_candidate_id::text, p_actor_id, 'reviewed-candidate-v2',
    jsonb_build_object('category_path', v_node.path, 'price_mode', v_price_mode,
      'review_notes', coalesce(v_payload->'review_notes', '{}'::jsonb)),
    0.75
  ) returning id into v_observation_id;

  insert into public.listing_provenance_events (
    listing_id, source_observation_id, event_type, actor_user_id,
    source_type, after_state, reason, job_id
  ) values (
    p_listing_id, v_observation_id, 'candidate_published', p_actor_id,
    'external_indexed',
    jsonb_build_object('candidate_id', p_candidate_id, 'category_node_id', v_node.id,
      'photo_count', jsonb_array_length(p_images), 'publication_status', 'published',
      'price_mode', v_price_mode, 'retention_days', 30),
    'Reviewed and published by an authorized super administrator', v_candidate.job_id
  );

  update public.listing_ingest_candidates
  set status = 'published', candidate_listing_id = p_listing_id,
      validation_errors = '[]'::jsonb, updated_at = now()
  where id = p_candidate_id;

  update public.listing_ingest_jobs
  set status = 'completed', dry_run = false, accepted_rows = greatest(accepted_rows, 1),
      approved_by = p_actor_id, approved_at = now(), completed_at = now(), updated_at = now()
  where id = v_candidate.job_id;

  return p_listing_id;
end;
$$;

revoke all on function public.publish_reviewed_ingest_candidate(uuid, uuid, uuid, jsonb)
  from public, anon, authenticated;
grant execute on function public.publish_reviewed_ingest_candidate(uuid, uuid, uuid, jsonb) to service_role;

comment on function public.publish_reviewed_ingest_candidate(uuid, uuid, uuid, jsonb) is
  'Service-only atomic publication for a schema-validated, super-admin-reviewed external candidate.';

create or replace function public.save_reviewed_ingest_candidate(
  p_candidate_id uuid,
  p_actor_id uuid,
  p_category_node_id bigint,
  p_normalized_payload jsonb,
  p_normalized_phone text,
  p_contact_hash text,
  p_normalized_location text,
  p_normalized_price_afn numeric,
  p_validation_errors jsonb,
  p_mark_publishable boolean
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_candidate public.listing_ingest_candidates%rowtype;
  v_source public.listing_sources%rowtype;
  v_node public.category_nodes%rowtype;
  v_next_status public.listing_ingest_candidate_status;
begin
  if not public.is_super_administrator(p_actor_id)
     or not public.has_admin_permission(p_actor_id, 'listings.moderate') then
    raise exception 'Not authorized to review ingest candidates';
  end if;
  if jsonb_typeof(p_normalized_payload) <> 'object'
     or pg_column_size(p_normalized_payload) > 65536
     or jsonb_typeof(p_validation_errors) <> 'array'
     or pg_column_size(p_validation_errors) > 8192 then
    raise exception 'Candidate review payload is invalid';
  end if;

  select * into v_candidate
  from public.listing_ingest_candidates
  where id = p_candidate_id
  for update;
  if not found then raise exception 'Candidate not found'; end if;
  if v_candidate.candidate_listing_id is not null or v_candidate.status = 'published' then
    raise exception 'Published candidates cannot be edited';
  end if;

  select * into v_source from public.listing_sources where id = v_candidate.source_id;
  if not found or v_source.status <> 'active' or v_source.kill_switch_enabled then
    raise exception 'Candidate source is not active';
  end if;
  select * into v_node from public.category_nodes
  where id = p_category_node_id and is_active and is_leaf;
  if not found then raise exception 'Candidate category must be an active leaf'; end if;
  if not exists (
    select 1
    from public.categories category
    where category.id = v_node.category_id
      and category.is_active
      and not category.is_coming_soon
  ) then
    raise exception 'Candidate category is not open for marketplace publication';
  end if;

  if p_mark_publishable and jsonb_array_length(p_validation_errors) <> 0 then
    raise exception 'A candidate with validation errors cannot be marked publishable';
  end if;
  if p_mark_publishable and not exists (
    select 1 from public.listing_ingest_candidate_media media
    where media.candidate_id = p_candidate_id
  ) then
    raise exception 'A publishable candidate requires at least one image';
  end if;

  v_next_status := case when p_mark_publishable then 'publishable' else 'needs_review' end;
  update public.listing_ingest_candidates
  set category_node_id = p_category_node_id,
      normalized_payload = p_normalized_payload,
      normalized_phone = p_normalized_phone,
      contact_hash = p_contact_hash,
      normalized_title = p_normalized_payload->>'title',
      normalized_location = p_normalized_location,
      normalized_price_afn = p_normalized_price_afn,
      validation_errors = p_validation_errors,
      status = v_next_status,
      updated_at = now()
  where id = p_candidate_id;

  insert into public.listing_provenance_events (
    listing_id, event_type, actor_user_id, source_type, after_state, reason, job_id
  ) values (
    null,
    case when p_mark_publishable then 'candidate_marked_publishable' else 'candidate_review_saved' end,
    p_actor_id, v_source.source_type,
    jsonb_build_object(
      'candidate_id', p_candidate_id,
      'category_node_id', p_category_node_id,
      'validation_error_count', jsonb_array_length(p_validation_errors),
      'status', v_next_status
    ),
    'External candidate reviewed by an authorized super administrator',
    v_candidate.job_id
  );

  return v_next_status::text;
end;
$$;

revoke all on function public.save_reviewed_ingest_candidate(
  uuid, uuid, bigint, jsonb, text, text, text, numeric, jsonb, boolean
) from public, anon, authenticated;
grant execute on function public.save_reviewed_ingest_candidate(
  uuid, uuid, bigint, jsonb, text, text, text, numeric, jsonb, boolean
) to service_role;

comment on function public.save_reviewed_ingest_candidate(
  uuid, uuid, bigint, jsonb, text, text, text, numeric, jsonb, boolean
) is 'Service-only atomic candidate review with immutable provenance evidence.';

create table if not exists private.external_inventory_retention_tombstones (
  object_type text not null check (object_type in ('published_listing', 'unpublished_candidate')),
  object_id uuid not null,
  source_platform text not null,
  source_item_hash text,
  job_id uuid,
  disposition text not null check (disposition in ('deleted', 'scrubbed')),
  expired_at timestamptz not null,
  purged_at timestamptz not null default now(),
  primary key (object_type, object_id)
);

revoke all on table private.external_inventory_retention_tombstones from public, anon, authenticated;

create index if not exists idx_listings_forwarded_retention_due
  on public.listings(expires_at, id)
  where source_type = 'external_indexed'
    and source_platform = 'telegram'
    and ownership_status = 'unclaimed'
    and provenance_status = 'permission_pending';

create or replace function public.expire_due_forwarded_external_ads(p_limit integer default 100)
returns table(listing_id uuid, candidate_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_limit < 1 or p_limit > 500 then raise exception 'Invalid retention batch size'; end if;

  return query
  with targets as (
    select listing.id
    from public.listings listing
    where listing.source_type = 'external_indexed'
      and listing.source_platform = 'telegram'
      and listing.ownership_status = 'unclaimed'
      and listing.provenance_status = 'permission_pending'
      and listing.expires_at <= now()
      and listing.status in ('approved', 'expired')
    order by listing.expires_at, listing.id
    limit p_limit
    for update skip locked
  ), expired as (
    update public.listings listing
    set status = 'expired', publication_status = 'archived', freshness_status = 'expired',
        allow_contact_display = false, noindex_external = true,
        removed_public_at = coalesce(listing.removed_public_at, now()), updated_at = now()
    from targets
    where listing.id = targets.id and listing.status = 'approved'
    returning listing.id
  ), logged as (
    insert into public.listing_provenance_events (
      listing_id, event_type, source_type, before_state, after_state, reason
    )
    select expired.id, 'external_retention_expired', 'external_indexed',
      jsonb_build_object('publication_status', 'published'),
      jsonb_build_object('publication_status', 'archived', 'retention_days', 30),
      'Forwarded external advertisement reached its 30-day retention limit'
    from expired
    returning listing_id
  )
  select targets.id, candidate.id
  from targets
  left join public.listing_ingest_candidates candidate on candidate.candidate_listing_id = targets.id;
end;
$$;

revoke all on function public.expire_due_forwarded_external_ads(integer) from public, anon, authenticated;
grant execute on function public.expire_due_forwarded_external_ads(integer) to service_role;

create or replace function public.get_stale_forwarded_candidate_ids(p_limit integer default 100)
returns table(candidate_id uuid)
language plpgsql
security definer
stable
set search_path = ''
as $$
begin
  if p_limit < 1 or p_limit > 500 then raise exception 'Invalid retention batch size'; end if;
  return query
  select candidate.id
  from public.listing_ingest_candidates candidate
  join public.listing_sources source on source.id = candidate.source_id
  where source.source_type = 'external_indexed'
    and source.platform = 'telegram'
    and candidate.candidate_listing_id is null
    and candidate.status <> 'published'
    and candidate.created_at <= now() - interval '30 days'
  order by candidate.created_at, candidate.id
  limit p_limit;
end;
$$;

revoke all on function public.get_stale_forwarded_candidate_ids(integer) from public, anon, authenticated;
grant execute on function public.get_stale_forwarded_candidate_ids(integer) to service_role;

create or replace function public.purge_stale_forwarded_candidate(p_candidate_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_candidate public.listing_ingest_candidates%rowtype;
  v_source public.listing_sources%rowtype;
begin
  select * into v_candidate from public.listing_ingest_candidates where id = p_candidate_id for update;
  if not found then return false; end if;
  select * into v_source from public.listing_sources where id = v_candidate.source_id;
  if not found or v_source.source_type <> 'external_indexed' or v_source.platform <> 'telegram'
     or v_candidate.candidate_listing_id is not null or v_candidate.status = 'published'
     or v_candidate.created_at > now() - interval '30 days' then
    raise exception 'Candidate is outside the forwarded-ad retention boundary';
  end if;

  insert into private.external_inventory_retention_tombstones (
    object_type, object_id, source_platform, source_item_hash, job_id,
    disposition, expired_at
  ) values (
    'unpublished_candidate', v_candidate.id, 'telegram',
    encode(extensions.digest(coalesce(v_candidate.source_item_id, ''), 'sha256'), 'hex'),
    v_candidate.job_id, 'deleted', v_candidate.created_at + interval '30 days'
  ) on conflict (object_type, object_id) do nothing;

  delete from public.listing_ingest_candidates where id = v_candidate.id;
  return true;
end;
$$;

revoke all on function public.purge_stale_forwarded_candidate(uuid) from public, anon, authenticated;
grant execute on function public.purge_stale_forwarded_candidate(uuid) to service_role;

create or replace function public.purge_expired_forwarded_external_ad(p_listing_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_listing public.listings%rowtype;
  v_candidate public.listing_ingest_candidates%rowtype;
  v_has_user_history boolean;
  v_disposition text;
begin
  select * into v_listing from public.listings where id = p_listing_id for update;
  if not found then return 'missing'; end if;
  if v_listing.source_type <> 'external_indexed' or v_listing.source_platform <> 'telegram'
     or v_listing.ownership_status <> 'unclaimed' or v_listing.provenance_status <> 'permission_pending'
     or v_listing.expires_at > now() or v_listing.status <> 'expired'
     or v_listing.publication_status <> 'archived' then
    raise exception 'Listing is outside the forwarded-ad retention boundary';
  end if;

  select * into v_candidate
  from public.listing_ingest_candidates
  where candidate_listing_id = v_listing.id
  order by created_at limit 1
  for update;

  v_has_user_history :=
    exists(select 1 from public.messages where listing_id = v_listing.id)
    or exists(select 1 from public.offers where listing_id = v_listing.id)
    or exists(select 1 from public.favorites where listing_id = v_listing.id)
    or exists(select 1 from public.reports where listing_id = v_listing.id)
    or exists(select 1 from public.listing_claims where listing_id = v_listing.id)
    or exists(select 1 from public.listing_contact_events where listing_id = v_listing.id)
    or exists(select 1 from public.listing_promotions where listing_id = v_listing.id)
    or exists(select 1 from public.promotion_payment_requests where listing_id = v_listing.id);
  v_disposition := case when v_has_user_history then 'scrubbed' else 'deleted' end;

  insert into private.external_inventory_retention_tombstones (
    object_type, object_id, source_platform, source_item_hash, job_id,
    disposition, expired_at
  ) values (
    'published_listing', v_listing.id, 'telegram',
    encode(extensions.digest(coalesce(v_listing.source_item_id, ''), 'sha256'), 'hex'),
    v_candidate.job_id, v_disposition, v_listing.expires_at
  ) on conflict (object_type, object_id) do nothing;

  insert into public.listing_provenance_events (
    listing_id, event_type, source_type, after_state, reason, job_id
  ) values (
    v_listing.id, 'external_retention_purged', 'external_indexed',
    jsonb_build_object('retention_days', 30, 'disposition', v_disposition),
    'Expired forwarded advertisement payload and media were purged', v_candidate.job_id
  );

  if v_candidate.id is not null then
    delete from public.listing_ingest_candidates where id = v_candidate.id;
  end if;

  if not v_has_user_history then
    delete from public.listings where id = v_listing.id;
  else
    -- Keep only the invisible listing shell required by user conversations,
    -- offers, favorites, reports, contact audits, claims, or payment history.
    -- All transferable advertisement content and source payload is removed.
    delete from public.ai_moderation_reviews where listing_id = v_listing.id;
    delete from public.electronics_listings where listing_id = v_listing.id;
    delete from public.listing_category_path where listing_id = v_listing.id;
    delete from public.listing_images where listing_id = v_listing.id;
    delete from public.listing_attributes where listing_id = v_listing.id;
    delete from public.listing_translations where listing_id = v_listing.id;
    delete from public.listing_vehicle_features where listing_id = v_listing.id;
    delete from public.vehicle_damage_reports where listing_id = v_listing.id;
    delete from public.listing_notes where listing_id = v_listing.id;
    delete from public.listing_price_history where listing_id = v_listing.id;
    delete from public.listing_quality_signals where listing_id = v_listing.id;
    delete from public.listing_risk_signals where listing_id = v_listing.id;
    delete from public.listing_share_outputs where listing_id = v_listing.id;
    delete from public.listing_source_observations where listing_id = v_listing.id;
    delete from public.listing_translation_jobs where listing_id = v_listing.id;
    update public.listings
    set title = 'Expired external listing',
        description = 'This forwarded advertisement expired after the 30-day retention period.',
        original_title = 'Expired external listing',
        original_description = 'This forwarded advertisement expired after the 30-day retention period.',
        contact_phone = '', contact_name = null, whatsapp_enabled = false,
        province = null, district = null, neighborhood = null,
        address_optional = null, address_text = null,
        latitude = null, longitude = null, location_accuracy = null,
        source_item_id = null, source_url = null, source_payload_hash = null,
        vehicle_brand = null, vehicle_model = null, vehicle_year = null,
        ownership_status = 'removed', provenance_status = 'blocked',
        removed_public_at = coalesce(removed_public_at, now()), updated_at = now()
    where id = v_listing.id;
  end if;

  return v_disposition;
end;
$$;

revoke all on function public.purge_expired_forwarded_external_ad(uuid) from public, anon, authenticated;
grant execute on function public.purge_expired_forwarded_external_ad(uuid) to service_role;

comment on function public.expire_due_forwarded_external_ads(integer) is
  'Service-only first phase: removes only due, unclaimed Telegram external ads from public discovery.';
comment on function public.purge_expired_forwarded_external_ad(uuid) is
  'Service-only second phase: purges due Telegram external ad data while preserving user interaction history.';
