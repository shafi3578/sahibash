begin;

-- Public listing pages embed images and attributes through PostgREST. After
-- tightening direct public column grants on public.listings, child-table RLS
-- policies must not require anon/authenticated clients to read private listing
-- columns such as user_id. Keep that visibility decision inside a trusted,
-- audited SECURITY DEFINER helper instead.

create or replace function public.can_read_listing_children(target_listing_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.listings l
    where l.id = target_listing_id
      and (
        l.status = 'approved'::public.listing_status
        or (
          (select auth.uid()) is not null
          and l.user_id = (select auth.uid())
        )
        or (select public.is_admin((select auth.uid())))
      )
  );
$$;

revoke all on function public.can_read_listing_children(uuid) from public;
grant execute on function public.can_read_listing_children(uuid) to anon, authenticated, service_role;

drop policy if exists listing_images_select_visible on public.listing_images;
drop policy if exists listing_images_select_with_visible_listing on public.listing_images;
drop policy if exists listing_images_owner_or_admin_write on public.listing_images;

create policy listing_images_select_with_visible_listing
on public.listing_images
for select
to anon, authenticated
using (public.can_read_listing_children(listing_id));

drop policy if exists listing_attributes_select_visible on public.listing_attributes;
drop policy if exists listing_attributes_select_with_visible_listing on public.listing_attributes;
drop policy if exists listing_attributes_owner_or_admin_write on public.listing_attributes;

create policy listing_attributes_select_with_visible_listing
on public.listing_attributes
for select
to anon, authenticated
using (public.can_read_listing_children(listing_id));

comment on function public.can_read_listing_children(uuid)
  is 'Trusted RLS helper for public listing child embeds. Prevents child-table policies from requiring direct public SELECT on private public.listings columns.';

commit;
