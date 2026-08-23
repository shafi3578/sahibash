"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeLocaleInput } from "@/lib/i18n/routing";
import { getCurrentLocale } from "@/lib/i18n/server";
import { localizePath } from "@/lib/i18n/routing";

export async function saveNotificationPreferencesAction(formData: FormData) {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  const yes = (key: string) => formData.get(key) === "on";
  const currentLocale = await getCurrentLocale();
  const locale = normalizeLocaleInput(String(formData.get("locale") ?? "")) ?? currentLocale;

  const { error } = await supabase.from("notification_preferences").upsert(
    {
      user_id: user.id,
      locale,
      new_messages: yes("new_messages"),
      listing_moderation: yes("listing_moderation"),
      listing_expiry: yes("listing_expiry"),
      saved_search_matches: yes("saved_search_matches"),
      saved_listing_changes: yes("saved_listing_changes"),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    throw new Error("Unable to save notification preferences.");
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/settings/notifications");
  revalidatePath(localizePath("/dashboard/settings", locale));
  revalidatePath(localizePath("/dashboard/settings/notifications", locale));
}
