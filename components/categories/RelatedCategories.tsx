import { CategoryRow } from "@/components/categories/CategoryRow";
import type { CategoryNodeWithCount } from "@/lib/categories/getCategories";

type Props = {
  items: CategoryNodeWithCount[];
};

export function RelatedCategories({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <section className="overflow-hidden border-t border-slate-200 bg-white">
      <div className="border-y border-slate-200 bg-slate-100 px-4 py-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Related Categories</p>
      </div>
      {items.map((item) => (
        <CategoryRow
          key={item.id}
          href={`/categories/${item.slug}?node=${item.id}`}
          title={item.name}
          count={item.count}
          compact
          countStyle="paren"
        />
      ))}
    </section>
  );
}
