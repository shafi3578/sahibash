import Image from "next/image";
import Link from "next/link";
import type { ListingWithImages } from "@/types/database";

export function ListingCard({ listing, showStatus = false }: { listing: ListingWithImages; showStatus?: boolean }) {
  const image = listing.listing_images?.[0]?.image_url ?? listing.listing_images?.[0]?.public_url;
  const isDormitory = listing.category_node?.path === "real-estate/dormitory" || listing.category_node?.slug === "dormitory";
  const isStudentSuitable = Boolean(listing.suitable_for_students);
  return (
    <article className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Link href={`/listings/${listing.id}`}>
        <div className="relative h-44 w-full bg-[var(--surface-2)]">
          {image ? (
            <Image src={image} alt={listing.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-[var(--ink-2)]">No image</div>
          )}
          {(isDormitory || isStudentSuitable) ? (
            <div className="absolute left-2 top-2 flex flex-wrap gap-1">
              {isStudentSuitable ? (
                <span className="rounded-full bg-emerald-600 px-2 py-1 text-[10px] font-semibold text-white">Suitable for Students</span>
              ) : null}
              {isDormitory ? (
                <span className="rounded-full bg-indigo-600 px-2 py-1 text-[10px] font-semibold text-white">Dormitory</span>
              ) : null}
            </div>
          ) : null}
        </div>
      </Link>
      <div className="space-y-2 p-4">
        <Link href={`/listings/${listing.id}`}><h3 className="line-clamp-2 text-base font-semibold text-[var(--ink-1)]">{listing.title}</h3></Link>
        <p className="text-lg font-bold text-[var(--accent)]">{new Intl.NumberFormat("en-US").format(listing.price)} {listing.currency}</p>
        <p className="line-clamp-1 text-sm text-[var(--ink-2)]">{listing.city} - {listing.district}</p>
        {showStatus ? <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">Status: {listing.status}</p> : null}
      </div>
    </article>
  );
}
