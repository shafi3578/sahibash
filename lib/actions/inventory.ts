"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getCurrentUser, requireSuperAdministrator } from "@/lib/auth";
import type { AppLocale } from "@/lib/i18n/translations";
import { assertSafeExternalUrl, candidateIdempotencyKey, normalizeAfghanistanPhone, normalizeInventoryText, normalizePriceToAfn } from "@/lib/inventory/normalization";
import { scoreDuplicateCandidate, type DuplicateCandidate } from "@/lib/inventory/deduplication";
import { recordDemandSignalAction } from "@/lib/actions/liquidity";
import { consumeRateLimit } from "@/lib/security/rate-limit";

export type InventoryContactEvent =
  | "phone_reveal"
  | "call_click"
  | "whatsapp_click"
  | "owner_claim_click"
  | "remove_request_click"
  | "report_unavailable"
  | "report_wrong_info"
  | "report_scam";

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

export async function initiateListingClaimAction(listingId: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Authentication required", statusCode: 401 };

  const rateLimit = await consumeRateLimit({
    scope: "inventory.claim",
    userId: user.id,
    maxRequests: 10,
    windowSeconds: 60 * 60,
  });
  if (!rateLimit.allowed) return { ok: false, message: "Too many requests", statusCode: 429 };

  const supabase = await createTrustedServerClient();
  const { data: listing } = await supabase
    .from("listings")
    .select("id, source_type, ownership_status, contact_phone")
    .eq("id", listingId)
    .maybeSingle();

  if (!listing || (listing as { ownership_status?: string }).ownership_status === "claimed") {
    return { ok: false, message: "Listing is not eligible for claim" };
  }

  const phone = normalizeAfghanistanPhone((listing as { contact_phone?: string | null }).contact_phone);
  const { data: claim, error } = await supabase
    .from("listing_claims")
    .insert({
      listing_id: listingId,
      claimant_user_id: user.id,
      status: "initiated",
      masked_contact_hint: phone.hint,
      challenge_channel: "staff_review",
      challenge_expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    })
    .select("id")
    .single();

  if (error || !claim) return { ok: false, message: "Could not start claim" };

  await supabase.rpc("record_listing_provenance_event", {
    p_listing_id: listingId,
    p_event_type: "claim_initiated",
    p_after_state: { claim_id: claim.id },
    p_reason: "buyer_owner_claim",
  });

  return { ok: true, claimId: claim.id };
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
