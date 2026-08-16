import Image from "next/image";
import Link from "next/link";
import type { ListingWithImages } from "@/types/database";
import { getDictionary } from "@/lib/i18n/server";
import { localizePath } from "@/lib/i18n/routing";
import { getPublishedListingSchema } from "@/lib/data/listing-schema-config";
import { labelForLocale } from "@/lib/listing-schema-config";
import { toggleFavoriteAction } from "@/lib/actions/favorites";
import { formatCurrencyAmount, formatDate } from "@/lib/i18n/format";

export async function ListingCard({
  listing,
  showStatus = false,
  href,
}: {
  listing: ListingWithImages;
  showStatus?: boolean;
  href?: string;
}) {
  const { t, locale } = await getDictionary();
  const displayTitle = listing.translated_title || listing.title;
  const image = listing.listing_images?.[0]?.image_url ?? listing.listing_images?.[0]?.public_url;
  const listingHref = href ?? localizePath(`/listings/${listing.id}`, locale);
  const listingType = String((listing as { listing_type?: string }).listing_type ?? "").toLowerCase();
  const isWanted = listingType === "wanted" || /\bwanted\b/i.test(displayTitle);
  const isDormitory = listing.category_node?.path === "real-estate/dormitory" || listing.category_node?.slug === "dormitory";
  const isStudentSuitable = Boolean(listing.suitable_for_students);
  const fallbackProvince = listing.province ?? listing.district ?? "-";
  const schemaVersion = listing.category_node?.id ? await getPublishedListingSchema(Number(listing.category_node.id)) : null;
  const attributes = new Map(((listing as ListingWithImages & { listing_attributes?: Array<Record<string, unknown>> }).listing_attributes ?? []).map((attribute) => [String(attribute.attribute_key), attribute]));
  const cardFields = (schemaVersion?.config.fields ?? []).filter((field) => field.active && field.card).sort((a, b) => a.order - b.order).slice(0, 4).flatMap((field) => {
    const attribute = attributes.get(field.key);
    const direct = (listing as unknown as Record<string, unknown>)[field.key];
    const raw = direct ?? attribute?.attribute_value_text ?? attribute?.attribute_value_number ?? attribute?.attribute_value_boolean;
    if (raw === null || raw === undefined || raw === "") return [];
    const option = field.options.find((item) => item.value === String(raw));
    return [{ key: field.key, label: labelForLocale(field.labels, locale), value: option ? labelForLocale(option.labels, locale) : typeof raw === "boolean" ? (raw ? t.search.yes : t.search.no) : String(raw) }];
  });
  const freshness = formatDate(listing.created_at, locale, { month: "short", day: "numeric" });
  return (
    <article className="relative overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <form action={async () => { "use server"; await toggleFavoriteAction(listing.id); }} className="absolute end-2 top-2 z-10">
        <button aria-label={t.listing.addToFavorites} className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-xl shadow-sm backdrop-blur">♡</button>
      </form>
      <Link href={listingHref}>
        <div className="relative aspect-[4/3] w-full bg-[var(--surface-2)]">
          {image ? (
            <Image src={image} alt={displayTitle} fill className="object-cover" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" />
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
      <div className="space-y-1.5 p-3 sm:p-4">
        <Link href={listingHref}><h3 className="line-clamp-2 text-base font-semibold text-[var(--ink-1)]">{displayTitle}</h3></Link>
        <p className="text-lg font-bold text-[var(--accent)]">{formatCurrencyAmount(listing.price, listing.currency, locale)}</p>
        <p className="line-clamp-1 text-xs text-[var(--ink-2)]">{fallbackProvince}{listing.district ? ` · ${listing.district}` : ""} · {freshness}</p>
        {cardFields.length > 0 ? <div className="flex flex-wrap gap-1.5">{cardFields.slice(0,2).map((field) => <span key={field.key} className="rounded-full bg-[var(--surface-2)] px-2 py-1 text-[10px] text-[var(--ink-2)]">{field.value}</span>)}</div> : null}
        {showStatus ? <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">{listing.status}</p> : null}
      </div>
    </article>
  );
}
