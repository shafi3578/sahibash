-- Applied as 20260916135905 in the production migration ledger.
-- Paid promotion cannot make a hidden/expired listing discoverable. Keep the
-- existing owner, RBAC, AAL2, proof and configured-term guards; renewals stay seller-owned.
begin;

create or replace function private.is_featured_payment_target_eligible(p_listing_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1
    from public.listings l
    join public.categories c on c.id = l.category_id
    where l.id = p_listing_id
      and l.status = 'approved'
      and (l.publication_status is null or l.publication_status = 'published')
      and l.removed_public_at is null
      and l.expires_at > now()
      and l.price > 0
      and coalesce(l.freshness_status::text, 'seller_confirmed') not in ('expired', 'source_missing', 'sold_confirmed')
      and c.is_active = true
      and c.is_coming_soon = false
  );
$$;
revoke all on function private.is_featured_payment_target_eligible(uuid) from public, anon;
grant execute on function private.is_featured_payment_target_eligible(uuid) to authenticated, service_role;

create or replace function public.guard_promotion_payment_request_mutation()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := (select auth.uid());
  v_is_reviewer boolean := false;
  v_is_reviewer_aal2 boolean := false;
  v_config public.promotion_campaign_configs%rowtype;
begin
  if new.status = 'approved' then
    -- Serialize activation with concurrent seller/admin listing status changes.
    perform 1 from public.listings where id = new.listing_id for update;
  end if;
  if new.status in ('pending_payment', 'pending_review', 'approved')
    and not private.is_featured_payment_target_eligible(new.listing_id) then
    raise exception 'listing is not eligible for paid promotion' using errcode = '22023';
  end if;

  if v_actor is not null then
    v_is_reviewer := coalesce(public.has_admin_permission(v_actor, 'payments.review'), false);
    v_is_reviewer_aal2 := v_is_reviewer and private.is_aal2();
  end if;

  if TG_OP = 'INSERT' then
    if v_is_reviewer_aal2 then
      return new;
    end if;

    if v_actor is null or new.user_id <> v_actor then
      raise exception 'promotion request user mismatch' using errcode = '42501';
    end if;

    if new.status <> 'pending_payment' then
      raise exception 'client cannot set payment review status' using errcode = '42501';
    end if;

    if new.promotion_type <> 'featured' then
      raise exception 'unsupported promotion type' using errcode = '22023';
    end if;

    if new.reviewed_at is not null or new.reviewed_by is not null or new.admin_note is not null or new.rejection_reason is not null then
      raise exception 'client cannot set review fields' using errcode = '42501';
    end if;

    if new.receipt_storage_path is not null or new.submitted_at is not null then
      raise exception 'receipt proof must be submitted after request creation' using errcode = '42501';
    end if;

    select *
    into v_config
    from public.promotion_campaign_configs
    where id = new.campaign_config_id
      and is_active = true
      and promotion_type = 'featured'
    limit 1;

    if not found then
      raise exception 'active promotion config not found' using errcode = '22023';
    end if;

    if new.amount <> v_config.amount
      or new.currency <> v_config.currency
      or new.provider <> v_config.provider
      or coalesce(new.payment_method, '') <> coalesce(v_config.payment_method, '')
      or coalesce(new.merchant_reference, '') <> coalesce(v_config.merchant_reference, '') then
      raise exception 'client cannot change configured payment terms' using errcode = '42501';
    end if;

    if exists (
      select 1
      from public.listing_promotions lp
      where lp.listing_id = new.listing_id
        and lp.promotion_type = 'featured'
        and (lp.ends_at is null or lp.ends_at > now())
    ) then
      raise exception 'listing already has an active featured promotion' using errcode = '23505';
    end if;

    return new;
  end if;

  if TG_OP = 'UPDATE' then
    if v_is_reviewer and not v_is_reviewer_aal2 then
      raise exception 'aal2 required' using errcode = '42501';
    end if;

    if v_is_reviewer_aal2 and not (
      old.status = 'rejected' and new.status = 'pending_review' and new.user_id = v_actor
    ) then
      return new;
    end if;

    if v_actor is null or old.user_id <> v_actor or new.user_id <> old.user_id then
      raise exception 'promotion request user mismatch' using errcode = '42501';
    end if;

    if new.listing_id <> old.listing_id
      or new.promotion_type <> old.promotion_type
      or new.campaign_config_id <> old.campaign_config_id
      or new.amount <> old.amount
      or new.currency <> old.currency
      or new.provider <> old.provider
      or coalesce(new.payment_method, '') <> coalesce(old.payment_method, '')
      or coalesce(new.merchant_reference, '') <> coalesce(old.merchant_reference, '')
      or new.expires_at <> old.expires_at
      or new.idempotency_key <> old.idempotency_key then
      raise exception 'client cannot change configured payment terms' using errcode = '42501';
    end if;

    if old.status not in ('pending_payment', 'rejected') or new.status <> 'pending_review' then
      raise exception 'client can only submit proof for review' using errcode = '42501';
    end if;

    if new.provider_status is distinct from old.provider_status then
      raise exception 'client cannot set provider status' using errcode = '42501';
    end if;

    if old.status = 'rejected' then
      -- A correction may retain or clear old review fields, never forge new ones.
      -- The AFTER trigger archives the previous review atomically before it is lost.
      if (new.reviewed_at is distinct from old.reviewed_at and new.reviewed_at is not null)
        or (new.reviewed_by is distinct from old.reviewed_by and new.reviewed_by is not null)
        or (new.admin_note is distinct from old.admin_note and new.admin_note is not null)
        or (new.rejection_reason is distinct from old.rejection_reason and new.rejection_reason is not null) then
        raise exception 'client cannot set review fields' using errcode = '42501';
      end if;
      new.reviewed_at := null;
      new.reviewed_by := null;
      new.admin_note := null;
      new.rejection_reason := null;
      new.provider_status := null;
    elsif new.reviewed_at is not null or new.reviewed_by is not null or new.admin_note is not null
      or new.rejection_reason is distinct from old.rejection_reason then
      raise exception 'client cannot set review fields' using errcode = '42501';
    end if;

    if new.receipt_storage_path is null and coalesce(trim(new.transaction_reference), '') = '' then
      raise exception 'receipt or transaction reference required' using errcode = '22023';
    end if;

    if new.receipt_mime_type is not null
      and new.receipt_mime_type not in ('image/jpeg', 'image/png', 'image/webp', 'application/pdf') then
      raise exception 'unsupported receipt MIME type' using errcode = '22023';
    end if;

    if new.receipt_file_size is not null and new.receipt_file_size > 5242880 then
      raise exception 'receipt file too large' using errcode = '22023';
    end if;

    return new;
  end if;

  return new;
end;
$$;

-- Audit all review transitions, including direct REST/RPC calls. This narrow
-- private trigger is the only definer; it grants no new client write authority.
create or replace function private.audit_featured_payment_transition()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_action text;
begin
  if old.status is not distinct from new.status then
    return new;
  end if;

  if new.status = 'pending_review' and old.status in ('pending_payment', 'rejected') then
    if v_actor is null or v_actor <> old.user_id or new.user_id <> old.user_id then
      raise exception 'promotion request user mismatch' using errcode = '42501';
    end if;
    v_action := case when old.status = 'rejected'
      then 'FEATURED_PAYMENT_PROOF_RESUBMITTED' else 'FEATURED_PAYMENT_PROOF_SUBMITTED' end;
  elsif new.status in ('approved', 'rejected') then
    if v_actor is null or not coalesce(public.has_admin_permission(v_actor, 'payments.review'), false) then
      raise exception 'forbidden' using errcode = '42501';
    end if;
    perform private.require_aal2();
    v_action := case when new.status = 'approved'
      then 'FEATURED_PAYMENT_APPROVED' else 'FEATURED_PAYMENT_REJECTED' end;
  else
    return new;
  end if;

  insert into public.audit_logs(admin_user_id, action, entity_type, entity_id, safe_changes)
  values (
    v_actor, v_action, 'promotion_payment_request', new.id::text,
    jsonb_build_object(
      'listing_id', new.listing_id,
      'amount', new.amount,
      'currency', new.currency,
      'before_status', old.status,
      'after_status', new.status,
      'previous_review', jsonb_build_object(
        'reviewed_at', old.reviewed_at, 'reviewed_by', old.reviewed_by,
        'admin_note', old.admin_note, 'rejection_reason', old.rejection_reason,
        'provider_status', old.provider_status
      ),
      'previous_proof', jsonb_build_object(
        'transaction_reference', old.transaction_reference,
        'receipt_storage_path', old.receipt_storage_path,
        'submitted_at', old.submitted_at
      ),
      'review', jsonb_build_object(
        'reviewed_at', new.reviewed_at, 'reviewed_by', new.reviewed_by,
        'admin_note', new.admin_note, 'rejection_reason', new.rejection_reason,
        'provider_status', new.provider_status
      ),
      'proof', jsonb_build_object(
        'transaction_reference', new.transaction_reference,
        'receipt_storage_path', new.receipt_storage_path,
        'submitted_at', new.submitted_at
      )
    )
  );
  return new;
end;
$$;
revoke all on function private.audit_featured_payment_transition() from public, anon, authenticated, service_role;

-- Existing audit read policies admit general admins. These rows include private
-- payment evidence, so add an AND restriction without granting any new access.
drop policy if exists audit_logs_payment_evidence_read on public.audit_logs;
create policy audit_logs_payment_evidence_read
on public.audit_logs
as restrictive
for select
to authenticated
using (
  entity_type is distinct from 'promotion_payment_request'
  or (select public.has_admin_permission(auth.uid(), 'payments.view'))
  or (select public.has_admin_permission(auth.uid(), 'payments.review'))
);

drop trigger if exists audit_featured_payment_transition on public.promotion_payment_requests;
create trigger audit_featured_payment_transition
after update on public.promotion_payment_requests
for each row execute function private.audit_featured_payment_transition();

commit;
