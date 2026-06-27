begin;

create table if not exists public.listing_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  posting_type text not null check (posting_type in ('sell', 'wanted', 'telegram', 'quick')),
  category jsonb not null default '{}'::jsonb,
  details jsonb not null default '{}'::jsonb,
  photos jsonb not null default '[]'::jsonb,
  location jsonb not null default '{}'::jsonb,
  language text not null default 'en' check (language in ('en', 'fa', 'ps')),
  status text not null default 'in_progress' check (status in ('in_progress', 'published', 'discarded')),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_listing_drafts_user_updated
  on public.listing_drafts(user_id, updated_at desc);

create index if not exists idx_listing_drafts_status
  on public.listing_drafts(status, updated_at desc);

create unique index if not exists ux_listing_drafts_user_active
  on public.listing_drafts(user_id)
  where status = 'in_progress';

drop trigger if exists trg_listing_drafts_updated_at on public.listing_drafts;
create trigger trg_listing_drafts_updated_at
before update on public.listing_drafts
for each row execute function public.set_updated_at();

alter table public.listing_drafts enable row level security;

drop policy if exists listing_drafts_owner_select on public.listing_drafts;
create policy listing_drafts_owner_select
on public.listing_drafts
for select
using (
  user_id = auth.uid() or public.is_admin(auth.uid())
);

drop policy if exists listing_drafts_owner_insert on public.listing_drafts;
create policy listing_drafts_owner_insert
on public.listing_drafts
for insert
with check (
  user_id = auth.uid() or public.is_admin(auth.uid())
);

drop policy if exists listing_drafts_owner_update on public.listing_drafts;
create policy listing_drafts_owner_update
on public.listing_drafts
for update
using (
  user_id = auth.uid() or public.is_admin(auth.uid())
)
with check (
  user_id = auth.uid() or public.is_admin(auth.uid())
);

drop policy if exists listing_drafts_owner_delete on public.listing_drafts;
create policy listing_drafts_owner_delete
on public.listing_drafts
for delete
using (
  user_id = auth.uid() or public.is_admin(auth.uid())
);

commit;
