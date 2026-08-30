import "server-only";

import { createSupabaseAdmin } from "@/lib/supabase/admin";
import type { AppLocale } from "@/lib/i18n/translations";

type NotificationType =
  | "listing_message"
  | "listing_offer"
  | "claim_accepted"
  | "claim_rejected"
  | "system";

type Copy = Record<AppLocale, { title: string; body: string }>;

type CreateAccountNotificationInput = {
  userId: string;
  type: NotificationType;
  copy: Copy;
  payload?: Record<string, string>;
  preference?: "new_messages";
};

export async function createAccountNotification({
  userId,
  type,
  copy,
  payload = {},
  preference,
}: CreateAccountNotificationInput): Promise<boolean> {
  try {
    const admin = createSupabaseAdmin();
    const [{ data: preferences }, { data: profile }] = await Promise.all([
      admin
        .from("notification_preferences")
        .select("locale,new_messages")
        .eq("user_id", userId)
        .maybeSingle(),
      admin.from("profiles").select("preferred_language").eq("id", userId).maybeSingle(),
    ]);

    if (preference && preferences?.[preference] === false) return true;

    const candidate = preferences?.locale ?? profile?.preferred_language;
    const locale: AppLocale = candidate === "fa" || candidate === "ps" ? candidate : "en";
    const localized = copy[locale];
    const { error } = await admin.from("notifications").insert({
      user_id: userId,
      type,
      title: localized.title,
      body: localized.body,
      payload,
    });
    return !error;
  } catch {
    // Notification delivery must never roll back the user action that produced it.
    return false;
  }
}
