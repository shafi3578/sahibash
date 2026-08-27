revoke all privileges on table public.notifications from anon;
revoke all privileges on table public.notifications from authenticated;
grant select, update on table public.notifications to authenticated;

comment on table public.notifications is
  'Private account notifications. Service-role writers only; authenticated users may read and mark only their own rows through RLS.';
