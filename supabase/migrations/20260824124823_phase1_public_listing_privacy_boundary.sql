begin;

-- Phase 1 public listing data boundary:
-- RLS controls which rows are visible; these grants control which columns the
-- Data API can expose. Public clients must not be able to select seller phone
-- numbers, exact/private coordinates, address_text, location_geog, or internal
-- moderation/provenance internals directly from public.listings.

alter table public.listings enable row level security;

revoke all on table public.listings from anon;
revoke all on table public.listings from authenticated;

grant select (
  id,
  category_id,
  subcategory_id,
  category_node_id,
  product_model_id,
  vehicle_variant_id,
  vehicle_type,
  vehicle_subtype,
  vehicle_brand,
  vehicle_model,
  vehicle_year,
  vehicle_is_manual,
  vehicle_is_classic,
  vehicle_is_custom,
  vehicle_manual_specs,
  suitable_for_students,
  student_housing_type,
  gender_allowed,
  payment_period,
  distance_to_university,
  title,
  description,
  original_title,
  original_description,
  original_language,
  original_locale,
  price,
  currency,
  city,
  district,
  address_optional,
  country_id,
  province_id,
  district_id,
  area_id,
  province,
  neighborhood,
  video_url,
  contact_name,
  delivery_preference,
  meeting_preference,
  negotiable,
  minimum_offer,
  whatsapp_enabled,
  status,
  featured,
  urgent,
  views_count,
  favorites_count,
  messages_count,
  listing_score,
  created_at,
  updated_at,
  expires_at,
  published_at,
  last_bumped_at,
  archived_at,
  location_visibility,
  is_location_confirmed,
  source_type,
  ownership_status,
  publication_status,
  freshness_status,
  provenance_status,
  source_platform,
  source_url,
  source_last_seen_at,
  source_posted_at,
  provenance_confidence,
  allow_contact_display,
  noindex_external,
  removed_public_at
) on public.listings to anon;

grant select (
  id,
  user_id,
  category_id,
  subcategory_id,
  category_node_id,
  product_model_id,
  vehicle_variant_id,
  vehicle_type,
  vehicle_subtype,
  vehicle_brand,
  vehicle_model,
  vehicle_year,
  vehicle_is_manual,
  vehicle_is_classic,
  vehicle_is_custom,
  vehicle_manual_specs,
  suitable_for_students,
  student_housing_type,
  gender_allowed,
  payment_period,
  distance_to_university,
  title,
  description,
  original_title,
  original_description,
  original_language,
  original_locale,
  price,
  currency,
  city,
  district,
  address_optional,
  country_id,
  province_id,
  district_id,
  area_id,
  province,
  neighborhood,
  video_url,
  contact_name,
  delivery_preference,
  meeting_preference,
  negotiable,
  minimum_offer,
  whatsapp_enabled,
  status,
  featured,
  urgent,
  views_count,
  favorites_count,
  messages_count,
  listing_score,
  created_at,
  updated_at,
  expires_at,
  published_at,
  approved_by,
  approved_at,
  rejection_reason,
  approval_rejected_reason,
  last_bumped_at,
  archived_at,
  location_visibility,
  is_location_confirmed,
  source_type,
  ownership_status,
  publication_status,
  freshness_status,
  provenance_status,
  source_platform,
  source_url,
  source_last_seen_at,
  source_posted_at,
  provenance_confidence,
  allow_contact_display,
  noindex_external,
  removed_public_at
) on public.listings to authenticated;

grant insert, update, delete on table public.listings to authenticated;
grant select, insert, update, delete on table public.listings to service_role;

drop policy if exists listings_select_public_or_owner_or_admin on public.listings;
create policy listings_select_public_or_owner_or_admin
on public.listings
for select
to anon, authenticated
using (
  status = 'approved'::public.listing_status
  or (
    (select auth.uid()) is not null
    and user_id = (select auth.uid())
  )
  or (select public.is_admin((select auth.uid())))
);

drop policy if exists listings_delete_owner_or_admin on public.listings;
create policy listings_delete_owner_or_admin
on public.listings
for delete
to authenticated
using (
  user_id = (select auth.uid())
  or (select public.is_admin((select auth.uid())))
);

-- Contact events are audit records. They should be written by trusted server
-- actions after state checks and rate limits, not forged directly by browsers.
drop policy if exists listing_contact_events_public_insert on public.listing_contact_events;
revoke insert on table public.listing_contact_events from anon, authenticated;
revoke all on table public.listing_contact_events from anon;
grant select on table public.listing_contact_events to authenticated;
grant insert on table public.listing_contact_events to service_role;

comment on column public.listings.contact_phone
  is 'Private seller phone. Never grant direct anon/authenticated SELECT; reveal through trusted server action with rate limiting and listing_contact_events audit.';
comment on column public.listings.location_geog
  is 'Private generated seller point used for trusted server-side distance search only. Public output must be sanitized through location_visibility.';

commit;
