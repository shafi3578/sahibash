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
            <a key={category.id} href={category.id > 0 ? localizePath(`/categories/${category.slug}?node=${category.id}`, locale) : localizePath(`/categories/${category.slug}`, locale)} className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl bg-[var(--surface-2)] p-2 text-center">
              <span aria-hidden="true" className="text-2xl">{category.slug === "real-estate" ? "⌂" : category.slug === "vehicles" ? "🚙" : category.slug === "mobile-phones-tablets" ? "▣" : "♻"}</span>
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
