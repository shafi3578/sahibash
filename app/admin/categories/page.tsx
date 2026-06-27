import { requireAdmin } from "@/lib/auth";
import {
  adminCreateCategoryAction,
  adminDeleteCategoryAction,
  adminUpdateCategoryAction,
  adminUpsertCategoryAliasAction,
} from "@/lib/actions/category-admin";
import { getCategoryAdminSnapshot } from "@/lib/data/category-admin";

export default async function AdminCategoriesPage() {
  await requireAdmin();
  const snapshot = await getCategoryAdminSnapshot();

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold">Category Admin</h1>
      <p className="mt-1 text-[var(--ink-2)]">Manage categories, aliases, and field metadata for smart posting and search.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[var(--line)] bg-white p-4">
          <h2 className="font-display text-xl font-bold">Add Category</h2>
          <form action={adminCreateCategoryAction} className="mt-3 grid gap-3">
            <input name="name" placeholder="Category name" required className="rounded-xl border border-[var(--line)] px-3 py-2" />
            <input name="slug" placeholder="category-slug" required className="rounded-xl border border-[var(--line)] px-3 py-2" />
            <textarea name="description" placeholder="Description" className="min-h-20 rounded-xl border border-[var(--line)] px-3 py-2" />
            <input name="display_order" type="number" placeholder="Display order" className="rounded-xl border border-[var(--line)] px-3 py-2" />
            <label className="inline-flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" name="is_active" defaultChecked className="h-4 w-4" /> Active
            </label>
            <button className="rounded-xl bg-[var(--ink-1)] px-4 py-2 text-sm font-semibold text-white">Save Category</button>
          </form>
        </section>

        <section className="rounded-2xl border border-[var(--line)] bg-white p-4">
          <h2 className="font-display text-xl font-bold">Add Category Alias</h2>
          <form action={adminUpsertCategoryAliasAction} className="mt-3 grid gap-3">
            <select name="category_id" required className="rounded-xl border border-[var(--line)] px-3 py-2">
              <option value="">Select category</option>
              {snapshot.categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
            <input name="alias" placeholder="Alias term" required className="rounded-xl border border-[var(--line)] px-3 py-2" />
            <select name="language" defaultValue="en" className="rounded-xl border border-[var(--line)] px-3 py-2">
              <option value="en">en</option>
              <option value="fa">fa</option>
              <option value="ps">ps</option>
              <option value="multi">multi</option>
            </select>
            <button className="rounded-xl bg-[var(--ink-1)] px-4 py-2 text-sm font-semibold text-white">Save Alias</button>
          </form>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-[var(--line)] bg-white p-4">
        <h2 className="font-display text-xl font-bold">Categories</h2>
        <div className="mt-3 space-y-3">
          {snapshot.categories.map((category) => (
            <form key={category.id} action={adminUpdateCategoryAction} className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
              <input type="hidden" name="id" value={category.id} />
              <div className="grid gap-2 md:grid-cols-5">
                <input name="name" defaultValue={category.name} className="rounded-lg border border-[var(--line)] px-2 py-1 text-sm" />
                <input name="slug" defaultValue={category.slug} className="rounded-lg border border-[var(--line)] px-2 py-1 text-sm" />
                <input name="display_order" type="number" defaultValue={category.display_order} className="rounded-lg border border-[var(--line)] px-2 py-1 text-sm" />
                <label className="inline-flex items-center gap-2 rounded-lg border border-[var(--line)] bg-white px-2 py-1 text-sm font-semibold">
                  <input type="checkbox" name="is_active" defaultChecked={category.is_active} className="h-4 w-4" /> Active
                </label>
                <button className="rounded-lg bg-[var(--ink-1)] px-3 py-1 text-xs font-semibold text-white">Update</button>
              </div>
              <textarea name="description" defaultValue={category.description ?? ""} className="mt-2 min-h-16 w-full rounded-lg border border-[var(--line)] px-2 py-1 text-sm" />
              <button formAction={adminDeleteCategoryAction} className="mt-2 rounded-lg border border-red-300 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">Delete</button>
            </form>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--line)] bg-white p-4">
          <h2 className="font-display text-xl font-bold">Recent Aliases</h2>
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
          <h2 className="font-display text-xl font-bold">Top Zero-Result Queries</h2>
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
