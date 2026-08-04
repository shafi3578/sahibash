begin;

create table if not exists public.listing_schema_versions (
  id uuid primary key default gen_random_uuid(),
  category_node_id bigint not null references public.category_nodes(id) on delete cascade,
  version integer not null check (version > 0),
  status text not null check (status in ('published', 'archived')),
  config jsonb not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  published_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint listing_schema_versions_node_version unique (category_node_id, version),
  constraint listing_schema_versions_config_shape check (
    jsonb_typeof(config) = 'object'
    and jsonb_typeof(config -> 'fields') = 'array'
    and jsonb_typeof(config -> 'sections') = 'array'
  )
);

create unique index if not exists listing_schema_versions_one_published
  on public.listing_schema_versions(category_node_id)
  where status = 'published';
create index if not exists listing_schema_versions_history
  on public.listing_schema_versions(category_node_id, version desc);

alter table public.listing_schema_versions enable row level security;

create or replace function public.is_super_administrator(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select uid is not null and exists (
    select 1
    from public.admin_user_roles ur
    join public.admin_roles r on r.id = ur.role_id
    where ur.user_id = uid and r.name = 'super_administrator'
  );
$$;

revoke all on function public.is_super_administrator(uuid) from public;
grant execute on function public.is_super_administrator(uuid) to authenticated, service_role;

drop policy if exists category_schema_profiles_writeable_by_admins on public.category_schema_profiles;
create policy category_schema_profiles_writeable_by_super_administrators
on public.category_schema_profiles for all to authenticated
using ((select public.is_super_administrator(auth.uid())))
with check ((select public.is_super_administrator(auth.uid())));

drop policy if exists listing_schema_versions_public_read on public.listing_schema_versions;
create policy listing_schema_versions_public_read
on public.listing_schema_versions for select
to anon, authenticated
using (status = 'published' or (select public.is_super_administrator(auth.uid())));

revoke all on table public.listing_schema_versions from anon, authenticated;
grant select on table public.listing_schema_versions to anon, authenticated;
grant all on table public.listing_schema_versions to service_role;

create or replace function public.publish_listing_schema(
  target_category_node_id bigint,
  expected_version integer,
  schema_config jsonb
)
returns public.listing_schema_versions
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  current_version integer;
  new_row public.listing_schema_versions;
begin
  if actor is null or not public.is_super_administrator(actor) then
    raise exception 'Super administrator access required' using errcode = '42501';
  end if;

  if not exists (select 1 from public.category_nodes where id = target_category_node_id) then
    raise exception 'Unknown category node';
  end if;

  if jsonb_typeof(schema_config) <> 'object'
     or jsonb_typeof(schema_config -> 'fields') <> 'array'
     or jsonb_typeof(schema_config -> 'sections') <> 'array' then
    raise exception 'Invalid listing schema configuration';
  end if;

  perform 1 from public.category_nodes where id = target_category_node_id for update;
  select coalesce(max(version), 0) into current_version
  from public.listing_schema_versions where category_node_id = target_category_node_id;

  if expected_version is not null and expected_version <> current_version then
    raise exception 'Schema changed since it was loaded. Refresh and try again.' using errcode = '40001';
  end if;

  update public.listing_schema_versions
  set status = 'archived', archived_at = now()
  where category_node_id = target_category_node_id and status = 'published';

  insert into public.listing_schema_versions(category_node_id, version, status, config, created_by)
  values (target_category_node_id, current_version + 1, 'published', schema_config, actor)
  returning * into new_row;

  insert into public.audit_logs(admin_user_id, action, entity_type, entity_id, safe_changes)
  values (
    actor,
    'SETTING_CHANGED',
    'listing_schema',
    target_category_node_id::text,
    jsonb_build_object('version', new_row.version, 'field_count', jsonb_array_length(schema_config -> 'fields'))
  );

  return new_row;
end;
$$;

revoke all on function public.publish_listing_schema(bigint, integer, jsonb) from public, anon;
grant execute on function public.publish_listing_schema(bigint, integer, jsonb) to authenticated, service_role;

commit;
