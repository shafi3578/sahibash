"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentLocale } from "@/lib/i18n/server";
import { localizePath } from "@/lib/i18n/routing";
import { notificationDestination } from "@/lib/notifications/destination";

export async function markNotificationReadAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  const supabase = await createSupabaseServerClient();
  await supabase.from("notifications").update({ is_read: true, read_at: new Date().toISOString() }).eq("id", id).eq("user_id", user.id);
  revalidatePath("/dashboard/notifications");
}

export async function markAllNotificationsReadAction() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  await supabase.from("notifications").update({ is_read: true, read_at: new Date().toISOString() }).eq("user_id", user.id).eq("is_read", false);
  revalidatePath("/dashboard/notifications");
}

export async function openNotificationAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) redirect("/dashboard/notifications");
  const supabase = await createSupabaseServerClient();
  const { data: notification } = await supabase
    .from("notifications")
    .select("payload")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  const locale = await getCurrentLocale();
  if (!notification) redirect(localizePath("/dashboard/notifications", locale));
  await supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);
  redirect(localizePath(notificationDestination(notification.payload), locale));
}
