begin;

-- Step 3 P0 hardening: privileged payment/configuration writes must be
-- authorized at the database boundary, not only in Next.js Server Actions.
-- Ordinary seller proof submission remains AAL1-compatible.

create schema if not exists private;
grant usage on schema private to authenticated, service_role;

create or replace function private.is_aal2()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce((auth.jwt() ->> 'aal') = 'aal2', false);
$$;

create or replace function private.require_aal2()
returns void
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  if not private.is_aal2() then
    raise exception 'aal2 required' using errcode = '42501';
  end if;
end;
$$;

comment on function private.is_aal2() is
  'Returns true only when the authenticated Supabase JWT has assurance level aal2.';
comment on function private.require_aal2() is
  'Raises 42501 unless the authenticated Supabase JWT has assurance level aal2.';

revoke all on function private.is_aal2() from public, anon, authenticated;
revoke all on function private.require_aal2() from public, anon, authenticated;
grant execute on function private.is_aal2() to authenticated, service_role;
grant execute on function private.require_aal2() to authenticated, service_role;

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

    if v_is_reviewer_aal2 then
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

    if new.reviewed_at is not null or new.reviewed_by is not null or new.admin_note is not null or new.rejection_reason is distinct from old.rejection_reason then
      raise exception 'client cannot set review fields' using errcode = '42501';
    end if;

    if new.provider_status is distinct from old.provider_status then
      raise exception 'client cannot set provider status' using errcode = '42501';
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

revoke all on function public.guard_promotion_payment_request_mutation() from public, anon;
grant execute on function public.guard_promotion_payment_request_mutation() to authenticated, service_role;

drop policy if exists promotion_campaign_configs_super_admin_manage on public.promotion_campaign_configs;
drop policy if exists promotion_campaign_configs_admin_insert on public.promotion_campaign_configs;
drop policy if exists promotion_campaign_configs_admin_update on public.promotion_campaign_configs;
drop policy if exists promotion_campaign_configs_admin_delete on public.promotion_campaign_configs;

create policy promotion_campaign_configs_admin_insert
on public.promotion_campaign_configs for insert
to authenticated
with check (
  (select private.is_aal2())
  and (
    (select public.has_admin_permission((select auth.uid()), 'payments.configure'))
    or (select public.has_admin_permission((select auth.uid()), 'settings.update'))
  )
);

create policy promotion_campaign_configs_admin_update
on public.promotion_campaign_configs for update
to authenticated
using (
  (select private.is_aal2())
  and (
    (select public.has_admin_permission((select auth.uid()), 'payments.configure'))
    or (select public.has_admin_permission((select auth.uid()), 'settings.update'))
  )
)
with check (
  (select private.is_aal2())
  and (
    (select public.has_admin_permission((select auth.uid()), 'payments.configure'))
    or (select public.has_admin_permission((select auth.uid()), 'settings.update'))
  )
);

create policy promotion_campaign_configs_admin_delete
on public.promotion_campaign_configs for delete
to authenticated
using (
  (select private.is_aal2())
  and (
    (select public.has_admin_permission((select auth.uid()), 'payments.configure'))
    or (select public.has_admin_permission((select auth.uid()), 'settings.update'))
  )
);

drop policy if exists promotion_payment_requests_admin_review on public.promotion_payment_requests;
create policy promotion_payment_requests_admin_review
on public.promotion_payment_requests for update
to authenticated
using (
  (select private.is_aal2())
  and (select public.has_admin_permission((select auth.uid()), 'payments.review'))
)
with check (
  (select private.is_aal2())
  and (select public.has_admin_permission((select auth.uid()), 'payments.review'))
);

create or replace function public.approve_featured_payment_request(
  p_request_id uuid,
  p_admin_note text default null
)
returns table(request_id uuid, promotion_id uuid, featured_until timestamptz)
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := (select auth.uid());
  v_request public.promotion_payment_requests%rowtype;
  v_config public.promotion_campaign_configs%rowtype;
  v_promotion_id uuid;
  v_featured_until timestamptz;
begin
  if v_actor is null or not coalesce(public.has_admin_permission(v_actor, 'payments.review'), false) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  perform private.require_aal2();

  select *
  into v_request
  from public.promotion_payment_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'payment request not found' using errcode = 'P0002';
  end if;

  if v_request.status = 'approved' then
    select lp.id, lp.ends_at
    into v_promotion_id, v_featured_until
    from public.listing_promotions lp
    where lp.payment_request_id = p_request_id
    limit 1;

    request_id := p_request_id;
    promotion_id := v_promotion_id;
    featured_until := v_featured_until;
    return next;
    return;
  end if;

  if v_request.status <> 'pending_review' then
    raise exception 'payment request is not pending review' using errcode = '22023';
  end if;

  select *
  into v_config
  from public.promotion_campaign_configs
  where id = v_request.campaign_config_id
    and promotion_type = 'featured'
  limit 1;

  if not found then
    raise exception 'promotion campaign config missing' using errcode = '22023';
  end if;

  v_featured_until := now() + make_interval(days => v_config.duration_days);

  update public.promotion_payment_requests
  set status = 'approved',
      reviewed_at = now(),
      reviewed_by = v_actor,
      admin_note = nullif(trim(coalesce(p_admin_note, '')), ''),
      rejection_reason = null,
      provider_status = coalesce(provider_status, 'manual_review_approved'),
      updated_at = now()
  where id = p_request_id;

  insert into public.listing_promotions (
    listing_id,
    promotion_type,
    starts_at,
    ends_at,
    created_by,
    payment_request_id,
    metadata
  ) values (
    v_request.listing_id,
    'featured',
    now(),
    v_featured_until,
    v_actor,
    p_request_id,
    jsonb_build_object(
      'provider', v_request.provider::text,
      'campaign_key', v_config.key,
      'amount', v_request.amount,
      'currency', v_request.currency,
      'manual_review', true
    )
  )
  on conflict (payment_request_id) where payment_request_id is not null
  do update set
    ends_at = excluded.ends_at,
    metadata = public.listing_promotions.metadata || excluded.metadata
  returning id into v_promotion_id;

  update public.listings
  set featured = true,
      featured_until = v_featured_until,
      updated_at = now()
  where id = v_request.listing_id;

  request_id := p_request_id;
  promotion_id := v_promotion_id;
  featured_until := v_featured_until;
  return next;
end;
$$;

create or replace function public.reject_featured_payment_request(
  p_request_id uuid,
  p_rejection_reason text,
  p_admin_note text default null
)
returns boolean
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := (select auth.uid());
  v_request public.promotion_payment_requests%rowtype;
begin
  if v_actor is null or not coalesce(public.has_admin_permission(v_actor, 'payments.review'), false) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  perform private.require_aal2();

  if char_length(trim(coalesce(p_rejection_reason, ''))) < 3 then
    raise exception 'rejection reason required' using errcode = '22023';
  end if;

  select *
  into v_request
  from public.promotion_payment_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'payment request not found' using errcode = 'P0002';
  end if;

  if v_request.status = 'approved' then
    raise exception 'approved payment requests cannot be rejected' using errcode = '22023';
  end if;

  if v_request.status = 'rejected' then
    return true;
  end if;

  if v_request.status <> 'pending_review' then
    raise exception 'payment request is not pending review' using errcode = '22023';
  end if;

  update public.promotion_payment_requests
  set status = 'rejected',
      reviewed_at = now(),
      reviewed_by = v_actor,
      rejection_reason = left(trim(p_rejection_reason), 2000),
      admin_note = nullif(left(trim(coalesce(p_admin_note, '')), 2000), ''),
      provider_status = coalesce(provider_status, 'manual_review_rejected'),
      updated_at = now()
  where id = p_request_id;

  return true;
end;
$$;

revoke all on function public.approve_featured_payment_request(uuid, text) from public, anon, authenticated;
grant execute on function public.approve_featured_payment_request(uuid, text) to authenticated, service_role;
revoke all on function public.reject_featured_payment_request(uuid, text, text) from public, anon, authenticated;
grant execute on function public.reject_featured_payment_request(uuid, text, text) to authenticated, service_role;

drop policy if exists listing_promotions_admin_manage on public.listing_promotions;
drop policy if exists listing_promotions_admin_insert on public.listing_promotions;
drop policy if exists listing_promotions_admin_update on public.listing_promotions;
drop policy if exists listing_promotions_admin_delete on public.listing_promotions;

create policy listing_promotions_admin_insert
on public.listing_promotions for insert
to authenticated
with check (
  (select private.is_aal2())
  and (
    (select public.has_admin_permission((select auth.uid()), 'listings.feature'))
    or (select public.has_admin_permission((select auth.uid()), 'payments.review'))
  )
);

create policy listing_promotions_admin_update
on public.listing_promotions for update
to authenticated
using (
  (select private.is_aal2())
  and (
    (select public.has_admin_permission((select auth.uid()), 'listings.feature'))
    or (select public.has_admin_permission((select auth.uid()), 'payments.review'))
  )
)
with check (
  (select private.is_aal2())
  and (
    (select public.has_admin_permission((select auth.uid()), 'listings.feature'))
    or (select public.has_admin_permission((select auth.uid()), 'payments.review'))
  )
);

create policy listing_promotions_admin_delete
on public.listing_promotions for delete
to authenticated
using (
  (select private.is_aal2())
  and (
    (select public.has_admin_permission((select auth.uid()), 'listings.feature'))
    or (select public.has_admin_permission((select auth.uid()), 'payments.review'))
  )
);

commit;
