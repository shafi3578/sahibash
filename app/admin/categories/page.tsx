import { requirePermission } from "@/lib/auth";
import {
  adminCreateCategoryAction,
  adminDeleteCategoryAction,
  adminUpdateCategoryAction,
  adminUpsertCategoryAliasAction,
} from "@/lib/actions/category-admin";
import {
  deleteCategorySchemaProfileAction,
  getCategorySchemaProfiles,
  saveCategorySchemaProfileAction,
} from "@/lib/actions/category-schema";
import { getCategoryAdminSnapshot } from "@/lib/data/category-admin";
import { getCurrentLocale } from "@/lib/i18n/server";
import { getUiTranslations } from "@/lib/i18n/ui";

export default async function AdminCategoriesPage() {
  await requirePermission("categories.view");
  const locale = await getCurrentLocale();
  const ui = getUiTranslations(locale);
  const snapshot = await getCategoryAdminSnapshot();
  const schemaProfiles = await getCategorySchemaProfiles();

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold">{ui.admin.categoryAdmin}</h1>
      <p className="mt-1 text-[var(--ink-2)]">{ui.admin.manageCategoriesAndAliases}</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[var(--line)] bg-white p-4">
          <h2 className="font-display text-xl font-bold">{ui.admin.addCategory}</h2>
          <form action={adminCreateCategoryAction} className="mt-3 grid gap-3">
            <input name="name" placeholder={ui.admin.categoryName} required className="rounded-xl border border-[var(--line)] px-3 py-2" />
            <input name="slug" placeholder={ui.admin.categorySlug} required className="rounded-xl border border-[var(--line)] px-3 py-2" />
            <textarea name="description" placeholder={ui.admin.description} className="min-h-20 rounded-xl border border-[var(--line)] px-3 py-2" />
            <input name="display_order" type="number" placeholder={ui.admin.displayOrder} className="rounded-xl border border-[var(--line)] px-3 py-2" />
            <label className="inline-flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" name="is_active" defaultChecked className="h-4 w-4" /> {ui.admin.active}
            </label>
            <button className="rounded-xl bg-[var(--ink-1)] px-4 py-2 text-sm font-semibold text-white">{ui.admin.saveCategory}</button>
          </form>
        </section>

        <section className="rounded-2xl border border-[var(--line)] bg-white p-4">
          <h2 className="font-display text-xl font-bold">{ui.admin.addCategoryAlias}</h2>
          <form action={adminUpsertCategoryAliasAction} className="mt-3 grid gap-3">
            <select name="category_id" required className="rounded-xl border border-[var(--line)] px-3 py-2">
              <option value="">{ui.admin.selectCategory}</option>
              {snapshot.categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
            <input name="alias" placeholder={ui.admin.aliasTerm} required className="rounded-xl border border-[var(--line)] px-3 py-2" />
            <select name="language" defaultValue="en" className="rounded-xl border border-[var(--line)] px-3 py-2">
              <option value="en">en</option>
              <option value="fa">fa</option>
              <option value="ps">ps</option>
              <option value="multi">{ui.admin.multiLanguage}</option>
            </select>
            <button className="rounded-xl bg-[var(--ink-1)] px-4 py-2 text-sm font-semibold text-white">{ui.admin.saveAlias}</button>
          </form>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-[var(--line)] bg-white p-4">
        <h2 className="font-display text-xl font-bold">{ui.admin.categories}</h2>
        <div className="mt-3 space-y-3">
          {snapshot.categories.map((category) => (
            <form key={category.id} action={adminUpdateCategoryAction} className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
              <input type="hidden" name="id" value={category.id} />
              <div className="grid gap-2 md:grid-cols-5">
                <input name="name" defaultValue={category.name} className="rounded-lg border border-[var(--line)] px-2 py-1 text-sm" />
                <input name="slug" defaultValue={category.slug} className="rounded-lg border border-[var(--line)] px-2 py-1 text-sm" />
                <input name="display_order" type="number" defaultValue={category.display_order} className="rounded-lg border border-[var(--line)] px-2 py-1 text-sm" />
                <label className="inline-flex items-center gap-2 rounded-lg border border-[var(--line)] bg-white px-2 py-1 text-sm font-semibold">
                  <input type="checkbox" name="is_active" defaultChecked={category.is_active} className="h-4 w-4" /> {ui.admin.active}
                </label>
                <button className="rounded-lg bg-[var(--ink-1)] px-3 py-1 text-xs font-semibold text-white">{ui.admin.update}</button>
              </div>
              <textarea name="description" defaultValue={category.description ?? ""} className="mt-2 min-h-16 w-full rounded-lg border border-[var(--line)] px-2 py-1 text-sm" />
              <button formAction={adminDeleteCategoryAction} className="mt-2 rounded-lg border border-red-300 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">{ui.admin.delete}</button>
            </form>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-[var(--line)] bg-white p-4">
        <h2 className="font-display text-xl font-bold">Schema profiles</h2>
        <p className="mt-1 text-sm text-[var(--ink-2)]">Define per-category schema profiles that can be reused by the posting flow.</p>

        <form action={saveCategorySchemaProfileAction} className="mt-4 grid gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4 md:grid-cols-2">
          <label className="text-sm font-semibold">
            Category slug
            <input name="category_slug" placeholder="vehicles" className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
          </label>
          <label className="text-sm font-semibold">
            Schema key
            <input name="schema_key" placeholder="vehicle-profile" className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
          </label>
          <label className="text-sm font-semibold md:col-span-2">
            Title
            <input name="title" placeholder="Vehicle profile" className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
          </label>
          <label className="text-sm font-semibold md:col-span-2">
            Description
            <textarea name="description" placeholder="Describe the profile" className="mt-1 min-h-24 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
          </label>
          <label className="text-sm font-semibold">
            Sort order
            <input type="number" name="sort_order" defaultValue="0" className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
          </label>
          <label className="inline-flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" name="is_enabled" defaultChecked className="h-4 w-4" /> Enabled
          </label>
          <div className="md:col-span-2">
            <button type="submit" className="rounded-xl bg-[var(--ink-1)] px-4 py-2 text-sm font-semibold text-white">Save profile</button>
          </div>
        </form>

        <div className="mt-5 space-y-3">
          {schemaProfiles.map((profile) => (
            <div key={`${profile.category_slug}-${profile.schema_key}`} className="rounded-xl border border-[var(--line)] bg-white p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{profile.title}</p>
                  <p className="text-xs text-[var(--ink-2)]">{profile.category_slug} · {profile.schema_key}</p>
                </div>
                <div className="flex gap-2">
                  <form action={saveCategorySchemaProfileAction} className="contents">
                    <button type="submit" className="rounded-lg bg-[var(--ink-1)] px-3 py-1.5 text-xs font-semibold text-white">Save</button>
                  </form>
                  <form action={deleteCategorySchemaProfileAction} className="contents">
                    <input type="hidden" name="category_slug" value={profile.category_slug} />
                    <input type="hidden" name="schema_key" value={profile.schema_key} />
                    <button className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">Delete</button>
                  </form>
                </div>
              </div>
              <form action={saveCategorySchemaProfileAction} className="mt-3 grid gap-3 md:grid-cols-2">
                <label className="text-sm font-semibold">
                  Category slug
                  <input name="category_slug" defaultValue={profile.category_slug} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
                </label>
                <label className="text-sm font-semibold">
                  Schema key
                  <input name="schema_key" defaultValue={profile.schema_key} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
                </label>
                <label className="text-sm font-semibold md:col-span-2">
                  Title
                  <input name="title" defaultValue={profile.title} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
                </label>
                <label className="text-sm font-semibold md:col-span-2">
                  Description
                  <textarea name="description" defaultValue={profile.description} className="mt-1 min-h-24 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
                </label>
                <label className="text-sm font-semibold">
                  Sort order
                  <input type="number" name="sort_order" defaultValue={profile.sort_order} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
                </label>
                <label className="inline-flex items-center gap-2 text-sm font-semibold">
                  <input type="checkbox" name="is_enabled" defaultChecked={profile.is_enabled} className="h-4 w-4" /> Enabled
                </label>
              </form>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--line)] bg-white p-4">
          <h2 className="font-display text-xl font-bold">{ui.admin.recentAliases}</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {snapshot.aliases.slice(0, 50).map((alias) => (
              <li key={alias.id} className="flex items-center justify-between rounded-lg border border-[var(--line)] p-2">
                <span>{alias.alias}</span>
                <span className="text-xs text-[var(--ink-2)]">cat:{alias.category_id} {alias.language}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-[var(--line)] bg-white p-4">
          <h2 className="font-display text-xl font-bold">{ui.admin.topZeroResultQueries}</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {snapshot.topZeroResults.map((item) => (
              <li key={item.query} className="flex items-center justify-between rounded-lg border border-[var(--line)] p-2">
                <span>{item.query}</span>
                <span className="text-xs text-[var(--ink-2)]">{item.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
