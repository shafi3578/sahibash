import Link from "next/link";
import { CategoryCard } from "@/components/category-card";
import { ListingCard } from "@/components/listing-card";
import { CategoryHomeList } from "@/components/categories/CategoryHomeList";
import { CITIES } from "@/lib/constants/marketplace";
import { getHomeCategoryNodes } from "@/lib/categories/getCategories";
import { getCategoriesWithStats } from "@/lib/data/listings";
import { getApprovedListings } from "@/lib/data/queries";

export default async function HomePage() {
  const [listings, categories, mobileCategories] = await Promise.all([
    getApprovedListings(),
    getCategoriesWithStats(),
    getHomeCategoryNodes(),
  ]);

  const featured = listings.filter((l) => l.featured).slice(0, 4);
  const latest = listings.slice(0, 8);

  return (
    <main className="relative">
      <div className="hero-glow pointer-events-none absolute inset-x-0 top-0 h-[26rem]" />

      <section className="relative mx-auto max-w-7xl px-4 pb-8 pt-8 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-[var(--line)] bg-white p-6 shadow-[0_20px_40px_-28px_rgba(0,0,0,0.6)] sm:p-8">
          <p className="font-display text-4xl font-bold leading-tight sm:text-5xl">
            Find Better Deals Across Afghanistan
          </p>
          <p className="mt-3 max-w-2xl text-[var(--ink-2)]">
            Buy and sell in Vehicles, Real Estate, Mobile Phones & Tablets,
            Electronics, Home Goods, Jobs, Services, and more.
          </p>

          <form action="/search" className="mt-6 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
            <input
              name="q"
              placeholder="Search by title, brand, model..."
              className="w-full rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3"
            />
            <select
              name="city"
              defaultValue=""
              className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3"
            >
              <option value="">All Cities</option>
              {CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-2xl bg-[var(--ink-1)] px-6 py-3 text-sm font-semibold text-white"
            >
              Search
            </button>
          </form>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/post-ad"
              className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
            >
              Post an Ad
            </Link>
            <Link
              href="/listings"
              className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold"
            >
              Browse Listings
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
        <h2 className="mb-4 font-display text-2xl font-bold sm:text-3xl">Main Categories</h2>
        <div className="mb-5 block lg:hidden">
          <CategoryHomeList categories={mobileCategories} />
          <Link
            href="/categories"
            className="mt-3 inline-flex rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm font-semibold"
          >
            Open Full Category Browser
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
        <h2 className="mb-4 font-display text-2xl font-bold sm:text-3xl">Featured Listings</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(featured.length ? featured : latest.slice(0, 4)).map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <h2 className="mb-4 font-display text-2xl font-bold sm:text-3xl">Latest Listings</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {latest.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>
    </main>
  );
}
