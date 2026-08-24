-- Durable application rate-limit buckets for Vercel/serverless flows.
-- Stores only hashed actor identifiers, never raw IP addresses or user-agent
-- values. No production user data is deleted or rewritten.

create table if not exists public.app_rate_limit_buckets (
  scope text not null,
  actor_hash text not null,
  window_start timestamptz not null,
  request_count integer not null default 0 check (request_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (scope, actor_hash, window_start),
  constraint app_rate_limit_scope_safe check (scope ~ '^[a-zA-Z0-9_.:-]{1,96}$'),
  constraint app_rate_limit_actor_hash_safe check (actor_hash ~ '^[a-f0-9]{64}$')
);

create index if not exists idx_app_rate_limit_buckets_updated_at
on public.app_rate_limit_buckets(updated_at);

alter table public.app_rate_limit_buckets enable row level security;

revoke all on table public.app_rate_limit_buckets from anon, authenticated;

drop policy if exists app_rate_limit_buckets_admin_read on public.app_rate_limit_buckets;
create policy app_rate_limit_buckets_admin_read
on public.app_rate_limit_buckets
for select
to authenticated
using ((select public.has_admin_permission((select auth.uid()), 'audit_logs.view')));

create or replace function public.consume_app_rate_limit(
  p_scope text,
  p_actor_hash text,
  p_window_seconds integer,
  p_max_requests integer
)
returns table (
  allowed boolean,
  remaining integer,
  reset_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_scope text := coalesce(p_scope, '');
  v_actor_hash text := lower(coalesce(p_actor_hash, ''));
  v_window_seconds integer := greatest(1, least(coalesce(p_window_seconds, 60), 86400));
  v_max_requests integer := greatest(1, least(coalesce(p_max_requests, 1), 100000));
  v_window_start timestamptz;
  v_count integer;
begin
  if v_scope !~ '^[a-zA-Z0-9_.:-]{1,96}$' or v_actor_hash !~ '^[a-f0-9]{64}$' then
    return query select false, 0, now();
    return;
  end if;

  v_window_start := to_timestamp(
    floor(extract(epoch from now()) / v_window_seconds) * v_window_seconds
  );

  insert into public.app_rate_limit_buckets(scope, actor_hash, window_start, request_count)
  values (v_scope, v_actor_hash, v_window_start, 0)
  on conflict (scope, actor_hash, window_start) do nothing;

  select request_count
  into v_count
  from public.app_rate_limit_buckets
  where scope = v_scope
    and actor_hash = v_actor_hash
    and window_start = v_window_start
  for update;

  if v_count >= v_max_requests then
    update public.app_rate_limit_buckets
    set updated_at = now()
    where scope = v_scope
      and actor_hash = v_actor_hash
      and window_start = v_window_start;

    return query select false, 0, v_window_start + make_interval(secs => v_window_seconds);
    return;
  end if;

  update public.app_rate_limit_buckets
  set
    request_count = request_count + 1,
    updated_at = now()
  where scope = v_scope
    and actor_hash = v_actor_hash
    and window_start = v_window_start
  returning request_count into v_count;

  return query select true, greatest(v_max_requests - v_count, 0), v_window_start + make_interval(secs => v_window_seconds);
end;
$$;

revoke all on function public.consume_app_rate_limit(text, text, integer, integer) from public;
revoke all on function public.consume_app_rate_limit(text, text, integer, integer) from anon, authenticated;
grant execute on function public.consume_app_rate_limit(text, text, integer, integer) to service_role;
