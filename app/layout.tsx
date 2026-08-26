import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getCurrentLocale } from "@/lib/i18n/server";
import { headers } from "next/headers";
import { LocaleSync } from "@/components/locale-sync";
import { getSiteSettings } from "@/lib/actions/site-settings";
import "./globals.css";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { PwaRegister } from "@/components/pwa-register";
import { localeDirection, localeTag } from "@/lib/i18n/format";
import { SITE_METADATA } from "@/lib/i18n/metadata";
import { getLocalizedBrandName } from "@/lib/i18n/brand";

export async function generateMetadata(): Promise<Metadata> {
  const [siteSettings, locale] = await Promise.all([
    getSiteSettings(),
    getCurrentLocale(),
  ]);
  const localizedMetadata = SITE_METADATA[locale];
  const brandName = getLocalizedBrandName(locale, siteSettings.site_name);

  return {
    title: `${brandName} | ${localizedMetadata.titleSuffix}`,
    description: (locale === "en" ? siteSettings.site_tagline : null) || localizedMetadata.description,
    alternates: {
      languages: {
        en: "/en",
        "fa-AF": "/fa",
        "ps-AF": "/ps",
      },
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [locale, headerStore] = await Promise.all([
    getCurrentLocale(),
    headers(),
  ]);
  const isAdminRoute = headerStore.get("x-sahibash-admin-route") === "1";
  const dir = localeDirection(locale);
  const htmlLang = localeTag(locale);
  return (
    <html
      lang={htmlLang}
      dir={dir}
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <body className={isAdminRoute ? "min-h-full flex flex-col" : "min-h-full flex flex-col pb-20 lg:pb-0"}>
        <PwaRegister />
        <LocaleSync locale={locale} />
        {isAdminRoute ? null : <SiteHeader />}
        {children}
        {isAdminRoute ? null : <SiteFooter />}
        {isAdminRoute ? null : <MobileBottomNav locale={locale} />}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
