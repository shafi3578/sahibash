import type { CategoryNodeWithCount } from "@/lib/categories/getCategories";
import type { AppLocale } from "@/lib/i18n/translations";
import { localizeCategoryName, localizeCategorySubtitle } from "@/lib/i18n/category-labels";
import { localizePath } from "@/lib/i18n/routing";
import { getDictionary } from "@/lib/i18n/server";

type Props = {
  categories: CategoryNodeWithCount[];
  locale?: AppLocale;
};

const FALLBACK_HOME_ROWS = [
  { slug: "vehicles", name: "Vehicles", subtitle: "Cars, motorcycles, and transport listings", icon: "car", is_coming_soon: false },
  { slug: "real-estate", name: "Real Estate", subtitle: "Houses, apartments, land, and commercial property", icon: "home", is_coming_soon: false },
  { slug: "mobile-phones-tablets", name: "Phones & Electronics", subtitle: "Phones, tablets, and electronics deals", icon: "phone", is_coming_soon: false },
  { slug: "second-hand-items", name: "Second Hand", subtitle: "Used furniture, tools, home items, and more", icon: "box", is_coming_soon: false },
  { slug: "jobs", name: "Jobs", subtitle: "Full-time, part-time, and labor jobs", icon: "briefcase", is_coming_soon: true },
  { slug: "services", name: "Services", subtitle: "Repairs, transport, documents, and local help", icon: "wrench", is_coming_soon: true },
  { slug: "business-industry", name: "Business & Industry", subtitle: "Shops, machinery, wholesale, and industrial goods", icon: "factory", is_coming_soon: true },
  { slug: "farm-animals", name: "Farm & Animals", subtitle: "Livestock, feed, tractors, and pets", icon: "tractor", is_coming_soon: true },
  { slug: "education", name: "Education", subtitle: "Books, tutoring, classes, and training", icon: "book-open", is_coming_soon: true },
  { slug: "sports-hobbies", name: "Sports & Hobbies", subtitle: "Sports items, music, games, and leisure goods", icon: "trophy", is_coming_soon: true },
  { slug: "other", name: "Other", subtitle: "Manual posting for anything else", icon: "dots-horizontal", is_coming_soon: true },
] as const;

function CategoryIcon({ slug }: { slug: string }) {
  const common = "h-7 w-7";
  if (slug === "vehicles") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true" className={common}>
        <path fill="currentColor" d="M10 27h28l-3.1-8.4A5 5 0 0 0 30.2 15H17.8a5 5 0 0 0-4.7 3.6L10 27Zm4.2-3 1.7-4.5A2 2 0 0 1 17.8 18h12.4a2 2 0 0 1 1.9 1.5l1.7 4.5H14.2Z" />
        <path fill="currentColor" d="M9 25h30a4 4 0 0 1 4 4v6a2 2 0 0 1-2 2h-3.2a4 4 0 0 1-7.6 0H17.8a4 4 0 0 1-7.6 0H7a2 2 0 0 1-2-2v-6a4 4 0 0 1 4-4Zm5 11.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm20 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
      </svg>
    );
  }
  if (slug === "real-estate") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true" className={common}>
        <path fill="currentColor" d="M7 23.5 24 9l17 14.5-2.6 3.1-2.4-2V40H12V24.6l-2.4 2L7 23.5ZM17 36h5v-9h4v9h5V20.3l-7-6-7 6V36Z" />
      </svg>
    );
  }
  if (slug === "mobile-phones-tablets") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true" className={common}>
        <path fill="currentColor" d="M17 5h14a4 4 0 0 1 4 4v30a4 4 0 0 1-4 4H17a4 4 0 0 1-4-4V9a4 4 0 0 1 4-4Zm0 5v28h14V10H17Zm5 30h4v1h-4v-1Z" />
        <path fill="currentColor" d="M20 13h8v3h-8v-3Zm0 6h8v3h-8v-3Z" opacity=".45" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className={common}>
      <path fill="currentColor" d="M12 14h24a3 3 0 0 1 3 3v19a3 3 0 0 1-3 3H12a3 3 0 0 1-3-3V17a3 3 0 0 1 3-3Zm2 6v14h20V20H14Z" />
      <path fill="currentColor" d="M18 9h12v4H18V9Z" opacity=".55" />
    </svg>
  );
}

export async function CategoryHomeList({ categories, locale = "en" }: Props) {
  const { t } = await getDictionary();
  const rows = categories.length > 0
    ? categories.map((category) => ({
        id: category.id,
        slug: category.slug,
        name: localizeCategoryName({
          locale,
          fallbackName: category.slug === "mobile-phones-tablets" ? "Phones & Electronics" : category.name,
          slug: category.slug,
        }),
        subtitle: localizeCategorySubtitle({ locale, fallbackSubtitle: category.subtitle, slug: category.slug }),
        icon: category.icon,
        is_coming_soon: Boolean(category.is_coming_soon),
      }))
    : FALLBACK_HOME_ROWS.map((row, index) => ({
        id: -(index + 1),
        slug: row.slug,
        name: localizeCategoryName({ locale, fallbackName: row.name, slug: row.slug }),
        subtitle: localizeCategorySubtitle({ locale, fallbackSubtitle: row.subtitle, slug: row.slug }),
        icon: row.icon,
        is_coming_soon: row.is_coming_soon,
      }));

  const launchRows = rows.filter((row) => !row.is_coming_soon);
  const comingSoonRows = rows.filter((row) => row.is_coming_soon);

  return (
    <div className="space-y-3">
      <section className="overflow-hidden border-y border-slate-200 bg-white sm:rounded-2xl sm:border">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {t.home.mainCategories}
        </div>
        <div className="grid grid-cols-4 gap-2 p-3">
          {launchRows.slice(0, 4).map((category) => (
            <a key={category.id} href={category.id > 0 ? localizePath(`/categories/${category.slug}?node=${category.id}`, locale) : localizePath(`/categories/${category.slug}`, locale)} className="group flex min-h-24 flex-col items-center justify-center gap-2 rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-2 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--brand)] hover:shadow-md">
              <span aria-hidden="true" className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--brand)]/25 text-[var(--ink-1)] ring-1 ring-black/5 transition group-hover:scale-105">
                <CategoryIcon slug={category.slug} />
              </span>
              <span className="line-clamp-2 text-xs font-bold">{category.name}</span>
            </a>
          ))}
        </div>
        <a href={localizePath("/categories", locale)} className="flex min-h-11 items-center justify-center border-t border-slate-200 text-sm font-semibold text-[var(--accent)]">{t.home.openCategoryBrowser}</a>
      </section>

      {comingSoonRows.length > 0 ? <p className="hidden text-xs text-slate-500 lg:block">{`${comingSoonRows.length} ${t.home.moreCategories} · ${t.home.comingSoon}`}</p> : null}
    </div>
  );
}
