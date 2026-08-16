import type { ReactNode } from "react";
import type { AppLocale } from "@/lib/i18n/translations";
import { normalizeLocaleInput } from "@/lib/i18n/routing";
import { buildLocalizedMetadata } from "@/lib/i18n/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale: AppLocale = normalizeLocaleInput(rawLocale) ?? "en";
  return buildLocalizedMetadata(locale);
}

export default function LocaleLayout({ children }: { children: ReactNode }) {
  return children;
}
