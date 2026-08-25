import Image from "next/image";
import Link from "next/link";
import { getApprovedListings } from "@/lib/data/queries";
import { isFeaturedCurrentlyActive } from "@/lib/data/featured-payments";
import { getDictionary } from "@/lib/i18n/server";
import { localizePath } from "@/lib/i18n/routing";
import { formatListingPrice } from "@/lib/listings/price-display";

export default async function FeaturedPage() {
  const { locale, t } = await getDictionary();
  const href = (path: string) => localizePath(path, locale);
  const copy = locale === "fa"
    ? { empty: "هنوز اعلان ویژه‌ای وجود ندارد.", featured: "ویژه" }
    : locale === "ps"
      ? { empty: "لا تر اوسه ځانګړی اعلان نشته.", featured: "ځانګړی" }
      : { empty: "No featured ads yet.", featured: "Featured" };
  const listings = (await getApprovedListings({ locale, limit: 80 })).filter((listing) => isFeaturedCurrentlyActive(listing));

  return (
    <main className="mx-auto w-full max-w-7xl bg-[#f7f8fb] px-0 pb-28 sm:bg-transparent sm:px-4 sm:pb-16 lg:px-6">
      <div className="border-b border-slate-200 bg-white px-4 py-4 sm:mt-4 sm:rounded-3xl sm:border">
        <Link href={href("/")} className="text-sm font-semibold text-[var(--accent)]">← {t.home.browseListings}</Link>
        <h1 className="mt-3 font-display text-3xl font-black text-slate-950">{t.home.featuredListings}</h1>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((listing) => {
          const image = listing.listing_images?.[0]?.image_url ?? listing.listing_images?.[0]?.public_url;
          const displayTitle = listing.translated_title || listing.title;
          return (
            <Link key={listing.id} href={href(`/listings/${listing.id}`)} className="overflow-hidden bg-white shadow-sm sm:rounded-3xl sm:border sm:border-slate-200">
              <div className="relative aspect-video w-full bg-slate-100">
                {image ? <Image src={image} alt={displayTitle} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 420px" /> : null}
                <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">{copy.featured}</span>
              </div>
              <div className="p-3">
                <p className="line-clamp-2 text-base font-bold text-slate-950">{displayTitle}</p>
                <p className="mt-1 text-sm text-slate-500">{listing.province ?? listing.district ?? "-"}</p>
                <p className="mt-2 text-lg font-black text-[#2563eb]">{formatListingPrice(listing, locale)}</p>
              </div>
            </Link>
          );
        })}
      </div>
      {listings.length === 0 ? (
        <div className="mt-3 rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          {copy.empty}
        </div>
      ) : null}
    </main>
  );
}
