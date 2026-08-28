import { getPostingRootCategories } from "@/lib/data/queries";
import { getDictionary } from "@/lib/i18n/server";
import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import QuickPostForm from "@/components/posting/QuickPostForm";
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
  const initialRootSlug = getParam(params.category);

  const [categories, { t, locale }] = await Promise.all([
    getPostingRootCategories(),
    getDictionary(),
  ]);
  const user = await getCurrentUser();
  const sellerProfile = user
    ? await (async () => {
        const supabase = await createSupabaseServerClient();
        const { data } = await supabase
          .from("profiles")
          .select("full_name, phone")
          .eq("id", user.id)
          .maybeSingle();

        return data ? { full_name: String(data.full_name ?? ""), phone: String(data.phone ?? "") } : null;
      })()
    : null;

  const initialListingType = "for_sale";
  const initialMode = posting === "standard" ? "standard" : "quick";

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold">{t.postAd.postAd}</h1>
      {initialMode === "quick" ? (
        <QuickPostForm
          categories={categories}
          t={t}
          locale={locale}
          initialRootSlug={initialRootSlug}
          sellerProfile={sellerProfile}
          draftOwnerId={user?.id ?? null}
        />
      ) : (
        <PostAdForm
          categories={categories}
          t={t}
          locale={locale}
          initialListingType={initialListingType}
          initialMode={initialMode}
          initialRootSlug={initialRootSlug}
          sellerProfile={sellerProfile}
          draftOwnerId={user?.id ?? null}
        />
      )}
    </main>
  );
}
