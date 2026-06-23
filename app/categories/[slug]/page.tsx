import { notFound } from "next/navigation";
import { CategoryBrowser } from "@/components/categories/CategoryBrowser";
import {
  getCategoryBreadcrumb,
  getCategoryChildrenWithCounts,
  getCategoryNodeBySlugOrId,
  getRelatedCategories,
} from "@/lib/categories/getCategories";
import { getCategoryListingCount } from "@/lib/categories/getCategoryCounts";

export default async function CategoryBrowsePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ node?: string }>;
}) {
  const { slug } = await params;
  const { node } = await searchParams;
  const nodeId = node ? Number(node) : null;

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
      <style>{`header.sticky{display:none;} main+footer{display:none;}`}</style>
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
