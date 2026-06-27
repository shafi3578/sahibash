import Image from "next/image";
import Link from "next/link";
import { CategoryHomeList } from "@/components/categories/CategoryHomeList";
import { getHomeCategoryNodes } from "@/lib/categories/getCategories";
import { getCategoriesWithStats } from "@/lib/data/listings";
import { getApprovedListings } from "@/lib/data/queries";
import { getDictionary } from "@/lib/i18n/server";
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
  const featuredRow = featured.length ? featured : latest.slice(0, 6);

  return (
    <main className="mx-auto w-full max-w-7xl space-y-4 px-0 pb-28 pt-4 sm:px-4 sm:pb-16 lg:px-6">
      <section className="border-y border-slate-200 bg-white sm:rounded-2xl sm:border sm:shadow-sm">
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
