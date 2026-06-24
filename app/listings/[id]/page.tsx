import { notFound } from "next/navigation";
import { getListingById } from "@/lib/data/queries";
import Link from "next/link";
import { toggleFavoriteAction } from "@/lib/actions/favorites";
import { createReportAction } from "@/lib/actions/reports";
import { getCurrentUser } from "@/lib/auth";
import { sendListingMessageAction } from "@/lib/actions/messages";
import { createOfferAction } from "@/lib/actions/offers";
import { getCategoryFieldsWithOptions } from "@/lib/data/queries";
import { buildListingSpecView } from "@/lib/listings/detailSpecs";
import { ListingGallery } from "@/components/listings/listing-gallery";
import { VehicleDamageCard } from "@/components/vehicles/VehicleDamageCard";
import LocationCard from "@/components/location/LocationCard";
import { getDictionary } from "@/lib/i18n/server";

function readAttributeValue(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return "";
}

export default async function ListingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string; offer?: string; compose?: string; offerbox?: string }>;
}) {
  const { t } = await getDictionary();
  const { id } = await params;
  const qp = await searchParams;
  const listing = await getListingById(id);
  if (!listing) notFound();

  const currentUser = await getCurrentUser();
  const isOwner = currentUser?.id === listing.user_id;
  const callHref = `tel:${listing.contact_phone.replace(/[^\d+]/g, "")}`;
  const fields = await getCategoryFieldsWithOptions(listing.category_node_id);
  const attrs = (listing.listing_attributes ?? []).filter((item) => Boolean(item.attribute_key));
  const specView = buildListingSpecView(listing, fields, attrs);
  const attributeMap = new Map(
    attrs.map((item) => {
      const value = item.attribute_value_text ?? item.attribute_value_number ?? item.attribute_value_boolean ?? "";
      return [item.attribute_key, readAttributeValue(value)];
    })
  );
  const categoryLabel = [listing.category?.name, listing.category_node?.name].filter(Boolean).join(" > ");
  const locationParts = [listing.province, listing.district, listing.neighborhood || attributeMap.get("neighborhood") || listing.address_optional].filter(Boolean);
  const listingTypeValue = String(
    (listing as { listing_type?: string }).listing_type
    ?? attributeMap.get("listing_type")
    ?? attributeMap.get("listing_purpose")
    ?? attributeMap.get("rental_type")
    ?? ""
  ).toLowerCase();
  const isWanted = listingTypeValue.includes("wanted") || /\bwanted\b/i.test(listing.title);
  const videoUrl = listing.video_url || attributeMap.get("video_url") || "";
  const postedDate = new Date(listing.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const sellerJoinedDate = listing.profile?.created_at
    ? new Date(listing.profile.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      })
    : null;
  const sellerName = listing.contact_name || listing.profile?.full_name || "Seller";
  const sellerPhone = listing.contact_phone || listing.profile?.phone || "Not provided";
  const groupedSpecs = Object.entries(specView.grouped)
    .filter(([, rows]) => rows.length > 0)
    .sort(([a], [b]) => {
      const order = ["locked_specs", "property_details", "category_specific", "interior_features", "exterior_features", "location_nearby", "transportation", "view", "utilities"];
      const aIndex = order.indexOf(a);
      const bIndex = order.indexOf(b);
      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  const vehicleVariant = listing.vehicle_variant as ({
    name: string;
    fuel_type?: string | null;
    transmission?: string | null;
    body_type?: string | null;
    engine_power?: string | null;
    engine_capacity?: string | null;
    engine_size?: string | null;
    wheel_drive?: string | null;
    drive_type?: string | null;
    doors?: number | null;
    seats?: number | null;
    generation?: {
      name: string;
      model?: {
        name: string;
        series?: { name: string } | null;
        brand?: { name: string } | null;
      } | null;
    } | null;
  }) | null;
  const isVehicleListing = listing.category?.slug === "vehicles" || Boolean(listing.vehicle_variant_id);
  const selectedFeatures = (listing.vehicle_features ?? [])
    .map((item) => item.vehicle_feature)
    .filter(Boolean)
    .sort((a, b) => {
      const groupA = a?.group?.sort_order ?? 0;
      const groupB = b?.group?.sort_order ?? 0;
      if (groupA !== groupB) return groupA - groupB;
      return (a?.sort_order ?? 0) - (b?.sort_order ?? 0);
    });
  const featuresByGroup = selectedFeatures.reduce<Record<string, { groupName: string; items: string[] }>>((acc, feature) => {
    if (!feature?.group) return acc;
    if (!acc[feature.group.slug]) {
      acc[feature.group.slug] = { groupName: feature.group.name, items: [] };
    }
    acc[feature.group.slug].items.push(feature.name);
    return acc;
  }, {});
  const vehicleSummaryRows = isVehicleListing
    ? [
        { label: t.listing.listingNo, value: listing.id },
        { label: t.listing.listingDate, value: postedDate },
        { label: "Make", value: attributeMap.get("locked__make") || attributeMap.get("locked__brand") || vehicleVariant?.generation?.model?.brand?.name || "-" },
        { label: "Series", value: attributeMap.get("locked__series") || vehicleVariant?.generation?.model?.series?.name || "-" },
        { label: "Model", value: attributeMap.get("locked__model") || vehicleVariant?.generation?.model?.name || "-" },
        { label: "Vehicle Type", value: listing.vehicle_type || "-" },
        { label: "Vehicle Subtype", value: listing.vehicle_subtype || "-" },
        { label: "Manual Brand", value: listing.vehicle_brand || "-" },
        { label: "Manual Model", value: listing.vehicle_model || "-" },
        { label: "Year", value: attributeMap.get("year") || "-" },
        { label: "Fuel Type", value: attributeMap.get("locked__fuel_type") || vehicleVariant?.fuel_type || "-" },
        { label: "Gear", value: attributeMap.get("locked__gear") || attributeMap.get("locked__transmission") || vehicleVariant?.transmission || "-" },
        { label: "Vehicle Status", value: attributeMap.get("vehicle_status") || "-" },
        { label: "Body Type", value: attributeMap.get("locked__body_type") || vehicleVariant?.body_type || "-" },
        { label: "KM", value: attributeMap.get("mileage") || "-" },
        { label: "Engine Power", value: attributeMap.get("locked__engine_power") || vehicleVariant?.engine_power || "-" },
        { label: "Engine Capacity", value: attributeMap.get("locked__engine_capacity") || vehicleVariant?.engine_capacity || vehicleVariant?.engine_size || "-" },
        { label: "Wheel Drive", value: attributeMap.get("locked__wheel_drive") || vehicleVariant?.wheel_drive || vehicleVariant?.drive_type || "-" },
        { label: "Color", value: attributeMap.get("color") || "-" },
        { label: "Warranty", value: attributeMap.get("warranty") || "-" },
        { label: "Salvage Record", value: attributeMap.get("salvage_record") || "-" },
        { label: "Plate Status", value: attributeMap.get("plate_status") || "-" },
        { label: "Seller Type", value: attributeMap.get("seller_type") || "-" },
        { label: "Exchange", value: attributeMap.get("exchange_available") || "-" },
        { label: "Manual Entry", value: listing.vehicle_is_manual ? "Yes" : "No" },
        { label: "Classic Vehicle", value: listing.vehicle_is_classic ? "Yes" : "No" },
        { label: "Custom Vehicle", value: listing.vehicle_is_custom ? "Yes" : "No" },
      ]
    : [];

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {qp.message === "sent" && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {t.listing.sendMessage}.
        </div>
      )}
      {qp.message === "invalid" && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Please write a message before sending.
        </div>
      )}
      {qp.message === "error" && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Unable to send message right now. Please try again.
        </div>
      )}
      {qp.offer === "sent" && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Your offer has been sent. Please wait for seller approval.
        </div>
      )}
      {qp.offer === "too-low" && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Your offer is below the minimum offer for this listing.
        </div>
      )}
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link href="/listings" className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm font-semibold">
          {t.listing.backToListings}
        </Link>
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-2)]">{categoryLabel || t.listing.category}</p>
      </div>
      <div className="space-y-4 pb-20 sm:pb-0">
        <ListingGallery images={listing.listing_images ?? []} title={listing.title} />

        <section className="rounded-2xl border border-[var(--line)] bg-white p-4 sm:p-5">
          {isWanted ? (
            <p className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
              {t.listing.wantedAd}
            </p>
          ) : null}
          <h1 className="mt-1 font-display text-2xl font-bold leading-tight sm:text-3xl">{listing.title}</h1>
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

        {isVehicleListing ? (
          <section className="rounded-2xl border border-[var(--line)] bg-white p-4 sm:p-5">
            <h2 className="text-base font-bold">{t.listing.vehicleSummary}</h2>
            <div className="mt-3 grid overflow-hidden rounded-xl border border-[var(--line)] md:grid-cols-2">
              {vehicleSummaryRows.map((row) => (
                <div key={row.label} className="flex items-start justify-between gap-3 border-b border-[var(--line)] px-3 py-2 text-sm last:border-b-0 md:nth-[2n]:border-l">
                  <span className="text-[var(--ink-2)]">{row.label}</span>
                  <span className="text-right font-semibold text-[var(--ink-1)]">{row.value}</span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="rounded-2xl border border-[var(--line)] bg-white p-4 sm:p-5">
          <h2 className="text-base font-bold">{t.listing.sellerInformation}</h2>
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <p><span className="text-[var(--ink-2)]">{t.listing.name}:</span> <span className="font-semibold">{sellerName}</span></p>
            <p><span className="text-[var(--ink-2)]">{t.listing.phone}:</span> <span className="font-semibold">{sellerPhone}</span></p>
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

        {listing.province_id && listing.district_id && (
          <LocationCard
            location={{
              countryId: listing.country_id,
              provinceId: listing.province_id,
              districtId: listing.district_id,
              areaId: listing.area_id,
              provinceName: (listing.provinces as any)?.name,
              districtName: (listing.districts as any)?.name,
              areaName: (listing.areas as any)?.name,
              addressText: listing.address_text,
              latitude: listing.latitude,
              longitude: listing.longitude,
              accuracy: listing.location_accuracy,
              visibility: listing.location_visibility as any,
            }}
          />
        )}

        {listing.vehicle_damage ? (
          <VehicleDamageCard
            allOriginal={listing.vehicle_damage.all_original}
            parts={(listing.vehicle_damage.vehicle_damage_parts ?? []).map((p) => ({
              part_key: p.part_key,
              part_label: p.part_label,
              condition: p.condition,
            }))}
          />
        ) : null}

        <section className="rounded-2xl border border-[var(--line)] bg-white p-4 sm:p-5">
          <h2 className="text-base font-bold">{t.listing.description}</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[var(--ink-1)]">{listing.description}</p>
          {videoUrl ? (
            <div className="mt-4 border-t border-[var(--line)] pt-3 text-sm">
              <p className="font-semibold">{t.listing.video}</p>
              <a href={videoUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex text-[var(--accent)] underline underline-offset-2">
                {t.listing.openVehicleVideo}
              </a>
            </div>
          ) : null}
        </section>

        {selectedFeatures.length > 0 ? (
          <section className="rounded-2xl border border-[var(--line)] bg-white p-4 sm:p-5">
            <h2 className="text-base font-bold">{t.listing.featureChecklist}</h2>
            <div className="mt-3 space-y-4">
              {Object.entries(featuresByGroup).map(([groupKey, group]) => (
                <section key={groupKey} className="rounded-xl border border-[var(--line)] p-3">
                  <h3 className="text-sm font-bold">{group.groupName}</h3>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {group.items.map((item) => (
                      <div key={`${groupKey}-${item}`} className="rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-sm font-semibold">
                        {item}
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </section>
        ) : null}

        <section className="rounded-2xl border border-[var(--line)] bg-white p-4 sm:p-5">
          <h2 className="text-base font-bold">{isVehicleListing ? t.listing.additionalDetails : t.listing.specifications}</h2>

          {groupedSpecs.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--ink-2)]">{t.listing.noAdditionalDetails}</p>
          ) : (
            <div className="mt-3 space-y-4">
              {groupedSpecs.map(([group, rows]) => (
                <section key={group} className="overflow-hidden rounded-xl border border-[var(--line)]">
                  <header className="border-b border-[var(--line)] bg-[var(--surface-2)] px-3 py-2">
                    <h3 className="text-sm font-semibold">{group === "locked_specs" ? t.listing.autoFilledSpecifications : group.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</h3>
                  </header>
                  <div className="grid divide-y divide-[var(--line)] md:grid-cols-2 md:divide-x md:divide-y-0">
                    {rows.map((row) => (
                      <div key={`${group}-${row.key}`} className="flex items-start justify-between gap-3 px-3 py-2 text-sm">
                        <span className="text-[var(--ink-2)]">{row.label}</span>
                        <span className="text-right font-semibold text-[var(--ink-1)]">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
          <h2 className="text-base font-bold text-amber-900">{t.listing.buyerSafetyWarning}</h2>
          <ul className="mt-3 space-y-2 text-sm text-amber-900">
            <li>{t.listing.safety1}</li>
            <li>{t.listing.safety2}</li>
            <li>{t.listing.safety3}</li>
            <li>{t.listing.safety4}</li>
          </ul>
        </section>
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
      </div>

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
