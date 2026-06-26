import { notFound } from "next/navigation";
import { CategoryBrowser } from "@/components/categories/CategoryBrowser";
import { ComingSoonWaitlistForm } from "@/components/categories/ComingSoonWaitlistForm";
import {
  getCategoryBreadcrumb,
  getCategoryChildrenWithCounts,
  getCategoryNodeBySlugOrId,
  getRootCategoryLaunchState,
  getRelatedCategories,
} from "@/lib/categories/getCategories";
import { getCategoryListingCount } from "@/lib/categories/getCategoryCounts";
import { getCurrentUser } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n/server";

export default async function CategoryBrowsePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ node?: string }>;
}) {
  const { slug } = await params;
  const { node } = await searchParams;
  const { t } = await getDictionary();
  const nodeId = node ? Number(node) : null;

  if (!Number.isFinite(nodeId)) {
    const launchState = await getRootCategoryLaunchState(slug);

    if (!launchState) {
      notFound();
    }

    if (launchState.isComingSoon) {
    const user = await getCurrentUser();

      return (
        <main className="min-h-screen bg-[#efefef] pb-8">
          <div className="mx-auto w-full max-w-3xl px-4 pt-6">
            <section className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">{t.home.comingSoon}</p>
              <h1 className="mt-2 font-display text-3xl font-bold text-[var(--ink-1)]">{launchState.categoryName}</h1>
              <p className="mt-2 text-sm text-[var(--ink-2)]">
                {t.home.comingSoon}
              </p>
              <p className="mt-1 text-sm text-[var(--ink-2)]">
                {t.postAd.notifyMe}
              </p>
              {launchState.launchDate ? (
                <p className="mt-2 text-xs font-semibold text-amber-700">Planned launch: {launchState.launchDate}</p>
              ) : null}

              <div className="mt-5 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
                <ComingSoonWaitlistForm
                  categorySlug={launchState.categorySlug}
                  defaultEmail={user?.email ?? ""}
                />
              </div>
            </section>
          </div>
        </main>
      );
    }
  }

  const categoryNode = await getCategoryNodeBySlugOrId({
    slug,
    nodeId: Number.isFinite(nodeId) ? nodeId : null,
  });

  if (!categoryNode) {
    notFound();
  }

  const [breadcrumb, children, allCount, related] = await Promise.all([
    getCategoryBreadcrumb(categoryNode),
    getCategoryChildrenWithCounts(categoryNode.id),
    getCategoryListingCount(categoryNode.id),
    getRelatedCategories(categoryNode),
  ]);

  return (
    <main className="min-h-screen bg-[#efefef] pb-8">
      <div className="mx-auto w-full max-w-3xl px-0 pt-0">
        <CategoryBrowser
          node={categoryNode}
          breadcrumb={breadcrumb}
          childCategories={children}
          allCount={allCount}
          related={related}
        />
      </div>
    </main>
  );
}
