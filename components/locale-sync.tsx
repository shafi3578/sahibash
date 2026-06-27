"use client";

import { useEffect } from "react";
import type { AppLocale } from "@/lib/i18n/translations";

export function LocaleSync({ locale }: { locale: AppLocale }) {
  useEffect(() => {
    const html = document.documentElement;
    html.lang = locale === "fa" ? "fa-AF" : locale === "ps" ? "ps-AF" : "en";
    html.dir = locale === "en" ? "ltr" : "rtl";

    try {
      window.localStorage.setItem("sahibash_locale", locale);
    } catch {
      // ignore
    }
  }, [locale]);

  return null;
}
