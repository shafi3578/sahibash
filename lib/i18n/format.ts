import type { AppLocale } from "@/lib/i18n/translations";

export const LOCALE_TAGS: Record<AppLocale, "en" | "fa-AF" | "ps-AF"> = {
  en: "en",
  fa: "fa-AF",
  ps: "ps-AF",
};

export function localeTag(locale: AppLocale) {
  return LOCALE_TAGS[locale];
}

export function localeDirection(locale: AppLocale): "ltr" | "rtl" {
  return locale === "en" ? "ltr" : "rtl";
}

export function formatNumber(value: number, locale: AppLocale, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(localeTag(locale), options).format(value);
}

export function formatDate(
  value: Date | string | number,
  locale: AppLocale,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
) {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(localeTag(locale), options).format(date);
}

export function formatCurrencyAmount(value: number, currency: string, locale: AppLocale) {
  return `${formatNumber(value, locale)} ${currency}`;
}
