begin;

-- Published listing schemas are public data. Keep the guest policy independent
-- from privileged helper functions so anonymous reads cannot fail on EXECUTE.
drop policy if exists listing_schema_versions_public_read on public.listing_schema_versions;
drop policy if exists listing_schema_versions_super_admin_read on public.listing_schema_versions;

create policy listing_schema_versions_public_read
on public.listing_schema_versions for select
to anon, authenticated
using (status = 'published');

create policy listing_schema_versions_super_admin_read
on public.listing_schema_versions for select
to authenticated
using ((select public.is_super_administrator((select auth.uid()))));

-- The deployed enum was created with an invalid placeholder value and rejected
-- valid application actions. Text plus a bounded non-empty constraint keeps the
-- log forward-compatible while still validating input.
alter table public.audit_logs
  alter column action type text using action::text;

alter table public.audit_logs
  drop constraint if exists audit_logs_action_valid,
  add constraint audit_logs_action_valid
    check (action = upper(action) and action ~ '^[A-Z][A-Z0-9_]{1,63}$');

drop policy if exists audit_logs_admin_insert on public.audit_logs;
create policy audit_logs_admin_insert
on public.audit_logs for insert
to authenticated
with check (
  admin_user_id = (select auth.uid())
  and (select public.is_admin((select auth.uid())))
);

revoke all on table public.audit_logs from anon, authenticated;
grant select, insert on table public.audit_logs to authenticated;
grant usage, select on sequence public.audit_logs_id_seq to authenticated;

-- Telemetry is written through narrow RPCs. This prevents public users from
-- selecting the table or changing arbitrary rows while preserving click linkage.
drop policy if exists "Public insert search telemetry" on public.search_telemetry;
drop policy if exists "Public update search telemetry clicks" on public.search_telemetry;

create or replace function public.record_search_telemetry(
  p_query_text text,
  p_normalized_query text,
  p_selected_language text,
  p_result_count integer default 0,
  p_category_filter text default null,
  p_province_filter text default null,
  p_district_filter text default null,
  p_rewritten_terms text[] default '{}'::text[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  telemetry_id uuid;
begin
  if char_length(p_query_text) not between 1 and 240
     or char_length(p_normalized_query) not between 1 and 240
     or p_selected_language not in ('en', 'fa', 'ps')
     or p_result_count < 0
     or coalesce(cardinality(p_rewritten_terms), 0) > 30 then
    raise exception 'Invalid search telemetry payload' using errcode = '22023';
  end if;

  insert into public.search_telemetry (
    p_query_text, p_normalized_query, p_selected_language, p_result_count,
    p_category_filter, p_province_filter, p_district_filter, p_rewritten_terms
  ) values (
    query_text, normalized_query, selected_language, result_count,
    category_filter, province_filter, district_filter, rewritten_terms
  ) returning id into telemetry_id;

  return telemetry_id;
end;
$$;

create or replace function public.record_search_telemetry_click(
  p_telemetry_id uuid,
  p_listing_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  changed integer;
begin
  update public.search_telemetry
  set clicked_listing_id = p_listing_id
  where id = p_telemetry_id
    and clicked_listing_id is null
    and created_at >= now() - interval '24 hours'
    and exists (
      select 1 from public.listings
      where id = p_listing_id and status = 'approved'
    );
  get diagnostics changed = row_count;
  return changed = 1;
end;
$$;

revoke all on table public.search_telemetry from anon, authenticated;
grant select on table public.search_telemetry to authenticated;
revoke all on function public.record_search_telemetry(text,text,text,integer,text,text,text,text[]) from public;
revoke all on function public.record_search_telemetry_click(uuid,uuid) from public;
grant execute on function public.record_search_telemetry(text,text,text,integer,text,text,text,text[]) to anon, authenticated, service_role;
grant execute on function public.record_search_telemetry_click(uuid,uuid) to anon, authenticated, service_role;

commit;
