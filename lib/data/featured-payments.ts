import "server-only";

import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppLocale } from "@/lib/i18n/translations";

export const PAYMENT_RECEIPTS_BUCKET = "payment-receipts";
export const FEATURED_CAMPAIGN_KEY = "featured_launch";

export type FeaturedPaymentStatus =
  | "pending_payment"
  | "pending_review"
  | "approved"
  | "rejected"
  | "expired"
  | "cancelled";

export type FeaturedCampaignConfig = {
  id: string;
  key: string;
  promotion_type: "featured";
  name_en: string;
  name_fa: string;
  name_ps: string;
  amount: number;
  currency: "AFN";
  duration_days: number;
  provider: "hesabpay";
  payment_method: string | null;
  merchant_reference: string | null;
  instructions_en: string;
  instructions_fa: string;
  instructions_ps: string;
  qr_storage_path: string | null;
  is_active: boolean;
  metadata: Record<string, unknown>;
  updated_at: string;
};

export type FeaturedPaymentRequest = {
  id: string;
  listing_id: string;
  user_id: string;
  promotion_type: "featured";
  campaign_config_id: string;
  amount: number;
  currency: "AFN";
  provider: "hesabpay";
  payment_method: string | null;
  merchant_reference: string | null;
  transaction_reference: string | null;
  receipt_storage_path: string | null;
  receipt_mime_type: string | null;
  receipt_file_size: number | null;
  provider_status: string | null;
  status: FeaturedPaymentStatus;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  admin_note: string | null;
  rejection_reason: string | null;
  expires_at: string;
  idempotency_key: string;
  created_at: string;
  updated_at: string;
};

export type ActiveFeaturedPromotion = {
  id: string;
  starts_at: string;
  ends_at: string | null;
  payment_request_id: string | null;
};

export type FeaturedPaymentSummary = {
  config: FeaturedCampaignConfig | null;
  request: FeaturedPaymentRequest | null;
  activePromotion: ActiveFeaturedPromotion | null;
};

export type AdminFeaturedPaymentQueueRow = FeaturedPaymentRequest & {
  receiptSignedUrl: string | null;
  listing: {
    id: string;
    title: string;
    status: string;
    featured: boolean;
    featured_until: string | null;
    price: number | null;
    currency: string | null;
    province: string | null;
    district: string | null;
    user_id: string | null;
  } | null;
  seller: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone_verification_status: string | null;
    preferred_language: AppLocale | null;
  } | null;
};

export type AdminFeaturedPaymentStats = {
  pendingReview: number;
  pendingPayment: number;
  rejectedRecent: number;
  activeFeatured: number;
};

export type AdminAttentionSummary = AdminFeaturedPaymentStats & {
  pendingListings: number;
  reportedListings: number;
  importCandidates: number;
  importFailures: number;
  claimsPending: number;
  duplicateReview: number;
  usersRequiringReview: number;
  recentModerationActions: number;
  unreadOperationalAlerts: number;
  listingsToday: number;
  listingsSevenDays: number;
  contactActionsToday: number;
  contactActionsSevenDays: number;
};

type SupabaseLike = Awaited<ReturnType<typeof createSupabaseServerClient>>;
type CountQuery = {
  eq: (column: string, value: unknown) => CountQuery;
  in: (column: string, values: unknown[]) => CountQuery;
  gte: (column: string, value: unknown) => CountQuery;
  contains: (column: string, value: unknown) => CountQuery;
  or: (filters: string) => CountQuery;
};
type CountQueryResult = {
  count: number | null;
  error: { code?: string; message?: string } | null;
};

function normalizeNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeLocale(value: unknown): AppLocale | null {
  return value === "en" || value === "fa" || value === "ps" ? value : null;
}

function asCampaignConfig(row: Record<string, unknown> | null | undefined): FeaturedCampaignConfig | null {
  if (!row?.id) return null;
  return {
    id: String(row.id),
    key: String(row.key ?? FEATURED_CAMPAIGN_KEY),
    promotion_type: "featured",
    name_en: String(row.name_en ?? "Featured"),
    name_fa: String(row.name_fa ?? "اعلان ویژه"),
    name_ps: String(row.name_ps ?? "ځانګړی اعلان"),
    amount: normalizeNumber(row.amount),
    currency: "AFN",
    duration_days: Math.max(1, Number(row.duration_days) || 7),
    provider: "hesabpay",
    payment_method: typeof row.payment_method === "string" ? row.payment_method : null,
    merchant_reference: typeof row.merchant_reference === "string" ? row.merchant_reference : null,
    instructions_en: String(row.instructions_en ?? ""),
    instructions_fa: String(row.instructions_fa ?? ""),
    instructions_ps: String(row.instructions_ps ?? ""),
    qr_storage_path: typeof row.qr_storage_path === "string" ? row.qr_storage_path : null,
    is_active: row.is_active !== false,
    metadata: (row.metadata && typeof row.metadata === "object" ? row.metadata : {}) as Record<string, unknown>,
    updated_at: String(row.updated_at ?? row.created_at ?? ""),
  };
}

function asPaymentRequest(row: Record<string, unknown> | null | undefined): FeaturedPaymentRequest | null {
  if (!row?.id) return null;
  const rawStatus = String(row.status ?? "pending_payment") as FeaturedPaymentStatus;
  return {
    id: String(row.id),
    listing_id: String(row.listing_id ?? ""),
    user_id: String(row.user_id ?? ""),
    promotion_type: "featured",
    campaign_config_id: String(row.campaign_config_id ?? ""),
    amount: normalizeNumber(row.amount),
    currency: "AFN",
    provider: "hesabpay",
    payment_method: typeof row.payment_method === "string" ? row.payment_method : null,
    merchant_reference: typeof row.merchant_reference === "string" ? row.merchant_reference : null,
    transaction_reference: typeof row.transaction_reference === "string" ? row.transaction_reference : null,
    receipt_storage_path: typeof row.receipt_storage_path === "string" ? row.receipt_storage_path : null,
    receipt_mime_type: typeof row.receipt_mime_type === "string" ? row.receipt_mime_type : null,
    receipt_file_size: typeof row.receipt_file_size === "number" ? row.receipt_file_size : null,
    provider_status: typeof row.provider_status === "string" ? row.provider_status : null,
    status: rawStatus,
    submitted_at: typeof row.submitted_at === "string" ? row.submitted_at : null,
    reviewed_at: typeof row.reviewed_at === "string" ? row.reviewed_at : null,
    reviewed_by: typeof row.reviewed_by === "string" ? row.reviewed_by : null,
    admin_note: typeof row.admin_note === "string" ? row.admin_note : null,
    rejection_reason: typeof row.rejection_reason === "string" ? row.rejection_reason : null,
    expires_at: String(row.expires_at ?? ""),
    idempotency_key: String(row.idempotency_key ?? ""),
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  };
}

function asPromotion(row: Record<string, unknown> | null | undefined): ActiveFeaturedPromotion | null {
  if (!row?.id) return null;
  return {
    id: String(row.id),
    starts_at: String(row.starts_at ?? ""),
    ends_at: typeof row.ends_at === "string" ? row.ends_at : null,
    payment_request_id: typeof row.payment_request_id === "string" ? row.payment_request_id : null,
  };
}

function isMissingTableError(error: { code?: string; message?: string } | null | undefined) {
  return error?.code === "42P01" || /does not exist/i.test(String(error?.message ?? ""));
}

async function getAdminCapableClient(): Promise<SupabaseLike> {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return createSupabaseAdmin() as unknown as SupabaseLike;
  }
  return createSupabaseServerClient();
}

export function getCampaignName(config: FeaturedCampaignConfig, locale: AppLocale) {
  if (locale === "fa") return config.name_fa;
  if (locale === "ps") return config.name_ps;
  return config.name_en;
}

export function getCampaignInstructions(config: FeaturedCampaignConfig, locale: AppLocale) {
  if (locale === "fa") return config.instructions_fa;
  if (locale === "ps") return config.instructions_ps;
  return config.instructions_en;
}

export function isFeaturedCurrentlyActive(listing: { featured?: boolean; featured_until?: string | null }) {
  if (!listing.featured) return false;
  if (!listing.featured_until) return false;
  const expiry = new Date(listing.featured_until);
  return !Number.isNaN(expiry.getTime()) && expiry > new Date();
}

export async function getActiveFeaturedCampaignConfig(): Promise<FeaturedCampaignConfig | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("promotion_campaign_configs")
      .select("*")
      .eq("key", FEATURED_CAMPAIGN_KEY)
      .eq("is_active", true)
      .maybeSingle();

    if (error || !data) {
      if (isMissingTableError(error)) return null;
      return null;
    }

    return asCampaignConfig(data as Record<string, unknown>);
  } catch {
    return null;
  }
}

export async function getListingFeaturedPaymentSummary(
  listingId: string,
  userId: string
): Promise<FeaturedPaymentSummary> {
  try {
    const supabase = await createSupabaseServerClient();
    const now = new Date().toISOString();
    const [{ data: configRow }, { data: requestRows }, { data: promotionRow }] = await Promise.all([
      supabase
        .from("promotion_campaign_configs")
        .select("*")
        .eq("key", FEATURED_CAMPAIGN_KEY)
        .eq("is_active", true)
        .maybeSingle(),
      supabase
        .from("promotion_payment_requests")
        .select("*")
        .eq("listing_id", listingId)
        .eq("user_id", userId)
        .eq("promotion_type", "featured")
        .order("created_at", { ascending: false })
        .limit(1),
      supabase
        .from("listing_promotions")
        .select("id, starts_at, ends_at, payment_request_id")
        .eq("listing_id", listingId)
        .eq("promotion_type", "featured")
        .or(`ends_at.is.null,ends_at.gt.${now}`)
        .order("starts_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const latestRequest = Array.isArray(requestRows) ? requestRows[0] : null;
    return {
      config: asCampaignConfig(configRow as Record<string, unknown> | null),
      request: asPaymentRequest(latestRequest as Record<string, unknown> | null),
      activePromotion: asPromotion(promotionRow as Record<string, unknown> | null),
    };
  } catch {
    return { config: null, request: null, activePromotion: null };
  }
}

async function getCount(client: SupabaseLike, table: string, apply?: (query: CountQuery) => CountQuery): Promise<number> {
  try {
    const baseQuery = client.from(table).select("id", { count: "exact", head: true }) as unknown as CountQuery;
    const query = apply ? apply(baseQuery) : baseQuery;
    const { count, error } = await (query as unknown as PromiseLike<CountQueryResult>);
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function getAdminFeaturedPaymentStats(): Promise<AdminFeaturedPaymentStats> {
  const client = await getAdminCapableClient();
  const now = new Date().toISOString();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [pendingReview, pendingPayment, rejectedRecent, activeFeatured] = await Promise.all([
    getCount(client, "promotion_payment_requests", (q) => q.eq("status", "pending_review")),
    getCount(client, "promotion_payment_requests", (q) => q.eq("status", "pending_payment")),
    getCount(client, "promotion_payment_requests", (q) =>
      q.eq("status", "rejected").gte("reviewed_at", sevenDaysAgo)
    ),
    getCount(client, "listing_promotions", (q) =>
      q.eq("promotion_type", "featured").or(`ends_at.is.null,ends_at.gt.${now}`)
    ),
  ]);

  return { pendingReview, pendingPayment, rejectedRecent, activeFeatured };
}

export async function getAdminAttentionSummary(): Promise<AdminAttentionSummary> {
  const client = await getAdminCapableClient();
  const now = Date.now();
  const today = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  const featured = await getAdminFeaturedPaymentStats();

  const [
    pendingListings,
    reportedListings,
    importCandidates,
    importFailures,
    claimsPending,
    duplicateReview,
    usersRequiringReview,
    recentModerationActions,
    unreadOperationalAlerts,
    listingsToday,
    listingsSevenDays,
    contactActionsToday,
    contactActionsSevenDays,
  ] = await Promise.all([
    getCount(client, "listings", (q) => q.eq("status", "pending")),
    getCount(client, "reports", (q) => q.eq("status", "open")),
    getCount(client, "listing_ingest_candidates", (q) => q.in("status", ["staged", "needs_review"])),
    getCount(client, "listing_ingest_candidates", (q) => q.in("status", ["rejected", "failed"])),
    getCount(client, "listing_claims", (q) => q.in("status", ["initiated", "challenge_sent", "under_review"])),
    getCount(client, "listing_duplicate_groups", (q) => q.in("status", ["open", "needs_review"])),
    getCount(client, "profiles", (q) => q.eq("phone_verification_status", "pending")),
    getCount(client, "listing_moderation_events", (q) => q.gte("created_at", sevenDaysAgo)),
    getCount(client, "notifications", (q) =>
      q.eq("is_read", false).contains("payload", { admin_operational: true })
    ),
    getCount(client, "listings", (q) => q.gte("created_at", today)),
    getCount(client, "listings", (q) => q.gte("created_at", sevenDaysAgo)),
    getCount(client, "listing_contact_events", (q) => q.gte("created_at", today)),
    getCount(client, "listing_contact_events", (q) => q.gte("created_at", sevenDaysAgo)),
  ]);

  return {
    ...featured,
    pendingListings,
    reportedListings,
    importCandidates,
    importFailures,
    claimsPending,
    duplicateReview,
    usersRequiringReview,
    recentModerationActions,
    unreadOperationalAlerts,
    listingsToday,
    listingsSevenDays,
    contactActionsToday,
    contactActionsSevenDays,
  };
}

export async function getAdminFeaturedPaymentQueue(): Promise<AdminFeaturedPaymentQueueRow[]> {
  try {
    const supabase = await getAdminCapableClient();
    const { data, error } = await supabase
      .from("promotion_payment_requests")
      .select("*")
      .in("status", ["pending_review", "pending_payment", "rejected"])
      .order("submitted_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(100);

    if (error || !data) return [];

    const requests = (data as Array<Record<string, unknown>>)
      .map(asPaymentRequest)
      .filter((row): row is FeaturedPaymentRequest => Boolean(row));

    const listingIds = Array.from(new Set(requests.map((row) => row.listing_id).filter(Boolean)));
    const userIds = Array.from(new Set(requests.map((row) => row.user_id).filter(Boolean)));

    const [{ data: listings }, { data: sellers }] = await Promise.all([
      listingIds.length
        ? supabase
            .from("listings")
            .select("id, title, status, featured, featured_until, price, currency, province, district, user_id")
            .in("id", listingIds)
        : Promise.resolve({ data: [] }),
      userIds.length
        ? supabase
            .from("profiles")
            .select("id, full_name, email, phone_verification_status, preferred_language")
            .in("id", userIds)
        : Promise.resolve({ data: [] }),
    ]);

    const listingsById = new Map(
      ((listings ?? []) as Array<Record<string, unknown>>).map((listing) => [
        String(listing.id),
        {
          id: String(listing.id),
          title: String(listing.title ?? ""),
          status: String(listing.status ?? ""),
          featured: Boolean(listing.featured),
          featured_until: typeof listing.featured_until === "string" ? listing.featured_until : null,
          price: typeof listing.price === "number" ? listing.price : Number(listing.price ?? 0),
          currency: typeof listing.currency === "string" ? listing.currency : null,
          province: typeof listing.province === "string" ? listing.province : null,
          district: typeof listing.district === "string" ? listing.district : null,
          user_id: typeof listing.user_id === "string" ? listing.user_id : null,
        },
      ])
    );

    const sellersById = new Map(
      ((sellers ?? []) as Array<Record<string, unknown>>).map((seller) => [
        String(seller.id),
        {
          id: String(seller.id),
          full_name: typeof seller.full_name === "string" ? seller.full_name : null,
          email: typeof seller.email === "string" ? seller.email : null,
          phone_verification_status: typeof seller.phone_verification_status === "string" ? seller.phone_verification_status : null,
          preferred_language: normalizeLocale(seller.preferred_language),
        },
      ])
    );

    const rows: AdminFeaturedPaymentQueueRow[] = [];
    for (const request of requests) {
      let receiptSignedUrl: string | null = null;
      if (request.receipt_storage_path) {
        try {
          const signed = await supabase.storage
            .from(PAYMENT_RECEIPTS_BUCKET)
            .createSignedUrl(request.receipt_storage_path, 10 * 60);
          receiptSignedUrl = signed.data?.signedUrl ?? null;
        } catch {
          receiptSignedUrl = null;
        }
      }

      rows.push({
        ...request,
        receiptSignedUrl,
        listing: listingsById.get(request.listing_id) ?? null,
        seller: sellersById.get(request.user_id) ?? null,
      });
    }

    return rows;
  } catch {
    return [];
  }
}
