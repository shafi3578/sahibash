import { getPostingRootCategories } from "@/lib/data/queries";
import { getDictionary } from "@/lib/i18n/server";
import PostAdForm from "../post-ad-form";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function getParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return String(value[0] ?? "");
  return String(value ?? "");
}

export default async function PostAdCreatePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const posting = getParam(params.posting);

  const [categories, { t, locale }] = await Promise.all([
    getPostingRootCategories(),
    getDictionary(),
  ]);

  const initialListingType = "for_sale";
  const initialMode = posting === "quick" ? "quick" : "standard";

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold">{t.postAd.postAd}</h1>
      <PostAdForm
        categories={categories}
        t={t}
        locale={locale}
        initialListingType={initialListingType}
        initialMode={initialMode}
      />
    </main>
  );
}
