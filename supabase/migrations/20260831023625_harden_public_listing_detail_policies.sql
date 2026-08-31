begin;

-- Public listing detail tables must not inspect public.listings directly.
-- The public listing Data API intentionally exposes only a safe column set;
-- direct owner/status subqueries therefore fail for anon even when the parent
-- listing is approved. Reuse the existing private SECURITY DEFINER visibility
-- helper so approved data, owners, and administrators retain the same access
-- without restoring broad listings-table privileges.

drop policy if exists electronics_listings_select_public_or_owner_or_admin
  on public.electronics_listings;
create policy electronics_listings_select_public_or_owner_or_admin
  on public.electronics_listings
  for select
  to anon, authenticated
  using (private.can_read_listing_children(listing_id));

drop policy if exists listing_promotions_select_owner_or_admin_or_public
  on public.listing_promotions;
create policy listing_promotions_select_owner_or_admin_or_public
  on public.listing_promotions
  for select
  to anon, authenticated
  using (private.can_read_listing_children(listing_id));

drop policy if exists listing_vehicle_features_visible_read
  on public.listing_vehicle_features;
create policy listing_vehicle_features_visible_read
  on public.listing_vehicle_features
  for select
  to anon, authenticated
  using (private.can_read_listing_children(listing_id));

drop policy if exists vehicle_damage_reports_owner_read
  on public.vehicle_damage_reports;
create policy vehicle_damage_reports_owner_read
  on public.vehicle_damage_reports
  for select
  to anon, authenticated
  using (private.can_read_listing_children(listing_id));

drop policy if exists vehicle_damage_parts_owner_read
  on public.vehicle_damage_parts;
create policy vehicle_damage_parts_owner_read
  on public.vehicle_damage_parts
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.vehicle_damage_reports report
      where report.id = vehicle_damage_parts.damage_report_id
        and private.can_read_listing_children(report.listing_id)
    )
  );

-- Fail atomically if any intended policy was not installed with the trusted
-- visibility boundary or still reads the restricted listings table directly.
do $$
declare
  hardened_policy_count integer;
begin
  select count(*)
  into hardened_policy_count
  from pg_policies
  where schemaname = 'public'
    and policyname in (
      'electronics_listings_select_public_or_owner_or_admin',
      'listing_promotions_select_owner_or_admin_or_public',
      'listing_vehicle_features_visible_read',
      'vehicle_damage_reports_owner_read',
      'vehicle_damage_parts_owner_read'
    )
    and cmd = 'SELECT'
    and coalesce(qual, '') ilike '%private.can_read_listing_children%'
    and coalesce(qual, '') !~* 'from[[:space:]]+listings';

  if hardened_policy_count <> 5 then
    raise exception 'Not all public listing-detail policies use the trusted visibility boundary';
  end if;
end;
$$;

commit;
