import Link from "next/link";
import type { Category } from "@/types/database";
import type { AppLocale } from "@/lib/i18n/translations";
import { localizeCategoryName, localizeCategorySubtitle } from "@/lib/i18n/category-labels";

export function CategoryCard({
  category,
  locale = "en",
}: {
  category: Category & { count?: number };
  locale?: AppLocale;
}) {
  const localizedName = localizeCategoryName({ locale, fallbackName: category.name, slug: category.slug });
  const localizedSubtitle = localizeCategorySubtitle({ locale, fallbackSubtitle: category.description, slug: category.slug });

  return (
    <Link
      href={`/categories/${category.slug}`}
      className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <p className="font-display text-lg font-semibold text-[var(--ink-1)]">
        {localizedName}
      </p>
      <p className="mt-1 text-sm text-[var(--ink-2)]">
        {localizedSubtitle}
      </p>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
        {new Intl.NumberFormat("en-US").format(category.count ?? 0)}
      </p>
    </Link>
  );
}
