import Link from "next/link";
import { CategoryCard } from "@/components/category-card";
import { ListingCard } from "@/components/listing-card";
import { CategoryHomeList } from "@/components/categories/CategoryHomeList";
import { AFGHAN_PROVINCES, getProvinceLabel } from "@/lib/constants/marketplace";
import { getHomeCategoryNodes } from "@/lib/categories/getCategories";
import { getCategoriesWithStats } from "@/lib/data/listings";
import { getApprovedListings } from "@/lib/data/queries";
import { getDictionary } from "@/lib/i18n/server";
import { localizeCategoryName } from "@/lib/i18n/category-labels";
import { localizePath } from "@/lib/i18n/routing";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const { t, locale } = await getDictionary();
  const href = (path: string) => localizePath(path, locale);
  const guestPostAdHref = `${href("/login")}?redirect=${encodeURIComponent("/post-ad")}&reason=post`;
  let postAdHref = guestPostAdHref;
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      postAdHref = href("/post-ad");
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
  const launchCategories = categories.filter((category) => ["vehicles", "real-estate", "mobile-phones-tablets", "second-hand-items"].includes(category.slug));
  const comingSoonCategories = categories.filter((category) => !["vehicles", "real-estate", "mobile-phones-tablets", "second-hand-items"].includes(category.slug));

  return (
    <main className="relative overflow-x-clip">
      <div className="hero-glow pointer-events-none absolute inset-x-0 top-0 h-[26rem]" />

      <section className="relative mx-auto w-full max-w-7xl px-4 pb-8 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        <div className="mx-auto w-full max-w-[calc(100vw-2rem)] rounded-3xl border border-[var(--line)] bg-white p-5 shadow-[0_20px_40px_-28px_rgba(0,0,0,0.6)] sm:max-w-none sm:p-8">
          <p className="font-display text-3xl font-bold leading-tight sm:text-5xl">
            {t.home.heroTitle}
          </p>
          <p className="mt-3 max-w-2xl text-[var(--ink-2)]">
            {t.home.heroSubtitle}
          </p>

          <form action={href("/search")} className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,16rem)_minmax(0,16rem)]">
            <input
              name="q"
              placeholder={t.home.searchPlaceholder}
              className="min-w-0 w-full rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3"
            />
            <select
              name="province"
              defaultValue=""
              className="min-w-0 w-full rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3"
            >
              <option value="">{t.home.allAfghanistan}</option>
              {AFGHAN_PROVINCES.map((province) => (
                <option key={province} value={province}>
                  {getProvinceLabel(province, locale)}
                </option>
              ))}
            </select>
            <input
              name="district"
              placeholder={t.home.districtPlaceholder}
              className="min-w-0 w-full rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3 md:col-span-2 lg:col-span-1"
            />
            <button
              type="submit"
              className="w-full rounded-2xl bg-[var(--ink-1)] px-6 py-3 text-sm font-semibold text-white md:col-span-2 lg:col-span-3"
            >
              {t.home.searchButton}
            </button>
          </form>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href={postAdHref}
              className="inline-flex whitespace-nowrap rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
            >
              {t.home.postAd}
            </Link>
            <Link
              href={href("/listings")}
              className="inline-flex whitespace-nowrap rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold"
            >
              {t.home.browseListings}
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
        <h2 className="mb-4 font-display text-2xl font-bold sm:text-3xl">{t.home.mainCategories}</h2>
        <div className="mb-5 block lg:hidden">
          <CategoryHomeList categories={mobileCategories} locale={locale} />
          <Link
            href={href("/categories")}
            className="mt-3 inline-flex rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm font-semibold"
          >
            {t.home.openCategoryBrowser}
          </Link>
        </div>
        <div className="hidden grid-cols-1 gap-4 sm:grid-cols-2 lg:grid lg:grid-cols-4">
          {launchCategories.map((category) => (
            <CategoryCard key={category.id} category={category} locale={locale} />
          ))}
        </div>
        {comingSoonCategories.length > 0 ? (
          <div className="mt-4 hidden lg:block">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-700">{t.home.moreCategories} ({t.home.comingSoon})</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {comingSoonCategories.map((category) => (
                <Link
                  key={category.id}
                  href={href(`/categories/${category.slug}`)}
                  className="min-w-0 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-start"
                >
                  <p className="font-display text-base font-semibold text-[var(--ink-1)]">
                    {localizeCategoryName({ locale, fallbackName: category.name, slug: category.slug })}
                  </p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-amber-700">{t.home.comingSoon}</p>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
        <h2 className="mb-4 font-display text-2xl font-bold sm:text-3xl">{t.home.featuredListings}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(featured.length ? featured : latest.slice(0, 4)).map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-28 sm:px-6 lg:px-8 lg:pb-16">
        <h2 className="mb-4 font-display text-2xl font-bold sm:text-3xl">{t.home.latestListings}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {latest.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>
    </main>
  );
}
