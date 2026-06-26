import { cookies } from "next/headers";
import { headers } from "next/headers";
import {
  SUPPORTED_LOCALES,
  getSafeTranslations,
  type AppLocale,
} from "@/lib/i18n/translations";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeLocaleInput } from "@/lib/i18n/routing";

export const LOCALE_COOKIE = "sahibash_locale";

function isSupportedLocale(value: string): value is AppLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export async function getCurrentLocale(): Promise<AppLocale> {
  const headerStore = await headers();
  const headerLocale = normalizeLocaleInput(headerStore.get("x-sahibash-locale"));
  if (headerLocale) {
    return headerLocale;
  }

  const cookieStore = await cookies();
  const cookieValue = normalizeLocaleInput(cookieStore.get(LOCALE_COOKIE)?.value);
  if (cookieValue && isSupportedLocale(cookieValue)) {
    return cookieValue;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;
    if (userId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("preferred_language")
        .eq("id", userId)
        .maybeSingle();
      const preferred = normalizeLocaleInput(
        String((profile as { preferred_language?: string } | null)?.preferred_language ?? "")
      );
      if (preferred && isSupportedLocale(preferred)) {
        return preferred;
      }
    }
  } catch {
    // fallback to default locale
  }

  return "fa";
}

export async function getDictionary() {
  const locale = await getCurrentLocale();
  return {
    locale,
    t: getSafeTranslations(locale),
  };
}
