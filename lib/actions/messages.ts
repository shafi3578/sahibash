"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentLocale } from "@/lib/i18n/server";
import { localizePath } from "@/lib/i18n/routing";
import { isUuid, isValidMessageBody, normalizeMessageBody } from "@/lib/messages/threading";
import { consumeRateLimit } from "@/lib/security/rate-limit";

function listingRedirect(listingId: string, locale: Awaited<ReturnType<typeof getCurrentLocale>>, status: string) {
  const targetPath = listingId && isUuid(listingId)
    ? `/listings/${listingId}?message=${status}`
    : `/listings?message=${status}`;
  return localizePath(targetPath, locale);
}

export async function sendListingMessageAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const locale = await getCurrentLocale();
  const listingId = String(formData.get("listingId") ?? "").trim();
  const body = normalizeMessageBody(formData.get("body"));

  if (!isUuid(listingId) || !isValidMessageBody(body)) {
    redirect(listingRedirect(listingId, locale, "invalid"));
  }

  const rateLimit = await consumeRateLimit({
    scope: "message.send",
    userId: user.id,
    maxRequests: 20,
    windowSeconds: 10 * 60,
  });
  if (!rateLimit.allowed) {
    redirect(listingRedirect(listingId, locale, "rate-limited"));
  }

  const supabase = await createSupabaseServerClient();

  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("id, user_id, status")
    .eq("id", listingId)
    .single();

  if (listingError || !listing || listing.user_id === user.id || listing.status !== "approved") {
    redirect(listingRedirect(listingId, locale, "error"));
  }

  const { error } = await supabase.from("messages").insert({
    listing_id: listing.id,
    sender_user_id: user.id,
    recipient_user_id: listing.user_id,
    body,
  });

  if (error) {
    redirect(listingRedirect(listingId, locale, "error"));
  }

  revalidatePath(`/listings/${listingId}`);
  revalidatePath(localizePath(`/listings/${listingId}`, locale));
  revalidatePath("/dashboard/messages");
  revalidatePath(localizePath("/dashboard/messages", locale));
  redirect(listingRedirect(listingId, locale, "sent"));
}

export async function replyMessageAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  const locale = await getCurrentLocale();

  const listingId = String(formData.get("listingId") ?? "").trim();
  const recipientUserId = String(formData.get("recipientUserId") ?? "").trim();
  const body = normalizeMessageBody(formData.get("body"));

  if (!isUuid(listingId) || !isUuid(recipientUserId) || !isValidMessageBody(body)) return;
  if (recipientUserId === user.id) return;

  const rateLimit = await consumeRateLimit({
    scope: "message.reply",
    userId: user.id,
    maxRequests: 60,
    windowSeconds: 10 * 60,
  });
  if (!rateLimit.allowed) return;

  const [outgoingThread, incomingThread] = await Promise.all([
    supabase
      .from("messages")
      .select("id")
      .eq("listing_id", listingId)
      .eq("sender_user_id", user.id)
      .eq("recipient_user_id", recipientUserId)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("messages")
      .select("id")
      .eq("listing_id", listingId)
      .eq("sender_user_id", recipientUserId)
      .eq("recipient_user_id", user.id)
      .limit(1)
      .maybeSingle(),
  ]);

  if (!outgoingThread.data && !incomingThread.data) {
    return;
  }

  const { error } = await supabase.from("messages").insert({
    listing_id: listingId,
    sender_user_id: user.id,
    recipient_user_id: recipientUserId,
    body,
  });

  if (error) return;

  revalidatePath("/dashboard/messages");
  revalidatePath(localizePath("/dashboard/messages", locale));
}
