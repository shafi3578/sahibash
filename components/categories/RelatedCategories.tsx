import { CategoryRow } from "@/components/categories/CategoryRow";
import type { CategoryNodeWithCount } from "@/lib/categories/getCategories";
import { getDictionary } from "@/lib/i18n/server";
import { localizeCategoryName } from "@/lib/i18n/category-labels";

type Props = {
  items: CategoryNodeWithCount[];
};

export async function RelatedCategories({ items }: Props) {
  const { t, locale } = await getDictionary();
  const relatedLabel = locale === "fa" ? "مرتبط" : locale === "ps" ? "اړوند" : t.search.related;
  if (items.length === 0) return null;

  return (
    <section className="overflow-hidden border-t border-slate-200 bg-white">
      <div className="border-y border-slate-200 bg-slate-100 px-4 py-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">{relatedLabel}</p>
      </div>
      {items.map((item) => (
        <CategoryRow
          key={item.id}
          href={`/categories/${item.slug}?node=${item.id}`}
          title={localizeCategoryName({
            locale,
            fallbackName: item.name,
            slug: item.slug,
            path: item.path,
          })}
          count={item.count}
          compact
          countStyle="paren"
          comingSoonLabel={t.home.comingSoon}
        />
      ))}
    </section>
  );
}
