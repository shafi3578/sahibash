"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function sendListingMessageAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const listingId = String(formData.get("listingId") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!listingId || body.length < 2) {
    redirect(`/listings/${listingId}?message=invalid`);
  }

  const supabase = await createSupabaseServerClient();

  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("id, user_id, status")
    .eq("id", listingId)
    .single();

  if (listingError || !listing || listing.user_id === user.id) {
    redirect(`/listings/${listingId}?message=error`);
  }

  const { error } = await supabase.from("messages").insert({
    listing_id: listing.id,
    sender_user_id: user.id,
    recipient_user_id: listing.user_id,
    body,
  });

  if (error) {
    redirect(`/listings/${listingId}?message=error`);
  }

  revalidatePath(`/listings/${listingId}`);
  revalidatePath("/dashboard/messages");
  redirect(`/listings/${listingId}?message=sent`);
}

export async function replyMessageAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const listingId = String(formData.get("listingId") ?? "").trim();
  const recipientUserId = String(formData.get("recipientUserId") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!listingId || !recipientUserId || !body) return;
  if (recipientUserId === user.id) return;

  const { error } = await supabase.from("messages").insert({
    listing_id: listingId,
    sender_user_id: user.id,
    recipient_user_id: recipientUserId,
    body,
  });

  if (error) return;

  revalidatePath("/dashboard/messages");
}
