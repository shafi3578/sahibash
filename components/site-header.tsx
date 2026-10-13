import Link from "next/link";
import { getDictionary } from "@/lib/i18n/server";
import { MobileSearchSheet } from "@/components/mobile-search-sheet";
import { localizePath } from "@/lib/i18n/routing";
import { getNavigationItems } from "@/lib/actions/navigation";
import { getSiteSettings } from "@/lib/actions/site-settings";
import { localizeNavigationLabel } from "@/lib/i18n/navigation-labels";
import { getLocalizedBrandName } from "@/lib/i18n/brand";
import { AuthAwareHeaderLinks, AuthAwareNotificationLink } from "@/components/auth-aware-header-actions";
import { MobileMenuSheet } from "@/components/mobile-menu-sheet";

export async function SiteHeader() {
  const [{ locale, t }, siteSettings, navigationItems] = await Promise.all([
    getDictionary(),
    getSiteSettings(),
    getNavigationItems(),
  ]);
  const brandName = getLocalizedBrandName(locale, siteSettings.site_name);
  const brandGlyph = locale === "en" ? "J" : "ج";
  const href = (path: string) => localizePath(path, locale);
  const mobileLabels = locale === "fa"
    ? { notifications: "اعلان‌ها" }
    : locale === "ps"
      ? { notifications: "خبرتیاوې" }
      : { notifications: "Notifications" };

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[linear-gradient(100deg,#11152d_0%,#25265a_52%,#4b2d62_100%)] text-white shadow-[0_12px_34px_rgba(21,22,46,0.24)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-2.5 sm:px-6 sm:py-4 lg:px-8">
          <Link href={href("/")} aria-label={brandName} className="brand-lockup shrink-0">
            <span aria-hidden="true" className="brand-mark">{brandGlyph}</span>
            <span className="font-display text-2xl font-black tracking-tight sm:text-3xl">{brandName}</span>
          </Link>
          <nav className="hidden flex-1 items-center justify-center gap-2 lg:flex">
            {navigationItems.map((link) => (
              <Link key={`${link.id}-${link.path}`} href={href(link.path)} className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-white/15">
                {localizeNavigationLabel(link.path, link.label, locale)}
              </Link>
            ))}
          </nav>
          <div className="flex min-w-0 items-center justify-end gap-1.5 sm:gap-2">
            <MobileSearchSheet locale={locale} />
            <MobileMenuSheet locale={locale} />
            <AuthAwareNotificationLink locale={locale} label={mobileLabels.notifications} />

            <AuthAwareHeaderLinks locale={locale} labels={t.header} />
          </div>
        </div>
      </header>
    </>
  );
}
