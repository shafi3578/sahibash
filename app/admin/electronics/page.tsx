import { requireAdmin } from "@/lib/auth";
import {
  adminCreateElectronicsBrandAction,
  adminCreateElectronicsModelAction,
  adminUpsertElectronicsOptionAction,
  adminUpsertElectronicsSpecAction,
} from "@/lib/actions/electronics";
import { getElectronicsAdminSnapshot } from "@/lib/data/electronics";

export default async function AdminElectronicsPage() {
  await requireAdmin();
  const snapshot = await getElectronicsAdminSnapshot();

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold">Electronics Catalog Admin</h1>
      <p className="mt-1 text-[var(--ink-2)]">Manage brands, models, specs, and options without developer changes.</p>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-[var(--line)] bg-white p-4">
          <h2 className="font-display text-xl font-bold">Add Brand</h2>
          <form action={adminCreateElectronicsBrandAction} className="mt-3 grid gap-3">
            <select name="category_id" required className="rounded-xl border border-[var(--line)] px-3 py-2">
              <option value="">Select Category</option>
              {snapshot.categories.filter((category) => category.parent_id !== null).map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
            <input name="name" placeholder="Brand Name" required className="rounded-xl border border-[var(--line)] px-3 py-2" />
            <input name="sort_order" type="number" placeholder="Sort Order" className="rounded-xl border border-[var(--line)] px-3 py-2" />
            <label className="inline-flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" name="is_popular" className="h-4 w-4" /> Popular
            </label>
            <button className="rounded-xl bg-[var(--ink-1)] px-4 py-2 text-sm font-semibold text-white">Save Brand</button>
          </form>
        </section>

        <section className="rounded-2xl border border-[var(--line)] bg-white p-4">
          <h2 className="font-display text-xl font-bold">Add Model</h2>
          <form action={adminCreateElectronicsModelAction} className="mt-3 grid gap-3">
            <select name="category_id" required className="rounded-xl border border-[var(--line)] px-3 py-2">
              <option value="">Select Category</option>
              {snapshot.categories.filter((category) => category.parent_id !== null).map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
            <select name="brand_id" required className="rounded-xl border border-[var(--line)] px-3 py-2">
              <option value="">Select Brand</option>
              {snapshot.brands.map((brand) => (
                <option key={brand.id} value={brand.id}>{brand.name}</option>
              ))}
            </select>
            <input name="name" placeholder="Model Name" required className="rounded-xl border border-[var(--line)] px-3 py-2" />
            <input name="release_year" type="number" placeholder="Release Year" className="rounded-xl border border-[var(--line)] px-3 py-2" />
            <label className="inline-flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" name="is_popular" className="h-4 w-4" /> Popular
            </label>
            <button className="rounded-xl bg-[var(--ink-1)] px-4 py-2 text-sm font-semibold text-white">Save Model</button>
          </form>
        </section>

        <section className="rounded-2xl border border-[var(--line)] bg-white p-4">
          <h2 className="font-display text-xl font-bold">Upsert Spec</h2>
          <form action={adminUpsertElectronicsSpecAction} className="mt-3 grid gap-3">
            <select name="model_id" required className="rounded-xl border border-[var(--line)] px-3 py-2">
              <option value="">Select Model</option>
              {snapshot.models.map((model) => (
                <option key={model.id} value={model.id}>{model.name}</option>
              ))}
            </select>
            <input name="spec_key" placeholder="Spec Key (e.g. screen_size)" required className="rounded-xl border border-[var(--line)] px-3 py-2" />
            <input name="spec_label" placeholder="Spec Label" required className="rounded-xl border border-[var(--line)] px-3 py-2" />
            <input name="spec_value" placeholder="Spec Value" required className="rounded-xl border border-[var(--line)] px-3 py-2" />
            <input name="spec_group" placeholder="Spec Group (optional)" className="rounded-xl border border-[var(--line)] px-3 py-2" />
            <label className="inline-flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" name="is_filterable" className="h-4 w-4" /> Filterable
            </label>
            <button className="rounded-xl bg-[var(--ink-1)] px-4 py-2 text-sm font-semibold text-white">Save Spec</button>
          </form>
        </section>

        <section className="rounded-2xl border border-[var(--line)] bg-white p-4">
          <h2 className="font-display text-xl font-bold">Upsert Option</h2>
          <form action={adminUpsertElectronicsOptionAction} className="mt-3 grid gap-3">
            <select name="model_id" required className="rounded-xl border border-[var(--line)] px-3 py-2">
              <option value="">Select Model</option>
              {snapshot.models.map((model) => (
                <option key={model.id} value={model.id}>{model.name}</option>
              ))}
            </select>
            <input name="option_type" placeholder="Option Type (storage, color, ram)" required className="rounded-xl border border-[var(--line)] px-3 py-2" />
            <input name="option_value" placeholder="Option Value (128GB)" required className="rounded-xl border border-[var(--line)] px-3 py-2" />
            <input name="sort_order" type="number" placeholder="Sort Order" className="rounded-xl border border-[var(--line)] px-3 py-2" />
            <button className="rounded-xl bg-[var(--ink-1)] px-4 py-2 text-sm font-semibold text-white">Save Option</button>
          </form>
        </section>
      </div>
    </main>
  );
}
