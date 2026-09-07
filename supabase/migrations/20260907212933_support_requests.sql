begin;

create table if not exists public.support_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  requester_name text not null check (char_length(requester_name) between 2 and 100),
  requester_email text not null check (char_length(requester_email) between 5 and 254),
  subject text not null check (subject in ('account', 'listing', 'safety', 'payment', 'technical', 'other')),
  message text not null check (char_length(message) between 20 and 3000),
  locale text not null default 'fa' check (locale in ('en', 'fa', 'ps')),
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_requests_status_created_idx
  on public.support_requests(status, created_at desc);
create index if not exists support_requests_user_created_idx
  on public.support_requests(user_id, created_at desc)
  where user_id is not null;

alter table public.support_requests enable row level security;
revoke all on table public.support_requests from anon, authenticated;

drop trigger if exists support_requests_set_updated_at on public.support_requests;
create trigger support_requests_set_updated_at
  before update on public.support_requests
  for each row execute function public.set_updated_at();

drop policy if exists support_requests_admin_read on public.support_requests;
create policy support_requests_admin_read
  on public.support_requests for select to authenticated
  using ((select public.has_admin_permission((select auth.uid()), 'audit_logs.view')));

drop policy if exists support_requests_admin_update on public.support_requests;
create policy support_requests_admin_update
  on public.support_requests for update to authenticated
  using ((select public.has_admin_permission((select auth.uid()), 'audit_logs.view')))
  with check ((select public.has_admin_permission((select auth.uid()), 'audit_logs.view')));

grant select on table public.support_requests to authenticated;
grant update (status) on table public.support_requests to authenticated;

commit;
