import { getNavigationItems } from "@/lib/actions/navigation";
import { getDictionary } from "@/lib/i18n/server";
import { getSiteSettings } from "@/lib/actions/site-settings";
import { localizePath } from "@/lib/i18n/routing";
import { localizeNavigationLabel } from "@/lib/i18n/navigation-labels";
import { getLocalizedBrandName } from "@/lib/i18n/brand";
import Link from "next/link";

const ESSENTIAL_LINKS = {
  en: [
    { path: "/safety", label: "Safety" },
    { path: "/contact", label: "Help & Contact" },
    { path: "/terms", label: "Terms" },
    { path: "/privacy", label: "Privacy" },
  ],
  fa: [
    { path: "/safety", label: "مصئونیت" },
    { path: "/contact", label: "کمک و تماس" },
    { path: "/terms", label: "شرایط استفاده" },
    { path: "/privacy", label: "حریم خصوصی" },
  ],
  ps: [
    { path: "/safety", label: "خوندیتوب" },
    { path: "/contact", label: "مرسته او اړیکه" },
    { path: "/terms", label: "د کارولو شرطونه" },
    { path: "/privacy", label: "محرمیت" },
  ],
} as const;

export async function SiteFooter() {
  const [{ t, locale }, siteSettings, navigationItems] = await Promise.all([
    getDictionary(),
    getSiteSettings(),
    getNavigationItems(),
  ]);
  const brandName = getLocalizedBrandName(locale, siteSettings.site_name || t.footer.platform);
  const existingPaths = new Set(navigationItems.map((item) => item.path));
  const essentialLinks = ESSENTIAL_LINKS[locale].filter((item) => !existingPaths.has(item.path));

  return (
    <footer className="mt-auto border-t border-[var(--line)] bg-white/70">
      <div className="mx-auto max-w-7xl px-4 py-8 text-sm text-[var(--ink-2)] sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-[1.5fr_1fr]">
          <div>
            <p className="font-semibold text-[var(--ink-1)]">{brandName}</p>
            <p className="mt-1 max-w-xl">{locale === "en" ? siteSettings.site_tagline || t.footer.tagline : t.footer.tagline}</p>
            <p className="mt-2 flex flex-wrap items-center gap-1 text-xs">
              <bdi dir="ltr">{siteSettings.contact_email}</bdi>
              <span aria-hidden="true">·</span>
              <bdi dir="ltr">{siteSettings.contact_phone}</bdi>
            </p>
          </div>
          <div>
            <p className="font-semibold text-[var(--ink-1)]">{t.footer.quickLinks}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {navigationItems.map((link) => (
                <Link key={`${link.id}-${link.path}`} href={localizePath(link.path, locale)} className="rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--ink-1)]">
                  {localizeNavigationLabel(link.path, link.label, locale)}
                </Link>
              ))}
              {essentialLinks.map((link) => (
                <Link key={link.path} href={localizePath(link.path, locale)} className="rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--ink-1)]">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
