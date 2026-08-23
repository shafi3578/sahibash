begin;

alter function public.publish_listing_schema(bigint,integer,jsonb) rename to publish_listing_schema_legacy;
alter function public.publish_listing_schema_legacy(bigint,integer,jsonb) set schema private;

create function public.publish_listing_schema(
  target_category_node_id bigint,
  expected_version integer,
  schema_config jsonb
)
returns public.listing_schema_versions
language sql
security invoker
set search_path = ''
as $$
  select private.publish_listing_schema_legacy(target_category_node_id, expected_version, schema_config);
$$;

revoke all on function private.publish_listing_schema_legacy(bigint,integer,jsonb) from public;
grant execute on function private.publish_listing_schema_legacy(bigint,integer,jsonb) to authenticated, service_role;
revoke all on function public.publish_listing_schema(bigint,integer,jsonb) from public, anon;
grant execute on function public.publish_listing_schema(bigint,integer,jsonb) to authenticated, service_role;

commit;
