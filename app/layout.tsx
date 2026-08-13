import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getCurrentLocale } from "@/lib/i18n/server";
import { LocaleSync } from "@/components/locale-sync";
import { getSiteSettings } from "@/lib/actions/site-settings";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const siteSettings = await getSiteSettings();

  return {
    title: `${siteSettings.site_name} | Buy and Sell in Afghanistan`,
    description: siteSettings.site_tagline || "A modern Afghanistan marketplace for vehicles, real estate, electronics, and second-hand items.",
  };
}

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getCurrentLocale();
  const dir = locale === "en" ? "ltr" : "rtl";
  const htmlLang = locale === "fa" ? "fa-AF" : locale === "ps" ? "ps-AF" : "en";
  return (
    <html
      lang={htmlLang}
      dir={dir}
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <LocaleSync locale={locale} />
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
