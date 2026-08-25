begin;

-- Step 3 foundation: featured payment requests, launch campaign config,
-- private receipt storage, AI search/moderation telemetry, and operational
-- Admin/Super Admin permissions. All changes are additive and preserve the
-- existing listings/listing_promotions domain.
-- Applied to the linked Supabase project as migration 20260825001346.

create schema if not exists private;

do $$
begin
  create type public.promotion_payment_provider as enum ('hesabpay');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.promotion_payment_request_status as enum (
    'pending_payment',
    'pending_review',
    'approved',
    'rejected',
    'expired',
    'cancelled'
  );
exception when duplicate_object then null;
end $$;

alter type public.notification_type add value if not exists 'featured_payment_review';
alter type public.notification_type add value if not exists 'featured_approved';
alter type public.notification_type add value if not exists 'featured_rejected';
alter type public.notification_type add value if not exists 'featured_expiring';
alter type public.notification_type add value if not exists 'listing_changes_required';
alter type public.notification_type add value if not exists 'claim_accepted';
alter type public.notification_type add value if not exists 'claim_rejected';
alter type public.notification_type add value if not exists 'wanted_match';

alter table public.listings
  add column if not exists featured_until timestamptz;

comment on column public.listings.featured_until is
  'Server-controlled featured expiry. Public UI must resolve featured=false when this timestamp is in the past.';

create index if not exists idx_listings_featured_until_active
  on public.listings(featured_until desc)
  where featured = true and featured_until is not null;

create table if not exists public.promotion_campaign_configs (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z0-9_-]{2,64}$'),
  promotion_type public.promotion_type not null default 'featured',
  name_en text not null check (char_length(name_en) between 1 and 120),
  name_fa text not null check (char_length(name_fa) between 1 and 120),
  name_ps text not null check (char_length(name_ps) between 1 and 120),
  amount numeric(14,2) not null check (amount > 0 and amount <= 1000000),
  currency text not null default 'AFN' check (currency = 'AFN'),
  duration_days integer not null default 7 check (duration_days between 1 and 365),
  provider public.promotion_payment_provider not null default 'hesabpay',
  payment_method text check (payment_method is null or char_length(payment_method) <= 120),
  merchant_reference text check (merchant_reference is null or char_length(merchant_reference) <= 240),
  instructions_en text not null check (char_length(instructions_en) between 1 and 2000),
  instructions_fa text not null check (char_length(instructions_fa) between 1 and 2000),
  instructions_ps text not null check (char_length(instructions_ps) between 1 and 2000),
  qr_storage_path text check (qr_storage_path is null or char_length(qr_storage_path) <= 500),
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object' and pg_column_size(metadata) <= 4096),
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint promotion_campaign_configs_featured_only
    check (promotion_type = 'featured')
);

comment on table public.promotion_campaign_configs is
  'Super Admin configurable promotion pricing/duration/payment references. No provider secrets are stored here.';

drop trigger if exists promotion_campaign_configs_set_updated_at on public.promotion_campaign_configs;
create trigger promotion_campaign_configs_set_updated_at
before update on public.promotion_campaign_configs
for each row execute function public.set_updated_at();

insert into public.promotion_campaign_configs (
  key,
  promotion_type,
  name_en,
  name_fa,
  name_ps,
  amount,
  currency,
  duration_days,
  provider,
  payment_method,
  merchant_reference,
  instructions_en,
  instructions_fa,
  instructions_ps,
  is_active,
  metadata
) values (
  'featured_launch',
  'featured',
  'Featured launch campaign',
  'کمپاین آغازین اعلان ویژه',
  'د ځانګړي اعلان د پیل کمپاین',
  10,
  'AFN',
  7,
  'hesabpay',
  'HesabPay manual proof',
  'Configure merchant destination in Super Admin before launch',
  'Pay with HesabPay using the official Sahibash merchant details, then upload your receipt or transaction reference. Your listing becomes Featured only after Admin verification.',
  'از طریق HesabPay با جزئیات رسمی تاجر صاحبش پرداخت کنید، سپس رسید یا شماره تراکنش را بارگذاری نمایید. اعلان شما فقط پس از تأیید ادمین ویژه می‌شود.',
  'د صاحبش رسمي سوداګریز معلوماتو له لارې په HesabPay پیسې ورکړئ، بیا رسید یا د معاملې شمېره پورته کړئ. اعلان یوازې د اډمین له تایید وروسته ځانګړی کېږي.',
  true,
  '{"launch_price":true,"manual_review_required":true}'::jsonb
) on conflict (key) do update set
  amount = excluded.amount,
  currency = excluded.currency,
  duration_days = excluded.duration_days,
  provider = excluded.provider,
  payment_method = excluded.payment_method,
  merchant_reference = coalesce(nullif(public.promotion_campaign_configs.merchant_reference, ''), excluded.merchant_reference),
  instructions_en = excluded.instructions_en,
  instructions_fa = excluded.instructions_fa,
  instructions_ps = excluded.instructions_ps,
  is_active = excluded.is_active,
  metadata = public.promotion_campaign_configs.metadata || excluded.metadata,
  updated_at = now();

create table if not exists public.promotion_payment_requests (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  promotion_type public.promotion_type not null default 'featured',
  campaign_config_id uuid not null references public.promotion_campaign_configs(id) on delete restrict,
  amount numeric(14,2) not null check (amount > 0 and amount <= 1000000),
  currency text not null default 'AFN' check (currency = 'AFN'),
  provider public.promotion_payment_provider not null default 'hesabpay',
  payment_method text check (payment_method is null or char_length(payment_method) <= 120),
  merchant_reference text check (merchant_reference is null or char_length(merchant_reference) <= 240),
  transaction_reference text check (transaction_reference is null or char_length(transaction_reference) between 3 and 240),
  receipt_storage_path text check (receipt_storage_path is null or char_length(receipt_storage_path) <= 500),
  receipt_mime_type text check (
    receipt_mime_type is null
    or receipt_mime_type in ('image/jpeg', 'image/png', 'image/webp', 'application/pdf')
  ),
  receipt_file_size integer check (receipt_file_size is null or (receipt_file_size > 0 and receipt_file_size <= 5242880)),
  provider_status text check (provider_status is null or char_length(provider_status) <= 120),
  status public.promotion_payment_request_status not null default 'pending_payment',
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  admin_note text check (admin_note is null or char_length(admin_note) <= 2000),
  rejection_reason text check (rejection_reason is null or char_length(rejection_reason) <= 2000),
  expires_at timestamptz not null default (now() + interval '7 days'),
  idempotency_key text not null check (char_length(idempotency_key) between 16 and 160),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object' and pg_column_size(metadata) <= 4096),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint promotion_payment_requests_featured_only
    check (promotion_type = 'featured')
);

comment on table public.promotion_payment_requests is
  'Manual or future-provider payment request records. Listing promotions are created only after Admin approval.';
comment on column public.promotion_payment_requests.receipt_storage_path is
  'Path in private payment-receipts bucket. Receipt upload is proof for review only, never automatic payment verification.';

drop trigger if exists promotion_payment_requests_set_updated_at on public.promotion_payment_requests;
create trigger promotion_payment_requests_set_updated_at
before update on public.promotion_payment_requests
for each row execute function public.set_updated_at();

create unique index if not exists promotion_payment_requests_user_idempotency_key
  on public.promotion_payment_requests(user_id, idempotency_key);

create unique index if not exists promotion_payment_requests_one_pending_per_listing
  on public.promotion_payment_requests(listing_id, promotion_type)
  where status in ('pending_payment', 'pending_review');

create index if not exists idx_promotion_payment_requests_status_submitted
  on public.promotion_payment_requests(status, submitted_at desc nulls last, created_at desc);
create index if not exists idx_promotion_payment_requests_listing
  on public.promotion_payment_requests(listing_id, created_at desc);
create index if not exists idx_promotion_payment_requests_user
  on public.promotion_payment_requests(user_id, created_at desc);
create index if not exists idx_promotion_payment_requests_reviewed_by
  on public.promotion_payment_requests(reviewed_by, reviewed_at desc)
  where reviewed_by is not null;

alter table public.listing_promotions
  add column if not exists payment_request_id uuid references public.promotion_payment_requests(id) on delete set null;

create unique index if not exists listing_promotions_payment_request_id_unique
  on public.listing_promotions(payment_request_id)
  where payment_request_id is not null;

create index if not exists idx_listing_promotions_active_featured
  on public.listing_promotions(listing_id, starts_at desc, ends_at desc)
  where promotion_type = 'featured';

create or replace function public.guard_promotion_payment_request_mutation()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := (select auth.uid());
  v_is_reviewer boolean := false;
  v_config public.promotion_campaign_configs%rowtype;
begin
  if v_actor is not null then
    v_is_reviewer := coalesce(public.has_admin_permission(v_actor, 'payments.review'), false);
  end if;

  if TG_OP = 'INSERT' then
    if v_is_reviewer then
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
    if v_is_reviewer then
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

drop trigger if exists guard_promotion_payment_request_mutation on public.promotion_payment_requests;
create trigger guard_promotion_payment_request_mutation
before insert or update on public.promotion_payment_requests
for each row execute function public.guard_promotion_payment_request_mutation();

alter table public.promotion_campaign_configs enable row level security;
alter table public.promotion_payment_requests enable row level security;

drop policy if exists promotion_campaign_configs_public_active_read on public.promotion_campaign_configs;
create policy promotion_campaign_configs_public_active_read
on public.promotion_campaign_configs for select
to anon, authenticated
using (is_active = true);

drop policy if exists promotion_campaign_configs_admin_read on public.promotion_campaign_configs;
create policy promotion_campaign_configs_admin_read
on public.promotion_campaign_configs for select
to authenticated
using ((select public.has_admin_permission((select auth.uid()), 'payments.view'))
   or (select public.has_admin_permission((select auth.uid()), 'payments.configure'))
   or (select public.has_admin_permission((select auth.uid()), 'settings.update')));

drop policy if exists promotion_campaign_configs_super_admin_manage on public.promotion_campaign_configs;
create policy promotion_campaign_configs_super_admin_manage
on public.promotion_campaign_configs for all
to authenticated
using ((select public.has_admin_permission((select auth.uid()), 'payments.configure'))
   or (select public.has_admin_permission((select auth.uid()), 'settings.update')))
with check ((select public.has_admin_permission((select auth.uid()), 'payments.configure'))
   or (select public.has_admin_permission((select auth.uid()), 'settings.update')));

drop policy if exists promotion_payment_requests_owner_select on public.promotion_payment_requests;
create policy promotion_payment_requests_owner_select
on public.promotion_payment_requests for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists promotion_payment_requests_admin_select on public.promotion_payment_requests;
create policy promotion_payment_requests_admin_select
on public.promotion_payment_requests for select
to authenticated
using ((select public.has_admin_permission((select auth.uid()), 'payments.view'))
   or (select public.has_admin_permission((select auth.uid()), 'payments.review')));

drop policy if exists promotion_payment_requests_owner_insert on public.promotion_payment_requests;
create policy promotion_payment_requests_owner_insert
on public.promotion_payment_requests for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and status = 'pending_payment'
  and promotion_type = 'featured'
  and exists (
    select 1
    from public.listings l
    where l.id = listing_id
      and l.user_id = (select auth.uid())
      and l.status in ('pending', 'approved')
      and coalesce(l.publication_status::text, 'published') not in ('removed', 'archived')
  )
);

drop policy if exists promotion_payment_requests_owner_submit_proof on public.promotion_payment_requests;
create policy promotion_payment_requests_owner_submit_proof
on public.promotion_payment_requests for update
to authenticated
using (
  user_id = (select auth.uid())
  and status in ('pending_payment', 'rejected')
)
with check (
  user_id = (select auth.uid())
  and status = 'pending_review'
);

drop policy if exists promotion_payment_requests_admin_review on public.promotion_payment_requests;
create policy promotion_payment_requests_admin_review
on public.promotion_payment_requests for update
to authenticated
using ((select public.has_admin_permission((select auth.uid()), 'payments.review')))
with check ((select public.has_admin_permission((select auth.uid()), 'payments.review')));

revoke all on table public.promotion_campaign_configs from anon, authenticated;
grant select on table public.promotion_campaign_configs to anon, authenticated;
grant insert, update, delete on table public.promotion_campaign_configs to authenticated;
grant all on table public.promotion_campaign_configs to service_role;

revoke all on table public.promotion_payment_requests from anon, authenticated;
grant select, insert, update on table public.promotion_payment_requests to authenticated;
grant all on table public.promotion_payment_requests to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-receipts',
  'payment-receipts',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']::text[]
)
on conflict (id) do update set
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']::text[];

drop policy if exists payment_receipts_owner_upload on storage.objects;
create policy payment_receipts_owner_upload
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'payment-receipts'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists payment_receipts_owner_read on storage.objects;
create policy payment_receipts_owner_read
on storage.objects for select
to authenticated
using (
  bucket_id = 'payment-receipts'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists payment_receipts_admin_read on storage.objects;
create policy payment_receipts_admin_read
on storage.objects for select
to authenticated
using (
  bucket_id = 'payment-receipts'
  and (
    (select public.has_admin_permission((select auth.uid()), 'payments.view'))
    or (select public.has_admin_permission((select auth.uid()), 'payments.review'))
  )
);

drop policy if exists payment_receipts_owner_update on storage.objects;
create policy payment_receipts_owner_update
on storage.objects for update
to authenticated
using (
  bucket_id = 'payment-receipts'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'payment-receipts'
  and (storage.foldername(name))[1] = (select auth.uid())::text
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

revoke all on function public.approve_featured_payment_request(uuid, text) from public;
grant execute on function public.approve_featured_payment_request(uuid, text) to authenticated, service_role;
revoke all on function public.reject_featured_payment_request(uuid, text, text) from public;
grant execute on function public.reject_featured_payment_request(uuid, text, text) to authenticated, service_role;

create table if not exists public.ai_search_parse_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  locale text not null check (locale in ('en', 'fa', 'ps')),
  raw_query_hash text not null check (raw_query_hash ~ '^[a-f0-9]{64}$'),
  parser_source text not null default 'deterministic' check (parser_source in ('deterministic', 'llm', 'hybrid')),
  confidence numeric(5,4) check (confidence is null or confidence between 0 and 1),
  interpreted_filters jsonb not null default '{}'::jsonb check (jsonb_typeof(interpreted_filters) = 'object' and pg_column_size(interpreted_filters) <= 4096),
  chips jsonb not null default '[]'::jsonb check (jsonb_typeof(chips) = 'array' and pg_column_size(chips) <= 4096),
  result_count integer not null default 0 check (result_count >= 0),
  zero_result boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.ai_search_parse_events enable row level security;
drop policy if exists ai_search_parse_events_privacy_safe_insert on public.ai_search_parse_events;
create policy ai_search_parse_events_privacy_safe_insert
on public.ai_search_parse_events for insert
to anon, authenticated
with check (
  actor_user_id is null or actor_user_id = (select auth.uid())
);
drop policy if exists ai_search_parse_events_admin_read on public.ai_search_parse_events;
create policy ai_search_parse_events_admin_read
on public.ai_search_parse_events for select
to authenticated
using ((select public.has_admin_permission((select auth.uid()), 'search.view'))
   or (select public.has_admin_permission((select auth.uid()), 'ai.view')));
revoke all on table public.ai_search_parse_events from anon, authenticated;
grant insert on table public.ai_search_parse_events to anon, authenticated;
grant select on table public.ai_search_parse_events to authenticated;
grant all on table public.ai_search_parse_events to service_role;
create index if not exists idx_ai_search_parse_events_zero_result
  on public.ai_search_parse_events(zero_result, created_at desc);
create index if not exists idx_ai_search_parse_events_locale_created
  on public.ai_search_parse_events(locale, created_at desc);

create table if not exists public.ai_moderation_reviews (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  ai_detection_log_id bigint references public.ai_detection_logs(id) on delete set null,
  mode text not null default 'shadow' check (mode in ('shadow', 'sampled_auto_approve', 'human_review_hold')),
  decision_suggestion text not null check (decision_suggestion in ('approve', 'review', 'block')),
  confidence numeric(5,4) not null check (confidence between 0 and 1),
  quality_score numeric(5,4) check (quality_score is null or quality_score between 0 and 1),
  category_confidence numeric(5,4) check (category_confidence is null or category_confidence between 0 and 1),
  prohibited_content_signals text[] not null default '{}'::text[],
  spam_signals text[] not null default '{}'::text[],
  duplicate_signals text[] not null default '{}'::text[],
  phone_in_description boolean not null default false,
  suspicious_price boolean not null default false,
  reason_codes text[] not null default '{}'::text[],
  seller_safe_explanation text check (seller_safe_explanation is null or char_length(seller_safe_explanation) <= 2000),
  human_decision text check (human_decision is null or human_decision in ('approve', 'review', 'block', 'dismissed')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.ai_moderation_reviews enable row level security;
drop policy if exists ai_moderation_reviews_admin_read on public.ai_moderation_reviews;
create policy ai_moderation_reviews_admin_read
on public.ai_moderation_reviews for select
to authenticated
using ((select public.has_admin_permission((select auth.uid()), 'ai.view'))
   or (select public.has_admin_permission((select auth.uid()), 'listings.moderate')));
drop policy if exists ai_moderation_reviews_admin_manage on public.ai_moderation_reviews;
create policy ai_moderation_reviews_admin_manage
on public.ai_moderation_reviews for all
to authenticated
using ((select public.has_admin_permission((select auth.uid()), 'ai.moderate'))
   or (select public.has_admin_permission((select auth.uid()), 'listings.moderate')))
with check ((select public.has_admin_permission((select auth.uid()), 'ai.moderate'))
   or (select public.has_admin_permission((select auth.uid()), 'listings.moderate')));
revoke all on table public.ai_moderation_reviews from anon, authenticated;
grant select, insert, update on table public.ai_moderation_reviews to authenticated;
grant all on table public.ai_moderation_reviews to service_role;
create index if not exists idx_ai_moderation_reviews_listing_created
  on public.ai_moderation_reviews(listing_id, created_at desc);
create index if not exists idx_ai_moderation_reviews_decision
  on public.ai_moderation_reviews(decision_suggestion, confidence desc, created_at desc);

insert into public.feature_flags(key, description, enabled, rollout_percent)
values
  ('featured_payments_hesabpay_manual', 'Enable HesabPay manual proof workflow for Featured listing requests.', true, 100),
  ('sahibash_ai_search_parser', 'Enable deterministic Sahibash AI natural-language search parser entry point.', true, 100),
  ('ai_moderation_shadow', 'Record AI moderation suggestions in shadow mode; human/rules remain final authority.', true, 100),
  ('professional_seller_dashboard', 'Show professional seller dashboard foundation using seller entity data.', true, 100)
on conflict (key) do update set
  description = excluded.description,
  enabled = excluded.enabled,
  rollout_percent = excluded.rollout_percent,
  updated_at = now();

insert into public.admin_permissions (key, description)
values
  ('payments.view', 'View Featured payment requests and promotion payment history'),
  ('payments.review', 'Approve or reject Featured payment proof after verification'),
  ('payments.configure', 'Configure promotion pricing, duration and payment provider references'),
  ('ai.view', 'View Sahibash AI search and moderation telemetry'),
  ('ai.configure', 'Configure Sahibash AI routing and launch controls'),
  ('ai.moderate', 'Review AI moderation suggestions and override shadow decisions'),
  ('system.health.view', 'View launch health, advisor and deployment readiness summaries'),
  ('business_sellers.view', 'View professional/business seller dashboard data'),
  ('business_sellers.manage', 'Manage professional/business seller verification and team settings')
on conflict (key) do update set description = excluded.description, updated_at = now();

insert into public.admin_role_permissions (role_id, permission_id)
select role.id, perm.id
from public.admin_roles role
join public.admin_permissions perm on true
where role.name = 'super_administrator'
on conflict do nothing;

insert into public.admin_role_permissions (role_id, permission_id)
select role.id, perm.id
from public.admin_roles role
join public.admin_permissions perm on perm.key in (
  'payments.view',
  'payments.review',
  'ai.view',
  'ai.moderate',
  'system.health.view',
  'business_sellers.view'
)
where role.name = 'marketplace_administrator'
on conflict do nothing;

insert into public.admin_role_permissions (role_id, permission_id)
select role.id, perm.id
from public.admin_roles role
join public.admin_permissions perm on perm.key in (
  'payments.view',
  'ai.view',
  'system.health.view'
)
where role.name = 'support_agent'
on conflict do nothing;

commit;
