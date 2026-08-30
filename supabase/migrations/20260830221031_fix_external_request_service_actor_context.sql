-- The permission helper intentionally requires its subject to match auth.uid().
-- Establish the service-asserted actor context before evaluating RBAC.

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
