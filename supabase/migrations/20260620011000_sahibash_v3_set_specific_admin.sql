-- Grant admin role to a specific user email
update public.profiles p
set role = 'admin'
from auth.users u
where p.id = u.id
  and lower(u.email) = lower('dr.shafiullahsarwari@gmail.com');
