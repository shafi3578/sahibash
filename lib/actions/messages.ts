"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentLocale } from "@/lib/i18n/server";
import { localizePath } from "@/lib/i18n/routing";
import { isUuid, isValidMessageBody, normalizeMessageBody } from "@/lib/messages/threading";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { createAccountNotification } from "@/lib/notifications/create";

const MESSAGE_NOTIFICATION_COPY = {
  en: { title: "New listing message", body: "You received a new message about one of your listings." },
  fa: { title: "پیام تازه برای اعلان", body: "دربارهٔ یکی از اعلان‌های شما پیام تازه‌ای رسیده است." },
  ps: { title: "د اعلان نوی پیغام", body: "ستاسو د یوه اعلان په اړه نوی پیغام راغلی دی." },
} as const;

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
    .select("id, user_id, status, publication_status, source_type, ownership_status")
    .eq("id", listingId)
    .single();

  const hasAccountSeller = Boolean(listing?.user_id)
    && (listing?.source_type === "native" || listing?.ownership_status === "claimed");
  if (
    listingError
    || !listing
    || !hasAccountSeller
    || !listing.user_id
    || listing.user_id === user.id
    || listing.status !== "approved"
    || listing.publication_status !== "published"
  ) {
    redirect(listingRedirect(listingId, locale, "error"));
  }

  const { data: blockedRows } = await supabase
    .from("user_blocks")
    .select("blocker_user_id")
    .or(`and(blocker_user_id.eq.${user.id},blocked_user_id.eq.${listing.user_id}),and(blocker_user_id.eq.${listing.user_id},blocked_user_id.eq.${user.id})`)
    .limit(1);
  if (blockedRows && blockedRows.length > 0) redirect(listingRedirect(listingId, locale, "error"));

  const { error } = await supabase.from("messages").insert({
    listing_id: listing.id,
    sender_user_id: user.id,
    recipient_user_id: listing.user_id,
    body,
  });

  if (error) {
    redirect(listingRedirect(listingId, locale, "error"));
  }

  await createAccountNotification({
    userId: listing.user_id,
    type: "listing_message",
    copy: MESSAGE_NOTIFICATION_COPY,
    payload: { listing_id: listing.id, sender_user_id: user.id },
    preference: "new_messages",
  });

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

  const { data: blockedRows } = await supabase
    .from("user_blocks")
    .select("blocker_user_id")
    .or(`and(blocker_user_id.eq.${user.id},blocked_user_id.eq.${recipientUserId}),and(blocker_user_id.eq.${recipientUserId},blocked_user_id.eq.${user.id})`)
    .limit(1);
  if (blockedRows && blockedRows.length > 0) return;

  const { error } = await supabase.from("messages").insert({
    listing_id: listingId,
    sender_user_id: user.id,
    recipient_user_id: recipientUserId,
    body,
  });

  if (error) return;

  await createAccountNotification({
    userId: recipientUserId,
    type: "listing_message",
    copy: MESSAGE_NOTIFICATION_COPY,
    payload: { listing_id: listingId, sender_user_id: user.id },
    preference: "new_messages",
  });

  revalidatePath("/dashboard/messages");
  revalidatePath(localizePath("/dashboard/messages", locale));
}
