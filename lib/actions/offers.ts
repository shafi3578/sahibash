"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

  const { error } = await supabase.from("offers").insert({
    listing_id: listing.id,
    buyer_user_id: user.id,
    seller_user_id: listing.user_id,
    offered_price: offeredPrice,
    currency: listing.currency,
    buyer_note: buyerNote || null,
    status: "pending",
    buyer_seen_at: new Date().toISOString(),
    seller_seen_at: null,
  });

  if (error) {
    redirect(`/listings/${listingId}?offer=error`);
  }

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

  await supabase.from("offers").update(payload).eq("id", offerId);

  revalidatePath("/dashboard/offers");
  revalidatePath(`/listings/${offer.listing_id}`);
}
