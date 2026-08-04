begin;

-- Catalog data is public read-only. Remove the broad default grants before
-- enabling RLS so browser clients cannot mutate or truncate catalog tables.
revoke all on table
  public.product_brands,
  public.product_series,
  public.product_models,
  public.model_specifications,
  public.phone_brands,
  public.phone_models,
  public.phone_model_aliases,
  public.phone_selectable_fields
from anon, authenticated;

grant select on table
  public.product_brands,
  public.product_series,
  public.product_models,
  public.model_specifications,
  public.phone_brands,
  public.phone_models,
  public.phone_model_aliases,
  public.phone_selectable_fields
to anon, authenticated;

alter table public.product_brands enable row level security;
alter table public.product_series enable row level security;
alter table public.product_models enable row level security;
alter table public.model_specifications enable row level security;
alter table public.phone_brands enable row level security;
alter table public.phone_models enable row level security;
alter table public.phone_model_aliases enable row level security;
alter table public.phone_selectable_fields enable row level security;

drop policy if exists product_brands_public_read on public.product_brands;
create policy product_brands_public_read on public.product_brands
  for select to anon, authenticated using (true);

drop policy if exists product_series_public_read on public.product_series;
create policy product_series_public_read on public.product_series
  for select to anon, authenticated using (true);

drop policy if exists product_models_public_read on public.product_models;
create policy product_models_public_read on public.product_models
  for select to anon, authenticated using (true);

drop policy if exists model_specifications_public_read on public.model_specifications;
create policy model_specifications_public_read on public.model_specifications
  for select to anon, authenticated using (true);

drop policy if exists phone_brands_public_read on public.phone_brands;
create policy phone_brands_public_read on public.phone_brands
  for select to anon, authenticated using (true);

drop policy if exists phone_models_public_read on public.phone_models;
create policy phone_models_public_read on public.phone_models
  for select to anon, authenticated using (true);

drop policy if exists phone_model_aliases_public_read on public.phone_model_aliases;
create policy phone_model_aliases_public_read on public.phone_model_aliases
  for select to anon, authenticated using (true);

drop policy if exists phone_selectable_fields_public_read on public.phone_selectable_fields;
create policy phone_selectable_fields_public_read on public.phone_selectable_fields
  for select to anon, authenticated using (true);

-- Trigger functions are not RPC endpoints.
revoke execute on function public.handle_new_user() from public, anon, authenticated, service_role;

-- Authorization helpers remain available only to authenticated requests and
-- the service role because existing RLS policies depend on them.
revoke execute on function public.has_admin_permission(uuid, text) from public, anon;
grant execute on function public.has_admin_permission(uuid, text) to authenticated, service_role;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;
revoke execute on function public.is_admin(uuid) from public, anon;
grant execute on function public.is_admin(uuid) to authenticated, service_role;

-- Public search is read-only and must respect the caller's RLS policies.
alter function public.search_student_housing_listing_ids(
  bigint, text, text, text, numeric, numeric, text, numeric, boolean,
  text, text, numeric, boolean
) security invoker;
revoke execute on function public.search_student_housing_listing_ids(
  bigint, text, text, text, numeric, numeric, text, numeric, boolean,
  text, text, numeric, boolean
) from public;
grant execute on function public.search_student_housing_listing_ids(
  bigint, text, text, text, numeric, numeric, text, numeric, boolean,
  text, text, numeric, boolean
) to anon, authenticated, service_role;

-- Privileged Control Center functions run as the caller so RLS remains the
-- final authorization boundary even if an RPC is invoked outside the app.
alter function public.save_site_settings(jsonb, text, uuid) security invoker;
alter function public.restore_site_settings_version(bigint, text, uuid) security invoker;
alter function public.publish_static_page(bigint, text, uuid) security invoker;
alter function public.restore_static_page_version(bigint, text, uuid) security invoker;

revoke execute on function public.save_site_settings(jsonb, text, uuid) from public, anon;
revoke execute on function public.restore_site_settings_version(bigint, text, uuid) from public, anon;
revoke execute on function public.publish_static_page(bigint, text, uuid) from public, anon;
revoke execute on function public.restore_static_page_version(bigint, text, uuid) from public, anon;

grant execute on function public.save_site_settings(jsonb, text, uuid) to authenticated, service_role;
grant execute on function public.restore_site_settings_version(bigint, text, uuid) to authenticated, service_role;
grant execute on function public.publish_static_page(bigint, text, uuid) to authenticated, service_role;
grant execute on function public.restore_static_page_version(bigint, text, uuid) to authenticated, service_role;

-- Site settings are intentionally public-facing, while mutations and version
-- history require the corresponding RBAC permission.
revoke all on table public.site_settings, public.site_settings_versions from anon, authenticated;
grant select on table public.site_settings to anon;
grant select, insert, update on table public.site_settings to authenticated;
grant select, insert on table public.site_settings_versions to authenticated;
revoke all on sequence public.site_settings_versions_id_seq from anon, authenticated;
grant usage, select on sequence public.site_settings_versions_id_seq to authenticated;

drop policy if exists site_settings_readable_by_admins on public.site_settings;
drop policy if exists site_settings_writeable_by_admins on public.site_settings;
drop policy if exists site_settings_public_read on public.site_settings;
drop policy if exists site_settings_authorized_insert on public.site_settings;
drop policy if exists site_settings_authorized_update on public.site_settings;

create policy site_settings_public_read on public.site_settings
  for select to anon, authenticated using (true);
create policy site_settings_authorized_insert on public.site_settings
  for insert to authenticated
  with check (
    (select public.has_admin_permission((select auth.uid()), 'settings.update'))
    or (select public.has_admin_permission((select auth.uid()), 'settings.publish'))
  );
create policy site_settings_authorized_update on public.site_settings
  for update to authenticated
  using (
    (select public.has_admin_permission((select auth.uid()), 'settings.update'))
    or (select public.has_admin_permission((select auth.uid()), 'settings.publish'))
  )
  with check (
    (select public.has_admin_permission((select auth.uid()), 'settings.update'))
    or (select public.has_admin_permission((select auth.uid()), 'settings.publish'))
  );

drop policy if exists site_settings_versions_readable_by_admins on public.site_settings_versions;
drop policy if exists site_settings_versions_authorized_select on public.site_settings_versions;
drop policy if exists site_settings_versions_authorized_insert on public.site_settings_versions;
create policy site_settings_versions_authorized_select on public.site_settings_versions
  for select to authenticated using (
    (select public.has_admin_permission((select auth.uid()), 'settings.view'))
    or (select public.has_admin_permission((select auth.uid()), 'settings.update'))
    or (select public.has_admin_permission((select auth.uid()), 'settings.publish'))
  );
create policy site_settings_versions_authorized_insert on public.site_settings_versions
  for insert to authenticated with check (
    (select public.has_admin_permission((select auth.uid()), 'settings.update'))
    or (select public.has_admin_permission((select auth.uid()), 'settings.publish'))
  );

-- Static page direct table access and RPCs share the same granular RBAC rules.
revoke all on table public.static_pages, public.static_page_versions from anon, authenticated;
grant select on table public.static_pages to anon;
grant select, insert, update on table public.static_pages to authenticated;
grant select, insert on table public.static_page_versions to authenticated;
revoke all on sequence public.static_pages_id_seq, public.static_page_versions_id_seq from anon, authenticated;
grant usage, select on sequence public.static_pages_id_seq, public.static_page_versions_id_seq to authenticated;

drop policy if exists static_pages_admin_all on public.static_pages;
drop policy if exists static_pages_public_read_published on public.static_pages;
drop policy if exists static_pages_authorized_select on public.static_pages;
drop policy if exists static_pages_authorized_insert on public.static_pages;
drop policy if exists static_pages_authorized_update on public.static_pages;

create policy static_pages_public_read_published on public.static_pages
  for select to anon, authenticated
  using (is_published = true and archived_at is null);
create policy static_pages_authorized_select on public.static_pages
  for select to authenticated using (
    (select public.has_admin_permission((select auth.uid()), 'pages.view'))
    or (select public.has_admin_permission((select auth.uid()), 'pages.update'))
    or (select public.has_admin_permission((select auth.uid()), 'pages.publish'))
    or (select public.has_admin_permission((select auth.uid()), 'configuration.rollback'))
  );
create policy static_pages_authorized_insert on public.static_pages
  for insert to authenticated with check (
    (select public.has_admin_permission((select auth.uid()), 'pages.update'))
    or (select public.has_admin_permission((select auth.uid()), 'configuration.rollback'))
  );
create policy static_pages_authorized_update on public.static_pages
  for update to authenticated
  using (
    (select public.has_admin_permission((select auth.uid()), 'pages.update'))
    or (select public.has_admin_permission((select auth.uid()), 'pages.publish'))
    or (select public.has_admin_permission((select auth.uid()), 'configuration.rollback'))
  )
  with check (
    (select public.has_admin_permission((select auth.uid()), 'pages.update'))
    or (select public.has_admin_permission((select auth.uid()), 'pages.publish'))
    or (select public.has_admin_permission((select auth.uid()), 'configuration.rollback'))
  );

drop policy if exists static_page_versions_admin_select on public.static_page_versions;
drop policy if exists static_page_versions_authorized_select on public.static_page_versions;
drop policy if exists static_page_versions_authorized_insert on public.static_page_versions;
create policy static_page_versions_authorized_select on public.static_page_versions
  for select to authenticated using (
    (select public.has_admin_permission((select auth.uid()), 'pages.view'))
    or (select public.has_admin_permission((select auth.uid()), 'pages.publish'))
    or (select public.has_admin_permission((select auth.uid()), 'configuration.rollback'))
  );
create policy static_page_versions_authorized_insert on public.static_page_versions
  for insert to authenticated with check (
    (select public.has_admin_permission((select auth.uid()), 'pages.publish'))
    or (select public.has_admin_permission((select auth.uid()), 'configuration.rollback'))
  );

-- Moderation is restricted to the dedicated permission rather than any admin.
revoke all on table public.moderation_workflow_entries from anon, authenticated;
grant select, insert, update, delete on table public.moderation_workflow_entries to authenticated;
revoke all on sequence public.moderation_workflow_entries_id_seq from anon, authenticated;
grant usage, select on sequence public.moderation_workflow_entries_id_seq to authenticated;

drop policy if exists moderation_workflow_entries_readable_by_admins on public.moderation_workflow_entries;
drop policy if exists moderation_workflow_entries_writeable_by_admins on public.moderation_workflow_entries;
drop policy if exists moderation_workflow_entries_authorized_select on public.moderation_workflow_entries;
drop policy if exists moderation_workflow_entries_authorized_write on public.moderation_workflow_entries;
create policy moderation_workflow_entries_authorized_select on public.moderation_workflow_entries
  for select to authenticated
  using ((select public.has_admin_permission((select auth.uid()), 'listings.moderate')));
create policy moderation_workflow_entries_authorized_write on public.moderation_workflow_entries
  for all to authenticated
  using ((select public.has_admin_permission((select auth.uid()), 'listings.moderate')))
  with check ((select public.has_admin_permission((select auth.uid()), 'listings.moderate')));

commit;
