"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentLocale } from "@/lib/i18n/server";
import { localizePath } from "@/lib/i18n/routing";
import { isUuid, normalizeMessageBody } from "@/lib/messages/threading";
import { consumeRateLimit } from "@/lib/security/rate-limit";

export async function createReportAction(formData: FormData) {
  const user = await requireUser();
  const listingId = String(formData.get("listingId") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  const details = String(formData.get("details") ?? "").trim();

  if (!isUuid(listingId) || reason.length < 3) {
    return;
  }

  const rateLimit = await consumeRateLimit({
    scope: "report.listing",
    userId: user.id,
    maxRequests: 10,
    windowSeconds: 60 * 60,
  });
  if (!rateLimit.allowed) return;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("reports").insert({
    listing_id: listingId,
    reporter_user_id: user.id,
    reason,
    details: details || null,
  });

  if (error) {
    return;
  }

  const locale = await getCurrentLocale();
  revalidatePath(`/listings/${listingId}`);
  revalidatePath(localizePath(`/listings/${listingId}`, locale));
}

export async function reportConversationAction(formData: FormData) {
  const user = await requireUser();
  const listingId = String(formData.get("listingId") ?? "").trim();
  const participantUserId = String(formData.get("participantUserId") ?? "").trim();
  const details = normalizeMessageBody(formData.get("details"));

  if (!isUuid(listingId) || !isUuid(participantUserId) || participantUserId === user.id) {
    return;
  }

  const rateLimit = await consumeRateLimit({
    scope: "report.conversation",
    userId: user.id,
    maxRequests: 10,
    windowSeconds: 60 * 60,
  });
  if (!rateLimit.allowed) return;

  const supabase = await createSupabaseServerClient();
  const [outgoingThread, incomingThread] = await Promise.all([
    supabase
      .from("messages")
      .select("id")
      .eq("listing_id", listingId)
      .eq("sender_user_id", user.id)
      .eq("recipient_user_id", participantUserId)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("messages")
      .select("id")
      .eq("listing_id", listingId)
      .eq("sender_user_id", participantUserId)
      .eq("recipient_user_id", user.id)
      .limit(1)
      .maybeSingle(),
  ]);

  if (!outgoingThread.data && !incomingThread.data) {
    return;
  }

  const { error } = await supabase.from("reports").insert({
    listing_id: listingId,
    reporter_user_id: user.id,
    reason: "message_thread",
    details: details || null,
  });

  if (error) {
    return;
  }

  const locale = await getCurrentLocale();
  revalidatePath("/dashboard/messages");
  revalidatePath(localizePath("/dashboard/messages", locale));
}
