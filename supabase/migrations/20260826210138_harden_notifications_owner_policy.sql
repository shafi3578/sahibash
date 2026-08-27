drop policy if exists notifications_owner_only on public.notifications;
drop policy if exists notifications_owner_select on public.notifications;
drop policy if exists notifications_owner_update on public.notifications;

create policy notifications_owner_select on public.notifications
  for select to authenticated using ((select auth.uid()) = user_id);

create policy notifications_owner_update on public.notifications
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke insert, delete on public.notifications from anon, authenticated;
grant select, update on public.notifications to authenticated;
