import Link from "next/link";
import { CategoryRow } from "@/components/categories/CategoryRow";
import { RelatedCategories } from "@/components/categories/RelatedCategories";
import type { CategoryNode } from "@/types/database";
import type { CategoryNodeWithCount } from "@/lib/categories/getCategories";

type Props = {
  node: CategoryNode;
  breadcrumb: CategoryNode[];
  childCategories: CategoryNodeWithCount[];
  allCount: number;
  related: CategoryNodeWithCount[];
};

export function CategoryBrowser({ node, breadcrumb, childCategories, allCount, related }: Props) {
  const allHref = `/search?categoryNodeId=${node.id}&scope=subtree`;

  return (
    <div className="space-y-0 border border-slate-200 bg-white">
      <header className="bg-[#1f5f8f] px-4 py-3 text-white">
        <div className="flex items-center gap-3">
          <span className="text-xl leading-none">☰</span>
          <h1 className="text-[29px] font-semibold leading-none">Category Selection</h1>
        </div>
        <div className="mt-2 flex flex-wrap gap-1 text-xs text-sky-100">
          {breadcrumb.map((item, idx) => (
            <span key={item.id} className="inline-flex items-center gap-1">
              <Link href={`/categories/${item.slug}?node=${item.id}`} className="underline-offset-2 hover:underline">
                {item.name}
              </Link>
              {idx < breadcrumb.length - 1 ? <span>›</span> : null}
            </span>
          ))}
        </div>
      </header>

      <section className="overflow-hidden bg-white">
        <CategoryRow
          href={allHref}
          title={`All "${node.name}" Listings`}
          count={allCount}
          countStyle="paren"
          compact
          emphasize
        />
        {childCategories.map((item) => (
          <CategoryRow
            key={item.id}
            href={item.has_children ? `/categories/${item.slug}?node=${item.id}` : `/search?categoryNodeId=${item.id}&scope=exact`}
            title={item.name}
            count={item.count}
            countStyle="paren"
            compact
          />
        ))}
      </section>

      <RelatedCategories items={related} />
    </div>
  );
}
