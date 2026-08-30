-- Security Advisor follow-up: external request RPCs perform multi-table atomic
-- writes and therefore remain SECURITY DEFINER, but are no longer exposed to
-- browser roles. Server Actions authenticate the user, rate-limit submissions,
-- and require AAL2 for moderation before calling these service-only wrappers.

revoke all on function public.submit_external_listing_claim(uuid, text)
  from public, anon, authenticated;
grant execute on function public.submit_external_listing_claim(uuid, text)
  to service_role;

revoke all on function public.submit_external_listing_removal_request(uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.submit_external_listing_removal_request(uuid, text, text)
  to service_role;

revoke all on function public.review_external_listing_claim(uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.review_external_listing_claim(uuid, text, text)
  to service_role;

revoke all on function public.review_external_listing_removal_request(uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.review_external_listing_removal_request(uuid, text, text)
  to service_role;

create or replace function public.submit_external_listing_claim_service(
  p_listing_id uuid,
  p_claimant_note text,
  p_actor_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result uuid;
begin
  if p_actor_id is null or not exists (
    select 1 from auth.users where id = p_actor_id
  ) then
    raise exception 'invalid actor' using errcode = '42501';
  end if;

  perform set_config(
    'request.jwt.claims',
    jsonb_build_object('sub', p_actor_id, 'role', 'authenticated', 'aal', 'aal1')::text,
    true
  );
  v_result := public.submit_external_listing_claim(p_listing_id, p_claimant_note);
  return v_result;
end;
$$;

revoke all on function public.submit_external_listing_claim_service(uuid, text, uuid)
  from public, anon, authenticated;
grant execute on function public.submit_external_listing_claim_service(uuid, text, uuid)
  to service_role;

create or replace function public.submit_external_listing_removal_request_service(
  p_listing_id uuid,
  p_reason_code text,
  p_details text,
  p_actor_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result uuid;
begin
  if p_actor_id is null or not exists (
    select 1 from auth.users where id = p_actor_id
  ) then
    raise exception 'invalid actor' using errcode = '42501';
  end if;

  perform set_config(
    'request.jwt.claims',
    jsonb_build_object('sub', p_actor_id, 'role', 'authenticated', 'aal', 'aal1')::text,
    true
  );
  v_result := public.submit_external_listing_removal_request(p_listing_id, p_reason_code, p_details);
  return v_result;
end;
$$;

revoke all on function public.submit_external_listing_removal_request_service(uuid, text, text, uuid)
  from public, anon, authenticated;
grant execute on function public.submit_external_listing_removal_request_service(uuid, text, text, uuid)
  to service_role;

create or replace function public.review_external_listing_claim_service(
  p_claim_id uuid,
  p_decision text,
  p_reviewer_note text,
  p_actor_id uuid
)
returns table(listing_id uuid, requester_user_id uuid, outcome text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_actor_id is null
     or not exists (select 1 from auth.users where id = p_actor_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  perform set_config(
    'request.jwt.claims',
    jsonb_build_object('sub', p_actor_id, 'role', 'authenticated', 'aal', 'aal2')::text,
    true
  );
  if not public.has_admin_permission(p_actor_id, 'listings.moderate') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
    select reviewed.listing_id, reviewed.requester_user_id, reviewed.outcome
    from public.review_external_listing_claim(p_claim_id, p_decision, p_reviewer_note) reviewed;
end;
$$;

revoke all on function public.review_external_listing_claim_service(uuid, text, text, uuid)
  from public, anon, authenticated;
grant execute on function public.review_external_listing_claim_service(uuid, text, text, uuid)
  to service_role;

create or replace function public.review_external_listing_removal_request_service(
  p_request_id uuid,
  p_decision text,
  p_reviewer_note text,
  p_actor_id uuid
)
returns table(listing_id uuid, requester_user_id uuid, outcome text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_actor_id is null
     or not exists (select 1 from auth.users where id = p_actor_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  perform set_config(
    'request.jwt.claims',
    jsonb_build_object('sub', p_actor_id, 'role', 'authenticated', 'aal', 'aal2')::text,
    true
  );
  if not public.has_admin_permission(p_actor_id, 'listings.moderate') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
    select reviewed.listing_id, reviewed.requester_user_id, reviewed.outcome
    from public.review_external_listing_removal_request(p_request_id, p_decision, p_reviewer_note) reviewed;
end;
$$;

revoke all on function public.review_external_listing_removal_request_service(uuid, text, text, uuid)
  from public, anon, authenticated;
grant execute on function public.review_external_listing_removal_request_service(uuid, text, text, uuid)
  to service_role;

comment on function public.submit_external_listing_claim_service(uuid, text, uuid) is
  'Service-only claim submission called after authenticated Server Action validation and rate limiting.';
comment on function public.submit_external_listing_removal_request_service(uuid, text, text, uuid) is
  'Service-only removal submission called after authenticated Server Action validation and rate limiting.';
comment on function public.review_external_listing_claim_service(uuid, text, text, uuid) is
  'Service-only atomic claim review called after listings.moderate plus AAL2 Server Action authorization.';
comment on function public.review_external_listing_removal_request_service(uuid, text, text, uuid) is
  'Service-only atomic removal review called after listings.moderate plus AAL2 Server Action authorization.';
