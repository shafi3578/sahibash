"use client";

import { useState, useCallback } from "react";
import { TRANSLATIONS, getSafeTranslations, type AppLocale } from "@/lib/i18n/translations";

type Dictionary = typeof TRANSLATIONS["en"];

export function useTranslation(locale: AppLocale = "en") {
  const [dict] = useState<Dictionary>(() => getSafeTranslations(locale));

  const t = useCallback(
    (key: string, defaultValue?: string) => {
      let current: any = dict;
      
      for (const part of key.split(".")) {
        current = current?.[part];
      }
      
      return (current as string) || defaultValue || key;
    },
    [dict]
  );

  return { t, dict };
}
