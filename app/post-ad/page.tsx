import { getPostingRootCategories } from "@/lib/data/queries";
import { getDictionary } from "@/lib/i18n/server";
import PostAdForm from "./post-ad-form";

export default async function PostAdPage() {
  const [categories, { t, locale }] = await Promise.all([
    getPostingRootCategories(),
    getDictionary(),
  ]);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold">{t.postAd.postAd}</h1>
      <PostAdForm categories={categories} t={t} locale={locale} />
    </main>
  );
}
