begin;

-- Step 3 completion: AI shadow moderation must connect into the existing
-- operational moderation surfaces without auto-rejecting seller content.

alter table public.moderation_workflow_entries
  add column if not exists entity_uuid uuid,
  add column if not exists source text not null default 'manual',
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.moderation_workflow_entries
  drop constraint if exists moderation_workflow_entries_metadata_object,
  add constraint moderation_workflow_entries_metadata_object
    check (jsonb_typeof(metadata) = 'object' and pg_column_size(metadata) <= 4096);

create index if not exists idx_moderation_workflow_entries_entity_uuid
  on public.moderation_workflow_entries(entity_type, entity_uuid, created_at desc)
  where entity_uuid is not null;

create index if not exists idx_moderation_workflow_entries_source_status
  on public.moderation_workflow_entries(source, status, created_at desc);

comment on column public.moderation_workflow_entries.entity_uuid is
  'UUID entity reference for listing moderation; legacy entity_id remains for older numeric workflow rows.';
comment on column public.moderation_workflow_entries.source is
  'Workflow source such as manual or ai_shadow_moderation.';
comment on column public.moderation_workflow_entries.metadata is
  'Small PII-minimized context for operations queues; never store raw listing prose here.';

grant select, insert, update on table public.moderation_workflow_entries to authenticated;
grant all on table public.moderation_workflow_entries to service_role;
grant select, insert, update on table public.listing_quality_signals to authenticated;
grant all on table public.listing_quality_signals to service_role;
grant all on table public.listing_risk_signals to service_role;

commit;
