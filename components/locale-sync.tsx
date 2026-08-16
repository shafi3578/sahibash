"use client";

import { useEffect } from "react";
import type { AppLocale } from "@/lib/i18n/translations";
import { localeDirection, localeTag } from "@/lib/i18n/format";

export function LocaleSync({ locale }: { locale: AppLocale }) {
  useEffect(() => {
    const html = document.documentElement;
    html.lang = localeTag(locale);
    html.dir = localeDirection(locale);

    try {
      window.localStorage.setItem("sahibash_locale", locale);
    } catch {
      // ignore
    }
  }, [locale]);

  return null;
}
