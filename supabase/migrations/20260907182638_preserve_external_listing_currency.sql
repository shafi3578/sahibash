-- Preserve the source currency for administrator-reviewed external listings.
-- The existing publication RPC intentionally accepts an AFN-normalized amount;
-- this service-only wrapper bridges a reviewed USD amount without conversion.

create or replace function public.publish_reviewed_ingest_candidate_with_currency(
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
  v_price_mode text;
  v_currency text;
  v_price_text text;
  v_price numeric;
  v_published_id uuid;
  v_previous_claims text;
begin
  select * into v_candidate
  from public.listing_ingest_candidates
  where id = p_candidate_id
  for update;

  if not found then
    raise exception 'Candidate not found';
  end if;

  v_price_mode := lower(coalesce(v_candidate.normalized_payload->>'price_mode', 'contact'));
  if v_price_mode = 'contact' then
    return public.publish_reviewed_ingest_candidate(
      p_candidate_id,
      p_actor_id,
      p_listing_id,
      p_images
    );
  end if;

  v_currency := upper(coalesce(v_candidate.normalized_payload->>'currency', 'AFN'));
  if v_currency not in ('AFN', 'USD') then
    raise exception 'Candidate currency is invalid';
  end if;

  v_price_text := coalesce(
    nullif(v_candidate.normalized_payload->>'price_amount', ''),
    v_candidate.normalized_price_afn::text
  );
  if coalesce(v_price_text, '') !~ '^[0-9]+([.][0-9]{1,2})?$' then
    raise exception 'Candidate price amount is invalid';
  end if;
  v_price := v_price_text::numeric;
  if v_price <= 0 then
    raise exception 'Candidate price amount must be positive';
  end if;

  if p_actor_id is null then
    raise exception 'Actor is required for audited price publication';
  end if;
  v_previous_claims := current_setting('request.jwt.claims', true);
  perform set_config(
    'request.jwt.claims',
    jsonb_build_object('sub', p_actor_id, 'role', 'authenticated', 'aal', 'aal2')::text,
    true
  );

  if v_currency = 'USD' then
    -- The legacy publication function validates this column before inserting.
    -- Restore its AFN-only semantic immediately after the atomic publication.
    update public.listing_ingest_candidates
    set normalized_price_afn = v_price
    where id = p_candidate_id;
  elsif coalesce(v_candidate.normalized_price_afn, 0) <> v_price then
    raise exception 'Candidate AFN amount does not match its normalized price';
  end if;

  v_published_id := public.publish_reviewed_ingest_candidate(
    p_candidate_id,
    p_actor_id,
    p_listing_id,
    p_images
  );

  if v_currency = 'USD' then
    update public.listings
    set price = v_price,
        currency = 'USD',
        updated_at = now()
    where id = v_published_id;

    if not found then
      raise exception 'Published listing was not found for currency preservation';
    end if;

    update public.listing_ingest_candidates
    set normalized_price_afn = null,
        updated_at = now()
    where id = p_candidate_id;

    update public.listing_source_observations
    set normalized_payload = normalized_payload || jsonb_build_object(
          'price_mode', v_price_mode,
          'price_amount', v_price,
          'currency', v_currency
        ),
        updated_at = now()
    where listing_id = v_published_id;

    insert into public.listing_provenance_events (
      listing_id,
      event_type,
      actor_user_id,
      source_type,
      before_state,
      after_state,
      reason,
      job_id
    ) values (
      v_published_id,
      'external_listing_currency_preserved',
      p_actor_id,
      'external_indexed',
      jsonb_build_object('price', v_price, 'currency', 'AFN'),
      jsonb_build_object(
        'candidate_id', p_candidate_id,
        'price', v_price,
        'currency', v_currency,
        'price_mode', v_price_mode
      ),
      'Preserved the administrator-verified source currency without conversion',
      v_candidate.job_id
    );
  end if;

  perform set_config('request.jwt.claims', coalesce(v_previous_claims, ''), true);
  return v_published_id;
end;
$$;

revoke all on function public.publish_reviewed_ingest_candidate_with_currency(
  uuid, uuid, uuid, jsonb
) from public, anon, authenticated;
grant execute on function public.publish_reviewed_ingest_candidate_with_currency(
  uuid, uuid, uuid, jsonb
) to service_role;

comment on function public.publish_reviewed_ingest_candidate_with_currency(
  uuid, uuid, uuid, jsonb
) is 'Service-only atomic external-listing publication that preserves reviewed AFN or USD source currency without conversion.';

-- Correct the five already-published records whose reviewed source text contains
-- an explicit USD amount. Natural source identifiers are used instead of
-- generated database IDs, and every change receives an immutable audit event.
do $$
declare
  v_fix record;
  v_listing public.listings%rowtype;
  v_match_count integer;
  v_previous_claims text;
begin
  v_previous_claims := current_setting('request.jwt.claims', true);
  for v_fix in
    select * from (values
      ('Online_car_trading:1307125'::text, 8100::numeric),
      ('Online_car_trading:1307136'::text, 5200::numeric),
      ('Online_car_trading:1305314'::text, 7100::numeric),
      ('CarshoponlineHerat1:512568'::text, 16000::numeric),
      ('CarshoponlineHerat1:505807'::text, 5500::numeric)
    ) as correction(source_item_id, price_amount)
  loop
    select count(*) into v_match_count
    from public.listings
    where source_type = 'external_indexed'
      and source_item_id = v_fix.source_item_id;

    if v_match_count = 0 then
      continue;
    elsif v_match_count <> 1 then
      raise exception 'Expected one listing for source %, found %', v_fix.source_item_id, v_match_count;
    end if;

    select * into v_listing
    from public.listings
    where source_type = 'external_indexed'
      and source_item_id = v_fix.source_item_id
    for update;

    if v_listing.price = v_fix.price_amount and v_listing.currency = 'USD' then
      continue;
    end if;
    if v_listing.price <> 0 or v_listing.currency <> 'AFN' or v_listing.status <> 'approved' then
      raise exception 'Listing % is not in the expected correction state', v_fix.source_item_id;
    end if;
    if v_listing.approved_by is null then
      raise exception 'Listing % has no approving administrator for price audit', v_fix.source_item_id;
    end if;

    perform set_config(
      'request.jwt.claims',
      jsonb_build_object('sub', v_listing.approved_by, 'role', 'authenticated', 'aal', 'aal2')::text,
      true
    );

    update public.listings
    set price = v_fix.price_amount,
        currency = 'USD',
        negotiable = true,
        updated_at = now()
    where id = v_listing.id;

    update public.listing_attributes
    set attribute_value_text = 'negotiable'
    where listing_id = v_listing.id
      and attribute_key = 'price_mode';

    if not found then
      raise exception 'Listing % has no price-mode audit attribute', v_fix.source_item_id;
    end if;

    update public.listing_ingest_candidates
    set normalized_payload = normalized_payload || jsonb_build_object(
          'price_mode', 'negotiable',
          'price_amount', v_fix.price_amount,
          'currency', 'USD'
        ),
        normalized_price_afn = null,
        updated_at = now()
    where id::text = v_listing.permission_record_id;

    if not found then
      raise exception 'Listing % has no linked reviewed candidate', v_fix.source_item_id;
    end if;

    update public.listing_source_observations
    set normalized_payload = normalized_payload || jsonb_build_object(
          'price_mode', 'negotiable',
          'price_amount', v_fix.price_amount,
          'currency', 'USD'
        ),
        updated_at = now()
    where listing_id = v_listing.id;

    insert into public.listing_provenance_events (
      listing_id,
      event_type,
      actor_user_id,
      source_type,
      before_state,
      after_state,
      reason
    ) values (
      v_listing.id,
      'external_listing_currency_corrected',
      v_listing.approved_by,
      'external_indexed',
      jsonb_build_object(
        'source_item_id', v_fix.source_item_id,
        'price', v_listing.price,
        'currency', v_listing.currency,
        'price_mode', 'contact'
      ),
      jsonb_build_object(
        'source_item_id', v_fix.source_item_id,
        'price', v_fix.price_amount,
        'currency', 'USD',
        'price_mode', 'negotiable'
      ),
      'Corrected an administrator-verified explicit USD source price without currency conversion'
    );
  end loop;
  perform set_config('request.jwt.claims', coalesce(v_previous_claims, ''), true);
end;
$$;
