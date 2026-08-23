begin;

-- Public read policies call this helper even for anonymous visitors. Bind the
-- argument to the caller so it cannot be used to inspect another user's role.
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select uid is not null
    and uid = (select auth.uid())
    and (
      exists (
        select 1
        from public.profiles p
        where p.id = uid and p.role = 'admin'
      )
      or exists (
        select 1
        from public.admin_user_roles ur
        where ur.user_id = uid
      )
    );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_admin((select auth.uid()));
$$;

revoke execute on function public.is_admin(uuid) from public;
revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin(uuid) to anon, authenticated, service_role;
grant execute on function public.is_admin() to anon, authenticated, service_role;

commit;
