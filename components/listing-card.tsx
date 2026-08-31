import Image from "next/image";
import Link from "next/link";
import type { ListingWithImages } from "@/types/database";
import { getDictionary } from "@/lib/i18n/server";
import { localizePath } from "@/lib/i18n/routing";
import { toggleFavoriteAction } from "@/lib/actions/favorites";
import { formatDate } from "@/lib/i18n/format";
import { getSourceTransparency } from "@/lib/inventory/provenance";
import { formatListingPrice } from "@/lib/listings/price-display";
import { isFeaturedCurrentlyActive } from "@/lib/data/featured-payments";

const CARD_FACT_LABELS = {
  en: {
    condition: "Condition",
    mileage: "Mileage",
    year: "Year",
    storage: "Storage",
    ram: "RAM",
    rooms: "Rooms",
    area_sqm: "Area",
  },
  fa: {
    condition: "وضعیت",
    mileage: "کارکرد",
    year: "سال",
    storage: "حافظه",
    ram: "رم",
    rooms: "اتاق",
    area_sqm: "مساحت",
  },
  ps: {
    condition: "حالت",
    mileage: "کارېدنه",
    year: "کال",
    storage: "حافظه",
    ram: "رم",
    rooms: "خونې",
    area_sqm: "مساحت",
  },
} as const;

const CARD_FACT_ORDER = ["condition", "mileage", "year", "storage", "ram", "rooms", "area_sqm"] as const;

function readAttributeValue(attribute: Record<string, unknown> | undefined) {
  if (!attribute) return null;
  return (
    attribute.attribute_value_text
    ?? attribute.attribute_value_number
    ?? attribute.attribute_value_boolean
    ?? attribute.attribute_value_json
    ?? null
  );
}

function buildCardFacts(
  attributes: Map<string, Record<string, unknown>>,
  locale: keyof typeof CARD_FACT_LABELS
) {
  return CARD_FACT_ORDER.flatMap((key) => {
    const raw = readAttributeValue(attributes.get(key));
    if (raw === null || raw === undefined || raw === "") return [];
    const value = typeof raw === "boolean"
      ? raw
        ? (locale === "fa" ? "بلی" : locale === "ps" ? "هو" : "Yes")
        : (locale === "fa" ? "خیر" : locale === "ps" ? "نه" : "No")
      : String(raw);

    return [{ key, label: CARD_FACT_LABELS[locale][key], value }];
  }).slice(0, 2);
}

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
  const isFeatured = isFeaturedCurrentlyActive(listing);
  const fallbackProvince = listing.province ?? listing.district ?? "-";
  const attributes = new Map(
    ((listing as ListingWithImages & { listing_attributes?: Array<Record<string, unknown>> }).listing_attributes ?? [])
      .map((attribute) => [String(attribute.attribute_key), attribute])
  );
  const cardFields = buildCardFacts(attributes, locale);
  const freshness = formatDate(listing.created_at, locale, { month: "short", day: "numeric" });
  const sourceTransparency = getSourceTransparency(listing, locale);
  return (
    <article className="relative overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <form action={async () => { "use server"; await toggleFavoriteAction(listing.id); }} className="absolute end-2 top-2 z-10">
        <button aria-label={t.listing.addToFavorites} className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-xl shadow-sm backdrop-blur">♡</button>
      </form>
      <Link href={listingHref}>
        <div className="relative aspect-[4/3] w-full bg-[var(--surface-2)]">
          {image ? (
            <Image src={image} alt={displayTitle} fill className="object-contain" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-[var(--ink-2)]">{t.postAd.photos}</div>
          )}
          {(isFeatured || sourceTransparency.isExternal || isDormitory || isStudentSuitable || isWanted) ? (
            <div className="absolute left-2 top-2 flex flex-wrap gap-1">
              {isFeatured ? (
                <span className="rounded-full bg-amber-500 px-2 py-1 text-[10px] font-black text-white shadow-sm">
                  {locale === "fa" ? "ویژه" : locale === "ps" ? "ځانګړی" : "Featured"}
                </span>
              ) : null}
              {sourceTransparency.isExternal ? (
                <span className="rounded-full bg-slate-900/85 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur">{sourceTransparency.sourceLabel}</span>
              ) : null}
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
        <p className="text-lg font-bold text-[var(--accent)]">{formatListingPrice(listing, locale, attributes)}</p>
        <p className="line-clamp-1 text-xs text-[var(--ink-2)]">{fallbackProvince}{listing.district ? ` · ${listing.district}` : ""} · {freshness}</p>
        {sourceTransparency.needsAvailabilityWarning ? <p className="text-[11px] font-semibold text-amber-700">{sourceTransparency.freshnessLabel}</p> : null}
        {cardFields.length > 0 ? <div className="flex flex-wrap gap-1.5">{cardFields.slice(0,2).map((field) => <span key={field.key} className="rounded-full bg-[var(--surface-2)] px-2 py-1 text-[10px] text-[var(--ink-2)]">{field.value}</span>)}</div> : null}
        {showStatus ? <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">{listing.status}</p> : null}
      </div>
    </article>
  );
}
