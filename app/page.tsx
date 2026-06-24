import Link from "next/link";
import { CategoryCard } from "@/components/category-card";
import { ListingCard } from "@/components/listing-card";
import { CategoryHomeList } from "@/components/categories/CategoryHomeList";
import { AFGHAN_PROVINCES } from "@/lib/constants/marketplace";
import { getHomeCategoryNodes } from "@/lib/categories/getCategories";
import { getCategoriesWithStats } from "@/lib/data/listings";
import { getApprovedListings } from "@/lib/data/queries";
import { getDictionary } from "@/lib/i18n/server";

export default async function HomePage() {
  const { t, locale } = await getDictionary();
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
    <main className="relative">
      <div className="hero-glow pointer-events-none absolute inset-x-0 top-0 h-[26rem]" />

      <section className="relative mx-auto max-w-7xl px-4 pb-8 pt-8 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-[var(--line)] bg-white p-6 shadow-[0_20px_40px_-28px_rgba(0,0,0,0.6)] sm:p-8">
          <p className="font-display text-4xl font-bold leading-tight sm:text-5xl">
            {t.home.heroTitle}
          </p>
          <p className="mt-3 max-w-2xl text-[var(--ink-2)]">
            {t.home.heroSubtitle}
          </p>

          <form action="/search" className="mt-6 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
            <input
              name="q"
              placeholder={t.home.searchPlaceholder}
              className="w-full rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3"
            />
            <select
              name="province"
              defaultValue=""
              className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3"
            >
              <option value="">{t.home.allAfghanistan}</option>
              {AFGHAN_PROVINCES.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </select>
            <input
              name="district"
              placeholder={t.home.districtPlaceholder}
              className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3"
            />
            <button
              type="submit"
              className="rounded-2xl bg-[var(--ink-1)] px-6 py-3 text-sm font-semibold text-white lg:col-span-3"
            >
              {t.home.searchButton}
            </button>
          </form>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/post-ad"
              className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
            >
              {t.home.postAd}
            </Link>
            <Link
              href="/listings"
              className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold"
            >
              {t.home.browseListings}
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
        <h2 className="mb-4 font-display text-2xl font-bold sm:text-3xl">{t.home.mainCategories}</h2>
        <div className="mb-5 block lg:hidden">
          <CategoryHomeList categories={mobileCategories} />
          <Link
            href="/categories"
            className="mt-3 inline-flex rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm font-semibold"
          >
            {t.home.openCategoryBrowser}
          </Link>
        </div>
        <div className="hidden grid-cols-1 gap-4 sm:grid-cols-2 lg:grid lg:grid-cols-4">
          {launchCategories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
        {comingSoonCategories.length > 0 ? (
          <div className="mt-4 hidden lg:block">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-700">{t.home.moreCategories} ({t.home.comingSoon})</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {comingSoonCategories.map((category) => (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left"
                >
                  <p className="font-display text-base font-semibold text-[var(--ink-1)]">{category.name}</p>
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

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
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
