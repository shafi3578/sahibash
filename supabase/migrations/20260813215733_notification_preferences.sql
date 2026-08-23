begin;
create table public.notification_preferences(
 user_id uuid primary key references auth.users(id) on delete cascade,
 locale text not null default 'fa' check(locale in('en','fa','ps')),
 new_messages boolean not null default true,
 listing_moderation boolean not null default true,
 listing_expiry boolean not null default true,
 saved_search_matches boolean not null default true,
 saved_listing_changes boolean not null default true,
 updated_at timestamptz not null default now()
);
alter table public.notification_preferences enable row level security;
create policy notification_preferences_owner_select on public.notification_preferences for select to authenticated using((select auth.uid())=user_id);
create policy notification_preferences_owner_insert on public.notification_preferences for insert to authenticated with check((select auth.uid())=user_id);
create policy notification_preferences_owner_update on public.notification_preferences for update to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
revoke all on table public.notification_preferences from anon,authenticated;
grant select,insert,update on table public.notification_preferences to authenticated;
grant all on table public.notification_preferences to service_role;
commit;
