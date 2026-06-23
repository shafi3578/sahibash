-- Bootstrap admin role for first user and make future signups auto-assign first admin

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  first_role public.profile_role;
begin
  first_role := case
    when exists (select 1 from public.profiles where role = 'admin') then 'user'::public.profile_role
    else 'admin'::public.profile_role
  end;

  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data ->> 'full_name', first_role)
  on conflict (id) do nothing;
  return new;
end;
$$;

-- One-time bootstrap: if no admin exists, promote the earliest profile
update public.profiles p
set role = 'admin'
where p.id = (
  select id
  from public.profiles
  order by created_at asc
  limit 1
)
and not exists (
  select 1
  from public.profiles
  where role = 'admin'
);
