begin;

-- This helper only reads RBAC tables. SECURITY INVOKER lets their RLS remain
-- authoritative and prevents the helper from becoming a privilege boundary.
alter function public.is_super_administrator(uuid) security invoker;
revoke all on function public.is_super_administrator(uuid) from public, anon;
grant execute on function public.is_super_administrator(uuid) to authenticated, service_role;

create index if not exists listing_schema_versions_created_by
  on public.listing_schema_versions(created_by);

commit;
