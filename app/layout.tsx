import type { Metadata } from "next";
import { Space_Grotesk, Source_Sans_3 } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getCurrentLocale } from "@/lib/i18n/server";
import { LocaleSync } from "@/components/locale-sync";
import "./globals.css";

const displayFont = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "700"],
});

const bodyFont = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Sahibash | Buy and Sell in Afghanistan",
  description: "A modern Afghanistan marketplace for vehicles, real estate, electronics, and second-hand items.",
};

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
      className={`${displayFont.variable} ${bodyFont.variable} h-full antialiased`}
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
