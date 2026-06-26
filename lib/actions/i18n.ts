"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LOCALE_COOKIE } from "@/lib/i18n/server";
import { SUPPORTED_LOCALES, type AppLocale } from "@/lib/i18n/translations";
import { localizePath, normalizeLocaleInput } from "@/lib/i18n/routing";

function isSupportedLocale(value: string): value is AppLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export async function setLocaleAction(formData: FormData) {
  const nextLocaleRaw = String(formData.get("locale") ?? "").trim().toLowerCase();
  const returnToRaw = String(formData.get("returnTo") ?? "/").trim();
  const returnTo = returnToRaw.startsWith("/") ? returnToRaw : "/";
  const normalized = normalizeLocaleInput(nextLocaleRaw);
  const nextLocale: AppLocale = normalized && isSupportedLocale(normalized) ? normalized : "fa";
  const localizedReturnTo = localizePath(returnTo, nextLocale);

  const cookieStore = await cookies();
  cookieStore.set({
    name: LOCALE_COOKIE,
    value: nextLocale,
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  try {
    const user = await getCurrentUser();
    if (user) {
      const supabase = await createSupabaseServerClient();
      await supabase
        .from("profiles")
        .update({ preferred_language: nextLocale })
        .eq("id", user.id);
    }
  } catch {
    // best effort
  }

  revalidatePath(localizedReturnTo);
  redirect(localizedReturnTo);
}
