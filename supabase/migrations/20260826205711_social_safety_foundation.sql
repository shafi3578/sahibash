-- Additive social-safety foundation: follows and blocks.
-- No existing tables or user/listing rows are modified.
create table if not exists public.user_follows (
  follower_user_id uuid not null references auth.users(id) on delete cascade,
  following_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_user_id, following_user_id),
  constraint user_follows_not_self check (follower_user_id <> following_user_id)
);

create table if not exists public.user_blocks (
  blocker_user_id uuid not null references auth.users(id) on delete cascade,
  blocked_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_user_id, blocked_user_id),
  constraint user_blocks_not_self check (blocker_user_id <> blocked_user_id)
);

create index if not exists user_follows_following_idx on public.user_follows(following_user_id);
create index if not exists user_blocks_blocked_idx on public.user_blocks(blocked_user_id);

alter table public.user_follows enable row level security;
alter table public.user_blocks enable row level security;

drop policy if exists user_follows_read_public on public.user_follows;
create policy user_follows_read_public on public.user_follows
  for select using (true);
drop policy if exists user_follows_insert_own on public.user_follows;
create policy user_follows_insert_own on public.user_follows
  for insert to authenticated with check ((select auth.uid()) = follower_user_id);
drop policy if exists user_follows_delete_own on public.user_follows;
create policy user_follows_delete_own on public.user_follows
  for delete to authenticated using ((select auth.uid()) = follower_user_id);

drop policy if exists user_blocks_read_own on public.user_blocks;
create policy user_blocks_read_own on public.user_blocks
  for select to authenticated using ((select auth.uid()) = blocker_user_id);
drop policy if exists user_blocks_insert_own on public.user_blocks;
create policy user_blocks_insert_own on public.user_blocks
  for insert to authenticated with check ((select auth.uid()) = blocker_user_id);
drop policy if exists user_blocks_delete_own on public.user_blocks;
create policy user_blocks_delete_own on public.user_blocks
  for delete to authenticated using ((select auth.uid()) = blocker_user_id);

grant select on public.user_follows to anon, authenticated;
grant select, insert, delete on public.user_follows to authenticated;
grant select, insert, delete on public.user_blocks to authenticated;
