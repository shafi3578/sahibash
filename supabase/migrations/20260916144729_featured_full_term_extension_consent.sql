-- Explicit seller consent precedes payment instructions. Legacy requests are not
-- backfilled: neither a reviewer nor a seller can manufacture historical consent.
begin;

alter table public.promotion_payment_requests
  add column extension_consent_version text,
  add column extension_consented_at timestamptz,
  add column purchased_duration_days integer,
  add column consented_config_updated_at timestamptz,
  add column payment_instructions_snapshot jsonb,
  add column approval_expires_at_before timestamptz,
  add column approval_expires_at_after timestamptz,
  add constraint featured_extension_consent_complete check (
    (extension_consent_version is null and extension_consented_at is null and purchased_duration_days is null
      and consented_config_updated_at is null and payment_instructions_snapshot is null)
    or (extension_consent_version is not null and char_length(extension_consent_version) <= 64
      and extension_consented_at is not null and purchased_duration_days is not null and purchased_duration_days between 1 and 365
      and consented_config_updated_at is not null and payment_instructions_snapshot is not null
      and jsonb_typeof(payment_instructions_snapshot) = 'object')
  ),
  add constraint featured_approval_expiry_complete check (
    (approval_expires_at_before is null and approval_expires_at_after is null)
    or (approval_expires_at_before is not null and approval_expires_at_after is not null and approval_expires_at_after >= approval_expires_at_before)
  );

create or replace function private.guard_featured_extension_consent()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_config public.promotion_campaign_configs%rowtype;
  v_expiry timestamptz;
  v_approved_at timestamptz;
  v_featured_until timestamptz;
begin
  if TG_OP = 'INSERT' then
    if v_actor is null or new.user_id is distinct from v_actor
      or not exists (select 1 from public.listings where id = new.listing_id and user_id = v_actor) then
      raise exception 'only the listing owner can consent' using errcode = '42501';
    end if;
    if new.status <> 'pending_payment'
      or new.extension_consent_version is distinct from 'featured-full-term-v1'
      or new.extension_consented_at is not null
      or new.payment_instructions_snapshot is not null
      or new.approval_expires_at_before is not null or new.approval_expires_at_after is not null then
      raise exception 'explicit owner extension consent required' using errcode = '22023';
    end if;
    select * into v_config from public.promotion_campaign_configs
    where id = new.campaign_config_id and is_active = true and promotion_type = 'featured';
    if not found or new.purchased_duration_days is distinct from v_config.duration_days
      or new.consented_config_updated_at is distinct from v_config.updated_at
      or new.amount is distinct from v_config.amount or new.currency is distinct from v_config.currency
      or new.provider is distinct from v_config.provider
      or new.payment_method is distinct from v_config.payment_method
      or new.merchant_reference is distinct from v_config.merchant_reference then
      raise exception 'consented campaign terms changed' using errcode = '22023';
    end if;
    new.extension_consent_version := 'featured-full-term-v1';
    new.extension_consented_at := clock_timestamp();
    new.purchased_duration_days := v_config.duration_days;
    new.consented_config_updated_at := v_config.updated_at;
    new.payment_instructions_snapshot := jsonb_build_object(
      'en', v_config.instructions_en, 'fa', v_config.instructions_fa, 'ps', v_config.instructions_ps
    );
    return new;
  end if;

  if new.extension_consent_version is distinct from old.extension_consent_version
    or new.extension_consented_at is distinct from old.extension_consented_at
    or new.purchased_duration_days is distinct from old.purchased_duration_days
    or new.consented_config_updated_at is distinct from old.consented_config_updated_at
    or new.payment_instructions_snapshot is distinct from old.payment_instructions_snapshot
    or new.user_id is distinct from old.user_id or new.listing_id is distinct from old.listing_id
    or new.campaign_config_id is distinct from old.campaign_config_id
    or new.amount is distinct from old.amount or new.currency is distinct from old.currency
    or new.provider is distinct from old.provider or new.payment_method is distinct from old.payment_method
    or new.merchant_reference is distinct from old.merchant_reference
    or new.approval_expires_at_before is distinct from old.approval_expires_at_before
    or new.approval_expires_at_after is distinct from old.approval_expires_at_after then
    raise exception 'consent and purchased terms are immutable' using errcode = '42501';
  end if;

  if old.status = 'approved' and new.status <> 'approved' then
    raise exception 'approved payment requests cannot be reopened' using errcode = '42501';
  end if;
  if new.status in ('pending_review', 'approved') and (
    new.extension_consent_version is distinct from 'featured-full-term-v1'
    or new.extension_consented_at is null or new.purchased_duration_days is null
    or new.purchased_duration_days not between 1 and 365
  ) and old.status <> 'approved' then
    raise exception 'recorded owner extension consent required' using errcode = '22023';
  end if;

  if new.status = 'approved' and old.status <> 'approved' then
    if old.status <> 'pending_review' then
      raise exception 'payment request is not pending review' using errcode = '22023';
    end if;
    if v_actor is null or not coalesce(public.has_admin_permission(v_actor, 'payments.review'), false) then
      raise exception 'forbidden' using errcode = '42501';
    end if;
    perform private.require_aal2();

    -- The payment row is already locked by UPDATE; keep RPC lock order payment -> listing.
    select expires_at into v_expiry from public.listings where id = new.listing_id for update;
    v_approved_at := clock_timestamp();
    if not found or v_expiry is null or v_expiry <= v_approved_at
      or not private.is_featured_payment_target_eligible(new.listing_id) then
      raise exception 'listing is not eligible for paid promotion' using errcode = '22023';
    end if;
    v_featured_until := v_approved_at + make_interval(days => new.purchased_duration_days);
    new.approval_expires_at_before := v_expiry;
    new.approval_expires_at_after := greatest(v_expiry, v_featured_until);
    new.reviewed_at := v_approved_at;
    new.reviewed_by := v_actor;

    -- No status/publication/freshness changes: never revive an expired, sold or removed ad.
    update public.listings
    set expires_at = new.approval_expires_at_after, featured = true,
        featured_until = v_featured_until, updated_at = v_approved_at
    where id = new.listing_id;
    if not found then
      raise exception 'listing activation was not persisted' using errcode = '42501';
    end if;
    insert into public.listing_promotions (
      listing_id, promotion_type, starts_at, ends_at, created_by, payment_request_id, metadata
    ) values (
      new.listing_id, 'featured', v_approved_at, v_featured_until, v_actor, new.id,
      jsonb_build_object('provider', new.provider::text, 'amount', new.amount, 'currency', new.currency,
        'manual_review', true, 'consent_version', new.extension_consent_version,
        'consented_at', new.extension_consented_at, 'duration_days', new.purchased_duration_days,
        'listing_expiry_before', new.approval_expires_at_before, 'listing_expiry_after', new.approval_expires_at_after)
    );
  end if;
  return new;
end;
$$;
revoke all on function private.guard_featured_extension_consent() from public, anon, authenticated, service_role;

-- BEFORE triggers run alphabetically: consent/activation first, existing proof,
-- eligibility and AAL2 mutation guard second; AFTER audit sees final server values.
create trigger guard_featured_extension_consent
before insert or update on public.promotion_payment_requests
for each row execute function private.guard_featured_extension_consent();

create or replace function public.approve_featured_payment_request(
  p_request_id uuid, p_admin_note text default null
)
returns table(request_id uuid, promotion_id uuid, featured_until timestamptz)
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := (select auth.uid());
  v_request public.promotion_payment_requests%rowtype;
  v_promotion_id uuid;
  v_featured_until timestamptz;
begin
  if v_actor is null or not coalesce(public.has_admin_permission(v_actor, 'payments.review'), false) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  perform private.require_aal2();
  select * into v_request from public.promotion_payment_requests where id = p_request_id for update;
  if not found then
    raise exception 'payment request not found' using errcode = 'P0002';
  end if;
  if v_request.status <> 'approved' then
    if v_request.status <> 'pending_review' then
      raise exception 'payment request is not pending review' using errcode = '22023';
    end if;
    -- The consent trigger performs activation for both RPC and direct authorized
    -- UPDATE. All changes and the existing private audit are one transaction.
    update public.promotion_payment_requests
    set status = 'approved', reviewed_at = now(), reviewed_by = v_actor,
        admin_note = nullif(trim(coalesce(p_admin_note, '')), ''), rejection_reason = null,
        provider_status = coalesce(provider_status, 'manual_review_approved'), updated_at = now()
    where id = p_request_id;
    if not found then
      raise exception 'payment approval was not persisted' using errcode = '42501';
    end if;
  end if;
  select lp.id, lp.ends_at into v_promotion_id, v_featured_until
  from public.listing_promotions lp where lp.payment_request_id = p_request_id limit 1;
  request_id := p_request_id;
  promotion_id := v_promotion_id;
  featured_until := v_featured_until;
  return next;
end;
$$;
revoke all on function public.approve_featured_payment_request(uuid, text) from public, anon, authenticated;
grant execute on function public.approve_featured_payment_request(uuid, text) to authenticated, service_role;

-- The existing payment-only restrictive audit SELECT policy remains unchanged.
-- Replaced below only to add immutable consent and actual expiry-change evidence.

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
      'extension_consent', jsonb_build_object(
        'version', new.extension_consent_version, 'consented_at', new.extension_consented_at,
        'config_updated_at', new.consented_config_updated_at,
        'duration_days', new.purchased_duration_days
      ),
      'listing_expiry', jsonb_build_object(
        'before', new.approval_expires_at_before, 'after', new.approval_expires_at_after
      ),
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

commit;
