begin;

-- Step 3 performance hardening: keep equivalent access rules while avoiding
-- row-by-row auth helper evaluation and clearly overlapping permissive SELECT
-- policies on high-frequency catalog, listing, message, favorite, report,
-- electronics and vehicle detail paths.

-- Root taxonomy: a newer optimized authenticated admin ALL policy already
-- exists, so these legacy public admin policies are redundant.
drop policy if exists categories_admin_insert on public.categories;
drop policy if exists categories_admin_update on public.categories;
drop policy if exists categories_admin_delete on public.categories;

-- Subcategories keep one public/admin SELECT policy and explicit admin writes.
drop policy if exists subcategories_public_select_active on public.subcategories;
drop policy if exists subcategories_admin_insert on public.subcategories;
drop policy if exists subcategories_admin_update on public.subcategories;
drop policy if exists subcategories_admin_delete on public.subcategories;

create policy subcategories_public_select_active
  on public.subcategories
  for select
  to public
  using ((is_active = true) or (select is_admin((select auth.uid()))));

create policy subcategories_admin_insert
  on public.subcategories
  for insert
  to public
  with check ((select is_admin((select auth.uid()))));

create policy subcategories_admin_update
  on public.subcategories
  for update
  to public
  using ((select is_admin((select auth.uid()))))
  with check ((select is_admin((select auth.uid()))));

create policy subcategories_admin_delete
  on public.subcategories
  for delete
  to public
  using ((select is_admin((select auth.uid()))));

-- Favorites: remove exact duplicate delete policy and optimize owner checks.
drop policy if exists favorites_delete_own on public.favorites;
drop policy if exists favorites_delete_own_or_admin on public.favorites;
drop policy if exists favorites_insert_own on public.favorites;
drop policy if exists favorites_select_own on public.favorites;

create policy favorites_select_own
  on public.favorites
  for select
  to public
  using (user_id = (select auth.uid()));

create policy favorites_insert_own
  on public.favorites
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy favorites_delete_own_or_admin
  on public.favorites
  for delete
  to public
  using ((user_id = (select auth.uid())) or (select is_admin((select auth.uid()))));

-- Listing child writes keep owner/admin semantics; public child reads stay on
-- private.can_read_listing_children(listing_id).
drop policy if exists listing_images_insert_owner_or_admin on public.listing_images;
drop policy if exists listing_images_update_owner_or_admin on public.listing_images;
drop policy if exists listing_images_delete_owner_or_admin on public.listing_images;

create policy listing_images_insert_owner_or_admin
  on public.listing_images
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.listings l
      where l.id = listing_images.listing_id
        and (l.user_id = (select auth.uid()) or (select is_admin((select auth.uid()))))
    )
  );

create policy listing_images_update_owner_or_admin
  on public.listing_images
  for update
  to public
  using (
    exists (
      select 1
      from public.listings l
      where l.id = listing_images.listing_id
        and (l.user_id = (select auth.uid()) or (select is_admin((select auth.uid()))))
    )
  )
  with check (
    exists (
      select 1
      from public.listings l
      where l.id = listing_images.listing_id
        and (l.user_id = (select auth.uid()) or (select is_admin((select auth.uid()))))
    )
  );

create policy listing_images_delete_owner_or_admin
  on public.listing_images
  for delete
  to public
  using (
    exists (
      select 1
      from public.listings l
      where l.id = listing_images.listing_id
        and (l.user_id = (select auth.uid()) or (select is_admin((select auth.uid()))))
    )
  );

drop policy if exists listing_attributes_insert_owner_or_admin on public.listing_attributes;
drop policy if exists listing_attributes_update_owner_or_admin on public.listing_attributes;
drop policy if exists listing_attributes_delete_owner_or_admin on public.listing_attributes;

create policy listing_attributes_insert_owner_or_admin
  on public.listing_attributes
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.listings l
      where l.id = listing_attributes.listing_id
        and (l.user_id = (select auth.uid()) or (select is_admin((select auth.uid()))))
    )
  );

create policy listing_attributes_update_owner_or_admin
  on public.listing_attributes
  for update
  to public
  using (
    exists (
      select 1
      from public.listings l
      where l.id = listing_attributes.listing_id
        and (l.user_id = (select auth.uid()) or (select is_admin((select auth.uid()))))
    )
  )
  with check (
    exists (
      select 1
      from public.listings l
      where l.id = listing_attributes.listing_id
        and (l.user_id = (select auth.uid()) or (select is_admin((select auth.uid()))))
    )
  );

create policy listing_attributes_delete_owner_or_admin
  on public.listing_attributes
  for delete
  to public
  using (
    exists (
      select 1
      from public.listings l
      where l.id = listing_attributes.listing_id
        and (l.user_id = (select auth.uid()) or (select is_admin((select auth.uid()))))
    )
  );

-- Drafts, messages and listing view analytics.
drop policy if exists listing_drafts_owner_select on public.listing_drafts;
drop policy if exists listing_drafts_owner_insert on public.listing_drafts;
drop policy if exists listing_drafts_owner_update on public.listing_drafts;
drop policy if exists listing_drafts_owner_delete on public.listing_drafts;

create policy listing_drafts_owner_select
  on public.listing_drafts
  for select
  to public
  using ((user_id = (select auth.uid())) or (select is_admin((select auth.uid()))));

create policy listing_drafts_owner_insert
  on public.listing_drafts
  for insert
  to public
  with check ((user_id = (select auth.uid())) or (select is_admin((select auth.uid()))));

create policy listing_drafts_owner_update
  on public.listing_drafts
  for update
  to public
  using ((user_id = (select auth.uid())) or (select is_admin((select auth.uid()))))
  with check ((user_id = (select auth.uid())) or (select is_admin((select auth.uid()))));

create policy listing_drafts_owner_delete
  on public.listing_drafts
  for delete
  to public
  using ((user_id = (select auth.uid())) or (select is_admin((select auth.uid()))));

drop policy if exists messages_insert_sender_only on public.messages;
drop policy if exists messages_select_sender_or_recipient on public.messages;
drop policy if exists messages_update_recipient_or_admin on public.messages;

create policy messages_insert_sender_only
  on public.messages
  for insert
  to authenticated
  with check (sender_user_id = (select auth.uid()));

create policy messages_select_sender_or_recipient
  on public.messages
  for select
  to public
  using (
    sender_user_id = (select auth.uid())
    or recipient_user_id = (select auth.uid())
    or (select is_admin((select auth.uid())))
  );

create policy messages_update_recipient_or_admin
  on public.messages
  for update
  to public
  using ((recipient_user_id = (select auth.uid())) or (select is_admin((select auth.uid()))))
  with check ((recipient_user_id = (select auth.uid())) or (select is_admin((select auth.uid()))));

drop policy if exists listing_views_select_admin_only on public.listing_views;
drop policy if exists listing_views_select_owner_or_admin on public.listing_views;

create policy listing_views_select_owner_or_admin
  on public.listing_views
  for select
  to public
  using (
    exists (
      select 1
      from public.listings l
      where l.id = listing_views.listing_id
        and (l.user_id = (select auth.uid()) or (select is_admin((select auth.uid()))))
    )
  );

-- Reports: remove overlapping ALL policy and retain reporter/admin paths.
drop policy if exists reports_admin_manage on public.reports;
drop policy if exists reports_insert_reporter_only on public.reports;
drop policy if exists reports_select_own_or_admin on public.reports;
drop policy if exists reports_update_admin_only on public.reports;
drop policy if exists reports_delete_admin_only on public.reports;

create policy reports_insert_reporter_only
  on public.reports
  for insert
  to authenticated
  with check (reporter_user_id = (select auth.uid()));

create policy reports_select_own_or_admin
  on public.reports
  for select
  to public
  using ((reporter_user_id = (select auth.uid())) or (select is_admin((select auth.uid()))));

create policy reports_update_admin_only
  on public.reports
  for update
  to public
  using ((select is_admin((select auth.uid()))))
  with check ((select is_admin((select auth.uid()))));

create policy reports_delete_admin_only
  on public.reports
  for delete
  to public
  using ((select is_admin((select auth.uid()))));

-- Search aliases and category/product config tables keep public active reads
-- plus admin full visibility/writes without overlapping ALL policies.
drop policy if exists "Admins manage search aliases" on public.search_alias_dictionary;
drop policy if exists "Public read active search aliases" on public.search_alias_dictionary;

create policy search_alias_dictionary_select_active_or_admin
  on public.search_alias_dictionary
  for select
  to public
  using ((is_active = true) or (select is_admin((select auth.uid()))));

create policy search_alias_dictionary_admin_insert
  on public.search_alias_dictionary
  for insert
  to public
  with check ((select is_admin((select auth.uid()))));

create policy search_alias_dictionary_admin_update
  on public.search_alias_dictionary
  for update
  to public
  using ((select is_admin((select auth.uid()))))
  with check ((select is_admin((select auth.uid()))));

create policy search_alias_dictionary_admin_delete
  on public.search_alias_dictionary
  for delete
  to public
  using ((select is_admin((select auth.uid()))));

drop policy if exists category_fields_admin_manage on public.category_fields;
drop policy if exists category_fields_public_select_active on public.category_fields;

create policy category_fields_public_select_active
  on public.category_fields
  for select
  to public
  using ((is_active = true) or (select is_admin((select auth.uid()))));

create policy category_fields_admin_insert
  on public.category_fields
  for insert
  to public
  with check ((select is_admin((select auth.uid()))));

create policy category_fields_admin_update
  on public.category_fields
  for update
  to public
  using ((select is_admin((select auth.uid()))))
  with check ((select is_admin((select auth.uid()))));

create policy category_fields_admin_delete
  on public.category_fields
  for delete
  to public
  using ((select is_admin((select auth.uid()))));

drop policy if exists filter_definitions_admin_write on public.filter_definitions;
drop policy if exists filter_definitions_public_read on public.filter_definitions;

create policy filter_definitions_select_active_or_admin
  on public.filter_definitions
  for select
  to public
  using ((is_active = true) or (select is_admin((select auth.uid()))));

create policy filter_definitions_admin_insert
  on public.filter_definitions
  for insert
  to public
  with check ((select is_admin((select auth.uid()))));

create policy filter_definitions_admin_update
  on public.filter_definitions
  for update
  to public
  using ((select is_admin((select auth.uid()))))
  with check ((select is_admin((select auth.uid()))));

create policy filter_definitions_admin_delete
  on public.filter_definitions
  for delete
  to public
  using ((select is_admin((select auth.uid()))));

drop policy if exists posting_category_config_admin_manage on public.posting_category_config;
drop policy if exists posting_category_config_public_read on public.posting_category_config;

create policy posting_category_config_select_active_or_admin
  on public.posting_category_config
  for select
  to public
  using ((is_active = true) or (select is_admin((select auth.uid()))));

create policy posting_category_config_admin_insert
  on public.posting_category_config
  for insert
  to public
  with check ((select is_admin((select auth.uid()))));

create policy posting_category_config_admin_update
  on public.posting_category_config
  for update
  to public
  using ((select is_admin((select auth.uid()))))
  with check ((select is_admin((select auth.uid()))));

create policy posting_category_config_admin_delete
  on public.posting_category_config
  for delete
  to public
  using ((select is_admin((select auth.uid()))));

drop policy if exists product_specs_admin_manage on public.product_specs;
drop policy if exists product_specs_public_read on public.product_specs;

create policy product_specs_select_active_or_admin
  on public.product_specs
  for select
  to public
  using ((is_active = true) or (select is_admin((select auth.uid()))));

create policy product_specs_admin_insert
  on public.product_specs
  for insert
  to public
  with check ((select is_admin((select auth.uid()))));

create policy product_specs_admin_update
  on public.product_specs
  for update
  to public
  using ((select is_admin((select auth.uid()))))
  with check ((select is_admin((select auth.uid()))));

create policy product_specs_admin_delete
  on public.product_specs
  for delete
  to public
  using ((select is_admin((select auth.uid()))));

drop policy if exists homepage_sections_writeable_by_admins on public.homepage_sections;

create policy homepage_sections_admin_insert
  on public.homepage_sections
  for insert
  to public
  with check ((select is_admin((select auth.uid()))));

create policy homepage_sections_admin_update
  on public.homepage_sections
  for update
  to public
  using ((select is_admin((select auth.uid()))))
  with check ((select is_admin((select auth.uid()))));

create policy homepage_sections_admin_delete
  on public.homepage_sections
  for delete
  to public
  using ((select is_admin((select auth.uid()))));

drop policy if exists navigation_items_writeable_by_admins on public.navigation_items;

create policy navigation_items_admin_insert
  on public.navigation_items
  for insert
  to public
  with check ((select is_admin((select auth.uid()))));

create policy navigation_items_admin_update
  on public.navigation_items
  for update
  to public
  using ((select is_admin((select auth.uid()))))
  with check ((select is_admin((select auth.uid()))));

create policy navigation_items_admin_delete
  on public.navigation_items
  for delete
  to public
  using ((select is_admin((select auth.uid()))));

drop policy if exists "Admins manage listing translations" on public.listing_translations;
drop policy if exists "Public can read listing translations" on public.listing_translations;

create policy listing_translations_select_visible_or_admin
  on public.listing_translations
  for select
  to public
  using (
    (select is_admin((select auth.uid())))
    or exists (
      select 1
      from public.listings l
      where l.id = listing_translations.listing_id
        and l.status = 'approved'::listing_status
    )
  );

create policy listing_translations_admin_insert
  on public.listing_translations
  for insert
  to public
  with check ((select is_admin((select auth.uid()))));

create policy listing_translations_admin_update
  on public.listing_translations
  for update
  to public
  using ((select is_admin((select auth.uid()))))
  with check ((select is_admin((select auth.uid()))));

create policy listing_translations_admin_delete
  on public.listing_translations
  for delete
  to public
  using ((select is_admin((select auth.uid()))));

-- Electronics catalog/detail policies.
drop policy if exists electronics_categories_admin_manage on public.electronics_categories;
drop policy if exists electronics_categories_public_read on public.electronics_categories;

create policy electronics_categories_select_active_or_admin
  on public.electronics_categories
  for select
  to public
  using ((is_active = true) or (select is_admin((select auth.uid()))));

create policy electronics_categories_admin_insert
  on public.electronics_categories
  for insert
  to public
  with check ((select is_admin((select auth.uid()))));

create policy electronics_categories_admin_update
  on public.electronics_categories
  for update
  to public
  using ((select is_admin((select auth.uid()))))
  with check ((select is_admin((select auth.uid()))));

create policy electronics_categories_admin_delete
  on public.electronics_categories
  for delete
  to public
  using ((select is_admin((select auth.uid()))));

drop policy if exists electronics_brands_admin_manage on public.electronics_brands;
drop policy if exists electronics_brands_public_read on public.electronics_brands;

create policy electronics_brands_select_active_or_admin
  on public.electronics_brands
  for select
  to public
  using ((is_active = true) or (select is_admin((select auth.uid()))));

create policy electronics_brands_admin_insert
  on public.electronics_brands
  for insert
  to public
  with check ((select is_admin((select auth.uid()))));

create policy electronics_brands_admin_update
  on public.electronics_brands
  for update
  to public
  using ((select is_admin((select auth.uid()))))
  with check ((select is_admin((select auth.uid()))));

create policy electronics_brands_admin_delete
  on public.electronics_brands
  for delete
  to public
  using ((select is_admin((select auth.uid()))));

drop policy if exists electronics_models_admin_manage on public.electronics_models;
drop policy if exists electronics_models_public_read on public.electronics_models;

create policy electronics_models_select_active_or_admin
  on public.electronics_models
  for select
  to public
  using ((is_active = true) or (select is_admin((select auth.uid()))));

create policy electronics_models_admin_insert
  on public.electronics_models
  for insert
  to public
  with check ((select is_admin((select auth.uid()))));

create policy electronics_models_admin_update
  on public.electronics_models
  for update
  to public
  using ((select is_admin((select auth.uid()))))
  with check ((select is_admin((select auth.uid()))));

create policy electronics_models_admin_delete
  on public.electronics_models
  for delete
  to public
  using ((select is_admin((select auth.uid()))));

drop policy if exists electronics_model_specs_admin_manage on public.electronics_model_specs;
drop policy if exists electronics_model_specs_public_read on public.electronics_model_specs;

create policy electronics_model_specs_select_public_or_admin
  on public.electronics_model_specs
  for select
  to public
  using ((is_public = true) or (select is_admin((select auth.uid()))));

create policy electronics_model_specs_admin_insert
  on public.electronics_model_specs
  for insert
  to public
  with check ((select is_admin((select auth.uid()))));

create policy electronics_model_specs_admin_update
  on public.electronics_model_specs
  for update
  to public
  using ((select is_admin((select auth.uid()))))
  with check ((select is_admin((select auth.uid()))));

create policy electronics_model_specs_admin_delete
  on public.electronics_model_specs
  for delete
  to public
  using ((select is_admin((select auth.uid()))));

drop policy if exists electronics_model_options_admin_manage on public.electronics_model_options;

create policy electronics_model_options_admin_insert
  on public.electronics_model_options
  for insert
  to public
  with check ((select is_admin((select auth.uid()))));

create policy electronics_model_options_admin_update
  on public.electronics_model_options
  for update
  to public
  using ((select is_admin((select auth.uid()))))
  with check ((select is_admin((select auth.uid()))));

create policy electronics_model_options_admin_delete
  on public.electronics_model_options
  for delete
  to public
  using ((select is_admin((select auth.uid()))));

drop policy if exists electronics_listings_select_public_or_owner_or_admin on public.electronics_listings;
drop policy if exists electronics_listings_write_owner_or_admin on public.electronics_listings;

create policy electronics_listings_select_public_or_owner_or_admin
  on public.electronics_listings
  for select
  to public
  using (
    exists (
      select 1
      from public.listings l
      where l.id = electronics_listings.listing_id
        and (
          l.status = 'approved'::listing_status
          or l.user_id = (select auth.uid())
          or (select is_admin((select auth.uid())))
        )
    )
  );

create policy electronics_listings_insert_owner_or_admin
  on public.electronics_listings
  for insert
  to public
  with check (
    exists (
      select 1
      from public.listings l
      where l.id = electronics_listings.listing_id
        and (l.user_id = (select auth.uid()) or (select is_admin((select auth.uid()))))
    )
  );

create policy electronics_listings_update_owner_or_admin
  on public.electronics_listings
  for update
  to public
  using (
    exists (
      select 1
      from public.listings l
      where l.id = electronics_listings.listing_id
        and (l.user_id = (select auth.uid()) or (select is_admin((select auth.uid()))))
    )
  )
  with check (
    exists (
      select 1
      from public.listings l
      where l.id = electronics_listings.listing_id
        and (l.user_id = (select auth.uid()) or (select is_admin((select auth.uid()))))
    )
  );

create policy electronics_listings_delete_owner_or_admin
  on public.electronics_listings
  for delete
  to public
  using (
    exists (
      select 1
      from public.listings l
      where l.id = electronics_listings.listing_id
        and (l.user_id = (select auth.uid()) or (select is_admin((select auth.uid()))))
    )
  );

-- Vehicle detail policies: split owner writes from visible reads.
drop policy if exists listing_vehicle_features_owner_write on public.listing_vehicle_features;
drop policy if exists listing_vehicle_features_visible_read on public.listing_vehicle_features;

create policy listing_vehicle_features_visible_read
  on public.listing_vehicle_features
  for select
  to public
  using (
    exists (
      select 1
      from public.listings l
      where l.id = listing_vehicle_features.listing_id
        and (l.status = 'approved'::listing_status or l.user_id = (select auth.uid()))
    )
  );

create policy listing_vehicle_features_insert_owner
  on public.listing_vehicle_features
  for insert
  to public
  with check (
    exists (
      select 1
      from public.listings l
      where l.id = listing_vehicle_features.listing_id
        and l.user_id = (select auth.uid())
    )
  );

create policy listing_vehicle_features_update_owner
  on public.listing_vehicle_features
  for update
  to public
  using (
    exists (
      select 1
      from public.listings l
      where l.id = listing_vehicle_features.listing_id
        and l.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.listings l
      where l.id = listing_vehicle_features.listing_id
        and l.user_id = (select auth.uid())
    )
  );

create policy listing_vehicle_features_delete_owner
  on public.listing_vehicle_features
  for delete
  to public
  using (
    exists (
      select 1
      from public.listings l
      where l.id = listing_vehicle_features.listing_id
        and l.user_id = (select auth.uid())
    )
  );

drop policy if exists vehicle_damage_reports_owner_write on public.vehicle_damage_reports;
drop policy if exists vehicle_damage_reports_owner_read on public.vehicle_damage_reports;

create policy vehicle_damage_reports_owner_read
  on public.vehicle_damage_reports
  for select
  to public
  using (
    exists (
      select 1
      from public.listings l
      where l.id = vehicle_damage_reports.listing_id
        and (l.status = 'approved'::listing_status or l.user_id = (select auth.uid()))
    )
  );

create policy vehicle_damage_reports_insert_owner
  on public.vehicle_damage_reports
  for insert
  to public
  with check (
    exists (
      select 1
      from public.listings l
      where l.id = vehicle_damage_reports.listing_id
        and l.user_id = (select auth.uid())
    )
  );

create policy vehicle_damage_reports_update_owner
  on public.vehicle_damage_reports
  for update
  to public
  using (
    exists (
      select 1
      from public.listings l
      where l.id = vehicle_damage_reports.listing_id
        and l.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.listings l
      where l.id = vehicle_damage_reports.listing_id
        and l.user_id = (select auth.uid())
    )
  );

create policy vehicle_damage_reports_delete_owner
  on public.vehicle_damage_reports
  for delete
  to public
  using (
    exists (
      select 1
      from public.listings l
      where l.id = vehicle_damage_reports.listing_id
        and l.user_id = (select auth.uid())
    )
  );

drop policy if exists vehicle_damage_parts_owner_write on public.vehicle_damage_parts;
drop policy if exists vehicle_damage_parts_owner_read on public.vehicle_damage_parts;

create policy vehicle_damage_parts_owner_read
  on public.vehicle_damage_parts
  for select
  to public
  using (
    exists (
      select 1
      from public.vehicle_damage_reports r
      join public.listings l on l.id = r.listing_id
      where r.id = vehicle_damage_parts.damage_report_id
        and (l.status = 'approved'::listing_status or l.user_id = (select auth.uid()))
    )
  );

create policy vehicle_damage_parts_insert_owner
  on public.vehicle_damage_parts
  for insert
  to public
  with check (
    exists (
      select 1
      from public.vehicle_damage_reports r
      join public.listings l on l.id = r.listing_id
      where r.id = vehicle_damage_parts.damage_report_id
        and l.user_id = (select auth.uid())
    )
  );

create policy vehicle_damage_parts_update_owner
  on public.vehicle_damage_parts
  for update
  to public
  using (
    exists (
      select 1
      from public.vehicle_damage_reports r
      join public.listings l on l.id = r.listing_id
      where r.id = vehicle_damage_parts.damage_report_id
        and l.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.vehicle_damage_reports r
      join public.listings l on l.id = r.listing_id
      where r.id = vehicle_damage_parts.damage_report_id
        and l.user_id = (select auth.uid())
    )
  );

create policy vehicle_damage_parts_delete_owner
  on public.vehicle_damage_parts
  for delete
  to public
  using (
    exists (
      select 1
      from public.vehicle_damage_reports r
      join public.listings l on l.id = r.listing_id
      where r.id = vehicle_damage_parts.damage_report_id
        and l.user_id = (select auth.uid())
    )
  );

commit;
