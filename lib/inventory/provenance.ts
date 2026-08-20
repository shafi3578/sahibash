import type { AppLocale } from "@/lib/i18n/translations";

export type ListingSourceType =
  | "native"
  | "dealer_managed"
  | "partner_feed"
  | "seller_approved_import"
  | "scout_assisted"
  | "external_indexed"
  | "migrated_legacy";

export type ListingFreshnessStatus =
  | "fresh"
  | "aging"
  | "stale"
  | "source_missing"
  | "seller_confirmed"
  | "sold_confirmed"
  | "expired";

export type ListingOwnershipStatus =
  | "unclaimed"
  | "claim_pending"
  | "claimed"
  | "partner_managed"
  | "staff_managed"
  | "disputed"
  | "removed"
  | "opted_out";

export type ListingPublicationStatus =
  | "draft"
  | "pending_review"
  | "published"
  | "hidden"
  | "archived"
  | "removed";

export type BridgeListingLike = {
  source_type?: string | null;
  freshness_status?: string | null;
  ownership_status?: string | null;
  publication_status?: string | null;
  provenance_confidence?: number | string | null;
  allow_contact_display?: boolean | null;
  source_last_seen_at?: string | null;
  contact_phone?: string | null;
  status?: string | null;
};

const SOURCE_COPY: Record<ListingSourceType, Record<AppLocale, string>> = {
  native: { en: "Sahibash seller", fa: "فروشنده صاحباش", ps: "د صاحباش پلورونکی" },
  dealer_managed: { en: "Dealer inventory", fa: "موجودی فروشگاه", ps: "د دوکان موجودي" },
  partner_feed: { en: "Partner inventory", fa: "موجودی شریک", ps: "د شریک موجودي" },
  seller_approved_import: { en: "Seller-approved import", fa: "واردشده با تأیید فروشنده", ps: "د پلورونکي په تایید وارد شوی" },
  scout_assisted: { en: "Staff-assisted listing", fa: "ثبت با کمک کارمند", ps: "د کارکوونکي په مرسته اعلان" },
  external_indexed: { en: "External listing", fa: "اعلان بیرونی", ps: "بهرنی اعلان" },
  migrated_legacy: { en: "Legacy Sahibash listing", fa: "اعلان قدیمی صاحباش", ps: "پخوانی د صاحباش اعلان" },
};

const FRESHNESS_COPY: Record<ListingFreshnessStatus, Record<AppLocale, string>> = {
  fresh: { en: "Recently refreshed", fa: "به‌تازگی تازه شده", ps: "تازه شوی" },
  aging: { en: "Availability should be confirmed", fa: "موجودیت باید تأیید شود", ps: "شتون باید تایید شي" },
  stale: { en: "May be outdated", fa: "ممکن است قدیمی باشد", ps: "کېدای شي زوړ وي" },
  source_missing: { en: "Source no longer confirms it", fa: "منبع دیگر آن را تأیید نمی‌کند", ps: "سرچینه یې نور نه تاییدوي" },
  seller_confirmed: { en: "Seller confirmed", fa: "تأیید شده توسط فروشنده", ps: "پلورونکي تایید کړی" },
  sold_confirmed: { en: "Sold", fa: "فروخته شد", ps: "پلورل شوی" },
  expired: { en: "Expired", fa: "منقضی شده", ps: "تېر شوی" },
};

export function normalizeSourceType(value: unknown): ListingSourceType {
  const source = String(value ?? "native");
  if (
    source === "dealer_managed" ||
    source === "partner_feed" ||
    source === "seller_approved_import" ||
    source === "scout_assisted" ||
    source === "external_indexed" ||
    source === "migrated_legacy"
  ) {
    return source;
  }
  return "native";
}

export function normalizeFreshnessStatus(value: unknown): ListingFreshnessStatus {
  const status = String(value ?? "seller_confirmed");
  if (
    status === "fresh" ||
    status === "aging" ||
    status === "stale" ||
    status === "source_missing" ||
    status === "sold_confirmed" ||
    status === "expired"
  ) {
    return status;
  }
  return "seller_confirmed";
}

export function getSourceTransparency(listing: BridgeListingLike, locale: AppLocale) {
  const sourceType = normalizeSourceType(listing.source_type);
  const freshnessStatus = normalizeFreshnessStatus(listing.freshness_status);
  const ownershipStatus = String(listing.ownership_status ?? (sourceType === "native" ? "claimed" : "unclaimed")) as ListingOwnershipStatus;
  const confidence = Number(listing.provenance_confidence ?? (sourceType === "native" ? 1 : 0.5));
  const isExternal = sourceType !== "native" && sourceType !== "migrated_legacy";
  const canContact = listing.allow_contact_display !== false && Boolean(listing.contact_phone);
  const needsAvailabilityWarning = isExternal && ["aging", "stale", "source_missing", "expired"].includes(freshnessStatus);

  return {
    sourceType,
    freshnessStatus,
    ownershipStatus,
    isExternal,
    canContact,
    needsAvailabilityWarning,
    sourceLabel: SOURCE_COPY[sourceType][locale],
    freshnessLabel: FRESHNESS_COPY[freshnessStatus][locale],
    confidence: Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : 0.5,
  };
}

export function shouldShowInNormalDiscovery(listing: BridgeListingLike) {
  const publicationStatus = String(listing.publication_status ?? (listing.status === "approved" ? "published" : "pending_review"));
  const freshnessStatus = normalizeFreshnessStatus(listing.freshness_status);
  return publicationStatus === "published" && !["expired", "source_missing", "sold_confirmed"].includes(freshnessStatus);
}

export function sourceRankingWeight(sourceType: ListingSourceType, ownershipStatus: string | null | undefined) {
  if (sourceType === "native" || ownershipStatus === "claimed") return 1;
  if (sourceType === "seller_approved_import" || sourceType === "dealer_managed") return 0.86;
  if (sourceType === "partner_feed") return 0.78;
  if (sourceType === "scout_assisted") return 0.7;
  if (sourceType === "external_indexed") return 0.52;
  return 0.65;
}
