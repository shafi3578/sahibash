begin;

drop policy if exists listing_schema_versions_public_read on public.listing_schema_versions;
create policy listing_schema_versions_public_read
on public.listing_schema_versions for select
to anon, authenticated
using (
  status = 'published'
  or (select public.is_super_administrator((select auth.uid())))
);

drop policy if exists category_schema_profiles_writeable_by_super_administrators on public.category_schema_profiles;
create policy category_schema_profiles_writeable_by_super_administrators
on public.category_schema_profiles for all to authenticated
using ((select public.is_super_administrator((select auth.uid()))))
with check ((select public.is_super_administrator((select auth.uid()))));

commit;
