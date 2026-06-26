import Image from "next/image";
import Link from "next/link";
import type { ListingWithImages } from "@/types/database";
import { getDictionary } from "@/lib/i18n/server";

export async function ListingCard({
  listing,
  showStatus = false,
  href,
}: {
  listing: ListingWithImages;
  showStatus?: boolean;
  href?: string;
}) {
  const { t } = await getDictionary();
  const displayTitle = listing.translated_title || listing.title;
  const image = listing.listing_images?.[0]?.image_url ?? listing.listing_images?.[0]?.public_url;
  const listingHref = href ?? `/listings/${listing.id}`;
  const listingType = String((listing as { listing_type?: string }).listing_type ?? "").toLowerCase();
  const isWanted = listingType === "wanted" || /\bwanted\b/i.test(displayTitle);
  const isDormitory = listing.category_node?.path === "real-estate/dormitory" || listing.category_node?.slug === "dormitory";
  const isStudentSuitable = Boolean(listing.suitable_for_students);
  const fallbackProvince = listing.province ?? listing.district ?? "-";
  return (
    <article className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Link href={listingHref}>
        <div className="relative h-44 w-full bg-[var(--surface-2)]">
          {image ? (
            <Image src={image} alt={displayTitle} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-[var(--ink-2)]">{t.postAd.photos}</div>
          )}
          {(isDormitory || isStudentSuitable || isWanted) ? (
            <div className="absolute left-2 top-2 flex flex-wrap gap-1">
              {isWanted ? (
                <span className="rounded-full bg-amber-600 px-2 py-1 text-[10px] font-semibold text-white">{t.listing.wantedAd}</span>
              ) : null}
              {isStudentSuitable ? (
                <span className="rounded-full bg-emerald-600 px-2 py-1 text-[10px] font-semibold text-white">{t.listing.suitableForStudents}</span>
              ) : null}
              {isDormitory ? (
                <span className="rounded-full bg-indigo-600 px-2 py-1 text-[10px] font-semibold text-white">{t.postAd.dormitory}</span>
              ) : null}
            </div>
          ) : null}
        </div>
      </Link>
      <div className="space-y-2 p-4">
        <Link href={listingHref}><h3 className="line-clamp-2 text-base font-semibold text-[var(--ink-1)]">{displayTitle}</h3></Link>
        <p className="text-lg font-bold text-[var(--accent)]">{new Intl.NumberFormat("en-US").format(listing.price)} {listing.currency}</p>
        <p className="line-clamp-1 text-sm text-[var(--ink-2)]">{fallbackProvince}{listing.district ? ` - ${listing.district}` : ""}</p>
        {showStatus ? <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">{listing.status}</p> : null}
      </div>
    </article>
  );
}
