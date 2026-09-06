-- Safely backfill deterministic review hints for Telegram candidates that
-- arrived before webhook prefill was introduced. The function is deliberately
-- service-only, never selects a category, never changes review status, and
-- records a content-free provenance event for every changed candidate.

create or replace function public.backfill_telegram_candidate_prefill(
  p_candidate_id uuid,
  p_normalized_phone text,
  p_price_original numeric,
  p_currency text,
  p_normalized_price_afn numeric,
  p_province text,
  p_province_id bigint
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_candidate public.listing_ingest_candidates%rowtype;
  v_source public.listing_sources%rowtype;
  v_payload jsonb;
  v_before jsonb;
  v_changed boolean := false;
begin
  if p_candidate_id is null then
    raise exception 'Candidate id is required';
  end if;
  if p_normalized_phone is not null and p_normalized_phone !~ '^\+93[0-9]{9}$' then
    raise exception 'Candidate phone is invalid';
  end if;
  if (p_price_original is null) <> (p_currency is null) then
    raise exception 'Candidate price and currency must be supplied together';
  end if;
  if p_price_original is not null and (p_price_original <= 0 or p_currency not in ('AFN', 'USD')) then
    raise exception 'Candidate price is invalid';
  end if;
  if p_currency = 'AFN' and p_normalized_price_afn is distinct from p_price_original then
    raise exception 'AFN candidate price is inconsistent';
  end if;
  if p_currency is distinct from 'AFN' and p_normalized_price_afn is not null then
    raise exception 'Foreign currency must not be converted automatically';
  end if;
  if (p_province is null) <> (p_province_id is null) then
    raise exception 'Candidate province and id must be supplied together';
  end if;
  if p_province is not null and not exists (
    select 1
    from public.provinces province
    where province.id = p_province_id
      and province.name = p_province
      and province.is_active
  ) then
    raise exception 'Candidate province is invalid';
  end if;

  select * into v_candidate
  from public.listing_ingest_candidates candidate
  where candidate.id = p_candidate_id
  for update;
  if not found then return false; end if;

  select * into v_source
  from public.listing_sources source
  where source.id = v_candidate.source_id;
  if not found
     or v_source.source_type <> 'external_indexed'
     or v_source.platform <> 'telegram'
     or v_candidate.status <> 'needs_review'
     or v_candidate.candidate_listing_id is not null then
    return false;
  end if;

  v_payload := coalesce(v_candidate.normalized_payload, '{}'::jsonb);
  if jsonb_typeof(v_payload) <> 'object' or pg_column_size(v_payload) > 65536 then
    raise exception 'Candidate payload is invalid';
  end if;
  v_before := jsonb_build_object(
    'has_phone', v_candidate.normalized_phone is not null,
    'has_price_afn', v_candidate.normalized_price_afn is not null,
    'has_location', v_candidate.normalized_location is not null,
    'has_province_id', v_payload ? 'province_id'
  );

  if v_candidate.normalized_phone is null and p_normalized_phone is not null then
    v_candidate.normalized_phone := p_normalized_phone;
    if not (v_payload ? 'contact_phone') then
      v_payload := v_payload || jsonb_build_object('contact_phone', p_normalized_phone);
    end if;
    v_changed := true;
  end if;

  if p_price_original is not null and not (v_payload ? 'price_original') then
    v_payload := v_payload || jsonb_build_object(
      'price_original', p_price_original,
      'currency', p_currency
    );
    v_changed := true;
  end if;
  if v_candidate.normalized_price_afn is null and p_normalized_price_afn is not null then
    v_candidate.normalized_price_afn := p_normalized_price_afn;
    v_changed := true;
  end if;

  if v_candidate.normalized_location is null and p_province is not null then
    v_candidate.normalized_location := p_province;
    v_changed := true;
  end if;
  if p_province is not null and not (v_payload ? 'detected_province') then
    v_payload := v_payload || jsonb_build_object('detected_province', p_province);
    v_changed := true;
  end if;
  if p_province_id is not null and not (v_payload ? 'province_id') then
    v_payload := v_payload || jsonb_build_object('province_id', p_province_id);
    v_changed := true;
  end if;

  if not v_changed then return false; end if;

  update public.listing_ingest_candidates
  set normalized_payload = v_payload,
      normalized_phone = v_candidate.normalized_phone,
      normalized_price_afn = v_candidate.normalized_price_afn,
      normalized_location = v_candidate.normalized_location,
      updated_at = now()
  where id = v_candidate.id;

  insert into public.listing_provenance_events (
    listing_id, event_type, actor_user_id, source_type,
    before_state, after_state, reason, job_id
  ) values (
    null, 'candidate_prefill_backfilled', null, 'external_indexed',
    v_before,
    jsonb_build_object(
      'candidate_id', v_candidate.id,
      'has_phone', v_candidate.normalized_phone is not null,
      'has_price_afn', v_candidate.normalized_price_afn is not null,
      'has_location', v_candidate.normalized_location is not null,
      'has_province_id', v_payload ? 'province_id'
    ),
    'Deterministic Telegram review hints backfilled without changing review status',
    v_candidate.job_id
  );

  return true;
end;
$$;

revoke all on function public.backfill_telegram_candidate_prefill(
  uuid, text, numeric, text, numeric, text, bigint
) from public, anon, authenticated;
grant execute on function public.backfill_telegram_candidate_prefill(
  uuid, text, numeric, text, numeric, text, bigint
) to service_role;

comment on function public.backfill_telegram_candidate_prefill(
  uuid, text, numeric, text, numeric, text, bigint
) is 'Service-only conservative prefill for legacy Telegram review candidates with atomic audit evidence.';
