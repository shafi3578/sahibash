-- V5 offer seen flags for dashboard notification dots

alter table if exists public.offers
  add column if not exists buyer_seen_at timestamptz,
  add column if not exists seller_seen_at timestamptz;

-- Existing rows are considered seen by default so only new updates trigger badges.
update public.offers
set
  buyer_seen_at = coalesce(buyer_seen_at, now()),
  seller_seen_at = coalesce(seller_seen_at, now())
where buyer_seen_at is null or seller_seen_at is null;
