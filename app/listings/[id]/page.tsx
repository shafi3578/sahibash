import { notFound } from "next/navigation";
import { getListingById } from "@/lib/data/queries";
import Link from "next/link";
import { toggleFavoriteAction } from "@/lib/actions/favorites";
import { createReportAction } from "@/lib/actions/reports";
import { getCurrentUser } from "@/lib/auth";
import { sendListingMessageAction } from "@/lib/actions/messages";
import { createOfferAction } from "@/lib/actions/offers";
import { reportListingTranslationIssueAction } from "@/lib/actions/translations";
import { getCategoryFieldsWithOptions } from "@/lib/data/queries";
import { buildListingSpecView } from "@/lib/listings/detailSpecs";
import { ListingGallery } from "@/components/listings/listing-gallery";
import { VehicleDamageCard } from "@/components/vehicles/VehicleDamageCard";
import LocationCard from "@/components/location/LocationCard";
import type { LocationVisibility } from "@/components/location/LocationCard";
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

function isMeaningfulValue(value: string | null | undefined) {
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
  const fields = await getCategoryFieldsWithOptions(listing.category_node_id);
  const attrs = (listing.listing_attributes ?? []).filter((item) => Boolean(item.attribute_key));
  const specView = buildListingSpecView(listing, fields, attrs, locale);
  const attributeMap = new Map(
    attrs.map((item) => {
      const value = item.attribute_value_text ?? item.attribute_value_number ?? item.attribute_value_boolean ?? "";
      return [item.attribute_key, readAttributeValue(value, locale)];
    })
  );
  const categoryLabel = [listing.category?.name, listing.category_node?.name].filter(Boolean).join(" > ");
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
  const groupedSpecs = Object.entries(specView.grouped)
    .map(([group, rows]) => [group, rows.filter((row) => isMeaningfulValue(row.value))] as const)
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

  const safeSellerName = listing.contact_name || listing.profile?.full_name || t.listing.sellerFallback;
  const safeSellerPhone = listing.contact_phone || listing.profile?.phone || t.listing.notProvided;

  const overviewRows = specView.basicRows.filter((row) => isMeaningfulValue(row.value));
  const displaySectionLabel = (group: string) => {
    if (group === "location_nearby") return t.listing.location;
    if (group === "category_specific" || group === "property_details") return t.listing.condition;
    return t.listing.specifications;
  };

  const dedupedSections = groupedSpecs.reduce<Array<{ label: string; rows: Array<{ key: string; label: string; value: string; group: string }> }>>((acc, [group, rows]) => {
    const sectionLabel = displaySectionLabel(group);
    const existing = acc.find((item) => item.label === sectionLabel);
    const existingKeys = new Set((existing?.rows ?? []).map((row) => `${row.label.toLowerCase()}::${row.value.toLowerCase()}`));
    const nextRows = rows.filter((row) => {
      const sig = `${row.label.toLowerCase()}::${row.value.toLowerCase()}`;
      if (existingKeys.has(sig)) return false;
      existingKeys.add(sig);
      return true;
    });
    if (nextRows.length === 0) return acc;
    if (existing) {
      existing.rows.push(...nextRows);
      return acc;
    }
    acc.push({ label: sectionLabel, rows: [...nextRows] });
    return acc;
  }, []);
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
  const vehicleMakeValue = attributeMap.get("locked__make")
    || attributeMap.get("locked__brand")
    || listing.vehicle_brand
    || vehicleVariant?.generation?.model?.brand?.name
    || "-";
  const vehicleModelValue = attributeMap.get("locked__model")
    || listing.vehicle_model
    || vehicleVariant?.generation?.model?.name
    || "-";
  const vehicleFuelValue = attributeMap.get("locked__fuel_type") || vehicleVariant?.fuel_type || "-";
  const vehicleTransmissionValue = attributeMap.get("locked__gear")
    || attributeMap.get("locked__transmission")
    || vehicleVariant?.transmission
    || "-";
  const vehicleTypeValue = attributeMap.get("locked__vehicle_type")
    || listing.vehicle_type
    || "-";
  const vehicleSubtypeValue = attributeMap.get("locked__vehicle_subtype")
    || listing.vehicle_subtype
    || "-";
  const vehicleSeriesValue = attributeMap.get("locked__series")
    || vehicleVariant?.generation?.model?.series?.name
    || "-";
  const vehicleBodyTypeValue = attributeMap.get("locked__body_type")
    || listing.vehicle_subtype
    || vehicleVariant?.body_type
    || listing.vehicle_type
    || "-";
  const vehicleMileageValue = attributeMap.get("mileage") || "-";
  const vehicleYearValue = attributeMap.get("year") || "-";
  const vehiclePlateNumberValue = attributeMap.get("plate_number")
    || attributeMap.get("license_plate")
    || attributeMap.get("vehicle_plate_number")
    || "-";
  const vehiclePlateTypeValue = attributeMap.get("license_plate_type")
    || attributeMap.get("plate_type")
    || attributeMap.get("negative_plate_type")
    || attributeMap.get("plate_status")
    || "-";
  const vehicleFirstRegistrationValue = attributeMap.get("first_registration")
    || attributeMap.get("registration_date")
    || attributeMap.get("first_registered_at")
    || "-";
  const vehicleEngineSizeValue = attributeMap.get("engine_size")
    || attributeMap.get("locked__engine_size")
    || attributeMap.get("locked__engine_capacity")
    || vehicleVariant?.engine_size
    || vehicleVariant?.engine_capacity
    || "-";
  const vehicleEnginePowerValue = attributeMap.get("engine_power")
    || attributeMap.get("locked__engine_power")
    || vehicleVariant?.engine_power
    || "-";
  const vehicleEngineCapacityValue = attributeMap.get("engine_capacity")
    || attributeMap.get("locked__engine_capacity")
    || vehicleVariant?.engine_capacity
    || "-";
  const vehicleWheelDriveValue = attributeMap.get("wheel_drive")
    || attributeMap.get("drive_type")
    || vehicleVariant?.wheel_drive
    || vehicleVariant?.drive_type
    || "-";
  const vehicleStatusValue = attributeMap.get("condition")
    || attributeMap.get("status")
    || "-";
  const vehicleWarrantyValue = attributeMap.get("warranty") || "-";
  const vehicleSellerTypeValue = attributeMap.get("seller_type") || "-";
  const vehicleExchangeValue = attributeMap.get("exchange") || "-";
  const vehicleManualEntryValue = attributeMap.get("manual_entry") || "-";
  const vehicleClassicValue = attributeMap.get("classic_vehicle") || "-";
  const vehicleCustomValue = attributeMap.get("custom_vehicle") || "-";
  const vehicleSalvageRecordValue = attributeMap.get("salvage_record") || "-";
  const vehicleLocationValue = locationParts.length > 0 ? locationParts.join(", ") : "-";
  const vehicleMetricRows = isVehicleListing
    ? [
        { label: t.listing.vehicleKm, value: vehicleMileageValue },
        { label: t.listing.vehicleFirstRegistration, value: vehicleFirstRegistrationValue },
        { label: t.listing.vehicleGear, value: vehicleTransmissionValue },
        { label: t.listing.vehicleFuelType, value: vehicleFuelValue },
      ]
    : [];
  const vehicleDetailRows = isVehicleListing
    ? [
        { key: "color", label: t.listing.vehicleColor, value: attributeMap.get("color") || "-" },
        { key: "plate_number", label: t.listing.vehiclePlateNumber, value: vehiclePlateNumberValue },
        { key: "plate_type", label: t.listing.vehiclePlateType, value: vehiclePlateTypeValue },
        { key: "vehicle_type", label: t.listing.vehicleType, value: vehicleTypeValue },
        { key: "vehicle_subtype", label: t.listing.vehicleSubtype, value: vehicleSubtypeValue },
        { key: "engine_size", label: t.listing.vehicleEngineSize, value: vehicleEngineSizeValue },
        { key: "engine_capacity", label: t.listing.vehicleEngineCapacity, value: vehicleEngineCapacityValue },
        { key: "engine_power", label: t.listing.vehicleEnginePower, value: vehicleEnginePowerValue },
        { key: "wheel_drive", label: t.listing.vehicleWheelDrive, value: vehicleWheelDriveValue },
        { key: "fuel_type", label: t.listing.vehicleFuelType, value: vehicleFuelValue },
        { key: "status", label: t.listing.vehicleStatus, value: vehicleStatusValue },
        { key: "body_type", label: t.listing.vehicleBodyType, value: vehicleBodyTypeValue },
        { key: "make", label: t.listing.vehicleMake, value: vehicleMakeValue },
        { key: "series", label: t.listing.vehicleSeries, value: vehicleSeriesValue },
        { key: "model", label: t.listing.vehicleModel, value: vehicleModelValue },
        { key: "transmission", label: t.listing.vehicleGear, value: vehicleTransmissionValue },
        { key: "year", label: t.listing.vehicleYear, value: vehicleYearValue },
        { key: "warranty", label: t.listing.vehicleWarranty, value: vehicleWarrantyValue },
        { key: "salvage_record", label: t.listing.vehicleSalvageRecord, value: vehicleSalvageRecordValue },
        { key: "plate_status", label: t.listing.vehiclePlateStatus, value: attributeMap.get("plate_status") || "-" },
        { key: "seller_type", label: t.listing.vehicleSellerType, value: vehicleSellerTypeValue },
        { key: "exchange", label: t.listing.vehicleExchange, value: vehicleExchangeValue },
        { key: "manual_entry", label: t.listing.vehicleManualEntry, value: vehicleManualEntryValue },
        { key: "classic_vehicle", label: t.listing.vehicleClassic, value: vehicleClassicValue },
        { key: "custom_vehicle", label: t.listing.vehicleCustom, value: vehicleCustomValue },
        { key: "location", label: t.listing.location, value: vehicleLocationValue },
      ]
    : [];
  const seenVehicleLabels = new Set<string>();
  const cleanedVehicleMetricRows = vehicleMetricRows.filter((row) => isMeaningfulValue(row.value));
  const cleanedVehicleDetailRows = vehicleDetailRows.filter((row) => {
    if (!isMeaningfulValue(row.value)) return false;
    const key = row.label.toLowerCase();
    if (seenVehicleLabels.has(key)) return false;
    seenVehicleLabels.add(key);
    return true;
  });
  const vehicleDisplayedKeys = new Set([
    "make",
    "brand",
    "model",
    "series",
    "body_type",
    "vehicle_type",
    "vehicle_subtype",
    "status",
    "fuel_type",
    "transmission",
    "gear",
    "year",
    "mileage",
    "color",
    "engine_size",
    "engine_capacity",
    "plate_status",
    "plate_number",
    "license_plate",
    "vehicle_plate_number",
    "plate_type",
    "license_plate_type",
    "negative_plate_type",
    "wheel_drive",
    "drive_type",
    "engine_power",
    "seller_type",
    "exchange",
    "manual_entry",
    "classic_vehicle",
    "custom_vehicle",
    "salvage_record",
    "warranty",
    "registration_date",
    "first_registration",
    "first_registered_at",
  ]);
  const filteredOverviewRows = isVehicleListing ? [] : overviewRows;
  const filteredDedupedSections = isVehicleListing
    ? dedupedSections
        .map((section) => ({
          ...section,
          rows: section.rows.filter((row) => !vehicleDisplayedKeys.has(row.key)),
        }))
        .filter((section) => section.rows.length > 0)
    : dedupedSections;

  const categorySlug = listing.category?.slug ?? "";
  const safetyTips = (() => {
    const tipsByLocale = {
      en: {
        vehicles: [
          "Do not send advance payment before seeing the vehicle.",
          "Check vehicle documents.",
          "Verify ownership before payment.",
          "Meet in a safe public place.",
        ],
        realEstate: [
          "Visit the property before payment.",
          "Verify ownership documents.",
          "Do not pay deposit before confirming the property.",
          "Use written agreement when possible.",
        ],
        phones: [
          "Test phone before payment.",
          "Check IMEI and registration status.",
          "Check battery, screen, camera, and biometric features.",
          "Avoid advance payment.",
        ],
        general: [
          "Meet in a safe public place.",
          "Check item before payment.",
          "Do not send money before seeing the item.",
        ],
      },
      fa: {
        vehicles: [
          "قبل از دیدن واسطه، پیش پرداخت نفرستید.",
          "اسناد واسطه را بررسی کنید.",
          "مالکیت را پیش از پرداخت تایید کنید.",
          "در محل عمومی امن ملاقات کنید.",
        ],
        realEstate: [
          "قبل از پرداخت از ملک بازدید کنید.",
          "اسناد مالکیت را بررسی کنید.",
          "قبل از تایید ملک، بیعانه نپردازید.",
          "در صورت امکان قرارداد کتبی داشته باشید.",
        ],
        phones: [
          "قبل از پرداخت گوشی را تست کنید.",
          "IMEI و وضعیت راجستر را بررسی کنید.",
          "باتری، صفحه، کمره و سنسورها را بررسی کنید.",
          "از پیش پرداخت خودداری کنید.",
        ],
        general: [
          "در محل عمومی امن ملاقات کنید.",
          "قبل از پرداخت جنس را بررسی کنید.",
          "قبل از دیدن جنس پول نفرستید.",
        ],
      },
      ps: {
        vehicles: [
          "موټر له لیدلو مخکې مخکې پیسې مه لېږئ.",
          "د موټر اسناد وګورئ.",
          "له پیسو مخکې مالکیت تایید کړئ.",
          "په خوندي عامه ځای کې ووینئ.",
        ],
        realEstate: [
          "له پیسو مخکې ملکیت وګورئ.",
          "د مالکیت اسناد تایید کړئ.",
          "له تایید مخکې بیعانه مه ورکوئ.",
          "که ممکن وي لیکلی تړون وکړئ.",
        ],
        phones: [
          "له پیسو مخکې تلیفون وازمویئ.",
          "IMEI او راجستر حالت وګورئ.",
          "بیټرۍ، سکرین، کامره او بایومیټریک وګورئ.",
          "مخکې له مخکې پیسې مه ورکوئ.",
        ],
        general: [
          "په خوندي عامه ځای کې ووینئ.",
          "له پیسو مخکې توکی وګورئ.",
          "توکی له لیدلو مخکې پیسې مه لېږئ.",
        ],
      },
    } as const;
    const localeTips = tipsByLocale[locale] ?? tipsByLocale.en;
    if (categorySlug === "vehicles") {
      return localeTips.vehicles;
    }
    if (categorySlug === "real-estate") {
      return localeTips.realEstate;
    }
    if (categorySlug === "mobile-phones-tablets") {
      return localeTips.phones;
    }
    return localeTips.general;
  })();

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
              {listing.translation_note || t.listing.originalLanguage}
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

        {isVehicleListing ? (
          <section className="rounded-2xl border border-[var(--line)] bg-white p-4 sm:p-5">
            <h2 className="text-base font-bold">{t.postAd.vehicleDetails}</h2>
            {cleanedVehicleMetricRows.length > 0 ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {cleanedVehicleMetricRows.map((row) => (
                  <div key={`metric-${row.label}`} className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-3 text-sm">
                    <p className="text-[var(--ink-2)]">{row.label}</p>
                    <p className="mt-1 font-semibold text-[var(--ink-1)]">{row.value}</p>
                  </div>
                ))}
              </div>
            ) : null}
            <div className="mt-3 grid overflow-hidden rounded-xl border border-[var(--line)] md:grid-cols-2">
              {cleanedVehicleDetailRows.map((row) => (
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

          {filteredOverviewRows.length > 0 ? (
            <section className="mt-3 overflow-hidden rounded-xl border border-[var(--line)]">
              <header className="border-b border-[var(--line)] bg-[var(--surface-2)] px-3 py-2">
                <h3 className="text-sm font-semibold">{t.listing.overview}</h3>
              </header>
              <div className="grid divide-y divide-[var(--line)] md:grid-cols-2 md:divide-x md:divide-y-0">
                {filteredOverviewRows.map((row) => (
                  <div key={`overview-${row.label}`} className="flex items-start justify-between gap-3 px-3 py-2 text-sm">
                    <span className="text-[var(--ink-2)]">{row.label}</span>
                    <span className="text-right font-semibold text-[var(--ink-1)]">{row.value}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {filteredDedupedSections.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--ink-2)]">{t.listing.noAdditionalDetails}</p>
          ) : (
            <div className="mt-3 space-y-4">
              {filteredDedupedSections.map((section) => (
                <section key={section.label} className="overflow-hidden rounded-xl border border-[var(--line)]">
                  <header className="border-b border-[var(--line)] bg-[var(--surface-2)] px-3 py-2">
                    <h3 className="text-sm font-semibold">{section.label}</h3>
                  </header>
                  <div className="grid divide-y divide-[var(--line)] md:grid-cols-2 md:divide-x md:divide-y-0">
                    {section.rows.map((row) => (
                      <div key={`${section.label}-${row.key}-${row.value}`} className="flex items-start justify-between gap-3 px-3 py-2 text-sm">
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
            {safetyTips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
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
