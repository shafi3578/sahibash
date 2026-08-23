begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to anon, authenticated, service_role;

create or replace function private.is_admin(p_uid uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select p_uid is not null
    and p_uid = (select auth.uid())
    and (
      exists (select 1 from public.profiles p where p.id = p_uid and p.role = 'admin')
      or exists (select 1 from public.admin_user_roles ur where ur.user_id = p_uid)
    );
$$;

create or replace function public.is_admin(uid uuid)
returns boolean language sql stable security invoker set search_path = ''
as $$ select private.is_admin(uid); $$;

create or replace function public.is_admin()
returns boolean language sql stable security invoker set search_path = ''
as $$ select private.is_admin((select auth.uid())); $$;

create or replace function private.has_admin_permission(p_uid uuid, p_permission_key text)
returns boolean language sql stable security definer set search_path = ''
as $$
  select p_uid is not null
    and p_uid = (select auth.uid())
    and (
      exists (select 1 from public.profiles p where p.id = p_uid and p.role = 'admin')
      or exists (
        select 1
        from public.admin_user_roles ur
        join public.admin_role_permissions rp on rp.role_id = ur.role_id
        join public.admin_permissions perm on perm.id = rp.permission_id
        where ur.user_id = p_uid and perm.key = p_permission_key
      )
    );
$$;

create or replace function public.has_admin_permission(uid uuid, permission_key text)
returns boolean language sql stable security invoker set search_path = ''
as $$ select private.has_admin_permission(uid, permission_key); $$;

create or replace function private.record_search_telemetry(
  p_query_text text, p_normalized_query text, p_selected_language text,
  p_result_count integer default 0, p_category_filter text default null,
  p_province_filter text default null, p_district_filter text default null,
  p_rewritten_terms text[] default '{}'::text[]
)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare telemetry_id uuid;
begin
  if char_length(p_query_text) not between 1 and 240
     or char_length(p_normalized_query) not between 1 and 240
     or p_selected_language not in ('en', 'fa', 'ps')
     or p_result_count < 0
     or coalesce(cardinality(p_rewritten_terms), 0) > 30 then
    raise exception 'Invalid search telemetry payload' using errcode = '22023';
  end if;
  insert into public.search_telemetry (
    query_text, normalized_query, selected_language, result_count,
    category_filter, province_filter, district_filter, rewritten_terms
  ) values (
    p_query_text, p_normalized_query, p_selected_language, p_result_count,
    p_category_filter, p_province_filter, p_district_filter, p_rewritten_terms
  ) returning id into telemetry_id;
  return telemetry_id;
end;
$$;

create or replace function public.record_search_telemetry(
  p_query_text text, p_normalized_query text, p_selected_language text,
  p_result_count integer default 0, p_category_filter text default null,
  p_province_filter text default null, p_district_filter text default null,
  p_rewritten_terms text[] default '{}'::text[]
)
returns uuid language sql security invoker set search_path = ''
as $$ select private.record_search_telemetry(p_query_text, p_normalized_query, p_selected_language, p_result_count, p_category_filter, p_province_filter, p_district_filter, p_rewritten_terms); $$;

create or replace function private.record_search_telemetry_click(p_telemetry_id uuid, p_listing_id uuid)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare changed integer;
begin
  update public.search_telemetry set clicked_listing_id = p_listing_id
  where id = p_telemetry_id and clicked_listing_id is null
    and created_at >= now() - interval '24 hours'
    and exists (select 1 from public.listings where id = p_listing_id and status = 'approved');
  get diagnostics changed = row_count;
  return changed = 1;
end;
$$;

create or replace function public.record_search_telemetry_click(p_telemetry_id uuid, p_listing_id uuid)
returns boolean language sql security invoker set search_path = ''
as $$ select private.record_search_telemetry_click(p_telemetry_id, p_listing_id); $$;

revoke all on all functions in schema private from public;
grant execute on function private.is_admin(uuid) to anon, authenticated, service_role;
grant execute on function private.has_admin_permission(uuid,text) to authenticated, service_role;
grant execute on function private.record_search_telemetry(text,text,text,integer,text,text,text,text[]) to anon, authenticated, service_role;
grant execute on function private.record_search_telemetry_click(uuid,uuid) to anon, authenticated, service_role;

revoke execute on function public.is_admin() from anon;
revoke execute on function public.is_admin(uuid) from anon;

create schema if not exists extensions;
alter extension pg_trgm set schema extensions;

-- Preserve the administrator-entered value in version history before repairing
-- the visibly malformed production headline.
insert into public.site_settings_versions (
  site_settings_id, version_number, change_summary, settings_snapshot, created_by
)
select s.id,
       coalesce((select max(v.version_number) from public.site_settings_versions v where v.site_settings_id=s.id),0)+1,
       'Automated correction of malformed English homepage headline',
       to_jsonb(s),
       null
from public.site_settings s
where s.id=1 and s.home_hero_title='Discover trusted listings across Afghanistan the most good';

update public.site_settings
set home_hero_title='Discover trusted listings across Afghanistan', updated_at=now()
where id=1 and home_hero_title='Discover trusted listings across Afghanistan the most good';

commit;
