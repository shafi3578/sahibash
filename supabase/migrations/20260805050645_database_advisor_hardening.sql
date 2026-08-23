begin;

-- Pin application-function resolution to trusted schemas. This keeps current
-- unqualified references working while preventing caller-controlled paths.
alter function public.adjust_favorite_count() set search_path = public, pg_temp;
alter function public.adjust_message_count() set search_path = public, pg_temp;
alter function public.assign_first_primary_image() set search_path = public, pg_temp;
alter function public.ensure_single_primary_image() set search_path = public, pg_temp;
alter function public.get_category_descendant_ids(bigint) set search_path = public, pg_temp;
alter function public.get_category_listing_count(bigint) set search_path = public, pg_temp;
alter function public.get_category_tree_counts(bigint) set search_path = public, pg_temp;
alter function public.get_listings_by_location(bigint, bigint, bigint, numeric, numeric, text, bigint, integer, integer) set search_path = public, pg_temp;
alter function public.get_nearby_listings(numeric, numeric, numeric, text, bigint, integer) set search_path = public, pg_temp;
alter function public.increment_listing_view_count() set search_path = public, pg_temp;
alter function public.refresh_category_leaf_flags() set search_path = public, pg_temp;
alter function public.search_real_estate_listing_ids(bigint, text, text, text, text, text, numeric, numeric, numeric, numeric, numeric, numeric, numeric, boolean, text, text, numeric, numeric, numeric) set search_path = public, pg_temp;
alter function public.set_listing_approval_fields() set search_path = public, pg_temp;
alter function public.set_updated_at() set search_path = public, pg_temp;
alter function public.set_updated_at_listing_translation() set search_path = public, pg_temp;
alter function public.track_listing_price_changes() set search_path = public, pg_temp;
alter function public.update_offer_updated_at() set search_path = public, pg_temp;
alter function public.validate_listing_category_node() set search_path = public, pg_temp;
alter function public.validate_listing_category_subcategory() set search_path = public, pg_temp;

-- Cover foreign-key lookup paths reported by the database advisor.
create index if not exists idx_admin_role_permissions_permission_id on public.admin_role_permissions(permission_id);
create index if not exists idx_admin_user_roles_role_id on public.admin_user_roles(role_id);
create index if not exists idx_area_suggestions_approved_area_id on public.area_suggestions(approved_area_id);
create index if not exists idx_area_suggestions_district_id on public.area_suggestions(district_id);
create index if not exists idx_area_suggestions_submitted_by on public.area_suggestions(submitted_by);
create index if not exists idx_audit_logs_admin_user_id on public.audit_logs(admin_user_id);
create index if not exists idx_category_fields_category_id on public.category_fields(category_id);
create index if not exists idx_category_nodes_parent_id on public.category_nodes(parent_id);
create index if not exists idx_category_waitlists_user_id on public.category_waitlists(user_id);
create index if not exists idx_electronics_categories_category_node_id on public.electronics_categories(category_node_id);
create index if not exists idx_electronics_listings_model_id on public.electronics_listings(model_id);
create index if not exists idx_listing_attributes_category_field_id on public.listing_attributes(category_field_id);
create index if not exists idx_listing_price_history_changed_by on public.listing_price_history(changed_by);
create index if not exists idx_listing_promotions_created_by on public.listing_promotions(created_by);
create index if not exists idx_listings_approved_by on public.listings(approved_by);
create index if not exists idx_messages_sender_user_id on public.messages(sender_user_id);
create index if not exists idx_navigation_items_parent_id on public.navigation_items(parent_id);
create index if not exists idx_offers_listing_id on public.offers(listing_id);
create index if not exists idx_product_models_category_node_id on public.product_models(category_node_id);
create index if not exists idx_product_models_series_id on public.product_models(series_id);
create index if not exists idx_reports_resolved_by on public.reports(resolved_by);
create index if not exists idx_search_alias_dictionary_approved_by on public.search_alias_dictionary(approved_by);
create index if not exists idx_search_telemetry_clicked_listing_id on public.search_telemetry(clicked_listing_id);
create index if not exists idx_site_settings_versions_created_by on public.site_settings_versions(created_by);
create index if not exists idx_static_page_versions_created_by on public.static_page_versions(created_by);
create index if not exists idx_vehicle_brands_category_node_id on public.vehicle_brands(category_node_id);
create index if not exists idx_vehicle_features_group_id on public.vehicle_features(group_id);

drop index if exists public.idx_listings_category_node_id;

commit;
