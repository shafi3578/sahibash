import type { AppLocale } from "@/lib/i18n/translations";

export function getLocalizedBrandName(locale: AppLocale, fallback?: string | null) {
  void fallback;
  return locale === "fa" || locale === "ps" ? "صاحبش" : "Sahibash";
}
