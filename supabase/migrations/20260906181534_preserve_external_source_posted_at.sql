-- Preserve the original Telegram publication time on every external listing.
-- This lets administrators prove freshness instead of relying on ingest time.

create or replace function public.extract_external_source_posted_at(
  p_raw_payload jsonb,
  p_normalized_payload jsonb
)
returns timestamptz
language plpgsql
stable
set search_path = ''
as $$
declare
  v_iso text;
  v_epoch text;
  v_result timestamptz;
begin
  v_iso := nullif(btrim(coalesce(
    p_normalized_payload->>'source_published_at',
    p_normalized_payload->>'source_posted_at',
    p_normalized_payload->>'published_at'
  )), '');

  if v_iso is not null then
    begin
      v_result := v_iso::timestamptz;
      return v_result;
    exception when others then
      -- Fall through to the original Telegram epoch when a malformed optional
      -- normalized value is present.
      null;
    end;
  end if;

  v_epoch := nullif(btrim(coalesce(
    p_raw_payload#>>'{message,forward_origin,date}',
    p_raw_payload#>>'{message,forward_date}',
    p_raw_payload#>>'{edited_message,forward_origin,date}',
    p_raw_payload#>>'{edited_message,forward_date}',
    p_raw_payload#>>'{channel_post,date}',
    p_raw_payload#>>'{edited_channel_post,date}',
    p_raw_payload#>>'{message,date}',
    p_raw_payload#>>'{edited_message,date}'
  )), '');

  if v_epoch ~ '^[0-9]{9,13}(\.[0-9]+)?$' then
    begin
      -- Telegram dates are Unix seconds. Reject millisecond-like values rather
      -- than silently recording an implausible future timestamp.
      if v_epoch::numeric <= 32503680000 then
        return to_timestamp(v_epoch::double precision);
      end if;
    exception when others then
      return null;
    end;
  end if;

  return null;
end;
$$;

revoke all on function public.extract_external_source_posted_at(jsonb, jsonb)
  from public, anon, authenticated;
grant execute on function public.extract_external_source_posted_at(jsonb, jsonb)
  to service_role;

create or replace function public.set_external_listing_source_posted_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_candidate public.listing_ingest_candidates%rowtype;
  v_candidate_id uuid;
begin
  if new.source_type <> 'external_indexed' then
    return new;
  end if;

  if new.source_posted_at is null
     and coalesce(new.permission_record_id, '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    v_candidate_id := new.permission_record_id::uuid;
    select * into v_candidate
    from public.listing_ingest_candidates
    where id = v_candidate_id;

    if found then
      new.source_posted_at := public.extract_external_source_posted_at(
        v_candidate.raw_payload,
        v_candidate.normalized_payload
      );
    end if;
  end if;

  if new.status = 'approved' and new.publication_status = 'published' then
    if new.source_posted_at is null then
      raise exception 'External listing source publication time is required';
    end if;
    if new.source_posted_at > now() + interval '5 minutes' then
      raise exception 'External listing source publication time cannot be in the future';
    end if;
    if new.source_posted_at < now() - interval '30 days' then
      raise exception 'External listing source is older than 30 days';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.set_external_listing_source_posted_at()
  from public, anon, authenticated;
grant execute on function public.set_external_listing_source_posted_at()
  to service_role;

drop trigger if exists preserve_external_listing_source_posted_at on public.listings;
create trigger preserve_external_listing_source_posted_at
before insert or update of source_type, source_posted_at, permission_record_id, status, publication_status
on public.listings
for each row execute function public.set_external_listing_source_posted_at();

update public.listings listing
set source_posted_at = public.extract_external_source_posted_at(
  candidate.raw_payload,
  candidate.normalized_payload
)
from public.listing_ingest_candidates candidate
where listing.source_type = 'external_indexed'
  and listing.source_posted_at is null
  and listing.permission_record_id = candidate.id::text
  and public.extract_external_source_posted_at(
    candidate.raw_payload,
    candidate.normalized_payload
  ) is not null;

comment on function public.extract_external_source_posted_at(jsonb, jsonb) is
  'Extracts the original source publication time from normalized or raw Telegram candidate payloads.';
comment on function public.set_external_listing_source_posted_at() is
  'Preserves source publication time and rejects missing, future, or older-than-30-day external publications.';
