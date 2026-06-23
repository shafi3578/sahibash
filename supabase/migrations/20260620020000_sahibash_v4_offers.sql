-- V4 offers / orders workflow

create type public.offer_status as enum ('pending', 'accepted', 'rejected', 'cancelled');

create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  buyer_user_id uuid not null references auth.users(id) on delete cascade,
  seller_user_id uuid not null references auth.users(id) on delete cascade,
  offered_price numeric(14,2) not null check (offered_price > 0),
  currency public.currency_code not null,
  status public.offer_status not null default 'pending',
  buyer_note text,
  seller_response_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint offers_buyer_seller_diff check (buyer_user_id <> seller_user_id)
);

create index if not exists idx_offers_seller_status_created
  on public.offers(seller_user_id, status, created_at desc);

create index if not exists idx_offers_buyer_status_created
  on public.offers(buyer_user_id, status, created_at desc);

alter table public.offers enable row level security;

drop policy if exists offers_select_participants_or_admin on public.offers;
create policy offers_select_participants_or_admin
on public.offers
for select
using (
  buyer_user_id = auth.uid()
  or seller_user_id = auth.uid()
  or public.is_admin(auth.uid())
);

drop policy if exists offers_insert_buyer_only on public.offers;
create policy offers_insert_buyer_only
on public.offers
for insert
to authenticated
with check (
  buyer_user_id = auth.uid()
);

drop policy if exists offers_update_seller_or_buyer_or_admin on public.offers;
create policy offers_update_seller_or_buyer_or_admin
on public.offers
for update
using (
  buyer_user_id = auth.uid()
  or seller_user_id = auth.uid()
  or public.is_admin(auth.uid())
)
with check (
  buyer_user_id = auth.uid()
  or seller_user_id = auth.uid()
  or public.is_admin(auth.uid())
);

create or replace function public.update_offer_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_offers_updated_at on public.offers;
create trigger trg_offers_updated_at
before update on public.offers
for each row execute function public.update_offer_updated_at();
