begin;

-- Step 3 performance hardening follow-up: optimize remaining high-traffic
-- RLS auth helper calls while preserving each policy's original visibility.

-- Admin RBAC and audit tables.
drop policy if exists admin_permissions_admin_only on public.admin_permissions;
drop policy if exists admin_role_permissions_admin_only on public.admin_role_permissions;
drop policy if exists admin_roles_admin_only on public.admin_roles;
drop policy if exists admin_user_roles_admin_only on public.admin_user_roles;
drop policy if exists audit_logs_admin_only on public.audit_logs;

create policy admin_permissions_admin_only
  on public.admin_permissions
  for all
  to public
  using ((select is_admin((select auth.uid()))))
  with check ((select is_admin((select auth.uid()))));

create policy admin_role_permissions_admin_only
  on public.admin_role_permissions
  for all
  to public
  using ((select is_admin((select auth.uid()))))
  with check ((select is_admin((select auth.uid()))));

create policy admin_roles_admin_only
  on public.admin_roles
  for all
  to public
  using ((select is_admin((select auth.uid()))))
  with check ((select is_admin((select auth.uid()))));

create policy admin_user_roles_admin_only
  on public.admin_user_roles
  for all
  to public
  using ((select is_admin((select auth.uid()))))
  with check ((select is_admin((select auth.uid()))));

create policy audit_logs_admin_only
  on public.audit_logs
  for select
  to public
  using ((select is_admin((select auth.uid()))));

-- User profile and core listing insert boundary.
drop policy if exists profiles_select_own_or_admin on public.profiles;
drop policy if exists listings_insert_owner_only on public.listings;

create policy profiles_select_own_or_admin
  on public.profiles
  for select
  to public
  using (((select auth.uid()) = id) or (select is_admin((select auth.uid()))));

create policy listings_insert_owner_only
  on public.listings
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and status = 'pending'::listing_status
    and approved_by is null
    and approved_at is null
  );

-- Offers, saved searches, notes and notifications.
drop policy if exists offers_insert_buyer_only on public.offers;
drop policy if exists offers_select_participants_or_admin on public.offers;
drop policy if exists offers_update_seller_or_buyer_or_admin on public.offers;
drop policy if exists saved_searches_owner_only on public.saved_searches;
drop policy if exists listing_notes_owner_only on public.listing_notes;
drop policy if exists notifications_owner_only on public.notifications;

create policy offers_insert_buyer_only
  on public.offers
  for insert
  to authenticated
  with check (buyer_user_id = (select auth.uid()));

create policy offers_select_participants_or_admin
  on public.offers
  for select
  to public
  using (
    buyer_user_id = (select auth.uid())
    or seller_user_id = (select auth.uid())
    or (select is_admin((select auth.uid())))
  );

create policy offers_update_seller_or_buyer_or_admin
  on public.offers
  for update
  to public
  using (
    buyer_user_id = (select auth.uid())
    or seller_user_id = (select auth.uid())
    or (select is_admin((select auth.uid())))
  )
  with check (
    buyer_user_id = (select auth.uid())
    or seller_user_id = (select auth.uid())
    or (select is_admin((select auth.uid())))
  );

create policy saved_searches_owner_only
  on public.saved_searches
  for all
  to public
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy listing_notes_owner_only
  on public.listing_notes
  for all
  to public
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy notifications_owner_only
  on public.notifications
  for all
  to public
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Price history and Featured promotion public/owner/admin read.
drop policy if exists listing_price_history_select_owner_or_admin on public.listing_price_history;
drop policy if exists listing_price_history_insert_owner_or_admin on public.listing_price_history;
drop policy if exists listing_promotions_select_owner_or_admin_or_public on public.listing_promotions;

create policy listing_price_history_select_owner_or_admin
  on public.listing_price_history
  for select
  to public
  using (
    exists (
      select 1
      from public.listings l
      where l.id = listing_price_history.listing_id
        and (l.user_id = (select auth.uid()) or (select is_admin((select auth.uid()))))
    )
  );

create policy listing_price_history_insert_owner_or_admin
  on public.listing_price_history
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.listings l
      where l.id = listing_price_history.listing_id
        and (l.user_id = (select auth.uid()) or (select is_admin((select auth.uid()))))
    )
  );

create policy listing_promotions_select_owner_or_admin_or_public
  on public.listing_promotions
  for select
  to public
  using (
    exists (
      select 1
      from public.listings l
      where l.id = listing_promotions.listing_id
        and (
          l.status = 'approved'::listing_status
          or l.user_id = (select auth.uid())
          or (select is_admin((select auth.uid())))
        )
    )
  );

-- AI/search telemetry reads avoid raw per-row auth helpers.
drop policy if exists ai_detection_logs_owner_insert on public.ai_detection_logs;
drop policy if exists ai_detection_logs_owner_select on public.ai_detection_logs;
drop policy if exists "Admins read search telemetry" on public.search_telemetry;

create policy ai_detection_logs_owner_insert
  on public.ai_detection_logs
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy ai_detection_logs_owner_select
  on public.ai_detection_logs
  for select
  to authenticated
  using ((user_id = (select auth.uid())) or (select is_admin((select auth.uid()))));

create policy "Admins read search telemetry"
  on public.search_telemetry
  for select
  to public
  using ((select is_admin((select auth.uid()))));

-- Location admin write/update policies keep the original profile-role check.
drop policy if exists countries_admin_write on public.countries;
drop policy if exists countries_admin_update on public.countries;
drop policy if exists provinces_admin_write on public.provinces;
drop policy if exists provinces_admin_update on public.provinces;
drop policy if exists districts_admin_write on public.districts;
drop policy if exists districts_admin_update on public.districts;
drop policy if exists areas_admin_write on public.areas;
drop policy if exists areas_admin_update on public.areas;

create policy countries_admin_write
  on public.countries
  for insert
  to public
  with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'::profile_role));

create policy countries_admin_update
  on public.countries
  for update
  to public
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'::profile_role));

create policy provinces_admin_write
  on public.provinces
  for insert
  to public
  with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'::profile_role));

create policy provinces_admin_update
  on public.provinces
  for update
  to public
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'::profile_role));

create policy districts_admin_write
  on public.districts
  for insert
  to public
  with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'::profile_role));

create policy districts_admin_update
  on public.districts
  for update
  to public
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'::profile_role));

create policy areas_admin_write
  on public.areas
  for insert
  to public
  with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'::profile_role));

create policy areas_admin_update
  on public.areas
  for update
  to public
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'::profile_role));

-- Area suggestions: merge owner/admin SELECT policies into one.
drop policy if exists area_suggestions_admin_read on public.area_suggestions;
drop policy if exists area_suggestions_owner_read on public.area_suggestions;
drop policy if exists area_suggestions_admin_update on public.area_suggestions;
drop policy if exists area_suggestions_public_insert on public.area_suggestions;

create policy area_suggestions_owner_or_admin_read
  on public.area_suggestions
  for select
  to public
  using (
    submitted_by = (select auth.uid())
    or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'::profile_role)
  );

create policy area_suggestions_admin_update
  on public.area_suggestions
  for update
  to public
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'::profile_role));

create policy area_suggestions_public_insert
  on public.area_suggestions
  for insert
  to public
  with check ((select auth.uid()) is not null);

-- Public category aliases remain publicly readable; admin ALL no longer
-- overlaps SELECT.
drop policy if exists category_aliases_admin_manage on public.category_aliases;

create policy category_aliases_admin_insert
  on public.category_aliases
  for insert
  to public
  with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'::profile_role));

create policy category_aliases_admin_update
  on public.category_aliases
  for update
  to public
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'::profile_role))
  with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'::profile_role));

create policy category_aliases_admin_delete
  on public.category_aliases
  for delete
  to public
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'::profile_role));

drop policy if exists category_waitlists_insert_public on public.category_waitlists;
drop policy if exists category_waitlists_select_own on public.category_waitlists;

create policy category_waitlists_insert_public
  on public.category_waitlists
  for insert
  to anon, authenticated
  with check ((user_id is null) or ((select auth.uid()) = user_id));

create policy category_waitlists_select_own
  on public.category_waitlists
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Listing category path: split write from read to remove SELECT overlap.
drop policy if exists listing_category_path_owner_or_admin_read on public.listing_category_path;
drop policy if exists listing_category_path_owner_or_admin_write on public.listing_category_path;

create policy listing_category_path_owner_or_admin_read
  on public.listing_category_path
  for select
  to public
  using (
    exists (
      select 1
      from public.listings l
      where l.id = listing_category_path.listing_id
        and (l.user_id = (select auth.uid()) or (select is_admin((select auth.uid()))))
    )
  );

create policy listing_category_path_insert_owner_or_admin
  on public.listing_category_path
  for insert
  to public
  with check (
    exists (
      select 1
      from public.listings l
      where l.id = listing_category_path.listing_id
        and (l.user_id = (select auth.uid()) or (select is_admin((select auth.uid()))))
    )
  );

create policy listing_category_path_update_owner_or_admin
  on public.listing_category_path
  for update
  to public
  using (
    exists (
      select 1
      from public.listings l
      where l.id = listing_category_path.listing_id
        and (l.user_id = (select auth.uid()) or (select is_admin((select auth.uid()))))
    )
  )
  with check (
    exists (
      select 1
      from public.listings l
      where l.id = listing_category_path.listing_id
        and (l.user_id = (select auth.uid()) or (select is_admin((select auth.uid()))))
    )
  );

create policy listing_category_path_delete_owner_or_admin
  on public.listing_category_path
  for delete
  to public
  using (
    exists (
      select 1
      from public.listings l
      where l.id = listing_category_path.listing_id
        and (l.user_id = (select auth.uid()) or (select is_admin((select auth.uid()))))
    )
  );

drop policy if exists "Admins manage translation jobs" on public.listing_translation_jobs;

create policy "Admins manage translation jobs"
  on public.listing_translation_jobs
  for all
  to public
  using ((select is_admin((select auth.uid()))))
  with check ((select is_admin((select auth.uid()))));

commit;
