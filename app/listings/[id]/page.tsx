import { notFound } from "next/navigation";
import { getListingById } from "@/lib/data/queries";
import Link from "next/link";
import { toggleFavoriteAction } from "@/lib/actions/favorites";
import { createReportAction } from "@/lib/actions/reports";
import { getCurrentUser } from "@/lib/auth";
import { sendListingMessageAction } from "@/lib/actions/messages";
import { createOfferAction } from "@/lib/actions/offers";
import { reportListingTranslationIssueAction } from "@/lib/actions/translations";
import { localizeCategoryName } from "@/lib/i18n/category-labels";
import { buildActiveListingSchemaView } from "@/lib/listingSchemas";
import { ListingGallery } from "@/components/listings/listing-gallery";
import { VehicleDamageCard } from "@/components/vehicles/VehicleDamageCard";
import LocationCard from "@/components/location/LocationCard";
import type { LocationVisibility } from "@/components/location/LocationCard";
import { CategorySpecificDetails, ListingQuickFacts, SafetyTips } from "@/components/listings/listing-schema-sections";
import { getDictionary } from "@/lib/i18n/server";
import { appLocaleToListingLanguage } from "@/lib/listings/translation-service";
import { recordSearchTelemetryClick } from "@/lib/search/telemetry";

type NamedLocationRelation = { name?: string | null } | null;
type VehicleDamagePart = { part_key: string; part_label: string; condition: string };
type VehicleDamagePayload = {
  all_original: boolean;
  vehicle_damage_parts?: VehicleDamagePart[] | null;
};

function readAttributeValue(value: unknown, locale: "en" | "fa" | "ps") {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") {
    if (locale === "fa") return value ? "بلی" : "خیر";
    if (locale === "ps") return value ? "هو" : "نه";
    return value ? "Yes" : "No";
  }
  return "";
}

function isMeaningfulValue(value: string | string[] | null | undefined): boolean {
  if (Array.isArray(value)) {
    return value.some((item) => isMeaningfulValue(item));
  }

  const normalized = String(value ?? "").trim();
  return (
    normalized.length > 0
    && normalized !== "-"
    && normalized.toLowerCase() !== "null"
    && normalized.toLowerCase() !== "undefined"
  );
}

export default async function ListingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string; offer?: string; compose?: string; offerbox?: string; view?: string; translation?: string; st?: string }>;
}) {
  const { t, locale } = await getDictionary();
  const { id } = await params;
  const qp = await searchParams;
  const listing = await getListingById(id, locale);
  if (!listing) notFound();
  await recordSearchTelemetryClick(qp.st, id);
  const viewerLanguageCode = appLocaleToListingLanguage(locale);
  const showOriginal = qp.view === "original";
  const translationUnavailable = !showOriginal && viewerLanguageCode !== listing.display_language;
  const displayTitle = showOriginal
    ? (listing.original_title || listing.title)
    : (listing.translated_title || listing.title);
  const displayDescription = showOriginal
    ? (listing.original_description || listing.description)
    : (listing.translated_description || listing.description);

  const currentUser = await getCurrentUser();
  const isOwner = currentUser?.id === listing.user_id;
  const callHref = `tel:${listing.contact_phone.replace(/[^\d+]/g, "")}`;
  const originalLanguageCode = String(listing.original_locale || listing.original_language || "").toLowerCase();
  const englishLabel = locale === "fa" ? "انگلیسی" : locale === "ps" ? "انګلیسي" : "English";
  const dariLabel = locale === "ps" ? "دري" : "دری";
  const pashtoLabel = locale === "fa" ? "پشتو" : "پښتو";
  const translationLanguageLabel = originalLanguageCode.startsWith("fa")
    ? dariLabel
    : originalLanguageCode.startsWith("ps")
      ? pashtoLabel
      : englishLabel;
  const translationNote = locale === "en"
    ? (listing.translation_note || `${t.listing.originalLanguage}: ${translationLanguageLabel}`)
    : `${t.listing.originalLanguage}: ${translationLanguageLabel}`;
  const schemaView = buildActiveListingSchemaView(listing, locale);
  const attributeMap = new Map(
    (listing.listing_attributes ?? [])
      .filter((item) => Boolean(item.attribute_key))
      .map((item) => {
        const value = item.attribute_value_text ?? item.attribute_value_number ?? item.attribute_value_boolean ?? "";
        return [item.attribute_key, readAttributeValue(value, locale)];
      })
  );
  const categoryLabel = [
    localizeCategoryName({ locale, fallbackName: listing.category?.name ?? t.listing.category, slug: listing.category?.slug, path: listing.category?.slug }),
    localizeCategoryName({ locale, fallbackName: listing.category_node?.name ?? "", slug: listing.category_node?.slug, path: listing.category_node?.path }),
  ]
    .filter((value) => Boolean(value) && value.trim().length > 0)
    .join(" > ");
  const locationParts = listing.location_visibility === "exact"
    ? [listing.province, listing.district, listing.neighborhood || attributeMap.get("neighborhood") || listing.address_optional].filter(Boolean)
    : [listing.province, listing.district].filter(Boolean);
  const listingTypeValue = String(
    (listing as { listing_type?: string }).listing_type
    ?? attributeMap.get("listing_type")
    ?? attributeMap.get("listing_purpose")
    ?? attributeMap.get("rental_type")
    ?? ""
  ).toLowerCase();
  const isWanted = listingTypeValue.includes("wanted") || /\bwanted\b/i.test(displayTitle);
  const videoUrl = listing.video_url || attributeMap.get("video_url") || "";
  const dateLocale = locale === "fa" ? "fa-AF" : locale === "ps" ? "ps-AF" : "en-US";
  const postedDate = new Date(listing.created_at).toLocaleDateString(dateLocale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const sellerJoinedDate = listing.profile?.created_at
    ? new Date(listing.profile.created_at).toLocaleDateString(dateLocale, {
        year: "numeric",
        month: "short",
      })
    : null;
  const safeSellerName = listing.contact_name || listing.profile?.full_name || t.listing.sellerFallback;
  const safeSellerPhone = listing.contact_phone || listing.profile?.phone || t.listing.notProvided;
  const categorySpecificSections = schemaView.sections;
  const quickFacts = schemaView.quickFacts;
  const quickFactKeys = new Set(quickFacts.map((item) => item.key));
  const autoFilledSpecifications = schemaView.autoFilled.filter(
    (item) => isMeaningfulValue(item.value) && !quickFactKeys.has(item.key)
  );
  const categoryDetailsEmptyText = locale === "fa"
    ? "فروشنده هنوز مشخصات ساختاری این دسته را وارد نکرده است."
    : locale === "ps"
      ? "پلورونکي لا د دې کټګورۍ جوړښتي مشخصات نه دي داخل کړي."
      : "The seller has not provided structured specifications for this category yet.";
  const safetyTips = schemaView.safetyTips.length > 0 ? schemaView.safetyTips : [t.listing.safety1, t.listing.safety2, t.listing.safety3, t.listing.safety4];

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {qp.message === "sent" && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {t.listing.sendMessage}.
        </div>
      )}
      {qp.message === "invalid" && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {t.listing.messageInvalid}
        </div>
      )}
      {qp.message === "error" && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {t.listing.messageError}
        </div>
      )}
      {qp.offer === "sent" && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {t.listing.offerSent}
        </div>
      )}
      {qp.offer === "too-low" && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {t.listing.offerTooLow}
        </div>
      )}
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link href="/listings" className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm font-semibold">
          {t.listing.backToListings}
        </Link>
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-2)]">{categoryLabel || t.listing.category}</p>
      </div>
      <div className="space-y-4 pb-20 sm:pb-0">
        <ListingGallery images={listing.listing_images ?? []} title={displayTitle} />

        <section className="rounded-2xl border border-[var(--line)] bg-white p-4 sm:p-5">
          {isWanted ? (
            <p className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
              {t.listing.wantedAd}
            </p>
          ) : null}
          <h1 className="mt-1 font-display text-2xl font-bold leading-tight sm:text-3xl">{displayTitle}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-2 py-1 text-[var(--ink-2)]">
              {translationNote}
            </span>
            {showOriginal ? (
              <Link href={`/listings/${listing.id}`} className="rounded-full border border-[var(--line)] px-2 py-1 font-semibold">
                {t.listing.showTranslated}
              </Link>
            ) : (
              <Link href={`/listings/${listing.id}?view=original`} className="rounded-full border border-[var(--line)] px-2 py-1 font-semibold">
                {t.listing.viewOriginal}
              </Link>
            )}
          </div>
          {listing.suitable_for_students ? (
            <p className="mt-2 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
              {t.listing.suitableForStudents}
            </p>
          ) : null}
          <p className="mt-3 text-3xl font-bold text-[var(--accent)]">{new Intl.NumberFormat("en-US").format(listing.price)} {listing.currency}</p>
          <div className="mt-4 grid gap-2 border-t border-[var(--line)] pt-3 text-sm text-[var(--ink-2)] sm:grid-cols-2">
            {locationParts.length > 0 ? <p>{locationParts.join(" / ")}</p> : null}
            <p className="sm:text-right">{t.listing.posted}: {postedDate}</p>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--line)] bg-white p-4 sm:p-5">
          <h2 className="text-base font-bold">{t.listing.sellerInformation}</h2>
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <p><span className="text-[var(--ink-2)]">{t.listing.name}:</span> <span className="font-semibold">{safeSellerName}</span></p>
            <p><span className="text-[var(--ink-2)]">{t.listing.phone}:</span> <span className="font-semibold">{safeSellerPhone}</span></p>
            {sellerJoinedDate ? (
              <p><span className="text-[var(--ink-2)]">{t.listing.joined}:</span> <span className="font-semibold">{sellerJoinedDate}</span></p>
            ) : null}
          </div>
          {listing.minimum_offer ? (
            <p className="mt-2 text-sm text-[var(--ink-2)]">{t.listing.minimumOffer}: {new Intl.NumberFormat("en-US").format(listing.minimum_offer)} {listing.currency}</p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            {listing.contact_phone ? (
              <a href={callHref} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">{t.listing.callSeller}</a>
            ) : null}
            {!isOwner ? (
              <Link href={`/listings/${listing.id}?compose=1`} className="rounded-lg bg-[var(--ink-1)] px-4 py-2 text-sm font-semibold text-white">{t.listing.message}</Link>
            ) : null}
            {!isOwner ? (
              <Link href={`/listings/${listing.id}?offerbox=1`} className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white">{t.listing.offer}</Link>
            ) : null}
          </div>
        </section>

        <ListingQuickFacts rows={quickFacts} autoFilledLabel={t.listing.autoFilledSpecifications} />

        {listing.province_id && listing.district_id && (
          <LocationCard
            location={{
              countryId: listing.country_id,
              provinceId: listing.province_id,
              districtId: listing.district_id,
              areaId: listing.area_id,
              provinceName: (listing.provinces as NamedLocationRelation)?.name,
              districtName: (listing.districts as NamedLocationRelation)?.name,
              areaName: (listing.areas as NamedLocationRelation)?.name,
              addressText: listing.location_visibility === "exact" ? listing.address_text : null,
              latitude: listing.location_visibility === "exact" ? listing.latitude : null,
              longitude: listing.location_visibility === "exact" ? listing.longitude : null,
              accuracy: listing.location_accuracy,
              visibility: listing.location_visibility as LocationVisibility,
            }}
            locale={locale}
          />
        )}

        {listing.vehicle_damage ? (
          <VehicleDamageCard
            allOriginal={(listing.vehicle_damage as VehicleDamagePayload).all_original}
            parts={((listing.vehicle_damage as VehicleDamagePayload).vehicle_damage_parts ?? []).map((p: VehicleDamagePart) => ({
              part_key: p.part_key,
              part_label: p.part_label,
              condition: p.condition,
            }))}
          />
        ) : null}

        <CategorySpecificDetails sections={categorySpecificSections} emptyStateText={categoryDetailsEmptyText} />

        {autoFilledSpecifications.length > 0 ? (
          <section className="rounded-2xl border border-[var(--line)] bg-white p-4 sm:p-5">
            <h2 className="text-base font-bold">{t.listing.autoFilledSpecifications}</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {autoFilledSpecifications.map((row) => (
                <div key={row.key} className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-2)]">{row.label}</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--ink-1)]">{Array.isArray(row.value) ? row.value.join(", ") : row.value}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="rounded-2xl border border-[var(--line)] bg-white p-4 sm:p-5">
          <h2 className="text-base font-bold">{t.listing.description}</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[var(--ink-1)]">{displayDescription}</p>
          {videoUrl ? (
            <div className="mt-4 border-t border-[var(--line)] pt-3 text-sm">
              <p className="font-semibold">{t.listing.video}</p>
              <a href={videoUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex text-[var(--accent)] underline underline-offset-2">
                {t.listing.openVehicleVideo}
              </a>
            </div>
          ) : null}
        </section>

        <SafetyTips title={t.listing.buyerSafetyWarning} tips={safetyTips} />
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <form action={async () => { "use server"; await toggleFavoriteAction(listing.id); }}>
          <button className="rounded-lg border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold">{t.listing.addToFavorites}</button>
        </form>
        <form action={createReportAction} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="listingId" value={listing.id} />
          <select name="reason" required defaultValue="" className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm">
            <option value="" disabled>{t.listing.selectReportReason}</option>
            <option value={t.listing.fraudOrScam}>{t.listing.fraudOrScam}</option>
            <option value={t.listing.wrongCategory}>{t.listing.wrongCategory}</option>
            <option value={t.listing.duplicateListing}>{t.listing.duplicateListing}</option>
            <option value={t.listing.prohibitedOrUnsafeItem}>{t.listing.prohibitedOrUnsafeItem}</option>
            <option value={t.listing.spamOrMisleading}>{t.listing.spamOrMisleading}</option>
            <option value={t.listing.other}>{t.listing.other}</option>
          </select>
          <input name="details" placeholder={t.listing.optionalDetails} className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm" />
          <button className="rounded-lg bg-[var(--ink-1)] px-4 py-2 text-sm font-semibold text-white">{t.listing.reportListing}</button>
        </form>
        <form action={reportListingTranslationIssueAction} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="listingId" value={listing.id} />
          <input type="hidden" name="languageCode" value={viewerLanguageCode} />
          <input
            name="details"
            placeholder={t.listing.reportTranslationIssue}
            className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm"
          />
          <button className="rounded-lg border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold">
            {t.listing.reportTranslationIssue}
          </button>
        </form>
      </div>

      {(qp.translation === "unavailable" || translationUnavailable) ? (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {t.listing.translationUnavailable}
        </div>
      ) : null}

      {!isOwner ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-white/95 px-4 py-3 backdrop-blur sm:hidden">
          <div className="mx-auto flex w-full max-w-5xl gap-2">
            {listing.contact_phone ? (
              <a href={callHref} className="rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white">{t.listing.call}</a>
            ) : null}
            <Link href={`/listings/${listing.id}?compose=1`} className="flex-1 rounded-lg bg-[var(--ink-1)] px-4 py-3 text-center text-sm font-semibold text-white">{t.listing.message}</Link>
            <Link href={`/listings/${listing.id}?offerbox=1`} className="flex-1 rounded-lg bg-[var(--accent)] px-4 py-3 text-center text-sm font-semibold text-white">{t.listing.offer}</Link>
          </div>
        </div>
      ) : null}

      {qp.compose === "1" && !isOwner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">{t.listing.sendMessage}</h3>
              <Link href={`/listings/${listing.id}`} className="rounded px-2 py-1 text-sm text-[var(--ink-2)] hover:bg-[var(--surface-2)]">
                {t.listing.close}
              </Link>
            </div>
            <form action={sendListingMessageAction} className="space-y-3">
              <input type="hidden" name="listingId" value={listing.id} />
              <textarea
                name="body"
                required
                minLength={2}
                placeholder={t.listing.hiAvailability}
                className="min-h-28 w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm"
              />
              <button className="rounded-lg bg-[var(--ink-1)] px-4 py-2 text-sm font-semibold text-white">
                {t.listing.sendMessage}
              </button>
            </form>
          </div>
        </div>
      )}

      {qp.offerbox === "1" && !isOwner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">{t.listing.sendYourOffer}</h3>
              <Link href={`/listings/${listing.id}`} className="rounded px-2 py-1 text-sm text-[var(--ink-2)] hover:bg-[var(--surface-2)]">
                {t.listing.close}
              </Link>
            </div>
            {listing.minimum_offer ? (
              <p className="mb-3 text-sm text-[var(--ink-2)]">
                {t.listing.minimumOffer}: {new Intl.NumberFormat("en-US").format(listing.minimum_offer)} {listing.currency}
              </p>
            ) : null}
            <form action={createOfferAction} className="space-y-3">
              <input type="hidden" name="listingId" value={listing.id} />
              <input
                name="offeredPrice"
                type="number"
                min={listing.minimum_offer ?? 1}
                required
                placeholder={t.listing.enterOfferedPrice}
                className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm"
              />
              <textarea
                name="buyerNote"
                placeholder={t.listing.optionalNoteToSeller}
                className="min-h-20 w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm"
              />
              <button className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white">
                {t.listing.sendOffer}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
