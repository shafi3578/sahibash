-- Publish a fully reviewed external ingest candidate atomically. Media objects
-- are copied by the server before this function and verified here before use.

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
  v_province public.provinces%rowtype;
  v_district public.districts%rowtype;
  v_payload jsonb;
  v_title text;
  v_description text;
  v_contact_phone text;
  v_price_mode text;
  v_price numeric;
  v_vehicle_brand text;
  v_vehicle_model text;
  v_vehicle_year int;
  v_image jsonb;
  v_image_count int;
  v_observation_id uuid;
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

  if not found then
    raise exception 'Candidate not found';
  end if;
  if v_candidate.candidate_listing_id is not null then
    return v_candidate.candidate_listing_id;
  end if;
  if v_candidate.status <> 'publishable' then
    raise exception 'Candidate is not ready for publication';
  end if;
  if v_candidate.source_id is null or nullif(btrim(v_candidate.source_item_id), '') is null then
    raise exception 'Candidate provenance identity is incomplete';
  end if;

  select * into v_source from public.listing_sources where id = v_candidate.source_id;
  if not found or v_source.status <> 'active' or v_source.kill_switch_enabled then
    raise exception 'Candidate source is not active';
  end if;

  if exists (
    select 1
    from public.external_import_opt_outs opt_out
    where (v_candidate.contact_hash is not null and opt_out.contact_hash = v_candidate.contact_hash)
       or (v_candidate.normalized_phone is not null and opt_out.normalized_phone = v_candidate.normalized_phone)
  ) then
    raise exception 'Candidate contact has opted out of external publication';
  end if;

  if exists (
    select 1
    from public.listing_source_observations observation
    where observation.source_id is not distinct from v_candidate.source_id
      and observation.source_item_id is not distinct from v_candidate.source_item_id
  ) then
    raise exception 'Candidate source item is already linked to a listing';
  end if;

  v_payload := coalesce(v_candidate.normalized_payload, '{}'::jsonb);
  v_title := btrim(v_payload->>'title');
  v_description := btrim(v_payload->>'description');
  v_contact_phone := btrim(v_candidate.normalized_phone);
  v_price_mode := lower(coalesce(v_payload->>'price_mode', 'contact'));
  v_price := coalesce(v_candidate.normalized_price_afn, 0);
  v_vehicle_brand := nullif(btrim(v_payload#>>'{vehicle,brand}'), '');
  v_vehicle_model := nullif(btrim(v_payload#>>'{vehicle,model}'), '');

  if coalesce(v_payload#>>'{vehicle,year}', '') !~ '^[0-9]{4}$' then
    raise exception 'Vehicle year is missing or invalid';
  end if;
  v_vehicle_year := (v_payload#>>'{vehicle,year}')::int;

  if char_length(v_title) < 5 or char_length(v_title) > 120 then
    raise exception 'Candidate title is invalid';
  end if;
  if char_length(v_description) < 20 or char_length(v_description) > 5000 then
    raise exception 'Candidate description is invalid';
  end if;
  if concat_ws(' ',
      v_title,
      v_description,
      v_payload#>>'{translations,en,title}',
      v_payload#>>'{translations,en,description}',
      v_payload#>>'{translations,fa,title}',
      v_payload#>>'{translations,fa,description}',
      v_payload#>>'{translations,ps,title}',
      v_payload#>>'{translations,ps,description}'
    ) ~ '(?:\+?93|0)?7[0-9]{8}' then
    raise exception 'Public listing text must not contain a phone number';
  end if;
  if v_contact_phone !~ '^\+93[0-9]{9}$' then
    raise exception 'Candidate contact phone is invalid';
  end if;
  if v_price_mode not in ('contact', 'fixed', 'negotiable') then
    raise exception 'Candidate price mode is invalid';
  end if;
  if (v_price_mode = 'contact' and v_price <> 0)
     or (v_price_mode <> 'contact' and v_price <= 0) then
    raise exception 'Candidate price does not match its price mode';
  end if;
  if v_vehicle_year < 1950 or v_vehicle_year > extract(year from now())::int + 1 then
    raise exception 'Vehicle year is outside the allowed range';
  end if;
  if v_vehicle_brand is null or v_vehicle_model is null then
    raise exception 'Vehicle make and model are required';
  end if;

  select * into v_node
  from public.category_nodes
  where id = v_candidate.category_node_id and is_active and is_leaf;
  if not found then
    raise exception 'Candidate category must be an active leaf';
  end if;

  select id into v_subcategory_id
  from public.subcategories
  where category_id = v_node.category_id
    and slug = split_part(v_node.path, '/', 2)
    and is_active
  limit 1;
  if v_subcategory_id is null then
    raise exception 'Legacy subcategory mapping is missing';
  end if;

  if coalesce(v_payload->>'province_id', '') !~ '^[0-9]+$'
     or coalesce(v_payload->>'district_id', '') !~ '^[0-9]+$' then
    raise exception 'Candidate location is incomplete';
  end if;
  select * into v_province
  from public.provinces
  where id = (v_payload->>'province_id')::bigint and is_active;
  if not found then raise exception 'Candidate province is invalid'; end if;
  select * into v_district
  from public.districts
  where id = (v_payload->>'district_id')::bigint
    and province_id = v_province.id
    and is_active;
  if not found then raise exception 'Candidate district is invalid'; end if;

  if jsonb_typeof(p_images) <> 'array'
     or jsonb_array_length(p_images) < 1
     or jsonb_array_length(p_images) > 15 then
    raise exception 'Candidate images are missing or invalid';
  end if;
  v_image_count := jsonb_array_length(p_images);
  if v_image_count <> (
    select count(*)
    from public.listing_ingest_candidate_media candidate_media
    where candidate_media.candidate_id = p_candidate_id
  ) then
    raise exception 'Every retained candidate image must be published together';
  end if;

  for v_image in select value from jsonb_array_elements(p_images)
  loop
    if coalesce(v_image->>'storage_path', '') not like p_listing_id::text || '/%'
       or coalesce(v_image->>'public_url', '') not like 'https://%/storage/v1/object/public/listing-images/%'
       or coalesce(v_image->>'sort_order', '') !~ '^[0-9]+$'
       or not exists (
         select 1 from storage.objects
         where bucket_id = 'listing-images' and name = v_image->>'storage_path'
       ) then
      raise exception 'A published image is invalid or missing';
    end if;
  end loop;

  if (select count(distinct image.value->>'storage_path') from jsonb_array_elements(p_images) image(value)) <> v_image_count
     or (select count(distinct image.value->>'sort_order') from jsonb_array_elements(p_images) image(value)) <> v_image_count
     or (select min((image.value->>'sort_order')::int) from jsonb_array_elements(p_images) image(value)) <> 0
     or (select max((image.value->>'sort_order')::int) from jsonb_array_elements(p_images) image(value)) <> v_image_count - 1 then
    raise exception 'Candidate image order must be unique and contiguous';
  end if;

  if coalesce(v_payload#>>'{translations,en,title}', '') = ''
     or coalesce(v_payload#>>'{translations,en,description}', '') = ''
     or coalesce(v_payload#>>'{translations,fa,title}', '') = ''
     or coalesce(v_payload#>>'{translations,fa,description}', '') = ''
     or coalesce(v_payload#>>'{translations,ps,title}', '') = ''
     or coalesce(v_payload#>>'{translations,ps,description}', '') = '' then
    raise exception 'Reviewed translations are incomplete';
  end if;

  insert into public.listings (
    id, user_id, category_id, subcategory_id, category_node_id,
    title, description, original_title, original_description, original_language, original_locale,
    price, currency, province, district, province_id, district_id,
    contact_phone, contact_name, whatsapp_enabled, negotiable,
    status, publication_status, published_at, approved_by, approved_at,
    vehicle_type, vehicle_brand, vehicle_model, vehicle_year,
    location_visibility, is_location_confirmed,
    source_type, ownership_status, freshness_status, provenance_status,
    source_platform, source_item_id, source_first_seen_at, source_last_seen_at,
    permission_basis, permission_record_id, provenance_confidence,
    allow_contact_display, noindex_external, source_payload_hash,
    featured, urgent, expires_at
  ) values (
    p_listing_id, null, v_node.category_id, v_subcategory_id, v_node.id,
    v_title, v_description, v_title, v_description, 'fa', 'fa-AF',
    v_price, 'AFN', v_province.name, v_district.name, v_province.id, v_district.id,
    v_contact_phone, null, false, v_price_mode = 'negotiable',
    'approved', 'published', now(), p_actor_id, now(),
    'car', v_vehicle_brand, v_vehicle_model, v_vehicle_year,
    'province_district', true,
    'external_indexed', 'unclaimed', 'fresh', 'permission_pending',
    coalesce(v_source.platform, 'telegram'), v_candidate.source_item_id, v_candidate.created_at, now(),
    'administrator_authorized_forward', p_candidate_id::text, 0.75,
    true, true, encode(extensions.digest(v_candidate.raw_payload::text, 'sha256'), 'hex'),
    false, false, now() + interval '30 days'
  );

  insert into public.listing_images (listing_id, storage_path, public_url, is_primary, sort_order)
  select
    p_listing_id,
    value->>'storage_path',
    value->>'public_url',
    ordinality = 1,
    (value->>'sort_order')::int
  from jsonb_array_elements(p_images) with ordinality as image(value, ordinality);

  insert into public.listing_attributes (
    listing_id, attribute_key, attribute_value_text, attribute_value_number, field_label, is_locked
  ) values
    (p_listing_id, 'price_mode', v_price_mode, null, 'Price mode', true),
    (p_listing_id, 'vehicle_brand', v_vehicle_brand, null, 'Brand', true),
    (p_listing_id, 'vehicle_model', v_vehicle_model, null, 'Model', true),
    (p_listing_id, 'vehicle_year', null, v_vehicle_year, 'Year', true);

  insert into public.listing_attributes (
    listing_id, attribute_key, attribute_value_text, field_label, is_locked
  )
  select p_listing_id, 'body_condition_note', body_condition_note, 'Seller body-condition note', true
  from (select nullif(btrim(v_payload#>>'{vehicle,body_condition_note}'), '') as body_condition_note) note
  where body_condition_note is not null;

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
  from (values ('en', 'en'), ('fa-AF', 'fa'), ('ps-AF', 'ps'))
    as translation(language_code, payload_key);

  insert into public.listing_source_observations (
    listing_id, source_id, source_type, source_platform, source_item_id,
    import_job_id, first_seen_at, last_seen_at, permission_basis,
    permission_record_id, ingest_actor, ingest_version, normalized_payload,
    provenance_confidence
  ) values (
    p_listing_id, v_candidate.source_id, 'external_indexed', coalesce(v_source.platform, 'telegram'),
    v_candidate.source_item_id, v_candidate.job_id, v_candidate.created_at, now(),
    'administrator_authorized_forward', p_candidate_id::text, p_actor_id,
    'reviewed-candidate-v1',
    jsonb_build_object(
      'category_path', v_node.path,
      'price_mode', v_price_mode,
      'review_notes', coalesce(v_payload->'review_notes', '{}'::jsonb)
    ),
    0.75
  )
  returning id into v_observation_id;

  insert into public.listing_provenance_events (
    listing_id, source_observation_id, event_type, actor_user_id,
    source_type, after_state, reason, job_id
  ) values (
    p_listing_id, v_observation_id, 'candidate_published', p_actor_id,
    'external_indexed',
    jsonb_build_object(
      'candidate_id', p_candidate_id,
      'category_node_id', v_node.id,
      'photo_count', jsonb_array_length(p_images),
      'publication_status', 'published',
      'price_mode', v_price_mode
    ),
    'Reviewed and published by an authorized super administrator',
    v_candidate.job_id
  );

  update public.listing_ingest_candidates
  set status = 'published',
      candidate_listing_id = p_listing_id,
      validation_errors = '[]'::jsonb,
      updated_at = now()
  where id = p_candidate_id;

  update public.listing_ingest_jobs
  set status = 'completed',
      dry_run = false,
      accepted_rows = greatest(accepted_rows, 1),
      approved_by = p_actor_id,
      approved_at = now(),
      completed_at = now(),
      updated_at = now()
  where id = v_candidate.job_id;

  return p_listing_id;
end;
$$;

revoke all on function public.publish_reviewed_ingest_candidate(uuid, uuid, uuid, jsonb)
  from public, anon, authenticated;
grant execute on function public.publish_reviewed_ingest_candidate(uuid, uuid, uuid, jsonb)
  to service_role;

comment on function public.publish_reviewed_ingest_candidate(uuid, uuid, uuid, jsonb) is
  'Service-only atomic publication for a super-admin-reviewed external ingest candidate.';
