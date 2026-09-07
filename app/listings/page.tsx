import { ListingCard } from "@/components/listing-card";
import Link from "next/link";
import { getApprovedListingCount, getApprovedListings } from "@/lib/data/queries";
import { getDictionary } from "@/lib/i18n/server";
import { localizePath } from "@/lib/i18n/routing";
import { getUiTranslations } from "@/lib/i18n/ui";

export default async function ListingsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
}) {
  const { locale } = await getDictionary();
  const ui = getUiTranslations(locale);
  const resolved = searchParams ? await searchParams : {};
  const rawPage = Array.isArray(resolved.page) ? resolved.page[0] : resolved.page;
  const pageSize = 20;
  const requestedPage = Math.max(Number.parseInt(rawPage ?? "1", 10) || 1, 1);
  const total = await getApprovedListingCount();
  const totalPages = Math.max(1, Math.min(7, Math.ceil(total / pageSize)));
  const currentPage = Math.min(requestedPage, totalPages);
  const listings = await getApprovedListings({
    locale,
    limit: pageSize,
    offset: (currentPage - 1) * pageSize,
  });
  const href = (page: number) => localizePath(page === 1 ? "/listings" : `/listings?page=${page}`, locale);
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold">{ui.listingsPage.allListings}</h1>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
      </div>
      {listings.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-[var(--line)] bg-white p-8 text-center text-sm text-[var(--ink-2)]">
          {ui.listingsPage.empty}
        </div>
      ) : null}
      {totalPages > 1 ? (
        <nav aria-label="Listing pages" className="mt-8 flex flex-wrap items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
            <Link
              key={page}
              href={href(page)}
              aria-current={page === currentPage ? "page" : undefined}
              className={`grid h-10 w-10 place-items-center rounded-full text-sm font-bold transition ${page === currentPage ? "bg-[var(--ink-1)] text-white" : "border border-[var(--line)] bg-white text-[var(--ink-1)] hover:border-[var(--accent)]"}`}
            >
              {page}
            </Link>
          ))}
        </nav>
      ) : null}
    </main>
  );
}
