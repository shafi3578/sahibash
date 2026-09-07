import Image from "next/image";
import type { CategoryNodeWithCount } from "@/lib/categories/getCategories";
import type { AppLocale } from "@/lib/i18n/translations";
import { localizeCategoryName, localizeCategorySubtitle } from "@/lib/i18n/category-labels";
import { localizePath } from "@/lib/i18n/routing";
import { getDictionary } from "@/lib/i18n/server";

type Props = {
  categories: CategoryNodeWithCount[];
  locale?: AppLocale;
  showComingSoon?: boolean;
};

const FALLBACK_HOME_ROWS = [
  { slug: "vehicles", name: "Vehicles", subtitle: "Cars, motorcycles, and transport listings", icon: "car", is_coming_soon: false },
  { slug: "real-estate", name: "Real Estate", subtitle: "Houses, apartments, land, and commercial property", icon: "home", is_coming_soon: false },
  { slug: "mobile-phones-tablets", name: "Mobile Phones & Tablets", subtitle: "Phones and tablets for Afghanistan buyers", icon: "phone", is_coming_soon: false },
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
  const launchIcon: Record<string, string> = {
    vehicles: "/category-vehicles.webp",
    "real-estate": "/category-real-estate.webp",
    "mobile-phones-tablets": "/category-mobile-phones-tablets.webp",
    "second-hand-items": "/category-second-hand-items.webp",
  };
  if (launchIcon[slug]) {
    return (
      <Image src={launchIcon[slug]} alt="" width={56} height={56} quality={75} className="h-14 w-14 object-contain" />
    );
  }
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className="h-10 w-10">
      <rect x="7" y="18" width="18" height="18" rx="4" fill="#22c55e" />
      <rect x="22" y="11" width="18" height="24" rx="4" fill="#facc15" />
      <path fill="#ef4444" d="M13 14h21v5H13z" />
      <path fill="#0f172a" d="M13 24h8v8h-8zm14-6h7v12h-7z" opacity=".55" />
    </svg>
  );
}

export async function CategoryHomeList({ categories, locale = "en", showComingSoon = false }: Props) {
  const { t } = await getDictionary();
  const rows = categories.length > 0
    ? categories.map((category) => ({
        id: category.id,
        slug: category.slug,
        name: localizeCategoryName({
          locale,
          fallbackName: category.name,
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
            <a key={category.id} href={localizePath(`/categories/${category.slug}`, locale)} className="group flex min-h-24 flex-col items-center justify-center gap-2 rounded-3xl bg-white p-2 text-center transition active:bg-slate-100">
              <span aria-hidden="true" className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-50 shadow-sm ring-1 ring-slate-200 transition group-hover:scale-105">
                <CategoryIcon slug={category.slug} />
              </span>
              <span className="line-clamp-2 text-xs font-bold">{category.name}</span>
            </a>
          ))}
        </div>
      </section>

      {!showComingSoon && comingSoonRows.length > 0 ? <p className="hidden text-xs text-slate-500 lg:block">{`${comingSoonRows.length} ${t.home.moreCategories} · ${t.home.comingSoon}`}</p> : null}
      {showComingSoon && comingSoonRows.length > 0 ? (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">{t.home.comingSoon}</div>
          <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3">
            {comingSoonRows.map((category) => (
              <div key={category.id} aria-disabled="true" className="relative flex min-h-24 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-600">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white opacity-65"><CategoryIcon slug={category.slug} /></span>
                <span className="min-w-0 text-sm font-bold">{category.name}</span>
                <span className="absolute end-2 top-2 rounded-full bg-slate-200 px-2 py-0.5 text-[9px] font-black uppercase">{t.home.comingSoon}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
