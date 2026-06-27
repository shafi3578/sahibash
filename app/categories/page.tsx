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
    <main className="min-h-screen bg-[#efefef] pb-8">
      <style>{`header.sticky{display:none;} main+footer{display:none;}`}</style>
      <header className="bg-[#1f5f8f] px-4 pb-3 pt-4 text-white">
        <div className="flex items-center gap-3">
          <span className="text-xl leading-none">☰</span>
          <h1 className="text-[29px] font-semibold leading-none">{ui.categoriesPage.title}</h1>
        </div>
      </header>

      <div className="border-b border-slate-300 bg-[#efefef] px-4 py-3">
        <form action={localizePath("/search", locale)} className="relative">
          <input
            name="q"
            placeholder={ui.categoriesPage.searchPlaceholder}
            className="w-full border border-slate-300 bg-white px-3 py-2 text-[15px] text-slate-800"
          />
        </form>
      </div>

      <div className="mx-auto w-full max-w-3xl px-0">
        <CategoryHomeList categories={categories} locale={locale} />

        <div className="mt-3 px-4">
          <Link href={localizePath("/", locale)} className="text-sm font-semibold text-[#236dab]">
            {ui.categoriesPage.backHome}
          </Link>
        </div>
      </div>
    </main>
  );
}
