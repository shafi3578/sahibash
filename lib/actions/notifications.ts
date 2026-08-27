"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
