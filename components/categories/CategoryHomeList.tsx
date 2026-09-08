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
    vehicles: "/category-vehicles-v2.webp",
    "real-estate": "/category-real-estate-v2.webp",
    "mobile-phones-tablets": "/category-mobile-phones-tablets-v2.webp",
    "second-hand-items": "/category-second-hand-items-v2.webp",
  };
  if (launchIcon[slug]) {
    return (
      <Image
        src={launchIcon[slug]}
        alt=""
        aria-hidden="true"
        width={448}
        height={448}
        sizes="(max-width: 639px) 68px, 112px"
        className="h-[4.25rem] w-[4.25rem] object-contain drop-shadow-[0_12px_12px_rgba(0,0,0,0.42)] transition duration-500 group-hover:scale-[1.07] sm:h-28 sm:w-28"
      />
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
      <section className="relative mx-3 w-[calc(100%_-_1.5rem)] overflow-hidden rounded-[1.75rem] border border-[#c9a860]/55 bg-[radial-gradient(circle_at_6%_-15%,rgba(217,184,111,0.22),transparent_32%),radial-gradient(circle_at_96%_120%,rgba(19,132,116,0.25),transparent_42%),linear-gradient(145deg,#020b12_0%,#071c24_48%,#092b2a_100%)] shadow-[0_30px_72px_-36px_rgba(0,9,15,0.92),0_1px_0_rgba(255,255,255,0.11)_inset] sm:mx-0 sm:w-full">
        <div aria-hidden="true" className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#f1d590] to-transparent" />
        <div className="relative flex items-center justify-between gap-3 border-b border-[#d8bd7a]/20 px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#f3dda6] sm:px-5 sm:py-4 sm:text-xs">
          <span>{t.home.mainCategories}</span>
          <a href={localizePath("/categories", locale)} className="min-w-0 max-w-[9rem] truncate rounded-full border border-[#d8bd7a]/50 bg-[#d8bd7a]/10 px-3 py-1.5 text-end tracking-normal text-[#fff9eb] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] transition hover:border-[#f0d99f] hover:bg-[#d8bd7a]/20 sm:max-w-none">
            <span className="sm:hidden">{t.search.allCategories}</span>
            <span className="hidden sm:inline">{t.home.openCategoryBrowser}</span>
          </a>
        </div>
        <div className="relative grid grid-cols-4 gap-1.5 p-2.5 sm:gap-3 sm:p-4">
          {launchRows.slice(0, 4).map((category) => {
            const style = CATEGORY_CARD_STYLE[category.slug] ?? CATEGORY_CARD_FALLBACK;
            return (
              <a key={category.id} href={localizePath(`/categories/${category.slug}`, locale)} className="group relative flex min-h-[7.6rem] min-w-0 flex-col items-center justify-between overflow-hidden rounded-[1.15rem] border border-[#dfc781]/30 bg-[linear-gradient(155deg,rgba(255,255,255,0.12),rgba(255,255,255,0.035))] px-1 pb-2.5 pt-2 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.13),0_18px_32px_-24px_rgba(0,0,0,0.95)] transition duration-300 hover:-translate-y-1 hover:border-[#efd89d]/75 hover:bg-[linear-gradient(155deg,rgba(255,255,255,0.17),rgba(255,255,255,0.055))] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_24px_44px_-24px_rgba(0,0,0,0.95)] active:scale-[0.98] sm:min-h-[10.5rem] sm:rounded-[1.55rem] sm:px-3 sm:pb-3 sm:pt-3">
                <span aria-hidden="true" className={`absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-[70%] rounded-full blur-2xl sm:h-32 sm:w-32 ${style.halo}`} />
                <span aria-hidden="true" className="relative grid h-[4.7rem] w-full place-items-center transition duration-300 sm:h-[7.4rem]">
                  <CategoryIcon slug={category.slug} />
                </span>
                <span className="relative line-clamp-2 text-[10px] font-black leading-3 text-[#fff9eb] sm:text-sm sm:leading-5">{category.name}</span>
                <span aria-hidden="true" className={`absolute inset-x-4 bottom-0 h-[2px] bg-gradient-to-r from-transparent ${style.line} to-transparent sm:inset-x-8`} />
              </a>
            );
          })}
        </div>
      </section>

      {!showComingSoon && comingSoonRows.length > 0 ? <p className="hidden text-xs text-slate-500 lg:block">{`${comingSoonRows.length} ${t.home.moreCategories} · ${t.home.comingSoon}`}</p> : null}
      {showComingSoon && comingSoonRows.length > 0 ? (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">{t.home.comingSoon}</div>
          <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3">
            {comingSoonRows.map((category) => (
              <div key={category.id} aria-disabled="true" className="relative flex min-h-24 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-600">
                <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-white opacity-65"><CategoryIcon slug={category.slug} /></span>
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

const CATEGORY_CARD_FALLBACK = {
  halo: "bg-[#d8bd7a]/20",
  line: "via-[#d8bd7a]/80",
};

const CATEGORY_CARD_STYLE: Record<string, typeof CATEGORY_CARD_FALLBACK> = {
  vehicles: { halo: "bg-[#20a48f]/30", line: "via-[#55d5bd]" },
  "real-estate": { halo: "bg-[#d8a34d]/30", line: "via-[#f0c773]" },
  "mobile-phones-tablets": { halo: "bg-[#5b83c7]/30", line: "via-[#8db2ed]" },
  "second-hand-items": { halo: "bg-[#9f7652]/30", line: "via-[#d5ab7a]" },
};
