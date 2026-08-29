begin;

-- Search-first AI release. Public marketplace behavior stays manual/default;
-- these switches are server-read and privileged at the database boundary.
insert into public.feature_flags (key, description, enabled, rollout_percent)
values
  ('ai_search_enabled', 'Show the optional AI Search action after a verified Vercel AI Gateway request.', false, 0),
  ('ai_posting_category_suggestions_enabled', 'Allow optional AI category suggestions during posting. Manual category selection remains authoritative.', false, 0),
  ('ai_posting_image_detection_enabled', 'Allow posting images to be sent to the configured image classifier when category suggestions are enabled.', false, 0)
on conflict (key) do update set
  description = excluded.description;

drop policy if exists feature_flags_public_read on public.feature_flags;
drop policy if exists feature_flags_admin_read on public.feature_flags;
drop policy if exists feature_flags_admin_insert on public.feature_flags;
drop policy if exists feature_flags_admin_update on public.feature_flags;
drop policy if exists feature_flags_admin_delete on public.feature_flags;

create policy feature_flags_admin_read
on public.feature_flags for select
to authenticated
using (
  (select public.has_admin_permission((select auth.uid()), 'ai.view'))
  or (select public.has_admin_permission((select auth.uid()), 'settings.view'))
);

create policy feature_flags_admin_insert
on public.feature_flags for insert
to authenticated
with check (
  (select private.is_aal2())
  and (
    (key in (
      'ai_search_enabled',
      'ai_posting_category_suggestions_enabled',
      'ai_posting_image_detection_enabled'
    ) and (select public.has_admin_permission((select auth.uid()), 'ai.configure')))
    or
    (key not in (
      'ai_search_enabled',
      'ai_posting_category_suggestions_enabled',
      'ai_posting_image_detection_enabled'
    ) and (select public.has_admin_permission((select auth.uid()), 'settings.update')))
  )
);

create policy feature_flags_admin_update
on public.feature_flags for update
to authenticated
using (
  (select private.is_aal2())
  and (
    (key in (
      'ai_search_enabled',
      'ai_posting_category_suggestions_enabled',
      'ai_posting_image_detection_enabled'
    ) and (select public.has_admin_permission((select auth.uid()), 'ai.configure')))
    or
    (key not in (
      'ai_search_enabled',
      'ai_posting_category_suggestions_enabled',
      'ai_posting_image_detection_enabled'
    ) and (select public.has_admin_permission((select auth.uid()), 'settings.update')))
  )
)
with check (
  (select private.is_aal2())
  and (
    (key in (
      'ai_search_enabled',
      'ai_posting_category_suggestions_enabled',
      'ai_posting_image_detection_enabled'
    ) and (select public.has_admin_permission((select auth.uid()), 'ai.configure')))
    or
    (key not in (
      'ai_search_enabled',
      'ai_posting_category_suggestions_enabled',
      'ai_posting_image_detection_enabled'
    ) and (select public.has_admin_permission((select auth.uid()), 'settings.update')))
  )
);

create policy feature_flags_admin_delete
on public.feature_flags for delete
to authenticated
using (
  (select private.is_aal2())
  and (
    (key in (
      'ai_search_enabled',
      'ai_posting_category_suggestions_enabled',
      'ai_posting_image_detection_enabled'
    ) and (select public.has_admin_permission((select auth.uid()), 'ai.configure')))
    or
    (key not in (
      'ai_search_enabled',
      'ai_posting_category_suggestions_enabled',
      'ai_posting_image_detection_enabled'
    ) and (select public.has_admin_permission((select auth.uid()), 'settings.update')))
  )
);

revoke all on table public.feature_flags from anon, authenticated;
grant select, insert, update, delete on table public.feature_flags to authenticated;
grant all on table public.feature_flags to service_role;

create or replace function public.guard_feature_flag_mutation()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := (select auth.uid());
  v_key text := case when TG_OP = 'DELETE' then old.key else new.key end;
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') then
    if TG_OP = 'DELETE' then
      return old;
    end if;
    new.updated_at := now();
    return new;
  end if;

  if v_actor is null or not private.is_aal2() then
    raise exception 'aal2 required' using errcode = '42501';
  end if;

  if v_key in (
    'ai_search_enabled',
    'ai_posting_category_suggestions_enabled',
    'ai_posting_image_detection_enabled'
  ) then
    if not coalesce(public.has_admin_permission(v_actor, 'ai.configure'), false) then
      raise exception 'ai.configure required' using errcode = '42501';
    end if;
  elsif not coalesce(public.has_admin_permission(v_actor, 'settings.update'), false) then
    raise exception 'settings.update required' using errcode = '42501';
  end if;

  if TG_OP = 'DELETE' then
    return old;
  end if;

  if TG_OP = 'UPDATE' and new.key <> old.key then
    raise exception 'feature flag keys are immutable' using errcode = '22023';
  end if;

  new.updated_by := v_actor;
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.guard_feature_flag_mutation() from public, anon, authenticated;
grant execute on function public.guard_feature_flag_mutation() to authenticated, service_role;

drop trigger if exists feature_flags_guard_mutation on public.feature_flags;
create trigger feature_flags_guard_mutation
before insert or update or delete on public.feature_flags
for each row execute function public.guard_feature_flag_mutation();

alter table public.ai_search_parse_events
  add column if not exists gateway_status text,
  add column if not exists gateway_model text,
  add column if not exists latency_ms integer,
  add column if not exists input_tokens integer,
  add column if not exists output_tokens integer,
  add column if not exists estimated_cost_usd numeric(12,8),
  add column if not exists fallback_reason text;

alter table public.ai_search_parse_events
  drop constraint if exists ai_search_parse_events_gateway_status_check,
  add constraint ai_search_parse_events_gateway_status_check
    check (gateway_status is null or gateway_status ~ '^[a-z0-9_]{2,48}$'),
  drop constraint if exists ai_search_parse_events_gateway_model_check,
  add constraint ai_search_parse_events_gateway_model_check
    check (gateway_model is null or char_length(gateway_model) <= 120),
  drop constraint if exists ai_search_parse_events_latency_ms_check,
  add constraint ai_search_parse_events_latency_ms_check
    check (latency_ms is null or latency_ms between 0 and 120000),
  drop constraint if exists ai_search_parse_events_input_tokens_check,
  add constraint ai_search_parse_events_input_tokens_check
    check (input_tokens is null or input_tokens between 0 and 1000000),
  drop constraint if exists ai_search_parse_events_output_tokens_check,
  add constraint ai_search_parse_events_output_tokens_check
    check (output_tokens is null or output_tokens between 0 and 1000000),
  drop constraint if exists ai_search_parse_events_estimated_cost_check,
  add constraint ai_search_parse_events_estimated_cost_check
    check (estimated_cost_usd is null or estimated_cost_usd between 0 and 1000),
  drop constraint if exists ai_search_parse_events_fallback_reason_check,
  add constraint ai_search_parse_events_fallback_reason_check
    check (fallback_reason is null or char_length(fallback_reason) <= 240);

drop policy if exists ai_search_parse_events_privacy_safe_insert on public.ai_search_parse_events;
revoke insert on table public.ai_search_parse_events from anon, authenticated;
grant all on table public.ai_search_parse_events to service_role;

create index if not exists idx_ai_search_parse_events_source_created
  on public.ai_search_parse_events(parser_source, created_at desc);

comment on table public.feature_flags is
  'Server-read feature switches. Public clients have no access; privileged mutations require AAL2 and RBAC.';
comment on column public.ai_search_parse_events.estimated_cost_usd is
  'Server-computed estimate from token usage; raw search text is never stored in this table.';

commit;
