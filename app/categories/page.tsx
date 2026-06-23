import Link from "next/link";
import { CategoryHomeList } from "@/components/categories/CategoryHomeList";
import { getHomeCategoryNodes } from "@/lib/categories/getCategories";

export default async function CategoriesPage() {
  const categories = await getHomeCategoryNodes();

  return (
    <main className="min-h-screen bg-[#efefef] pb-8">
      <style>{`header.sticky{display:none;} main+footer{display:none;}`}</style>
      <header className="bg-[#1f5f8f] px-4 pb-3 pt-4 text-white">
        <div className="flex items-center gap-3">
          <span className="text-xl leading-none">☰</span>
          <h1 className="text-[29px] font-semibold leading-none">Category Selection</h1>
        </div>
      </header>

      <div className="border-b border-slate-300 bg-[#efefef] px-4 py-3">
        <form action="/search" className="relative">
          <input
            name="q"
            placeholder="Keyword or listing no."
            className="w-full border border-slate-300 bg-white px-3 py-2 text-[15px] text-slate-800"
          />
        </form>
      </div>

      <div className="mx-auto w-full max-w-3xl px-0">
        <CategoryHomeList categories={categories} />

        <div className="mt-3 px-4">
          <Link href="/" className="text-sm font-semibold text-[#236dab]">
            Back Home
          </Link>
        </div>
      </div>
    </main>
  );
}
