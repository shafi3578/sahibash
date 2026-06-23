-- Confirm auth email for specific admin account to allow login in local testing
update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, now())
where lower(email) = lower('dr.shafiullahsarwari@gmail.com');
