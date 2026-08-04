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

export default async function AdministratorSettingsPage() {
  await requirePermission("settings.update");
  const settings = await getSiteSettings();
  const versions = await getSiteSettingsVersions();
  const homepageSections = await getHomepageSections();
  const navigationItems = await getNavigationItems();
  const navigationLinksText = (settings.navigation_links ?? [])
    .map((link) => `${link.label}|${link.path}`)
    .join("\n");

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold">Site settings</h1>
      <p className="mt-1 text-[var(--ink-2)]">Edit the core public-facing details for the marketplace.</p>

      <form action={saveSiteSettingsAction} className="mt-6 space-y-4 rounded-2xl border border-[var(--line)] bg-white p-5">
        <label className="block text-sm font-semibold">
          Site name
          <input name="site_name" defaultValue={settings.site_name ?? ""} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
        </label>

        <label className="block text-sm font-semibold">
          Tagline
          <input name="site_tagline" defaultValue={settings.site_tagline ?? ""} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
        </label>

        <label className="block text-sm font-semibold">
          Contact email
          <input type="email" name="contact_email" defaultValue={settings.contact_email ?? ""} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
        </label>

        <label className="block text-sm font-semibold">
          Contact phone
          <input name="contact_phone" defaultValue={settings.contact_phone ?? ""} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
        </label>

        <label className="block text-sm font-semibold">
          Default locale
          <select name="default_locale" defaultValue={settings.default_locale ?? "fa"} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2">
            <option value="fa">fa</option>
            <option value="en">en</option>
            <option value="ps">ps</option>
          </select>
        </label>

        <label className="block text-sm font-semibold">
          Homepage hero title
          <input name="home_hero_title" defaultValue={settings.home_hero_title ?? ""} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
        </label>

        <label className="block text-sm font-semibold">
          Homepage hero subtitle
          <textarea name="home_hero_subtitle" defaultValue={settings.home_hero_subtitle ?? ""} className="mt-1 min-h-24 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold">
            Primary CTA label
            <input name="home_primary_cta_label" defaultValue={settings.home_primary_cta_label ?? ""} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
          </label>

          <label className="block text-sm font-semibold">
            Primary CTA path
            <input name="home_primary_cta_path" defaultValue={settings.home_primary_cta_path ?? ""} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
          </label>

          <label className="block text-sm font-semibold">
            Secondary CTA label
            <input name="home_secondary_cta_label" defaultValue={settings.home_secondary_cta_label ?? ""} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
          </label>

          <label className="block text-sm font-semibold">
            Secondary CTA path
            <input name="home_secondary_cta_path" defaultValue={settings.home_secondary_cta_path ?? ""} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
          </label>
        </div>

        <label className="block text-sm font-semibold">
          Navigation links
          <textarea
            name="navigation_links"
            defaultValue={navigationLinksText}
            placeholder="Listings|/listings\nCategories|/categories"
            className="mt-1 min-h-28 w-full rounded-xl border border-[var(--line)] px-3 py-2 font-mono text-sm"
          />
        </label>

        <label className="block text-sm font-semibold">
          Step-up window (minutes)
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
          Change summary
          <textarea
            name="change_summary"
            placeholder="Describe what changed for the version history"
            className="mt-1 min-h-24 w-full rounded-xl border border-[var(--line)] px-3 py-2"
          />
        </label>

        <button type="submit" className="rounded-xl bg-[var(--ink-1)] px-4 py-2 text-sm font-semibold text-white">
          Save settings
        </button>
      </form>

      <section className="mt-8 rounded-2xl border border-[var(--line)] bg-white p-5">
        <h2 className="font-display text-2xl font-semibold">Homepage sections</h2>
        <p className="mt-1 text-sm text-[var(--ink-2)]">Create reusable homepage blocks and publish them instantly.</p>

        <form action={saveHomepageSectionAction} className="mt-4 grid gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4 md:grid-cols-2">
          <label className="text-sm font-semibold">
            Slug
            <input name="slug" placeholder="hero-intro" className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
          </label>
          <label className="text-sm font-semibold">
            Type
            <select name="section_type" defaultValue="hero" className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2">
              <option value="hero">hero</option>
              <option value="promo">promo</option>
              <option value="feature">feature</option>
            </select>
          </label>
          <label className="text-sm font-semibold md:col-span-2">
            Title
            <input name="title" placeholder="Trusted marketplace" className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
          </label>
          <label className="text-sm font-semibold md:col-span-2">
            Body
            <textarea name="body" placeholder="Describe the section" className="mt-1 min-h-24 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
          </label>
          <label className="text-sm font-semibold">
            CTA label
            <input name="cta_label" className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
          </label>
          <label className="text-sm font-semibold">
            CTA path
            <input name="cta_path" placeholder="/listings" className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
          </label>
          <label className="text-sm font-semibold">
            Sort order
            <input type="number" name="sort_order" defaultValue="0" className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
          </label>
          <label className="inline-flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" name="is_enabled" defaultChecked className="h-4 w-4" />
            Enabled
          </label>
          <div className="md:col-span-2">
            <button type="submit" className="rounded-xl bg-[var(--ink-1)] px-4 py-2 text-sm font-semibold text-white">Save section</button>
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
                  <button className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">Delete</button>
                </form>
              </div>
              <p className="mt-2 text-sm text-[var(--ink-2)]">{section.body}</p>
              {section.cta_label && section.cta_path ? <p className="mt-2 text-xs font-semibold text-[var(--ink-1)]">{section.cta_label} → {section.cta_path}</p> : null}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-[var(--line)] bg-white p-5">
        <h2 className="font-display text-2xl font-semibold">Navigation builder</h2>
        <p className="mt-1 text-sm text-[var(--ink-2)]">Manage the public navigation links shown in the header and footer.</p>

        <form action={saveNavigationItemAction} className="mt-4 grid gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4 md:grid-cols-2">
          <label className="text-sm font-semibold">
            Label
            <input name="label" placeholder="Listings" className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
          </label>
          <label className="text-sm font-semibold">
            Path
            <input name="path" placeholder="/listings" className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
          </label>
          <label className="text-sm font-semibold">
            Parent id
            <input type="number" name="parent_id" defaultValue="0" className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
          </label>
          <label className="text-sm font-semibold">
            Sort order
            <input type="number" name="sort_order" defaultValue="0" className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
          </label>
          <label className="inline-flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" name="is_enabled" defaultChecked className="h-4 w-4" /> Enabled
          </label>
          <div className="md:col-span-2">
            <button type="submit" className="rounded-xl bg-[var(--ink-1)] px-4 py-2 text-sm font-semibold text-white">Save link</button>
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
                  <button className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">Delete</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-[var(--line)] bg-white p-5">
        <h2 className="font-display text-2xl font-semibold">Version history</h2>
        <p className="mt-1 text-sm text-[var(--ink-2)]">Restore any previous settings snapshot. A restore creates a new version.</p>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--line)] text-[var(--ink-2)]">
              <tr>
                <th className="py-2 pr-4">Version</th>
                <th className="py-2 pr-4">Summary</th>
                <th className="py-2 pr-4">Site name</th>
                <th className="py-2 pr-4">Locale</th>
                <th className="py-2 pr-4">Saved at</th>
                <th className="py-2 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {versions.length === 0 ? (
                <tr>
                  <td className="py-4 text-[var(--ink-2)]" colSpan={6}>No version history yet.</td>
                </tr>
              ) : (
                versions.map((version) => (
                  <tr key={version.id} className="border-b border-[var(--line)] last:border-0">
                    <td className="py-3 pr-4 font-semibold">#{version.version_number}</td>
                    <td className="py-3 pr-4">{version.change_summary || "Updated settings"}</td>
                    <td className="py-3 pr-4">{version.site_name}</td>
                    <td className="py-3 pr-4">{version.default_locale}</td>
                    <td className="py-3 pr-4">{new Date(version.created_at).toLocaleString()}</td>
                    <td className="py-3 pr-4 text-right">
                      <form action={restoreSiteSettingsVersionAction}>
                        <input type="hidden" name="version_id" value={String(version.id)} />
                        <button type="submit" className="rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold">
                          Restore
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
