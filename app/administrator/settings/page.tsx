import {
  getSiteSettings,
  getSiteSettingsVersions,
  restoreSiteSettingsVersionAction,
  saveSiteSettingsAction,
} from "@/lib/actions/site-settings";
import {
  deleteHomepageSectionAction,
  getHomepageSections,
  saveHomepageSectionAction,
} from "@/lib/actions/homepage-sections";
import {
  deleteNavigationItemAction,
  getNavigationItems,
  saveNavigationItemAction,
} from "@/lib/actions/navigation";
import { requirePermission } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n/server";
import { ADMIN_CONTROL_COPY } from "@/lib/i18n/admin-control-copy";
import { formatDate } from "@/lib/i18n/format";

export default async function AdministratorSettingsPage() {
  await requirePermission("settings.update");
  const { locale } = await getDictionary();
  const copy = ADMIN_CONTROL_COPY[locale];
  const settings = await getSiteSettings();
  const versions = await getSiteSettingsVersions();
  const homepageSections = await getHomepageSections();
  const navigationItems = await getNavigationItems();
  const navigationLinksText = (settings.navigation_links ?? [])
    .map((link) => `${link.label}|${link.path}`)
    .join("\n");
  const safeValue = (value: string | null | undefined) => value ?? "";

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold">{copy.siteSettings}</h1>
      <p className="mt-1 text-[var(--ink-2)]">{copy.editSettings}</p>

      <form action={saveSiteSettingsAction} className="mt-6 space-y-4 rounded-2xl border border-[var(--line)] bg-white p-5">
        <label className="block text-sm font-semibold">
          {copy.siteName}
          <input name="site_name" defaultValue={safeValue(settings.site_name)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
        </label>

        <label className="block text-sm font-semibold">
          {copy.tagline}
          <input name="site_tagline" defaultValue={safeValue(settings.site_tagline)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
        </label>

        <label className="block text-sm font-semibold">
          {copy.contactEmail}
          <input type="email" name="contact_email" defaultValue={safeValue(settings.contact_email)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
        </label>

        <label className="block text-sm font-semibold">
          {copy.contactPhone}
          <input name="contact_phone" defaultValue={safeValue(settings.contact_phone)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
        </label>

        <label className="block text-sm font-semibold">
          {copy.defaultLocale}
          <select name="default_locale" defaultValue={safeValue(settings.default_locale)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2">
            <option value="fa">fa</option>
            <option value="en">en</option>
            <option value="ps">ps</option>
          </select>
        </label>

        <label className="block text-sm font-semibold">
          {copy.heroTitle}
          <input name="home_hero_title" defaultValue={safeValue(settings.home_hero_title)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
        </label>

        <label className="block text-sm font-semibold">
          {copy.heroSubtitle}
          <textarea name="home_hero_subtitle" defaultValue={safeValue(settings.home_hero_subtitle)} className="mt-1 min-h-24 w-full rounded-xl border border-[var(--line)] px-3 py-2" />

        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold">
            {copy.primaryCtaLabel}
            <input name="home_primary_cta_label" defaultValue={safeValue(settings.home_primary_cta_label)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
          </label>

          <label className="block text-sm font-semibold">
            {copy.primaryCtaPath}
            <input name="home_primary_cta_path" defaultValue={safeValue(settings.home_primary_cta_path)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
          </label>

          <label className="block text-sm font-semibold">
            {copy.secondaryCtaLabel}
            <input name="home_secondary_cta_label" defaultValue={safeValue(settings.home_secondary_cta_label)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
          </label>

          <label className="block text-sm font-semibold">
            {copy.secondaryCtaPath}
            <input name="home_secondary_cta_path" defaultValue={safeValue(settings.home_secondary_cta_path)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
          </label>
        </div>

        <label className="block text-sm font-semibold">
          {copy.navigationLinks}
          <textarea
            name="navigation_links"
            defaultValue={navigationLinksText}
            placeholder="Listings|/listings\nCategories|/categories"
            className="mt-1 min-h-28 w-full rounded-xl border border-[var(--line)] px-3 py-2 font-mono text-sm"
          />
        </label>

        <label className="block text-sm font-semibold">
          {copy.stepUpWindow}
          <input
            type="number"
            name="step_up_window_minutes"
            defaultValue={settings.step_up_window_minutes ?? 15}
            min="1"
            max="1440"
            className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
          />
        </label>

        <label className="block text-sm font-semibold">
          {copy.changeSummary}
          <textarea
            name="change_summary"
            placeholder={copy.changeSummaryPlaceholder}
            className="mt-1 min-h-24 w-full rounded-xl border border-[var(--line)] px-3 py-2"
          />
        </label>

        <button type="submit" className="rounded-xl bg-[var(--ink-1)] px-4 py-2 text-sm font-semibold text-white">
          {copy.saveSettings}
        </button>
      </form>

      <section className="mt-8 rounded-2xl border border-[var(--line)] bg-white p-5">
        <h2 className="font-display text-2xl font-semibold">{copy.homepageSections}</h2>
        <p className="mt-1 text-sm text-[var(--ink-2)]">{copy.homepageSectionsDescription}</p>

        <form action={saveHomepageSectionAction} className="mt-4 grid gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4 md:grid-cols-2">
          <label className="text-sm font-semibold">
            {copy.slug}
            <input name="slug" placeholder="hero-intro" className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
          </label>
          <label className="text-sm font-semibold">
            {copy.type}
            <select name="section_type" defaultValue="hero" className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2">
              <option value="hero">hero</option>
              <option value="promo">promo</option>
              <option value="feature">feature</option>
            </select>
          </label>
          <label className="text-sm font-semibold md:col-span-2">
            {copy.title}
            <input name="title" placeholder="Trusted marketplace" className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
          </label>
          <label className="text-sm font-semibold md:col-span-2">
            {copy.body}
            <textarea name="body" placeholder="Describe the section" className="mt-1 min-h-24 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
          </label>
          <label className="text-sm font-semibold">
            {copy.ctaLabel}
            <input name="cta_label" className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
          </label>
          <label className="text-sm font-semibold">
            {copy.ctaPath}
            <input name="cta_path" placeholder="/listings" className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
          </label>
          <label className="text-sm font-semibold">
            {copy.sortOrder}
            <input type="number" name="sort_order" defaultValue="0" className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
          </label>
          <label className="inline-flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" name="is_enabled" defaultChecked className="h-4 w-4" />
            {copy.enabled}
          </label>
          <div className="md:col-span-2">
            <button type="submit" className="rounded-xl bg-[var(--ink-1)] px-4 py-2 text-sm font-semibold text-white">{copy.saveSection}</button>
          </div>
        </form>

        <div className="mt-5 space-y-3">
          {homepageSections.map((section) => (
            <div key={section.slug} className="rounded-xl border border-[var(--line)] bg-white p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{section.title}</p>
                  <p className="text-xs text-[var(--ink-2)]">{section.slug} · {section.section_type} · order {section.sort_order}</p>
                </div>
                <form action={deleteHomepageSectionAction}>
                  <input type="hidden" name="slug" value={section.slug} />
                  <button className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">{copy.delete}</button>
                </form>
              </div>
              <p className="mt-2 text-sm text-[var(--ink-2)]">{section.body}</p>
              {section.cta_label && section.cta_path ? <p className="mt-2 text-xs font-semibold text-[var(--ink-1)]">{section.cta_label} → {section.cta_path}</p> : null}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-[var(--line)] bg-white p-5">
        <h2 className="font-display text-2xl font-semibold">{copy.navigationBuilder}</h2>
        <p className="mt-1 text-sm text-[var(--ink-2)]">{copy.navigationDescription}</p>

        <form action={saveNavigationItemAction} className="mt-4 grid gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4 md:grid-cols-2">
          <label className="text-sm font-semibold">
            {copy.label}
            <input name="label" placeholder="Listings" className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
          </label>
          <label className="text-sm font-semibold">
            {copy.path}
            <input name="path" placeholder="/listings" className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
          </label>
          <label className="text-sm font-semibold">
            {copy.parentId}
            <input type="number" name="parent_id" defaultValue="0" className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
          </label>
          <label className="text-sm font-semibold">
            {copy.sortOrder}
            <input type="number" name="sort_order" defaultValue="0" className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
          </label>
          <label className="inline-flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" name="is_enabled" defaultChecked className="h-4 w-4" /> {copy.enabled}
          </label>
          <div className="md:col-span-2">
            <button type="submit" className="rounded-xl bg-[var(--ink-1)] px-4 py-2 text-sm font-semibold text-white">{copy.saveLink}</button>
          </div>
        </form>

        <div className="mt-5 space-y-3">
          {navigationItems.map((item) => (
            <div key={item.id} className="rounded-xl border border-[var(--line)] bg-white p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className="text-xs text-[var(--ink-2)]">{item.path} · order {item.sort_order}</p>
                </div>
                <form action={deleteNavigationItemAction}>
                  <input type="hidden" name="id" value={item.id} />
                  <button className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">{copy.delete}</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-[var(--line)] bg-white p-5">
        <h2 className="font-display text-2xl font-semibold">{copy.versionHistory}</h2>
        <p className="mt-1 text-sm text-[var(--ink-2)]">{copy.versionDescription}</p>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--line)] text-[var(--ink-2)]">
              <tr>
                <th className="py-2 pr-4">{copy.version}</th>
                <th className="py-2 pr-4">{copy.summary}</th>
                <th className="py-2 pr-4">{copy.siteName}</th>
                <th className="py-2 pr-4">{copy.locale}</th>
                <th className="py-2 pr-4">{copy.savedAt}</th>
                <th className="py-2 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {versions.length === 0 ? (
                <tr>
                  <td className="py-4 text-[var(--ink-2)]" colSpan={6}>{copy.noVersions}</td>
                </tr>
              ) : (
                versions.map((version) => (
                  <tr key={version.id} className="border-b border-[var(--line)] last:border-0">
                    <td className="py-3 pr-4 font-semibold">#{version.version_number}</td>
                    <td className="py-3 pr-4">{version.change_summary || copy.updatedSettings}</td>
                    <td className="py-3 pr-4">{version.site_name}</td>
                    <td className="py-3 pr-4">{version.default_locale}</td>
                    <td className="py-3 pr-4">{formatDate(version.created_at, locale, { dateStyle: "medium", timeStyle: "short" })}</td>
                    <td className="py-3 pr-4 text-right">
                      <form action={restoreSiteSettingsVersionAction}>
                        <input type="hidden" name="version_id" value={String(version.id)} />
                        <button type="submit" className="rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold">
                          {copy.restore}
                        </button>
                      </form>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
