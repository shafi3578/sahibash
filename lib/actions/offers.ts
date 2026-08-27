"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { createAccountNotification } from "@/lib/notifications/create";

const OFFER_CREATED_COPY = {
  en: { title: "New offer", body: "A buyer sent an offer for one of your listings." },
  fa: { title: "پیشنهاد تازه", body: "یک خریدار برای یکی از اعلان‌های شما پیشنهاد فرستاد." },
  ps: { title: "نوی وړاندیز", body: "یوه پېرودونکي ستاسو د یوه اعلان لپاره وړاندیز ولېږه." },
} as const;

const OFFER_STATUS_COPY = {
  accepted: {
    en: { title: "Offer accepted", body: "The seller accepted your offer." },
    fa: { title: "پیشنهاد پذیرفته شد", body: "فروشنده پیشنهاد شما را پذیرفت." },
    ps: { title: "وړاندیز ومنل شو", body: "پلورونکي ستاسو وړاندیز ومانه." },
  },
  rejected: {
    en: { title: "Offer declined", body: "The seller declined your offer." },
    fa: { title: "پیشنهاد رد شد", body: "فروشنده پیشنهاد شما را رد کرد." },
    ps: { title: "وړاندیز رد شو", body: "پلورونکي ستاسو وړاندیز رد کړ." },
  },
  cancelled: {
    en: { title: "Offer cancelled", body: "The buyer cancelled an offer." },
    fa: { title: "پیشنهاد لغو شد", body: "خریدار یک پیشنهاد را لغو کرد." },
    ps: { title: "وړاندیز لغوه شو", body: "پېرودونکي یو وړاندیز لغوه کړ." },
  },
} as const;

function toNumber(value: FormDataEntryValue | null): number {
  const n = Number(String(value ?? "0").replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export async function createOfferAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const listingId = String(formData.get("listingId") ?? "").trim();
  const offeredPrice = toNumber(formData.get("offeredPrice"));
  const buyerNote = String(formData.get("buyerNote") ?? "").trim();

  if (!listingId || offeredPrice <= 0) {
    redirect(`/listings/${listingId}?offer=invalid`);
  }

  const rateLimit = await consumeRateLimit({
    scope: "offer.create",
    userId: user.id,
    maxRequests: 20,
    windowSeconds: 60 * 60,
  });
  if (!rateLimit.allowed) {
    redirect(`/listings/${listingId}?offer=rate-limited`);
  }

  const { data: listing } = await supabase
    .from("listings")
    .select("id, user_id, status, currency, minimum_offer, negotiable")
    .eq("id", listingId)
    .single();

  if (!listing || listing.user_id === user.id || listing.status !== "approved") {
    redirect(`/listings/${listingId}?offer=invalid`);
  }

  if (listing.minimum_offer && offeredPrice < Number(listing.minimum_offer)) {
    redirect(`/listings/${listingId}?offer=too-low`);
  }

  const { data: createdOffer, error } = await supabase.from("offers").insert({
    listing_id: listing.id,
    buyer_user_id: user.id,
    seller_user_id: listing.user_id,
    offered_price: offeredPrice,
    currency: listing.currency,
    buyer_note: buyerNote || null,
    status: "pending",
    buyer_seen_at: new Date().toISOString(),
    seller_seen_at: null,
  }).select("id").single();

  if (error) {
    redirect(`/listings/${listingId}?offer=error`);
  }

  await createAccountNotification({
    userId: listing.user_id,
    type: "listing_offer",
    copy: OFFER_CREATED_COPY,
    payload: { listing_id: listing.id, offer_id: createdOffer.id },
  });

  revalidatePath(`/listings/${listingId}`);
  revalidatePath("/dashboard/offers");
  redirect(`/listings/${listingId}?offer=sent`);
}

export async function updateOfferStatusAction(
  offerId: string,
  status: "accepted" | "rejected" | "cancelled",
  sellerResponseNote?: string
): Promise<void> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: offer } = await supabase
    .from("offers")
    .select("id, listing_id, buyer_user_id, seller_user_id, status")
    .eq("id", offerId)
    .single();

  if (!offer) return;

  const isSeller = offer.seller_user_id === user.id;
  const isBuyer = offer.buyer_user_id === user.id;

  if ((status === "accepted" || status === "rejected") && !isSeller) {
    return;
  }

  if (status === "cancelled" && !isBuyer) {
    return;
  }

  const payload: Record<string, string | null> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (isSeller && (status === "accepted" || status === "rejected")) {
    payload.buyer_seen_at = null;
    payload.seller_seen_at = new Date().toISOString();
  }

  if (isBuyer && status === "cancelled") {
    payload.buyer_seen_at = new Date().toISOString();
    payload.seller_seen_at = null;
  }

  if (typeof sellerResponseNote === "string" && isSeller) {
    payload.seller_response_note = sellerResponseNote.trim() || null;
  }

  const { error } = await supabase.from("offers").update(payload).eq("id", offerId);
  if (!error) {
    const recipientId = status === "cancelled" ? offer.seller_user_id : offer.buyer_user_id;
    await createAccountNotification({
      userId: recipientId,
      type: "listing_offer",
      copy: OFFER_STATUS_COPY[status],
      payload: { listing_id: offer.listing_id, offer_id: offer.id },
    });
  }

  revalidatePath("/dashboard/offers");
  revalidatePath(`/listings/${offer.listing_id}`);
}
