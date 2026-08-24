"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeAfghanistanPhone } from "@/lib/inventory/normalization";
import { normalizeLocaleInput } from "@/lib/i18n/routing";

export async function updateAccountProfileAction(formData: FormData): Promise<{
  ok: boolean;
  message: string;
}> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const fullName = String(formData.get("full_name") ?? formData.get("fullName") ?? "")
    .trim()
    .replace(/\s+/g, " ");
  const phone = normalizeAfghanistanPhone(formData.get("phone"));
  const preferredLanguage = normalizeLocaleInput(String(formData.get("preferred_language") ?? ""));

  if (fullName.length < 2 || fullName.length > 80 || !/[\p{L}]/u.test(fullName)) {
    return { ok: false, message: "Enter a valid full name." };
  }

  if (!phone.normalized) {
    return { ok: false, message: "Enter a valid Afghanistan mobile number." };
  }

  const payload: Record<string, unknown> = {
    full_name: fullName,
    phone: phone.normalized,
    updated_at: new Date().toISOString(),
  };

  if (preferredLanguage) {
    payload.preferred_language = preferredLanguage;
  }

  const { error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", user.id);

  if (error) {
    return { ok: false, message: "Could not update your profile right now." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings/account");
  revalidatePath("/post-ad/create");

  return { ok: true, message: "Profile updated." };
}
