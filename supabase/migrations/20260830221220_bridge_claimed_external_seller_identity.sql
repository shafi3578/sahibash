-- Ensure verified claims can satisfy the existing external-owner identity
-- constraint even when legacy imported inventory has no seller entity yet.

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

revoke all on function public.review_external_listing_claim(uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.review_external_listing_claim(uuid, text, text)
  to service_role;
