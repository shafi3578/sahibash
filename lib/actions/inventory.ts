"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getCurrentUser, requirePermission, requireSuperAdministrator, requireUser } from "@/lib/auth";
import { getCurrentLocale } from "@/lib/i18n/server";
import { localizePath } from "@/lib/i18n/routing";
import type { AppLocale } from "@/lib/i18n/translations";
import { assertSafeExternalUrl, candidateIdempotencyKey, normalizeAfghanistanPhone, normalizeInventoryText, normalizePriceToAfn } from "@/lib/inventory/normalization";
import { scoreDuplicateCandidate, type DuplicateCandidate } from "@/lib/inventory/deduplication";
import { recordDemandSignalAction } from "@/lib/actions/liquidity";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { createAccountNotification } from "@/lib/notifications/create";

export type InventoryContactEvent =
  | "phone_reveal"
  | "call_click"
  | "whatsapp_click"
  | "owner_claim_click"
  | "remove_request_click"
  | "report_unavailable"
  | "report_wrong_info"
  | "report_scam";

const CLAIM_ACCEPTED_COPY = {
  en: { title: "Ownership claim approved", body: "Your ownership claim was approved. The listing is now connected to your account." },
  fa: { title: "درخواست مالکیت تأیید شد", body: "درخواست مالکیت شما تأیید شد و اعلان اکنون به حساب شما وصل است." },
  ps: { title: "د مالکیت غوښتنه ومنل شوه", body: "ستاسو د مالکیت غوښتنه ومنل شوه او اعلان اوس ستاسو له حساب سره تړلی دی." },
} as const;

const CLAIM_REJECTED_COPY = {
  en: { title: "Ownership claim needs attention", body: "Your ownership claim could not be verified. Review the administrator decision before trying again." },
  fa: { title: "درخواست مالکیت نیاز به پیگیری دارد", body: "مالکیت شما تأیید نشد. پیش از درخواست دوباره، نتیجه بررسی مدیر را ببینید." },
  ps: { title: "د مالکیت غوښتنه پاملرنې ته اړتیا لري", body: "ستاسو مالکیت تایید نه شو. له بیا غوښتنې مخکې د مدیر پرېکړه وګورئ." },
} as const;

const REMOVAL_ACCEPTED_COPY = {
  en: { title: "External listing removed", body: "The removal request was approved and the listing is no longer public." },
  fa: { title: "اعلان بیرونی حذف شد", body: "درخواست حذف تأیید شد و اعلان دیگر عمومی نیست." },
  ps: { title: "بهرنی اعلان لرې شو", body: "د لرې کولو غوښتنه ومنل شوه او اعلان نور عام نه دی." },
} as const;

const REMOVAL_REJECTED_COPY = {
  en: { title: "Removal request reviewed", body: "The listing was not removed because the request could not be verified." },
  fa: { title: "درخواست حذف بررسی شد", body: "چون درخواست قابل تأیید نبود، اعلان حذف نشد." },
  ps: { title: "د لرې کولو غوښتنه وکتل شوه", body: "ځکه چې غوښتنه تایید نه شوه، اعلان لرې نه شو." },
} as const;

type TrustedSupabaseClient =
  | ReturnType<typeof createSupabaseAdmin>
  | Awaited<ReturnType<typeof createSupabaseServerClient>>;

type ListingContactPhoneResult =
  | { ok: true; phone: string }
  | { ok: false; message: string; statusCode?: number };

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function normalizeActionLocale(locale: AppLocale): AppLocale {
  return locale === "en" || locale === "fa" || locale === "ps" ? locale : "fa";
}

async function createTrustedServerClient(): Promise<TrustedSupabaseClient> {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return createSupabaseAdmin();
  }

  return createSupabaseServerClient();
}

function normalizeContactPhone(phone: unknown) {
  const raw = String(phone ?? "").trim();
  const normalized = normalizeAfghanistanPhone(raw).normalized ?? raw;
  const digits = normalized.replace(/[^\d+]/g, "");
  if (digits.replace(/\D/g, "").length < 7) {
    return null;
  }
  return digits;
}

async function resolveContactPhone(
  supabase: TrustedSupabaseClient,
  listing: {
    user_id?: string | null;
    source_type?: string | null;
    contact_phone?: string | null;
  }
) {
  const sourceType = String(listing.source_type ?? "native");

  if ((sourceType === "native" || sourceType === "") && listing.user_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("phone,phone_verification_status,phone_verified_at")
      .eq("id", listing.user_id)
      .maybeSingle();
    const safeProfile = profile as { phone?: string | null; phone_verification_status?: string | null; phone_verified_at?: string | null } | null;
    const profilePhone = safeProfile?.phone_verification_status === "verified" && safeProfile.phone_verified_at
      ? normalizeContactPhone(safeProfile.phone)
      : null;

    if (profilePhone) {
      return { phone: profilePhone, contactSource: "profile_phone" };
    }
  }

  if (sourceType === "native" || sourceType === "") {
    return { phone: null, contactSource: "profile_phone_unavailable" };
  }

  return { phone: normalizeContactPhone(listing.contact_phone), contactSource: "source_listing_phone" };
}

async function currentUserIsAdmin(supabase: TrustedSupabaseClient, userId?: string) {
  if (!userId) return false;
  const { data, error } = await supabase.rpc("is_admin", { uid: userId });
  return !error && data === true;
}

export async function recordInventoryContactEventAction(
  listingId: string,
  eventType: InventoryContactEvent,
  locale: AppLocale,
  metadata: Record<string, unknown> = {}
) {
  const supabase = await createTrustedServerClient();
  const user = await getCurrentUser();
  const safeLocale = normalizeActionLocale(locale);
  const rateLimit = await consumeRateLimit({
    scope: `inventory.contact.${eventType}`,
    userId: user?.id ?? null,
    maxRequests: 120,
    windowSeconds: 10 * 60,
  });
  if (!rateLimit.allowed) return { ok: false, message: "Too many requests" };

  const { data: listing } = await supabase
    .from("listings")
    .select("id, source_type")
    .eq("id", listingId)
    .maybeSingle();

  if (!listing) return { ok: false };

  await supabase.from("listing_contact_events").insert({
    listing_id: listingId,
    event_type: eventType,
    actor_user_id: user?.id ?? null,
    source_type: (listing as { source_type?: string }).source_type ?? "native",
    locale: safeLocale,
    metadata,
  });

  if (eventType === "phone_reveal" || eventType === "call_click" || eventType === "whatsapp_click") {
    try {
      await recordDemandSignalAction({
        signalType: "contact_action",
        locale: safeLocale,
        attributes: { eventType, listingId },
        weight: eventType === "phone_reveal" ? 3 : 4,
        source: "listing_contact",
      });
    } catch {
      // Contact audit logging should not fail because demand telemetry is unavailable.
    }
  }

  return { ok: true };
}

export async function getListingContactPhoneAction(
  listingId: string,
  locale: AppLocale,
  channel: "call" | "whatsapp",
): Promise<ListingContactPhoneResult> {
  const safeListingId = String(listingId ?? "").trim();
  const safeLocale = normalizeActionLocale(locale);

  if (!isUuid(safeListingId)) {
    return { ok: false, message: "Invalid listing.", statusCode: 400 };
  }

  const user = await getCurrentUser();
  if (channel !== "call" && channel !== "whatsapp") {
    return { ok: false, message: "Invalid contact channel.", statusCode: 400 };
  }
  const eventType = channel === "call" ? "call_click" : "whatsapp_click";
  const rateLimit = await consumeRateLimit({
    scope: `inventory.contact.${channel}`,
    userId: user?.id ?? null,
    maxRequests: 20,
    windowSeconds: 10 * 60,
  });
  if (!rateLimit.allowed) {
    return { ok: false, message: "Too many requests. Please try again later.", statusCode: 429 };
  }

  const supabase = await createTrustedServerClient();
  const { data: listing, error } = await supabase
    .from("listings")
    .select("id, user_id, status, source_type, publication_status, freshness_status, contact_phone, allow_contact_display")
    .eq("id", safeListingId)
    .maybeSingle();

  if (error || !listing) {
    return { ok: false, message: "Contact not available.", statusCode: 404 };
  }

  const isOwner = Boolean(user?.id && listing.user_id === user.id);
  const isAdmin = await currentUserIsAdmin(supabase, user?.id);
  const isPubliclyCallable =
    listing.status === "approved"
    && (listing.publication_status === null || listing.publication_status === "published")
    && !["expired", "source_missing", "sold_confirmed"].includes(String(listing.freshness_status ?? "seller_confirmed"));

  if (!isPubliclyCallable && !isOwner && !isAdmin) {
    return { ok: false, message: "Contact not available.", statusCode: 403 };
  }

  if (listing.allow_contact_display === false && !isOwner && !isAdmin) {
    return { ok: false, message: "Contact not available.", statusCode: 403 };
  }

  const { phone, contactSource } = await resolveContactPhone(supabase, listing);
  if (!phone) {
    return { ok: false, message: "Contact not available.", statusCode: 404 };
  }

  const { error: contactAuditError } = await supabase.from("listing_contact_events").insert({
    listing_id: safeListingId,
    event_type: eventType,
    actor_user_id: user?.id ?? null,
    source_type: listing.source_type ?? "native",
    locale: safeLocale,
    metadata: {
      source: "listing_detail",
      privacy_boundary: "server_contact_action",
      actor_kind: user ? "authenticated" : "anonymous",
      is_owner: isOwner,
      is_admin: isAdmin,
      contact_source: contactSource,
    },
  });
  if (contactAuditError) {
    return { ok: false, message: "Contact not available.", statusCode: 500 };
  }

  try {
    await recordDemandSignalAction({
      signalType: "contact_action",
      locale: safeLocale,
      attributes: { eventType, listingId: safeListingId },
      weight: 4,
      source: "listing_contact",
    });
  } catch {
    // Contact should remain available even if demand telemetry is temporarily unavailable.
  }

  return { ok: true, phone };
}

export async function initiateListingClaimAction(listingId: string, claimantNote: string) {
  const user = await requireUser();
  const safeListingId = String(listingId ?? "").trim();
  const safeNote = String(claimantNote ?? "").trim();
  if (!isUuid(safeListingId) || safeNote.length < 10 || safeNote.length > 1000) {
    return { ok: false, message: "Invalid ownership request", statusCode: 400 };
  }

  const rateLimit = await consumeRateLimit({
    scope: "inventory.claim",
    userId: user.id,
    maxRequests: 10,
    windowSeconds: 60 * 60,
  });
  if (!rateLimit.allowed) return { ok: false, message: "Too many requests", statusCode: 429 };

  const supabase = createSupabaseAdmin();
  const { data: claimId, error } = await supabase.rpc("submit_external_listing_claim_service", {
    p_listing_id: safeListingId,
    p_claimant_note: safeNote,
    p_actor_id: user.id,
  });

  if (error || !claimId) return { ok: false, message: "Could not submit ownership request", statusCode: 400 };
  return { ok: true, claimId: String(claimId) };
}

export async function submitExternalListingClaimAction(formData: FormData): Promise<void> {
  const locale = await getCurrentLocale();
  const listingId = String(formData.get("listingId") ?? "").trim();
  const claimantNote = String(formData.get("claimantNote") ?? "").trim();
  const result = await initiateListingClaimAction(listingId, claimantNote);
  const status = result.ok ? "received" : result.statusCode === 429 ? "rate-limited" : "invalid";
  redirect(localizePath(`/listings/${listingId}?ownership=${status}`, locale));
}

export async function submitExternalListingRemovalAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const locale = await getCurrentLocale();
  const listingId = String(formData.get("listingId") ?? "").trim();
  const reasonCode = String(formData.get("reasonCode") ?? "").trim();
  const details = String(formData.get("details") ?? "").trim();
  const validReasons = new Set(["owner_request", "sold_or_unavailable", "privacy_or_rights", "wrong_information", "other"]);

  if (!isUuid(listingId) || !validReasons.has(reasonCode) || details.length < 10 || details.length > 1500) {
    redirect(localizePath(`/listings/${listingId}?removal=invalid`, locale));
  }

  const rateLimit = await consumeRateLimit({
    scope: "inventory.removal",
    userId: user.id,
    maxRequests: 10,
    windowSeconds: 60 * 60,
  });
  if (!rateLimit.allowed) {
    redirect(localizePath(`/listings/${listingId}?removal=rate-limited`, locale));
  }

  const supabase = createSupabaseAdmin();
  const { data: requestId, error } = await supabase.rpc("submit_external_listing_removal_request_service", {
    p_listing_id: listingId,
    p_reason_code: reasonCode,
    p_details: details,
    p_actor_id: user.id,
  });
  const status = !error && requestId ? "received" : "invalid";
  redirect(localizePath(`/listings/${listingId}?removal=${status}`, locale));
}

type ReviewedExternalRequest = {
  listing_id: string;
  requester_user_id: string;
  outcome: "approve" | "reject";
};

function firstReviewedRequest(value: unknown): ReviewedExternalRequest | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate || typeof candidate !== "object") return null;
  const row = candidate as Partial<ReviewedExternalRequest>;
  if (!isUuid(String(row.listing_id ?? "")) || !isUuid(String(row.requester_user_id ?? ""))) return null;
  if (row.outcome !== "approve" && row.outcome !== "reject") return null;
  return row as ReviewedExternalRequest;
}

export async function reviewExternalListingClaimAction(formData: FormData): Promise<void> {
  const actor = await requirePermission("listings.moderate");
  const claimId = String(formData.get("claimId") ?? "").trim();
  const decision = String(formData.get("decision") ?? "").trim();
  const reviewerNote = String(formData.get("reviewerNote") ?? "").trim();
  if (!isUuid(claimId) || (decision !== "approve" && decision !== "reject") || reviewerNote.length < 5 || reviewerNote.length > 2000) return;

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase.rpc("review_external_listing_claim_service", {
    p_claim_id: claimId,
    p_decision: decision,
    p_reviewer_note: reviewerNote || null,
    p_actor_id: actor.id,
  });
  const reviewed = !error ? firstReviewedRequest(data) : null;
  if (!reviewed) return;

  await createAccountNotification({
    userId: reviewed.requester_user_id,
    type: reviewed.outcome === "approve" ? "claim_accepted" : "claim_rejected",
    copy: reviewed.outcome === "approve" ? CLAIM_ACCEPTED_COPY : CLAIM_REJECTED_COPY,
    payload: { listing_id: reviewed.listing_id, claim_id: claimId },
  });
  revalidatePath("/admin/inventory");
  revalidatePath(`/listings/${reviewed.listing_id}`);
}

export async function reviewExternalListingRemovalAction(formData: FormData): Promise<void> {
  const actor = await requirePermission("listings.moderate");
  const requestId = String(formData.get("requestId") ?? "").trim();
  const decision = String(formData.get("decision") ?? "").trim();
  const reviewerNote = String(formData.get("reviewerNote") ?? "").trim();
  if (!isUuid(requestId) || (decision !== "approve" && decision !== "reject") || reviewerNote.length < 5 || reviewerNote.length > 2000) return;

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase.rpc("review_external_listing_removal_request_service", {
    p_request_id: requestId,
    p_decision: decision,
    p_reviewer_note: reviewerNote || null,
    p_actor_id: actor.id,
  });
  const reviewed = !error ? firstReviewedRequest(data) : null;
  if (!reviewed) return;

  await createAccountNotification({
    userId: reviewed.requester_user_id,
    type: "system",
    copy: reviewed.outcome === "approve" ? REMOVAL_ACCEPTED_COPY : REMOVAL_REJECTED_COPY,
    payload: { listing_id: reviewed.listing_id, removal_request_id: requestId },
  });
  revalidatePath("/admin/inventory");
  revalidatePath(`/listings/${reviewed.listing_id}`);
}

export async function normalizeIngestCandidateForDryRunAction(candidate: Record<string, unknown>) {
  await requireSuperAdministrator();

  const phone = normalizeAfghanistanPhone(candidate.contact_phone);
  const price = normalizePriceToAfn(candidate.price, candidate.currency);
  const sourceUrl = candidate.source_url ? assertSafeExternalUrl(candidate.source_url) : null;

  if (sourceUrl && !sourceUrl.ok) {
    return { ok: false, reason: sourceUrl.reason };
  }

  return {
    ok: true,
    normalized: {
      idempotencyKey: candidateIdempotencyKey([
        candidate.source_type,
        candidate.source_item_id,
        phone.normalized,
        candidate.title,
        candidate.category_node_id,
      ]),
      phone,
      price,
      title: normalizeInventoryText(candidate.title),
      description: normalizeInventoryText(candidate.description),
      sourceUrl: sourceUrl?.url ?? null,
    },
  };
}

export async function scoreInventoryDuplicateAction(a: DuplicateCandidate, b: DuplicateCandidate) {
  await requireSuperAdministrator();
  return scoreDuplicateCandidate(a, b);
}
