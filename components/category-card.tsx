import Link from "next/link";
import type { Category } from "@/types/database";

export function CategoryCard({
  category,
}: {
  category: Category & { count?: number };
}) {
  return (
    <Link
      href={`/category/${category.slug}`}
      className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <p className="font-display text-lg font-semibold text-[var(--ink-1)]">
        {category.name}
      </p>
      <p className="mt-1 text-sm text-[var(--ink-2)]">
        {category.description}
      </p>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
        {category.count ?? 0} active listings
      </p>
    </Link>
  );
}
