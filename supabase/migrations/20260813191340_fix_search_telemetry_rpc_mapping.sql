begin;

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
    query_text, normalized_query, selected_language, result_count,
    category_filter, province_filter, district_filter, rewritten_terms
  ) values (
    p_query_text, p_normalized_query, p_selected_language, p_result_count,
    p_category_filter, p_province_filter, p_district_filter, p_rewritten_terms
  ) returning id into telemetry_id;

  return telemetry_id;
end;
$$;

revoke all on function public.record_search_telemetry(text,text,text,integer,text,text,text,text[]) from public;
grant execute on function public.record_search_telemetry(text,text,text,integer,text,text,text,text[]) to anon, authenticated, service_role;

commit;
