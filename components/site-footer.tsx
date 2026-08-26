import { getNavigationItems } from "@/lib/actions/navigation";
import { getDictionary } from "@/lib/i18n/server";
import { getSiteSettings } from "@/lib/actions/site-settings";
import { localizePath } from "@/lib/i18n/routing";
import { localizeNavigationLabel } from "@/lib/i18n/navigation-labels";
import { getLocalizedBrandName } from "@/lib/i18n/brand";

export async function SiteFooter() {
  const [{ t, locale }, siteSettings, navigationItems] = await Promise.all([
    getDictionary(),
    getSiteSettings(),
    getNavigationItems(),
  ]);
  const brandName = getLocalizedBrandName(locale, siteSettings.site_name || t.footer.platform);

  return (
    <footer className="mt-auto border-t border-[var(--line)] bg-white/70">
      <div className="mx-auto max-w-7xl px-4 py-8 text-sm text-[var(--ink-2)] sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-[1.5fr_1fr]">
          <div>
            <p className="font-semibold text-[var(--ink-1)]">{brandName}</p>
            <p className="mt-1 max-w-xl">{locale === "en" ? siteSettings.site_tagline || t.footer.tagline : t.footer.tagline}</p>
            <p className="mt-2 text-xs">{siteSettings.contact_email} · {siteSettings.contact_phone}</p>
          </div>
          <div>
            <p className="font-semibold text-[var(--ink-1)]">{t.footer.quickLinks}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {navigationItems.map((link) => (
                <a key={`${link.id}-${link.path}`} href={localizePath(link.path, locale)} className="rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--ink-1)]">
                  {localizeNavigationLabel(link.path, link.label, locale)}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
