"use client";

import { useEffect } from "react";
import type { AppLocale } from "@/lib/i18n/translations";

export function LocaleSync({ locale }: { locale: AppLocale }) {
  useEffect(() => {
    try {
      window.localStorage.setItem("sahibash_locale", locale);
    } catch {
      // ignore
    }
  }, [locale]);

  return null;
}
