import { getNavigationItems } from "@/lib/actions/navigation";
import { getDictionary } from "@/lib/i18n/server";
import { getSiteSettings } from "@/lib/actions/site-settings";

export async function SiteFooter() {
  const { t } = await getDictionary();
  const siteSettings = await getSiteSettings();
  const navigationItems = await getNavigationItems();

  return (
    <footer className="mt-auto border-t border-[var(--line)] bg-white/70">
      <div className="mx-auto max-w-7xl px-4 py-8 text-sm text-[var(--ink-2)] sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-[1.5fr_1fr]">
          <div>
            <p className="font-semibold text-[var(--ink-1)]">{siteSettings.site_name || t.footer.platform}</p>
            <p className="mt-1 max-w-xl">{siteSettings.site_tagline || t.footer.tagline}</p>
            <p className="mt-2 text-xs">{siteSettings.contact_email} · {siteSettings.contact_phone}</p>
          </div>
          <div>
            <p className="font-semibold text-[var(--ink-1)]">Quick links</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {navigationItems.map((link) => (
                <a key={`${link.id}-${link.path}`} href={link.path} className="rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--ink-1)]">
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
