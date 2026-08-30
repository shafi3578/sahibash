-- Keep every supported external-listing review decision attributable and
-- explainable, even when a caller bypasses browser-native form validation.

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
declare
  v_previous_claims text;
  v_note text := btrim(coalesce(p_reviewer_note, ''));
begin
  if p_actor_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if char_length(v_note) < 5 or char_length(v_note) > 2000 then
    raise exception 'reviewer note must contain 5 to 2000 characters';
  end if;

  v_previous_claims := current_setting('request.jwt.claims', true);
  perform set_config(
    'request.jwt.claims',
    jsonb_build_object('sub', p_actor_id, 'role', 'authenticated', 'aal', 'aal2')::text,
    true
  );

  if not public.has_admin_permission(p_actor_id, 'listings.moderate') then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  select *
  from public.review_external_listing_claim(p_claim_id, p_decision, v_note);

  perform set_config('request.jwt.claims', coalesce(v_previous_claims, ''), true);
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
declare
  v_previous_claims text;
  v_note text := btrim(coalesce(p_reviewer_note, ''));
begin
  if p_actor_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if char_length(v_note) < 5 or char_length(v_note) > 2000 then
    raise exception 'reviewer note must contain 5 to 2000 characters';
  end if;

  v_previous_claims := current_setting('request.jwt.claims', true);
  perform set_config(
    'request.jwt.claims',
    jsonb_build_object('sub', p_actor_id, 'role', 'authenticated', 'aal', 'aal2')::text,
    true
  );

  if not public.has_admin_permission(p_actor_id, 'listings.moderate') then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  select *
  from public.review_external_listing_removal_request(p_request_id, p_decision, v_note);

  perform set_config('request.jwt.claims', coalesce(v_previous_claims, ''), true);
end;
$$;

revoke all on function public.review_external_listing_removal_request_service(uuid, text, text, uuid)
  from public, anon, authenticated;
grant execute on function public.review_external_listing_removal_request_service(uuid, text, text, uuid)
  to service_role;

comment on function public.review_external_listing_claim_service(uuid, text, text, uuid) is
  'Service-only claim review bridge; requires a verified admin actor and a meaningful audit note.';
comment on function public.review_external_listing_removal_request_service(uuid, text, text, uuid) is
  'Service-only removal review bridge; requires a verified admin actor and a meaningful audit note.';
