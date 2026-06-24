import { cookies } from "next/headers";
import {
  SUPPORTED_LOCALES,
  TRANSLATIONS,
  type AppLocale,
} from "@/lib/i18n/translations";

export const LOCALE_COOKIE = "sahibash_locale";

function isSupportedLocale(value: string): value is AppLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export async function getCurrentLocale(): Promise<AppLocale> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(LOCALE_COOKIE)?.value?.trim().toLowerCase();
  if (cookieValue && isSupportedLocale(cookieValue)) {
    return cookieValue;
  }
  return "en";
}

export async function getDictionary() {
  const locale = await getCurrentLocale();
  return {
    locale,
    t: TRANSLATIONS[locale],
  };
}
