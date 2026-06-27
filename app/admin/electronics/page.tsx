import { requireAdmin } from "@/lib/auth";
import {
  adminCreateElectronicsBrandAction,
  adminCreateElectronicsModelAction,
  adminUpsertElectronicsOptionAction,
  adminUpsertElectronicsSpecAction,
} from "@/lib/actions/electronics";
import { getElectronicsAdminSnapshot } from "@/lib/data/electronics";
import { getCurrentLocale } from "@/lib/i18n/server";
import { getUiTranslations } from "@/lib/i18n/ui";

export default async function AdminElectronicsPage() {
  await requireAdmin();
  const locale = await getCurrentLocale();
  const ui = getUiTranslations(locale);
  const snapshot = await getElectronicsAdminSnapshot();

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold">{ui.adminElectronics.title}</h1>
      <p className="mt-1 text-[var(--ink-2)]">{ui.adminElectronics.description}</p>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-[var(--line)] bg-white p-4">
          <h2 className="font-display text-xl font-bold">{ui.adminElectronics.addBrand}</h2>
          <form action={adminCreateElectronicsBrandAction} className="mt-3 grid gap-3">
            <select name="category_id" required className="rounded-xl border border-[var(--line)] px-3 py-2">
              <option value="">{ui.adminElectronics.selectCategory}</option>
              {snapshot.categories.filter((category) => category.parent_id !== null).map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
            <input name="name" placeholder={ui.adminElectronics.brandName} required className="rounded-xl border border-[var(--line)] px-3 py-2" />
            <input name="sort_order" type="number" placeholder={ui.adminElectronics.sortOrder} className="rounded-xl border border-[var(--line)] px-3 py-2" />
            <label className="inline-flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" name="is_popular" className="h-4 w-4" /> {ui.adminElectronics.popular}
            </label>
            <button className="rounded-xl bg-[var(--ink-1)] px-4 py-2 text-sm font-semibold text-white">{ui.adminElectronics.saveBrand}</button>
          </form>
        </section>

        <section className="rounded-2xl border border-[var(--line)] bg-white p-4">
          <h2 className="font-display text-xl font-bold">{ui.adminElectronics.addModel}</h2>
          <form action={adminCreateElectronicsModelAction} className="mt-3 grid gap-3">
            <select name="category_id" required className="rounded-xl border border-[var(--line)] px-3 py-2">
              <option value="">{ui.adminElectronics.selectCategory}</option>
              {snapshot.categories.filter((category) => category.parent_id !== null).map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
            <select name="brand_id" required className="rounded-xl border border-[var(--line)] px-3 py-2">
              <option value="">{ui.adminElectronics.selectBrand}</option>
              {snapshot.brands.map((brand) => (
                <option key={brand.id} value={brand.id}>{brand.name}</option>
              ))}
            </select>
            <input name="name" placeholder={ui.adminElectronics.modelName} required className="rounded-xl border border-[var(--line)] px-3 py-2" />
            <input name="release_year" type="number" placeholder={ui.adminElectronics.releaseYear} className="rounded-xl border border-[var(--line)] px-3 py-2" />
            <label className="inline-flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" name="is_popular" className="h-4 w-4" /> {ui.adminElectronics.popular}
            </label>
            <button className="rounded-xl bg-[var(--ink-1)] px-4 py-2 text-sm font-semibold text-white">{ui.adminElectronics.saveModel}</button>
          </form>
        </section>

        <section className="rounded-2xl border border-[var(--line)] bg-white p-4">
          <h2 className="font-display text-xl font-bold">{ui.adminElectronics.upsertSpec}</h2>
          <form action={adminUpsertElectronicsSpecAction} className="mt-3 grid gap-3">
            <select name="model_id" required className="rounded-xl border border-[var(--line)] px-3 py-2">
              <option value="">{ui.adminElectronics.selectModel}</option>
              {snapshot.models.map((model) => (
                <option key={model.id} value={model.id}>{model.name}</option>
              ))}
            </select>
            <input name="spec_key" placeholder={ui.adminElectronics.specKey} required className="rounded-xl border border-[var(--line)] px-3 py-2" />
            <input name="spec_label" placeholder={ui.adminElectronics.specLabel} required className="rounded-xl border border-[var(--line)] px-3 py-2" />
            <input name="spec_value" placeholder={ui.adminElectronics.specValue} required className="rounded-xl border border-[var(--line)] px-3 py-2" />
            <input name="spec_group" placeholder={ui.adminElectronics.specGroupOptional} className="rounded-xl border border-[var(--line)] px-3 py-2" />
            <label className="inline-flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" name="is_filterable" className="h-4 w-4" /> {ui.adminElectronics.filterable}
            </label>
            <button className="rounded-xl bg-[var(--ink-1)] px-4 py-2 text-sm font-semibold text-white">{ui.adminElectronics.saveSpec}</button>
          </form>
        </section>

        <section className="rounded-2xl border border-[var(--line)] bg-white p-4">
          <h2 className="font-display text-xl font-bold">{ui.adminElectronics.upsertOption}</h2>
          <form action={adminUpsertElectronicsOptionAction} className="mt-3 grid gap-3">
            <select name="model_id" required className="rounded-xl border border-[var(--line)] px-3 py-2">
              <option value="">{ui.adminElectronics.selectModel}</option>
              {snapshot.models.map((model) => (
                <option key={model.id} value={model.id}>{model.name}</option>
              ))}
            </select>
            <input name="option_type" placeholder={ui.adminElectronics.optionType} required className="rounded-xl border border-[var(--line)] px-3 py-2" />
            <input name="option_value" placeholder={ui.adminElectronics.optionValue} required className="rounded-xl border border-[var(--line)] px-3 py-2" />
            <input name="sort_order" type="number" placeholder={ui.adminElectronics.sortOrder} className="rounded-xl border border-[var(--line)] px-3 py-2" />
            <button className="rounded-xl bg-[var(--ink-1)] px-4 py-2 text-sm font-semibold text-white">{ui.adminElectronics.saveOption}</button>
          </form>
        </section>
      </div>
    </main>
  );
}
