export type FeaturedPaymentTarget = {
  status?: string | null;
  publication_status?: string | null;
  freshness_status?: string | null;
  removed_public_at?: string | null;
  expires_at?: string | null;
  price?: number | null;
};

// Category eligibility is checked by the server query and again in the database.
// Consent can extend a still-active ad on approval, never reactivate or republish it.
export function isFeaturedPaymentTargetEligible(listing: FeaturedPaymentTarget, now = Date.now()) {
  const expiresAt = Date.parse(listing.expires_at ?? "");
  return listing.status === "approved"
    && (listing.publication_status == null || listing.publication_status === "published")
    && !listing.removed_public_at
    && !["expired", "source_missing", "sold_confirmed"].includes(listing.freshness_status ?? "")
    && typeof listing.price === "number" && listing.price > 0
    && Number.isFinite(expiresAt) && expiresAt > now;
}
