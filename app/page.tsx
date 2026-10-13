import Image from "next/image";
import Link from "next/link";
import { CategoryHomeList } from "@/components/categories/CategoryHomeList";
import { getHomepageSections } from "@/lib/actions/homepage-sections";
import { getSiteSettings } from "@/lib/actions/site-settings";
import { getHomeCategoryNodes } from "@/lib/categories/getCategories";
import { resolveHomepageSections } from "@/lib/data/homepage-sections";
import { getApprovedListingCount, getApprovedListings } from "@/lib/data/queries";
import { isFeaturedCurrentlyActive } from "@/lib/data/featured-payments";
import { getDictionary } from "@/lib/i18n/server";
import { localizePath } from "@/lib/i18n/routing";
import { getLocalizedBrandName } from "@/lib/i18n/brand";
import { formatListingPrice } from "@/lib/listings/price-display";
import { getLocalizedListingLocation } from "@/lib/i18n/location-labels";
import { getUiTranslations } from "@/lib/i18n/ui";

function getHomePageCopy(
  locale: "en" | "fa" | "ps",
  siteSettings: Awaited<ReturnType<typeof getSiteSettings>>
) {
  if (locale === "fa") {
    return {
      tagline: "بازار آنلاین افغانستان",
      heroTitle: "اعلان‌های تازه با منبع روشن",
      heroSubtitle: "اعلان‌های فروشندگان جستجو و منابع بیرونی با برچسب روشن؛ موجودیت اعلان‌ها در هر ولایت متفاوت است.",
      primaryCta: "دیدن اعلان‌ها",
      secondaryCta: "ثبت اعلان",
      allFeatured: "همه ویژه‌ها",
      adBadge: "اعلان",
      brandBadge: "جستجو",
      paginationLabel: "صفحه‌های جدیدترین اعلان‌ها",
    };
  }

  if (locale === "ps") {
    return {
      tagline: "د افغانستان آنلاین بازار",
      heroTitle: "تازه اعلانونه له روښانه سرچینې سره",
      heroSubtitle: "د جستجو د پلورونکو او روښانه نښه شویو بهرنیو سرچینو اعلانونه؛ د اعلانونو شتون په هر ولایت کې توپیر لري.",
      primaryCta: "اعلانونه وګورئ",
      secondaryCta: "اعلان ثبت کړئ",
      allFeatured: "ټول ځانګړي",
      adBadge: "اعلان",
      brandBadge: "جستجو",
      paginationLabel: "د تازه اعلانونو پاڼې",
    };
  }

  return {
    tagline: siteSettings.site_tagline,
    heroTitle: "Fresh listings with clear sources",
    heroSubtitle: "Browse Justujo sellers and clearly labeled external sources. Listing availability varies by province.",
    primaryCta: siteSettings.home_primary_cta_label,
    secondaryCta: siteSettings.home_secondary_cta_label,
    allFeatured: "All featured",
    adBadge: "Ad",
    brandBadge: getLocalizedBrandName(locale, siteSettings.site_name),
    paginationLabel: "Latest listing pages",
  };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
}) {
  const dictionaryPromise = getDictionary();
  const siteSettingsPromise = getSiteSettings();
  const homepageSectionsPromise = getHomepageSections();
  const { t, locale } = await dictionaryPromise;
  const ui = getUiTranslations(locale);
  const href = (path: string) => localizePath(path, locale);
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const pageValue = Array.isArray(resolvedSearchParams.page) ? resolvedSearchParams.page[0] : resolvedSearchParams.page;
  const currentPage = Math.min(Math.max(Number.parseInt(pageValue ?? "1", 10) || 1, 1), 7);
  const pageSize = 10;
  const postAdCreatePath = "/post-ad/create?posting=sell";
  const siteSettings = await siteSettingsPromise;
  const homeCopy = getHomePageCopy(locale, siteSettings);
  const homepageSections = resolveHomepageSections(await homepageSectionsPromise);
  const postAdHref = href(postAdCreatePath);

  const [latest, featured, totalListings, mobileCategories] = await Promise.all([
    getApprovedListings({ locale, limit: pageSize, offset: (currentPage - 1) * pageSize }),
    getApprovedListings({ locale, featuredOnly: true, limit: 4 }),
    getApprovedListingCount(),
    getHomeCategoryNodes(),
  ]);

  const featuredRow = featured.filter((listing) => isFeaturedCurrentlyActive(listing));
  const heroListings = featuredRow.slice(0, 3);
  const totalPages = Math.max(1, Math.min(7, Math.ceil(totalListings / pageSize)));

  return (
    <main className="mx-auto min-h-[calc(100svh-4rem)] w-full max-w-7xl space-y-3 bg-[radial-gradient(circle_at_4%_0%,rgba(126,91,214,0.16),transparent_28%),radial-gradient(circle_at_98%_18%,rgba(255,118,103,0.12),transparent_32%),linear-gradient(180deg,#ffffff_0%,#f5f5fb_46%,#eef0fa_100%)] px-0 pb-28 pt-0 sm:bg-transparent sm:px-4 sm:space-y-4 sm:pb-16 sm:pt-4 lg:min-h-0 lg:px-6">
      <section className="hidden overflow-hidden bg-[radial-gradient(circle_at_17%_10%,rgba(255,189,122,0.34)_0,rgba(76,65,158,0.55)_24%,transparent_50%),radial-gradient(circle_at_92%_100%,rgba(255,118,103,0.22),transparent_38%),linear-gradient(135deg,#10132c_0%,#22265c_54%,#121536_100%)] text-white sm:block sm:rounded-3xl sm:border sm:border-[#ffbd7a]/35 sm:shadow-[0_28px_72px_-25px_rgba(15,16,45,0.70),0_1px_0_rgba(255,255,255,0.1)_inset]">
        <div className={`grid gap-6 px-4 py-7 sm:px-6 lg:px-8 lg:py-10 ${heroListings.length > 0 ? "lg:grid-cols-[1.1fr_0.9fr]" : ""}`}>
          <div>
            <p className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#ffd2a5] backdrop-blur">{homeCopy.tagline}</p>
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
          {heroListings.length > 0 ? <div className="grid grid-cols-3 gap-2 self-end lg:grid-cols-1">
            {heroListings.slice(0, 3).map((listing, index) => {
              const image = listing.listing_images?.[0]?.image_url ?? listing.listing_images?.[0]?.public_url;
              const displayTitle = listing.translated_title || listing.title;
              return (
                <Link key={listing.id} href={href(`/listings/${listing.id}`)} className="group overflow-hidden rounded-3xl border border-white/15 bg-white/10 shadow-2xl backdrop-blur transition hover:-translate-y-1 hover:bg-white/15">
                  <div className="relative h-28 bg-white/10 sm:h-36 lg:h-28">
                    {image ? <Image src={image} alt={displayTitle} fill className="object-contain transition duration-500 group-hover:scale-105" sizes="(max-width: 1024px) 33vw, 320px" /> : null}
                    <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-1 text-[10px] font-bold">#{index + 1}</span>
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-2 text-xs font-bold sm:text-sm">{displayTitle}</p>
                    <p className="mt-1 text-xs font-semibold text-[#ffc58e]">{formatListingPrice(listing, locale)}</p>
                  </div>
                </Link>
              );
            })}
          </div> : null}
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

      <section className="hidden border border-[#e3e5f1] bg-white/90 sm:block sm:rounded-2xl sm:shadow-[0_18px_45px_-34px_rgba(36,31,87,0.32)]">
        <form action={href("/search")} className="grid grid-cols-[1fr_auto] gap-2 p-3 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:p-4">
          <input
            name="q"
            placeholder={t.home.searchPlaceholder}
            className="min-w-0 rounded-xl border border-[#e1e4ef] bg-[#f8f8fc] px-3 py-2.5 text-sm text-[#171936] outline-none transition focus:border-[#8a78e6] focus:ring-2 focus:ring-[#8a78e6]/20"
          />
          <button
            type="submit"
            className="rounded-xl bg-[#5b4cc4] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_22px_-14px_rgba(91,76,196,0.9)] transition hover:bg-[#4939ad]"
          >
            {t.home.searchButton}
          </button>
          <Link
            href={postAdHref}
            className="col-span-2 rounded-xl border border-[#ffb989] bg-[#fff7f2] px-4 py-2.5 text-center text-sm font-semibold text-[#a64736] transition hover:bg-[#ffe9dd] sm:col-span-1"
          >
            {t.home.postAd}
          </Link>
        </form>
      </section>

      <section className="px-0 sm:px-0">
        <CategoryHomeList categories={mobileCategories} locale={locale} />
      </section>

      {featuredRow.length > 0 ? <section className="overflow-hidden border-y border-[#e3e5f1] bg-white sm:rounded-3xl sm:border sm:shadow-[0_22px_52px_-40px_rgba(36,31,87,0.35)]">
        <div className="flex items-center justify-between border-b border-[#e3e5f1] bg-[linear-gradient(90deg,#eeeaff_0%,#fbf9ff_48%,#fff3ee_100%)] px-4 py-3 text-xs font-black uppercase tracking-wide text-[#29254f]">
          {t.home.featuredListings}
          <Link href={href("/featured")} className="rounded-full bg-[#ffe4d5] px-2 py-1 text-[10px] text-[#9a4938]">{homeCopy.allFeatured}</Link>
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
                        <Image src={image} alt={displayTitle} fill className="object-contain" sizes="(max-width: 640px) 160px, 176px" />
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
      </section> : null}

      <section className="overflow-hidden bg-white sm:rounded-3xl sm:border sm:border-[#e3e5f1] sm:shadow-[0_22px_52px_-40px_rgba(36,31,87,0.35)]">
        <div className="border-y border-[#e3e5f1] bg-[linear-gradient(90deg,#eeeaff_0%,#ffffff_54%,#fff1eb_100%)] px-4 py-3 text-xs font-black uppercase tracking-wide text-[#29254f] sm:border-b sm:border-t-0">
          {t.home.latestListings}
        </div>
        <div className="divide-y divide-slate-100 sm:divide-slate-200">
          {latest.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm leading-6 text-slate-600">
              {ui.listingsPage.empty}
            </p>
          ) : null}
          {latest.map((listing, index) => {
            const image = listing.listing_images?.[0]?.image_url ?? listing.listing_images?.[0]?.public_url;
            const displayTitle = listing.translated_title || listing.title;
            const location = getLocalizedListingLocation(listing, locale).label;
            const isLikelyLcpImage = index === 0 && Boolean(image);
            return (
              <Link
                key={listing.id}
                href={href(`/listings/${listing.id}`)}
                className="block p-0 transition hover:bg-[#f8f3e8] sm:grid sm:grid-cols-[6rem_1fr_auto] sm:gap-3 sm:p-3"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-slate-100 sm:h-24 sm:w-24 sm:rounded-2xl sm:shadow-sm">
                  {image ? (
                    <Image
                      src={image}
                      alt={displayTitle}
                      fill
                      className="object-contain"
                      sizes="(max-width: 639px) 100vw, 96px"
                      loading={isLikelyLcpImage ? "eager" : undefined}
                      fetchPriority={isLikelyLcpImage ? "high" : undefined}
                    />
                  ) : null}
                  <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white sm:hidden">{homeCopy.brandBadge}</span>
                </div>
                <div className="min-w-0 px-3 pb-2 pt-2 sm:px-0 sm:pb-0 sm:pt-0">
                  <p className="line-clamp-2 text-base font-semibold text-slate-900 sm:font-normal sm:text-slate-800">{displayTitle}</p>
                  <p className="mt-1 line-clamp-1 text-sm text-slate-500">{location}</p>
                </div>
                <p className="px-3 pb-4 text-lg font-bold text-[var(--accent)] sm:col-span-1 sm:px-0 sm:pb-0 sm:text-xl">
                  {formatListingPrice(listing, locale)}
                </p>
              </Link>
            );
          })}
        </div>
        {totalPages > 1 ? (
          <nav aria-label={homeCopy.paginationLabel} className="flex flex-wrap items-center justify-center gap-2 border-t border-slate-100 bg-white px-3 py-4">
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <Link
                key={page}
                href={href(page === 1 ? "/" : `/?page=${page}`)}
                aria-current={page === currentPage ? "page" : undefined}
                className={`grid h-9 w-9 place-items-center rounded-full text-sm font-bold transition ${page === currentPage ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-700 hover:border-[var(--accent)]"}`}
              >
                {page}
              </Link>
            ))}
          </nav>
        ) : null}
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
          {mobileCategories.length > 0 ? (
            <Link
              href={href(`/categories/${mobileCategories[0].slug}`)}
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
