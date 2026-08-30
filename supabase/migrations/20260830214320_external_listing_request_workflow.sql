-- External inventory must not pretend to have an in-app seller before an
-- ownership claim is verified. This migration makes claim/removal requests
-- idempotent and reviewable, adds an AAL2-protected moderation workflow, and
-- enforces the buyer/seller boundary at RLS level for messages and offers.

create table if not exists public.listing_removal_requests (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  requester_user_id uuid not null references auth.users(id) on delete cascade,
  reason_code text not null
    check (reason_code in ('owner_request', 'sold_or_unavailable', 'privacy_or_rights', 'wrong_information', 'other')),
  details text not null check (char_length(btrim(details)) between 10 and 1500),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewer_note text check (reviewer_note is null or char_length(reviewer_note) <= 2000),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Preserve every historical click-generated claim, but close legacy rows that
-- contain no verification details. The requester can then submit the new form.
update public.listing_claims claim
set
  status = 'cancelled',
  evidence = coalesce(claim.evidence, '{}'::jsonb)
    || jsonb_build_object('system_note', 'Legacy click-only request closed; resubmit with verification details'),
  updated_at = now()
where claim.status in ('initiated', 'challenge_sent', 'verified')
  and char_length(btrim(coalesce(claim.evidence->>'claimant_note', ''))) < 10;

-- Leave only the newest valid request active so repeated submissions become
-- one auditable case without deleting any historical row.
with ranked_active_claims as (
  select id,
    row_number() over (
      partition by listing_id, claimant_user_id
      order by created_at desc, id desc
    ) as active_rank
  from public.listing_claims
  where claimant_user_id is not null
    and status in ('initiated', 'challenge_sent', 'verified')
)
update public.listing_claims claim
set
  status = 'cancelled',
  evidence = coalesce(claim.evidence, '{}'::jsonb)
    || jsonb_build_object('system_note', 'Superseded duplicate request consolidated during workflow hardening'),
  updated_at = now()
from ranked_active_claims ranked
where claim.id = ranked.id
  and ranked.active_rank > 1;

create unique index if not exists idx_listing_claims_one_active_per_user
  on public.listing_claims(listing_id, claimant_user_id)
  where status in ('initiated', 'challenge_sent', 'verified');

create unique index if not exists idx_listing_removal_requests_one_pending_per_user
  on public.listing_removal_requests(listing_id, requester_user_id)
  where status = 'pending';

create index if not exists idx_listing_removal_requests_review_queue
  on public.listing_removal_requests(status, created_at asc);

create index if not exists idx_listing_removal_requests_requester
  on public.listing_removal_requests(requester_user_id, created_at desc);

alter table public.listing_removal_requests enable row level security;

drop policy if exists listing_removal_requests_requester_read on public.listing_removal_requests;
create policy listing_removal_requests_requester_read
  on public.listing_removal_requests
  for select
  to authenticated
  using (
    requester_user_id = (select auth.uid())
    or (select public.has_admin_permission((select auth.uid()), 'listings.view'))
  );

drop policy if exists listing_removal_requests_requester_insert on public.listing_removal_requests;
create policy listing_removal_requests_requester_insert
  on public.listing_removal_requests
  for insert
  to authenticated
  with check (
    requester_user_id = (select auth.uid())
    and status = 'pending'
    and exists (
      select 1
      from public.listings listing
      where listing.id = listing_removal_requests.listing_id
        and listing.source_type not in ('native', 'migrated_legacy')
        and listing.ownership_status not in ('removed', 'opted_out')
    )
  );

drop policy if exists listing_removal_requests_admin_update on public.listing_removal_requests;
create policy listing_removal_requests_admin_update
  on public.listing_removal_requests
  for update
  to authenticated
  using (
    (select private.is_aal2())
    and (select public.has_admin_permission((select auth.uid()), 'listings.moderate'))
  )
  with check (
    (select private.is_aal2())
    and (select public.has_admin_permission((select auth.uid()), 'listings.moderate'))
  );

revoke all on table public.listing_removal_requests from public, anon, authenticated;
grant select, insert, update on table public.listing_removal_requests to authenticated;
grant all on table public.listing_removal_requests to service_role;

-- Direct table access must follow the same external-listing eligibility rules
-- as the application action. Privileged review also requires AAL2 at RLS.
drop policy if exists listing_claims_user_insert on public.listing_claims;
create policy listing_claims_user_insert
  on public.listing_claims
  for insert
  to authenticated
  with check (
    claimant_user_id = (select auth.uid())
    and status = 'initiated'
    and exists (
      select 1
      from public.listings listing
      where listing.id = listing_claims.listing_id
        and listing.source_type not in ('native', 'migrated_legacy')
        and listing.ownership_status not in ('claimed', 'removed', 'opted_out')
    )
  );

drop policy if exists listing_claims_admin_manage on public.listing_claims;
create policy listing_claims_admin_manage
  on public.listing_claims
  for update
  to authenticated
  using (
    (select private.is_aal2())
    and (select public.has_admin_permission((select auth.uid()), 'listings.moderate'))
  )
  with check (
    (select private.is_aal2())
    and (select public.has_admin_permission((select auth.uid()), 'listings.moderate'))
  );

create or replace function public.submit_external_listing_claim(
  p_listing_id uuid,
  p_claimant_note text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_listing public.listings%rowtype;
  v_claim_id uuid;
  v_note text := btrim(coalesce(p_claimant_note, ''));
begin
  if v_actor is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if char_length(v_note) < 10 or char_length(v_note) > 1000 then
    raise exception 'claim verification details must contain 10 to 1000 characters';
  end if;

  select * into v_listing
  from public.listings
  where id = p_listing_id
  for update;

  if not found
     or v_listing.source_type in ('native', 'migrated_legacy')
     or v_listing.ownership_status in ('claimed', 'removed', 'opted_out')
     or v_listing.publication_status <> 'published' then
    raise exception 'listing is not eligible for an ownership claim';
  end if;

  select claim.id into v_claim_id
  from public.listing_claims claim
  where claim.listing_id = p_listing_id
    and claim.claimant_user_id = v_actor
    and claim.status in ('initiated', 'challenge_sent', 'verified')
  order by claim.created_at desc
  limit 1;

  if v_claim_id is not null then
    return v_claim_id;
  end if;

  insert into public.listing_claims (
    listing_id,
    seller_entity_id,
    claimant_user_id,
    status,
    masked_contact_hint,
    challenge_channel,
    challenge_expires_at,
    evidence
  ) values (
    p_listing_id,
    v_listing.seller_entity_id,
    v_actor,
    'initiated',
    case
      when char_length(regexp_replace(v_listing.contact_phone, '\\D', '', 'g')) >= 2
        then '***' || right(regexp_replace(v_listing.contact_phone, '\\D', '', 'g'), 2)
      else null
    end,
    'staff_review',
    now() + interval '7 days',
    jsonb_build_object('claimant_note', v_note)
  )
  returning id into v_claim_id;

  insert into public.listing_provenance_events (
    listing_id, event_type, actor_user_id, source_type, after_state, reason
  ) values (
    p_listing_id,
    'claim_submitted',
    v_actor,
    v_listing.source_type,
    jsonb_build_object('claim_id', v_claim_id, 'status', 'initiated'),
    'external_listing_owner_request'
  );

  return v_claim_id;
end;
$$;

revoke all on function public.submit_external_listing_claim(uuid, text) from public, anon, authenticated;
grant execute on function public.submit_external_listing_claim(uuid, text) to authenticated;

create or replace function public.submit_external_listing_removal_request(
  p_listing_id uuid,
  p_reason_code text,
  p_details text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_listing public.listings%rowtype;
  v_request_id uuid;
  v_reason text := lower(btrim(coalesce(p_reason_code, '')));
  v_details text := btrim(coalesce(p_details, ''));
begin
  if v_actor is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if v_reason not in ('owner_request', 'sold_or_unavailable', 'privacy_or_rights', 'wrong_information', 'other') then
    raise exception 'invalid removal reason';
  end if;
  if char_length(v_details) < 10 or char_length(v_details) > 1500 then
    raise exception 'removal details must contain 10 to 1500 characters';
  end if;

  select * into v_listing
  from public.listings
  where id = p_listing_id
  for update;

  if not found
     or v_listing.source_type in ('native', 'migrated_legacy')
     or v_listing.ownership_status in ('removed', 'opted_out')
     or v_listing.publication_status <> 'published' then
    raise exception 'listing is not eligible for a removal request';
  end if;

  select request.id into v_request_id
  from public.listing_removal_requests request
  where request.listing_id = p_listing_id
    and request.requester_user_id = v_actor
    and request.status = 'pending'
  order by request.created_at desc
  limit 1;

  if v_request_id is not null then
    return v_request_id;
  end if;

  insert into public.listing_removal_requests (
    listing_id, requester_user_id, reason_code, details
  ) values (
    p_listing_id, v_actor, v_reason, v_details
  )
  returning id into v_request_id;

  insert into public.listing_provenance_events (
    listing_id, event_type, actor_user_id, source_type, after_state, reason
  ) values (
    p_listing_id,
    'removal_requested',
    v_actor,
    v_listing.source_type,
    jsonb_build_object('removal_request_id', v_request_id, 'status', 'pending', 'reason_code', v_reason),
    'external_listing_removal_request'
  );

  return v_request_id;
end;
$$;

revoke all on function public.submit_external_listing_removal_request(uuid, text, text) from public, anon, authenticated;
grant execute on function public.submit_external_listing_removal_request(uuid, text, text) to authenticated;

create or replace function public.review_external_listing_claim(
  p_claim_id uuid,
  p_decision text,
  p_reviewer_note text default null
)
returns table(listing_id uuid, requester_user_id uuid, outcome text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_claim public.listing_claims%rowtype;
  v_listing public.listings%rowtype;
  v_seller_entity_id uuid;
  v_claimant_hash text;
  v_decision text := lower(btrim(coalesce(p_decision, '')));
  v_note text := nullif(btrim(coalesce(p_reviewer_note, '')), '');
begin
  if v_actor is null
     or not private.is_aal2()
     or not public.has_admin_permission(v_actor, 'listings.moderate') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if v_decision not in ('approve', 'reject') then
    raise exception 'invalid review decision';
  end if;
  if v_note is null or char_length(v_note) < 5 or char_length(v_note) > 2000 then
    raise exception 'reviewer note must contain 5 to 2000 characters';
  end if;

  select * into v_claim
  from public.listing_claims
  where id = p_claim_id
  for update;

  if not found or v_claim.status not in ('initiated', 'challenge_sent', 'verified') then
    raise exception 'claim is no longer pending';
  end if;
  if v_claim.claimant_user_id is null then
    raise exception 'claimant account is missing';
  end if;

  select * into v_listing
  from public.listings
  where id = v_claim.listing_id
  for update;

  if not found or v_listing.source_type in ('native', 'migrated_legacy') then
    raise exception 'listing is not an external listing';
  end if;

  if v_decision = 'approve' then
    if v_listing.ownership_status in ('removed', 'opted_out')
       or v_listing.publication_status <> 'published' then
      raise exception 'listing can no longer be claimed';
    end if;
    if v_listing.user_id is not null and v_listing.user_id <> v_claim.claimant_user_id then
      raise exception 'listing already belongs to another account';
    end if;
    if v_listing.seller_entity_id is not null and exists (
      select 1 from public.seller_entities entity
      where entity.id = v_listing.seller_entity_id
        and entity.linked_user_id is not null
        and entity.linked_user_id <> v_claim.claimant_user_id
    ) then
      raise exception 'seller identity is linked to another account';
    end if;

    v_claimant_hash := encode(
      extensions.digest('claimant_user:' || v_claim.claimant_user_id::text, 'sha256'),
      'hex'
    );
    v_seller_entity_id := v_listing.seller_entity_id;
    if v_seller_entity_id is null then
      select entity.id into v_seller_entity_id
      from public.seller_entities entity
      where entity.linked_user_id = v_claim.claimant_user_id
         or entity.contact_hash = v_claimant_hash
      order by (entity.linked_user_id = v_claim.claimant_user_id) desc, entity.created_at asc
      limit 1;
    end if;
    if v_seller_entity_id is null then
      insert into public.seller_entities (
        linked_user_id, display_name, normalized_phone, original_phone,
        contact_hash, verification_status, created_by
      ) values (
        v_claim.claimant_user_id,
        (select profile.full_name from public.profiles profile where profile.id = v_claim.claimant_user_id),
        nullif(v_listing.contact_phone, ''),
        nullif(v_listing.contact_phone, ''),
        v_claimant_hash,
        'staff_verified',
        v_actor
      )
      returning id into v_seller_entity_id;
    end if;

    update public.listing_claims
    set
      status = 'converted',
      seller_entity_id = v_seller_entity_id,
      reviewed_by = v_actor,
      reviewed_at = now(),
      updated_at = now(),
      evidence = coalesce(evidence, '{}'::jsonb)
        || jsonb_build_object('reviewer_note', coalesce(v_note, ''), 'decision', 'approve')
    where id = v_claim.id;

    update public.listing_claims other_claim
    set
      status = 'failed',
      reviewed_by = v_actor,
      reviewed_at = now(),
      updated_at = now(),
      evidence = coalesce(evidence, '{}'::jsonb)
        || jsonb_build_object('system_note', 'Another verified claim was approved')
    where other_claim.listing_id = v_listing.id
      and other_claim.id <> v_claim.id
      and other_claim.status in ('initiated', 'challenge_sent', 'verified');

    update public.listings
    set
      user_id = v_claim.claimant_user_id,
      seller_entity_id = v_seller_entity_id,
      ownership_status = 'claimed',
      provenance_status = 'authorized',
      permission_basis = 'verified_owner_claim',
      source_consent_at = now(),
      freshness_status = 'seller_confirmed',
      noindex_external = false,
      updated_at = now()
    where id = v_listing.id;

    update public.seller_entities
    set
      linked_user_id = v_claim.claimant_user_id,
      verification_status = 'staff_verified',
      updated_at = now()
    where id = v_seller_entity_id
      and (linked_user_id is null or linked_user_id = v_claim.claimant_user_id);
  else
    update public.listing_claims
    set
      status = 'failed',
      reviewed_by = v_actor,
      reviewed_at = now(),
      updated_at = now(),
      evidence = coalesce(evidence, '{}'::jsonb)
        || jsonb_build_object('reviewer_note', coalesce(v_note, ''), 'decision', 'reject')
    where id = v_claim.id;
  end if;

  insert into public.listing_provenance_events (
    listing_id, event_type, actor_user_id, source_type, before_state, after_state, reason
  ) values (
    v_listing.id,
    case when v_decision = 'approve' then 'claim_approved' else 'claim_rejected' end,
    v_actor,
    v_listing.source_type,
    jsonb_build_object('ownership_status', v_listing.ownership_status, 'user_id', v_listing.user_id),
    jsonb_build_object('claim_id', v_claim.id, 'decision', v_decision, 'claimant_user_id', v_claim.claimant_user_id),
    v_note
  );

  return query select v_listing.id, v_claim.claimant_user_id, v_decision;
end;
$$;

revoke all on function public.review_external_listing_claim(uuid, text, text) from public, anon, authenticated;
grant execute on function public.review_external_listing_claim(uuid, text, text) to authenticated;

create or replace function public.review_external_listing_removal_request(
  p_request_id uuid,
  p_decision text,
  p_reviewer_note text default null
)
returns table(listing_id uuid, requester_user_id uuid, outcome text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_request public.listing_removal_requests%rowtype;
  v_listing public.listings%rowtype;
  v_source_id uuid;
  v_source_account_id text;
  v_decision text := lower(btrim(coalesce(p_decision, '')));
  v_note text := nullif(btrim(coalesce(p_reviewer_note, '')), '');
begin
  if v_actor is null
     or not private.is_aal2()
     or not public.has_admin_permission(v_actor, 'listings.moderate') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if v_decision not in ('approve', 'reject') then
    raise exception 'invalid review decision';
  end if;
  if v_note is null or char_length(v_note) < 5 or char_length(v_note) > 2000 then
    raise exception 'reviewer note must contain 5 to 2000 characters';
  end if;

  select * into v_request
  from public.listing_removal_requests
  where id = p_request_id
  for update;

  if not found or v_request.status <> 'pending' then
    raise exception 'removal request is no longer pending';
  end if;

  select * into v_listing
  from public.listings
  where id = v_request.listing_id
  for update;

  if not found or v_listing.source_type in ('native', 'migrated_legacy') then
    raise exception 'listing is not an external listing';
  end if;

  update public.listing_removal_requests
  set
    status = case when v_decision = 'approve' then 'approved' else 'rejected' end,
    reviewed_by = v_actor,
    reviewer_note = v_note,
    reviewed_at = now(),
    updated_at = now()
  where id = v_request.id;

  if v_decision = 'approve' then
    select observation.source_id, observation.source_account_id
    into v_source_id, v_source_account_id
    from public.listing_source_observations observation
    where observation.listing_id = v_listing.id
    order by observation.last_seen_at desc
    limit 1;

    if not exists (
      select 1
      from public.external_import_opt_outs opt_out
      where (v_listing.contact_phone <> '' and opt_out.normalized_phone = v_listing.contact_phone)
         or (v_source_account_id is not null and opt_out.source_account_id = v_source_account_id)
    ) then
      insert into public.external_import_opt_outs (
        source_id, source_type, normalized_phone, source_platform,
        source_account_id, reason, verified_by, verified_at, created_by
      ) values (
        v_source_id,
        v_listing.source_type,
        nullif(v_listing.contact_phone, ''),
        v_listing.source_platform,
        v_source_account_id,
        'approved_listing_removal:' || v_request.reason_code,
        v_actor,
        now(),
        v_request.requester_user_id
      );
    end if;

    update public.listings
    set
      status = 'expired',
      publication_status = 'removed',
      ownership_status = 'opted_out',
      freshness_status = 'expired',
      provenance_status = 'opted_out',
      allow_contact_display = false,
      noindex_external = true,
      removed_public_at = coalesce(removed_public_at, now()),
      archived_at = coalesce(archived_at, now()),
      expires_at = least(expires_at, now()),
      updated_at = now()
    where id = v_listing.id;
  end if;

  insert into public.listing_provenance_events (
    listing_id, event_type, actor_user_id, source_type, before_state, after_state, reason
  ) values (
    v_listing.id,
    case when v_decision = 'approve' then 'removal_approved' else 'removal_rejected' end,
    v_actor,
    v_listing.source_type,
    jsonb_build_object('publication_status', v_listing.publication_status, 'ownership_status', v_listing.ownership_status),
    jsonb_build_object('removal_request_id', v_request.id, 'decision', v_decision),
    coalesce(v_note, v_request.reason_code)
  );

  return query select v_listing.id, v_request.requester_user_id, v_decision;
end;
$$;

revoke all on function public.review_external_listing_removal_request(uuid, text, text) from public, anon, authenticated;
grant execute on function public.review_external_listing_removal_request(uuid, text, text) to authenticated;

-- Message and offer writes must reference a real accountable listing owner.
-- This remains true even if a caller bypasses the page and talks to PostgREST.
drop policy if exists messages_insert_sender_only on public.messages;
create policy messages_insert_sender_only
  on public.messages
  for insert
  to authenticated
  with check (
    sender_user_id = (select auth.uid())
    and sender_user_id <> recipient_user_id
    and exists (
      select 1
      from public.listings listing
      where listing.id = messages.listing_id
        and listing.user_id is not null
        and listing.user_id in (messages.sender_user_id, messages.recipient_user_id)
        and listing.status = 'approved'
        and listing.publication_status = 'published'
        and (listing.source_type = 'native' or listing.ownership_status = 'claimed')
    )
  );

drop policy if exists offers_insert_buyer_only on public.offers;
create policy offers_insert_buyer_only
  on public.offers
  for insert
  to authenticated
  with check (
    buyer_user_id = (select auth.uid())
    and buyer_user_id <> seller_user_id
    and exists (
      select 1
      from public.listings listing
      where listing.id = offers.listing_id
        and listing.user_id = offers.seller_user_id
        and listing.user_id is not null
        and listing.status = 'approved'
        and listing.publication_status = 'published'
        and (listing.source_type = 'native' or listing.ownership_status = 'claimed')
    )
  );

comment on table public.listing_removal_requests is
  'Authenticated, reviewable requests to remove an external listing; approval archives and opts out rather than deleting audit history.';
comment on function public.submit_external_listing_claim(uuid, text) is
  'Idempotently submits an authenticated ownership claim for a public unclaimed external listing.';
comment on function public.submit_external_listing_removal_request(uuid, text, text) is
  'Idempotently submits an authenticated external-listing removal request for staff verification.';
comment on function public.review_external_listing_claim(uuid, text, text) is
  'AAL2 plus listings.moderate atomic claim approval/rejection with provenance audit.';
comment on function public.review_external_listing_removal_request(uuid, text, text) is
  'AAL2 plus listings.moderate atomic removal review; approval opts out and removes the listing from public discovery.';
