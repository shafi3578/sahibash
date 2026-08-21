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
  const common = "h-10 w-10";
  if (slug === "vehicles") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true" className={common}>
        <path fill="#2563eb" d="M5 30h22l-2.3-6.2A4 4 0 0 0 21 21H11a4 4 0 0 0-3.7 2.8L5 30Z" />
        <path fill="#1d4ed8" d="M4 29h24a3 3 0 0 1 3 3v4H1v-4a3 3 0 0 1 3-3Z" />
        <circle cx="8" cy="36" r="3" fill="#111827" />
        <circle cx="24" cy="36" r="3" fill="#111827" />
        <path fill="#f97316" d="M30 25h7l3 5h3v5h-2.4a3 3 0 0 1-5.2 0h-7.8a3 3 0 0 1-2.6 1.5V29a4 4 0 0 1 4-4Z" />
        <circle cx="27" cy="35" r="2.4" fill="#111827" />
        <circle cx="38" cy="35" r="2.4" fill="#111827" />
        <path fill="#16a34a" d="M32 15a5 5 0 0 1 5 5h-4a2 2 0 0 0-2-2h-4v-3h5Z" />
        <circle cx="27" cy="20" r="2.2" fill="#111827" />
        <circle cx="38" cy="20" r="2.2" fill="#111827" />
      </svg>
    );
  }
  if (slug === "real-estate") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true" className={common}>
        <path fill="#f97316" d="M6 23 24 8l18 15-3 3-3-2.5V40H12V23.5L9 26l-3-3Z" />
        <path fill="#fff7ed" d="M17 38h5V27h5v11h5V21l-8-6.8L17 21v17Z" />
        <path fill="#2563eb" d="M16 18h6v5h-6v-5Zm10 0h6v5h-6v-5Z" />
      </svg>
    );
  }
  if (slug === "mobile-phones-tablets") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true" className={common}>
        <rect x="14" y="5" width="20" height="38" rx="5" fill="#111827" />
        <rect x="17" y="10" width="14" height="27" rx="2" fill="#38bdf8" />
        <rect x="7" y="17" width="15" height="23" rx="4" fill="#a855f7" />
        <rect x="10" y="21" width="9" height="14" rx="1.5" fill="#f5f3ff" />
        <circle cx="24" cy="40" r="1.4" fill="#f8fafc" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className={common}>
      <rect x="7" y="18" width="18" height="18" rx="4" fill="#22c55e" />
      <rect x="22" y="11" width="18" height="24" rx="4" fill="#facc15" />
      <path fill="#ef4444" d="M13 14h21v5H13z" />
      <path fill="#0f172a" d="M13 24h8v8h-8zm14-6h7v12h-7z" opacity=".55" />
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
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {t.home.mainCategories}
          <a href={localizePath("/categories", locale)} className="text-[var(--accent)]">{t.home.openCategoryBrowser}</a>
        </div>
        <div className="grid grid-cols-4 gap-2 p-3">
          {launchRows.slice(0, 4).map((category) => (
            <a key={category.id} href={localizePath("/categories", locale)} className="group flex min-h-24 flex-col items-center justify-center gap-2 rounded-3xl bg-white p-2 text-center transition active:bg-slate-100">
              <span aria-hidden="true" className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-50 shadow-sm ring-1 ring-slate-200 transition group-hover:scale-105">
                <CategoryIcon slug={category.slug} />
              </span>
              <span className="line-clamp-2 text-xs font-bold">{category.name}</span>
            </a>
          ))}
        </div>
      </section>

      {comingSoonRows.length > 0 ? <p className="hidden text-xs text-slate-500 lg:block">{`${comingSoonRows.length} ${t.home.moreCategories} · ${t.home.comingSoon}`}</p> : null}
    </div>
  );
}
