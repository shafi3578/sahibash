import type { AppLocale } from "@/lib/i18n/translations";

const NAVIGATION_LABELS = {
  en: { "/": "Home", "/listings": "Listings", "/categories": "Categories", "/search": "Search", "/post-ad": "Post an ad", "/post-ad/create": "Post an ad", "/safety": "Safety", "/privacy": "Privacy", "/terms": "Terms", "/contact": "Contact" },
  fa: { "/": "خانه", "/listings": "اعلان‌ها", "/categories": "دسته‌بندی‌ها", "/search": "جستجو", "/post-ad": "ثبت اعلان", "/post-ad/create": "ثبت اعلان", "/safety": "مصئونیت", "/privacy": "حریم خصوصی", "/terms": "شرایط استفاده", "/contact": "تماس" },
  ps: { "/": "کور", "/listings": "اعلانونه", "/categories": "کټګورۍ", "/search": "لټون", "/post-ad": "اعلان ثبت کړئ", "/post-ad/create": "اعلان ثبت کړئ", "/safety": "خوندیتوب", "/privacy": "محرمیت", "/terms": "د کارولو شرطونه", "/contact": "اړیکه" },
} as const;

export function localizeNavigationLabel(path: string, fallback: string, locale: AppLocale) {
  const pathname = path.split("?")[0].replace(/\/$/, "") || "/";
  return NAVIGATION_LABELS[locale][pathname as keyof typeof NAVIGATION_LABELS.en]
    ?? (locale === "en" ? fallback : NAVIGATION_LABELS[locale]["/"]);
}
