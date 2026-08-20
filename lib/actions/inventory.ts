"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser, requireSuperAdministrator } from "@/lib/auth";
import type { AppLocale } from "@/lib/i18n/translations";
import { assertSafeExternalUrl, candidateIdempotencyKey, normalizeAfghanistanPhone, normalizeInventoryText, normalizePriceToAfn } from "@/lib/inventory/normalization";
import { scoreDuplicateCandidate, type DuplicateCandidate } from "@/lib/inventory/deduplication";
import { recordDemandSignalAction } from "@/lib/actions/liquidity";

export type InventoryContactEvent =
  | "phone_reveal"
  | "call_click"
  | "whatsapp_click"
  | "owner_claim_click"
  | "remove_request_click"
  | "report_unavailable"
  | "report_wrong_info"
  | "report_scam";

export async function recordInventoryContactEventAction(
  listingId: string,
  eventType: InventoryContactEvent,
  locale: AppLocale,
  metadata: Record<string, unknown> = {}
) {
  const supabase = await createSupabaseServerClient();
  const user = await getCurrentUser();
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
    locale,
    metadata,
  });

  if (eventType === "phone_reveal" || eventType === "call_click" || eventType === "whatsapp_click") {
    await recordDemandSignalAction({
      signalType: "contact_action",
      locale,
      attributes: { eventType, listingId },
      weight: eventType === "phone_reveal" ? 3 : 4,
      source: "listing_contact",
    });
  }

  return { ok: true };
}

export async function initiateListingClaimAction(listingId: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Authentication required", statusCode: 401 };

  const supabase = await createSupabaseServerClient();
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
