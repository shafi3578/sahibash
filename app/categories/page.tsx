import Link from "next/link";
import { CategoryHomeList } from "@/components/categories/CategoryHomeList";
import { getHomeCategoryNodes } from "@/lib/categories/getCategories";
import { getCurrentLocale } from "@/lib/i18n/server";
import { getUiTranslations } from "@/lib/i18n/ui";
import { localizePath } from "@/lib/i18n/routing";

export default async function CategoriesPage() {
  const categories = await getHomeCategoryNodes();
  const locale = await getCurrentLocale();
  const ui = getUiTranslations(locale);

  return (
    <main className="min-h-screen bg-[var(--surface-1)] pb-24">
      <header className="bg-[radial-gradient(circle_at_15%_10%,rgba(199,164,92,0.28),transparent_32%),linear-gradient(135deg,#071f2b,#0b6b65)] px-4 py-6 text-white">
        <div className="mx-auto max-w-3xl"><h1 className="font-display text-3xl font-black">{ui.categoriesPage.title}</h1></div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-3">
        <form action={localizePath("/search", locale)} className="relative">
          <input
            name="q"
            placeholder={ui.categoriesPage.searchPlaceholder}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-[15px] text-slate-800"
          />
        </form>
      </div>

      <div className="mx-auto w-full max-w-3xl px-4">
        <CategoryHomeList categories={categories} locale={locale} showComingSoon />

        <div className="mt-3 px-4">
          <Link href={localizePath("/", locale)} className="text-sm font-semibold text-[var(--accent)]">
            {ui.categoriesPage.backHome}
          </Link>
        </div>
      </div>
    </main>
  );
}
