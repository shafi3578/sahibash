import type { ListingWithRelations, Profile } from "@/types/database";
import { sanitizePublicLocation } from "@/lib/location/privacy";

type ProfileWithEmail = Profile & { email?: string | null };

function sanitizeProfile(profile: ListingWithRelations["profile"]): ListingWithRelations["profile"] {
  if (!profile) return profile;

  const safeProfile: ProfileWithEmail = {
    ...profile,
    phone: null,
  };
  delete safeProfile.email;
  return safeProfile;
}

function hasCallableSellerContact(listing: ListingWithRelations) {
  const sourceType = String(listing.source_type ?? "native");
  const nativePhoneVerified = listing.profile?.phone_verification_status === "verified" && Boolean(listing.profile.phone_verified_at);
  const hasSourcePhone = sourceType !== "native" && Boolean(listing.contact_phone);
  return listing.allow_contact_display !== false && (nativePhoneVerified || hasSourcePhone);
}

export function sanitizePublicListingBoundary(listing: ListingWithRelations): ListingWithRelations {
  const publicLocation = sanitizePublicLocation(listing);

  return {
    ...listing,
    contact_phone: "",
    profile: sanitizeProfile(listing.profile),
    address_text: publicLocation.address_text,
    latitude: publicLocation.latitude,
    longitude: publicLocation.longitude,
    location_accuracy: publicLocation.location_visibility === "exact" ? listing.location_accuracy : null,
    location_source: null,
    public_contact_available: hasCallableSellerContact(listing),
  };
}

export function sanitizePublicListingBoundaries(rows: ListingWithRelations[]) {
  return rows.map((listing) => sanitizePublicListingBoundary(listing));
}
