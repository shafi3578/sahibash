-- Bootstrap existing admin profiles into the RBAC admin roles

insert into public.admin_user_roles (user_id, role_id)
select p.id, r.id
from public.profiles p
join public.admin_roles r on r.name = 'super_administrator'
where p.role = 'admin'
on conflict (user_id, role_id) do nothing;
