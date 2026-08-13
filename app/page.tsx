import Image from "next/image";
import Link from "next/link";
import { CategoryHomeList } from "@/components/categories/CategoryHomeList";
import { getHomepageSections } from "@/lib/actions/homepage-sections";
import { getSiteSettings } from "@/lib/actions/site-settings";
import { getHomeCategoryNodes } from "@/lib/categories/getCategories";
import { getCategoriesWithStats } from "@/lib/data/listings";
import { resolveHomepageSections } from "@/lib/data/homepage-sections";
import { getApprovedListings } from "@/lib/data/queries";
import { getDictionary } from "@/lib/i18n/server";
import { localizePath } from "@/lib/i18n/routing";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const { t, locale } = await getDictionary();
  const siteSettings = await getSiteSettings();
  const afghanistanCopy = {
    en: {
      eyebrow: "Afghanistan's local marketplace",
      coverage: "Built for every province",
      provinces: "Provinces",
      districts: "Districts",
      categories: "Categories",
      languages: "Local languages",
      trustTitle: "Trade locally, with better information",
      trustBody: "Explore structured categories, compare the details that matter, and connect across Afghanistan in your language.",
      discover: "Discover the marketplace",
      heroTitle: siteSettings.home_hero_title,
      heroSubtitle: siteSettings.home_hero_subtitle,
    },
    fa: {
      eyebrow: "بازار محلی افغانستان",
      coverage: "ساخته شده برای تمام ولایات",
      provinces: "ولایت",
      districts: "ولسوالی",
      categories: "دسته‌بندی",
      languages: "زبان محلی",
      trustTitle: "خرید و فروش محلی با معلومات بهتر",
      trustBody: "دسته‌بندی‌های منظم را ببینید، جزئیات مهم را مقایسه کنید و به زبان خود در سراسر افغانستان ارتباط بگیرید.",
      discover: "بازار را کاوش کنید",
      heroTitle: "آگهی‌های معتبر را در سراسر افغانستان پیدا کنید",
      heroSubtitle: "با جستجوی چندزبانه و ابزارهای محلی، خرید کنید، بفروشید و آگهی‌ها را آسان‌تر بررسی کنید.",
    },
    ps: {
      eyebrow: "د افغانستان سیمه‌ییز بازار",
      coverage: "د ټولو ولایتونو لپاره جوړ شوی",
      provinces: "ولایتونه",
      districts: "ولسوالۍ",
      categories: "کټګورۍ",
      languages: "سیمه‌ییزې ژبې",
      trustTitle: "په غوره معلوماتو سره سیمه‌ییزه راکړه ورکړه",
      trustBody: "منظمې کټګورۍ وپلټئ، مهم جزیات پرتله کړئ او په خپله ژبه د افغانستان له خلکو سره اړیکه ونیسئ.",
      discover: "بازار وپلټئ",
      heroTitle: "په ټول افغانستان کې باوري اعلانونه ومومئ",
      heroSubtitle: "د څو ژبو لټون او سیمه‌ییزو اسانتیاوو په مرسته توکي واخلئ، وپلورئ او اعلانونه وپلټئ.",
    },
  }[locale];
  const href = (path: string) => localizePath(path, locale);
  const postAdCreatePath = "/post-ad/create?posting=sell";
  const homepageSections = resolveHomepageSections(await getHomepageSections());
  const guestPostAdHref = `${href("/login")}?redirect=${encodeURIComponent(postAdCreatePath)}&reason=post`;
  let postAdHref = guestPostAdHref;
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      postAdHref = href(postAdCreatePath);
    }
  } catch {
    postAdHref = guestPostAdHref;
  }

  const [listings, categories, mobileCategories] = await Promise.all([
    getApprovedListings({ locale }),
    getCategoriesWithStats(),
    getHomeCategoryNodes(),
  ]);

  const featured = listings.filter((l) => l.featured).slice(0, 4);
  const latest = listings.slice(0, 8);
  const featuredRow = featured.length ? featured : latest.slice(0, 6);
  const localizedNavigationLabel = (path: string, label: string) => {
    if (path === "/listings") return t.home.browseListings;
    if (path === "/categories") return t.home.mainCategories;
    if (path.startsWith("/post-ad")) return t.home.postAd;
    return label;
  };

  return (
    <main className="mx-auto w-full max-w-7xl space-y-5 px-0 pb-28 pt-4 sm:px-4 sm:pb-16 lg:px-6">
      <section className="relative hidden overflow-hidden border-y border-emerald-950/10 bg-[#103b32] text-white sm:rounded-[2rem] sm:border sm:shadow-[0_24px_80px_-36px_rgba(15,59,50,0.8)] lg:block">
        <div aria-hidden="true" className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_20%_20%,#e6b85c_0_1px,transparent_1.5px),linear-gradient(135deg,transparent_0_48%,rgba(255,255,255,.08)_49%_51%,transparent_52%)] [background-size:24px_24px,72px_72px]" />
        <div className="relative grid gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[1.35fr_0.65fr] lg:px-12 lg:py-14">
          <div>
            <div className="inline-flex rounded-full border border-[#e6b85c]/40 bg-[#e6b85c]/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-[#f4d99c]">
              {afghanistanCopy.eyebrow}
            </div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.28em] text-white/60">{locale === "en" ? siteSettings.site_tagline : t.footer.tagline}</p>
            <h1 className="mt-3 max-w-3xl font-display text-4xl font-bold leading-[1.08] sm:text-6xl">
              {afghanistanCopy.heroTitle}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/80 sm:text-base">
              {afghanistanCopy.heroSubtitle}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={href(siteSettings.home_primary_cta_path ?? "/listings")} className="rounded-xl bg-[#e6b85c] px-5 py-3 text-sm font-bold text-[#18352f] shadow-lg shadow-black/10 transition hover:bg-[#f2cb7a]">
                {localizedNavigationLabel(siteSettings.home_primary_cta_path ?? "/listings", siteSettings.home_primary_cta_label ?? t.home.browseListings)}
              </Link>
              {siteSettings.home_secondary_cta_label && siteSettings.home_secondary_cta_path ? (
                <Link href={href(siteSettings.home_secondary_cta_path)} className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur">
                  {localizedNavigationLabel(siteSettings.home_secondary_cta_path, siteSettings.home_secondary_cta_label)}
                </Link>
              ) : null}
            </div>
          </div>
          <div className="self-center rounded-[1.75rem] border border-white/15 bg-white/[0.08] p-4 backdrop-blur-sm">
            <p className="px-2 pb-3 text-sm font-semibold text-[#f4d99c]">{afghanistanCopy.coverage}</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                ["34", afghanistanCopy.provinces],
                ["419", afghanistanCopy.districts],
                ["597", afghanistanCopy.categories],
                ["3", afghanistanCopy.languages],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-black/10 p-4">
                  <p className="font-display text-3xl font-bold text-white">{value}</p>
                  <p className="mt-1 text-xs text-white/65">{label}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 grid gap-2">
            {(siteSettings.navigation_links ?? []).slice(0, 3).map((link) => (
              <Link key={`${link.label}-${link.path}`} href={href(link.path)} className="rounded-xl px-3 py-2 text-sm font-semibold text-white/85 transition hover:bg-white/10 hover:text-white">
                {localizedNavigationLabel(link.path, link.label)}
              </Link>
            ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-4 hidden gap-4 rounded-[1.75rem] border border-amber-900/10 bg-[#fbf7ed] p-5 sm:mx-0 sm:grid-cols-[1fr_auto] sm:items-center sm:p-7 lg:grid">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#9a5b30]">{afghanistanCopy.discover}</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-[#173c32]">{afghanistanCopy.trustTitle}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5d665f]">{afghanistanCopy.trustBody}</p>
        </div>
        <div className="flex gap-2" aria-label="English, Dari and Pashto">
          {["EN", "دری", "پښتو"].map((language) => (
            <span key={language} className="rounded-full border border-[#d7c8a8] bg-white px-3 py-1.5 text-xs font-bold text-[#31584d]">{language}</span>
          ))}
        </div>
      </section>

      {homepageSections.length > 0 ? (
        <section className="hidden space-y-3 px-4 sm:px-0 lg:block">
          {homepageSections.map((section) => (
            <div key={section.slug} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">{section.section_type}</p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-slate-900">{section.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{section.body}</p>
              {section.cta_label && section.cta_path ? (
                <Link href={href(section.cta_path)} className="mt-4 inline-flex rounded-xl bg-[var(--ink-1)] px-4 py-2 text-sm font-semibold text-white">
                  {section.cta_label}
                </Link>
              ) : null}
            </div>
          ))}
        </section>
      ) : null}

      <section className="border-y border-emerald-950/10 bg-white sm:rounded-2xl sm:border sm:shadow-sm">
        <form action={href("/search")} className="grid grid-cols-[1fr_auto] gap-2 p-3 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:p-4">
          <input
            name="q"
            aria-label={t.home.searchPlaceholder}
            placeholder={t.home.searchPlaceholder}
            className="min-w-0 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm"
          />
          <button
            type="submit"
            className="rounded-xl bg-[#a7442f] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#8d3524]"
          >
            {t.home.searchButton}
          </button>
          <Link
            href={postAdHref}
            className="col-span-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-center text-sm font-semibold sm:col-span-1"
          >
            {t.home.postAd}
          </Link>
        </form>
      </section>

      <section className="px-0 sm:px-0">
        <CategoryHomeList categories={mobileCategories} locale={locale} />
      </section>

      <section className="overflow-hidden border-y border-slate-200 bg-white sm:rounded-2xl sm:border sm:shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
          {t.home.featuredListings}
        </div>
        <div className="overflow-x-auto px-3 py-3">
          <div className="flex min-w-max gap-3">
            {featuredRow.map((listing) => {
              const image = listing.listing_images?.[0]?.image_url ?? listing.listing_images?.[0]?.public_url;
              const displayTitle = listing.translated_title || listing.title;
              return (
                <Link
                  key={listing.id}
                  href={href(`/listings/${listing.id}`)}
                  className="w-44 shrink-0 overflow-hidden rounded-xl border border-slate-200"
                >
                  <div className="relative h-24 w-full bg-slate-100">
                    {image ? (
                      <Image src={image} alt={displayTitle} fill className="object-cover" sizes="176px" />
                    ) : null}
                  </div>
                  <div className="space-y-1 p-2">
                    <p className="line-clamp-2 text-sm font-medium text-slate-800">{displayTitle}</p>
                    <p className="text-sm font-semibold text-[var(--accent)]">
                      {new Intl.NumberFormat("en-US").format(listing.price)} {listing.currency}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="overflow-hidden border-y border-slate-200 bg-white sm:rounded-2xl sm:border sm:shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
          {t.home.latestListings}
        </div>
        <div className="divide-y divide-slate-200">
          {latest.map((listing) => {
            const image = listing.listing_images?.[0]?.image_url ?? listing.listing_images?.[0]?.public_url;
            const displayTitle = listing.translated_title || listing.title;
            const province = listing.province ?? listing.district ?? "-";
            return (
              <Link
                key={listing.id}
                href={href(`/listings/${listing.id}`)}
                className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-3 p-3"
              >
                <div className="relative h-[5.5rem] w-[5.5rem] overflow-hidden rounded-md bg-slate-100">
                  {image ? (
                    <Image src={image} alt={displayTitle} fill className="object-cover" sizes="88px" />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <p className="line-clamp-2 text-base text-slate-800">{displayTitle}</p>
                  <p className="mt-1 line-clamp-1 text-sm text-slate-500">{province}</p>
                </div>
                <p className="shrink-0 text-xl font-semibold text-[#1967b1]">
                  {new Intl.NumberFormat("en-US").format(listing.price)} {listing.currency}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="px-4 sm:px-0">
        <div className="flex flex-wrap gap-2">
          <Link
            href={href("/listings")}
            className="inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
          >
            {t.home.browseListings}
          </Link>
          <Link
            href={href("/categories")}
            className="inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
          >
            {t.home.openCategoryBrowser}
          </Link>
          {categories.length > 0 ? (
            <Link
              href={href(`/categories/${categories[0].slug}`)}
              className="inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            >
              {t.home.mainCategories}
            </Link>
          ) : null}
        </div>
      </section>
    </main>
  );
}
