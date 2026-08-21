import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getCurrentLocale } from "@/lib/i18n/server";
import { LocaleSync } from "@/components/locale-sync";
import { getSiteSettings } from "@/lib/actions/site-settings";
import "./globals.css";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { PwaRegister } from "@/components/pwa-register";
import { getCurrentUser } from "@/lib/auth";
import { localeDirection, localeTag } from "@/lib/i18n/format";
import { SITE_METADATA } from "@/lib/i18n/metadata";
import { getLocalizedBrandName } from "@/lib/i18n/brand";

export async function generateMetadata(): Promise<Metadata> {
  const siteSettings = await getSiteSettings();
  const locale = await getCurrentLocale();
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

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getCurrentLocale();
  const dir = localeDirection(locale);
  const htmlLang = localeTag(locale);
  const user = await getCurrentUser();
  return (
    <html
      lang={htmlLang}
      dir={dir}
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col pb-20 lg:pb-0">
        <PwaRegister />
        <LocaleSync locale={locale} />
        <SiteHeader />
        {children}
        <SiteFooter />
        <MobileBottomNav locale={locale} authenticated={Boolean(user)} />
      </body>
    </html>
  );
}
