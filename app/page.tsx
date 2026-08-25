import Image from "next/image";
import Link from "next/link";
import { CategoryHomeList } from "@/components/categories/CategoryHomeList";
import { getHomepageSections } from "@/lib/actions/homepage-sections";
import { getSiteSettings } from "@/lib/actions/site-settings";
import { getHomeCategoryNodes } from "@/lib/categories/getCategories";
import { getCategoriesWithStats } from "@/lib/data/listings";
import { resolveHomepageSections } from "@/lib/data/homepage-sections";
import { getApprovedListings } from "@/lib/data/queries";
import { isFeaturedCurrentlyActive } from "@/lib/data/featured-payments";
import { getDictionary } from "@/lib/i18n/server";
import { localizePath } from "@/lib/i18n/routing";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getLocalizedBrandName } from "@/lib/i18n/brand";
import { formatListingPrice } from "@/lib/listings/price-display";

function getHomePageCopy(
  locale: "en" | "fa" | "ps",
  siteSettings: Awaited<ReturnType<typeof getSiteSettings>>
) {
  if (locale === "fa") {
    return {
      tagline: "بازار آنلاین افغانستان",
      heroTitle: "اعلان‌های قابل اعتماد در سراسر افغانستان",
      heroSubtitle: "خرید، فروش و جستجو با دسته‌بندی‌های محلی، فیلترهای دقیق و پشتیبانی دری و پشتو.",
      primaryCta: "دیدن اعلان‌ها",
      secondaryCta: "ثبت اعلان",
      allFeatured: "همه ویژه‌ها",
      adBadge: "اعلان",
      brandBadge: "صاحبش",
    };
  }

  if (locale === "ps") {
    return {
      tagline: "د افغانستان آنلاین بازار",
      heroTitle: "په ټول افغانستان کې باوري اعلانونه",
      heroSubtitle: "واخلئ، وپلورئ او د محلي کټګوریو، دقیقو فلټرونو او دري/پښتو ملاتړ سره اعلانونه ولټوئ.",
      primaryCta: "اعلانونه وګورئ",
      secondaryCta: "اعلان ثبت کړئ",
      allFeatured: "ټول ځانګړي",
      adBadge: "اعلان",
      brandBadge: "صاحبش",
    };
  }

  return {
    tagline: siteSettings.site_tagline,
    heroTitle: siteSettings.home_hero_title,
    heroSubtitle: siteSettings.home_hero_subtitle,
    primaryCta: siteSettings.home_primary_cta_label,
    secondaryCta: siteSettings.home_secondary_cta_label,
    allFeatured: "All featured",
    adBadge: "Ad",
    brandBadge: getLocalizedBrandName(locale, siteSettings.site_name),
  };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
}) {
  const { t, locale } = await getDictionary();
  const href = (path: string) => localizePath(path, locale);
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const pageValue = Array.isArray(resolvedSearchParams.page) ? resolvedSearchParams.page[0] : resolvedSearchParams.page;
  const currentPage = Math.min(Math.max(Number.parseInt(pageValue ?? "1", 10) || 1, 1), 7);
  const pageSize = 10;
  const postAdCreatePath = "/post-ad/create?posting=sell";
  const siteSettings = await getSiteSettings();
  const homeCopy = getHomePageCopy(locale, siteSettings);
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
    getApprovedListings({ locale, limit: 70 }),
    getCategoriesWithStats(),
    getHomeCategoryNodes(),
  ]);

  const featured = listings.filter((listing) => isFeaturedCurrentlyActive(listing)).slice(0, 4);
  const latest = listings.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const featuredRow = featured.length ? featured : latest.slice(0, 6);
  const totalPages = Math.max(1, Math.min(7, Math.ceil(listings.length / pageSize)));

  return (
    <main className="mx-auto w-full max-w-7xl space-y-3 bg-[linear-gradient(180deg,#fff7ed_0%,#f8fafc_18%,#eef2ff_100%)] px-0 pb-28 pt-0 sm:bg-transparent sm:px-4 sm:space-y-4 sm:pb-16 sm:pt-4 lg:px-6">
      <section className="hidden overflow-hidden bg-[radial-gradient(circle_at_20%_20%,#ffe08a_0,#f97316_22%,#0f172a_58%,#020617_100%)] text-white sm:block sm:rounded-3xl sm:border sm:border-white/10 sm:shadow-sm">
        <div className="grid gap-6 px-4 py-7 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-10">
          <div>
            <p className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white/80 backdrop-blur">{homeCopy.tagline}</p>
            <h1 className="mt-4 max-w-2xl font-display text-4xl font-black leading-tight sm:text-5xl">
              {homeCopy.heroTitle}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/80 sm:text-base">
              {homeCopy.heroSubtitle}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={href(siteSettings.home_primary_cta_path ?? "/listings")} className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900">
                {homeCopy.primaryCta}
              </Link>
              {siteSettings.home_secondary_cta_label && siteSettings.home_secondary_cta_path ? (
                <Link href={href(siteSettings.home_secondary_cta_path)} className="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur">
                  {homeCopy.secondaryCta}
                </Link>
              ) : null}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 self-end lg:grid-cols-1">
            {featuredRow.slice(0, 3).map((listing, index) => {
              const image = listing.listing_images?.[0]?.image_url ?? listing.listing_images?.[0]?.public_url;
              const displayTitle = listing.translated_title || listing.title;
              return (
                <Link key={listing.id} href={href(`/listings/${listing.id}`)} className="group overflow-hidden rounded-3xl border border-white/15 bg-white/10 shadow-2xl backdrop-blur transition hover:-translate-y-1 hover:bg-white/15">
                  <div className="relative h-28 bg-white/10 sm:h-36 lg:h-28">
                    {image ? <Image src={image} alt={displayTitle} fill className="object-cover transition duration-500 group-hover:scale-105" sizes="(max-width: 1024px) 33vw, 320px" /> : null}
                    <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-1 text-[10px] font-bold">#{index + 1}</span>
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-2 text-xs font-bold sm:text-sm">{displayTitle}</p>
                    <p className="mt-1 text-xs font-semibold text-yellow-200">{formatListingPrice(listing, locale)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {homepageSections.length > 0 ? (
        <section className="space-y-3 px-4 sm:px-0">
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

      <section className="hidden border-y border-slate-200 bg-white sm:block sm:rounded-2xl sm:border sm:shadow-sm">
        <form action={href("/search")} className="grid grid-cols-[1fr_auto] gap-2 p-3 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:p-4">
          <input
            name="q"
            placeholder={t.home.searchPlaceholder}
            className="min-w-0 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm"
          />
          <button
            type="submit"
            className="rounded-xl bg-[var(--ink-1)] px-4 py-2.5 text-sm font-semibold text-white"
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

      <section className="overflow-hidden border-y border-slate-200 bg-white sm:rounded-3xl sm:border sm:shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600 sm:bg-gradient-to-r sm:from-amber-50 sm:to-white">
          {t.home.featuredListings}
          <Link href={href("/featured")} className="rounded-full bg-[var(--brand)]/30 px-2 py-1 text-[10px] text-slate-700">{homeCopy.allFeatured}</Link>
        </div>
        <div className="overflow-x-auto px-3 py-3 [scrollbar-width:none]">
          <div className="flex min-w-max gap-3">
            {featuredRow.map((listing) => {
              const image = listing.listing_images?.[0]?.image_url ?? listing.listing_images?.[0]?.public_url;
              const displayTitle = listing.translated_title || listing.title;
              return (
                <Link
                  key={listing.id}
                  href={href(`/listings/${listing.id}`)}
                  className="w-40 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:w-48 sm:rounded-3xl"
                >
                  <div className="relative h-56 w-full bg-slate-100 sm:h-32">
                    {image ? (
                      <Image src={image} alt={displayTitle} fill className="object-cover" sizes="(max-width: 640px) 160px, 176px" />
                    ) : null}
                    <span className="absolute bottom-2 left-2 rounded-md bg-black/65 px-1.5 py-0.5 text-[10px] font-bold text-white sm:hidden">{homeCopy.adBadge}</span>
                  </div>
                  <div className="space-y-1 p-2">
                    <p className="line-clamp-2 text-sm font-medium text-slate-800">{displayTitle}</p>
                    <p className="text-sm font-semibold text-[var(--accent)]">
                      {formatListingPrice(listing, locale)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
        {totalPages > 1 ? (
          <div className="flex items-center justify-center gap-2 border-t border-slate-100 bg-white px-3 py-4">
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <Link
                key={page}
                href={href(page === 1 ? "/" : `/?page=${page}`)}
                aria-current={page === currentPage ? "page" : undefined}
                className={`grid h-9 w-9 place-items-center rounded-full text-sm font-bold ${page === currentPage ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700"}`}
              >
                {page}
              </Link>
            ))}
          </div>
        ) : null}
      </section>

      <section className="overflow-hidden bg-white sm:rounded-3xl sm:border sm:border-slate-200 sm:shadow-sm">
        <div className="border-y border-slate-200 bg-white px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600 sm:border-b sm:border-t-0 sm:bg-slate-50">
          {t.home.latestListings}
        </div>
        <div className="divide-y divide-slate-100 sm:divide-slate-200">
          {latest.map((listing) => {
            const image = listing.listing_images?.[0]?.image_url ?? listing.listing_images?.[0]?.public_url;
            const displayTitle = listing.translated_title || listing.title;
            const province = listing.province ?? listing.district ?? "-";
            return (
              <Link
                key={listing.id}
                href={href(`/listings/${listing.id}`)}
                className="block p-0 transition hover:bg-amber-50/40 sm:grid sm:grid-cols-[6rem_1fr_auto] sm:gap-3 sm:p-3"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-slate-100 sm:h-24 sm:w-24 sm:rounded-2xl sm:shadow-sm">
                  {image ? (
                    <Image src={image} alt={displayTitle} fill className="object-cover" sizes="(max-width: 640px) 100vw, 88px" />
                  ) : null}
                  <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white sm:hidden">{homeCopy.brandBadge}</span>
                </div>
                <div className="min-w-0 px-3 pb-2 pt-2 sm:px-0 sm:pb-0 sm:pt-0">
                  <p className="line-clamp-2 text-base font-semibold text-slate-900 sm:font-normal sm:text-slate-800">{displayTitle}</p>
                  <p className="mt-1 line-clamp-1 text-sm text-slate-500">{province}</p>
                </div>
                <p className="px-3 pb-4 text-lg font-bold text-[#1967b1] sm:col-span-1 sm:px-0 sm:pb-0 sm:text-xl">
                  {formatListingPrice(listing, locale)}
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
