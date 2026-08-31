import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getListingById, getSimilarListings } from "@/lib/data/queries";
import Link from "next/link";
import { createReportAction } from "@/lib/actions/reports";
import { getCurrentUser } from "@/lib/auth";
import { sendListingMessageAction } from "@/lib/actions/messages";
import { createOfferAction } from "@/lib/actions/offers";
import { getCategoryFieldsWithOptions } from "@/lib/data/queries";
import { buildListingSpecView } from "@/lib/listings/detailSpecs";
import { ListingGallery } from "@/components/listings/listing-gallery";
import { VehicleDamageCard } from "@/components/vehicles/VehicleDamageCard";
import LocationCard from "@/components/location/LocationCard";
import type { LocationVisibility } from "@/components/location/LocationCard";
import { getDictionary } from "@/lib/i18n/server";
import type { AppLocale } from "@/lib/i18n/translations";
import { appLocaleToListingLanguage } from "@/lib/listings/translation-service";
import { recordSearchTelemetryClick } from "@/lib/search/telemetry";
import { buildActiveListingSchemaView } from "@/lib/listingSchemas";
import { getSimpleCategoryConfig, getSimpleCategoryKind, labelFor } from "@/lib/posting/simple-category-details";
import DynamicDetailSection from "@/data/componentsDynamicDetailSection";
import { ELECTRONICS_DYNAMIC_LEAF_KEY } from "@/lib/posting/electronics-dynamic";
import { getPublishedListingSchema } from "@/lib/data/listing-schema-config";
import { labelForLocale } from "@/lib/listing-schema-config";
import { localizeCategoryName } from "@/lib/i18n/category-labels";
import { ListingContactActions } from "@/components/listings/listing-contact-actions";
import { ListingCard } from "@/components/listing-card";
import { ListingAiAssistant, type ListingAiFact } from "@/components/listings/listing-ai-assistant";
import { formatCurrencyAmount } from "@/lib/i18n/format";
import { formatListingPrice } from "@/lib/listings/price-display";
import { getSourceTransparency } from "@/lib/inventory/provenance";
import { submitExternalListingClaimAction, submitExternalListingRemovalAction } from "@/lib/actions/inventory";
import { localizePath } from "@/lib/i18n/routing";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { FavoriteToggleButton } from "@/components/listings/favorite-toggle-button";
import { getProvinceLabel } from "@/lib/constants/marketplace";

type NamedLocationRelation = {
  name?: string | null;
  name_en?: string | null;
  name_fa?: string | null;
  name_ps?: string | null;
} | null;

function localizedLocationName(relation: NamedLocationRelation, locale: AppLocale) {
  if (!relation) return null;
  if (locale === "fa") return relation.name_fa || relation.name_en || relation.name || null;
  if (locale === "ps") return relation.name_ps || relation.name_en || relation.name || null;
  return relation.name_en || relation.name || null;
}

function localizedDistrictName(relation: NamedLocationRelation, locale: AppLocale, provinceName: string | null) {
  const value = localizedLocationName(relation, locale);
  if (!value || locale === "en") return value;
  const english = relation?.name_en || relation?.name || value;
  const localized = locale === "fa" ? relation?.name_fa : relation?.name_ps;
  if (localized && localized !== english) return localized;
  if (/\s+City$/i.test(english) && provinceName) {
    return locale === "fa" ? `شهر ${provinceName}` : `${provinceName} ښار`;
  }
  return value;
}
type ListingDetail = NonNullable<Awaited<ReturnType<typeof getListingById>>>;
type ListingDetailLocale = Awaited<ReturnType<typeof getDictionary>>["locale"];

async function SimilarListingsSection({
  listing,
  locale,
}: {
  listing: ListingDetail;
  locale: ListingDetailLocale;
}) {
  if (listing.status !== "approved") return null;

  const similarListings = await getSimilarListings(listing, locale, 4);
  if (similarListings.length === 0) return null;

  return (
    <section className="mt-8 border-t border-[var(--line)] pt-6">
      <h2 className="font-display text-2xl font-bold">{locale === "fa" ? "اعلان‌های مشابه" : locale === "ps" ? "ورته اعلانونه" : "Similar listings"}</h2>
      <p className="mt-1 text-sm text-[var(--ink-2)]">{locale === "fa" ? "بر اساس دسته‌بندی، موقعیت و محدوده قیمت" : locale === "ps" ? "د کټګورۍ، ځای او بیې له مخې" : "Based on category, location, and price range"}</p>
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {similarListings.map((item) => <ListingCard key={item.id} listing={item} />)}
      </div>
    </section>
  );
}

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
  searchParams: Promise<{
    message?: string;
    offer?: string;
    report?: string;
    compose?: string;
    offerbox?: string;
    claim?: string;
    remove?: string;
    ownership?: string;
    removal?: string;
    view?: string;
    translation?: string;
    st?: string;
  }>;
}) {
  const { t, locale } = await getDictionary();
  const { id } = await params;
  const qp = await searchParams;
  const listing = await getListingById(id, locale);
  if (!listing) notFound();
  const telemetryPromise = recordSearchTelemetryClick(qp.st, id);
  const currentUserPromise = getCurrentUser();
  const fieldsPromise = getCategoryFieldsWithOptions(listing.category_node_id);
  const configuredSchemaPromise = getPublishedListingSchema(listing.category_node_id);
  const favoriteStatePromise = currentUserPromise.then(async (user) => {
    if (!user) return false;
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("listing_id", listing.id)
      .maybeSingle();
    return Boolean(data?.id);
  });
  const viewerLanguageCode = appLocaleToListingLanguage(locale);
  const showOriginal = qp.view === "original";
  const translationUnavailable = !showOriginal && viewerLanguageCode !== listing.display_language;
  const displayTitle = showOriginal
    ? (listing.original_title || listing.title)
    : (listing.translated_title || listing.title);
  const displayDescription = showOriginal
    ? (listing.original_description || listing.description)
    : (listing.translated_description || listing.description);

  const [currentUser, fields, configuredSchema, isFavorited] = await Promise.all([
    currentUserPromise,
    fieldsPromise,
    configuredSchemaPromise,
    favoriteStatePromise,
    telemetryPromise.then(() => null),
  ]);
  const isOwner = currentUser?.id === listing.user_id;
  const listingHref = localizePath(`/listings/${listing.id}`, locale);
  const composeHref = localizePath(`/listings/${listing.id}?compose=1`, locale);
  const offerHref = localizePath(`/listings/${listing.id}?offerbox=1`, locale);
  const ownershipRequestHref = currentUser
    ? `${listingHref}?claim=1`
    : `${localizePath("/login", locale)}?redirect=${encodeURIComponent(`/listings/${listing.id}?claim=1`)}`;
  const removalRequestHref = currentUser
    ? `${listingHref}?remove=1`
    : `${localizePath("/login", locale)}?redirect=${encodeURIComponent(`/listings/${listing.id}?remove=1`)}`;
  const attrs = (listing.listing_attributes ?? []).filter((item) => Boolean(item.attribute_key));
  const dynamicLeafId = attrs.find((item) => item.attribute_key === ELECTRONICS_DYNAMIC_LEAF_KEY)?.attribute_value_text ?? null;
  const dynamicAttributes = attrs.reduce<Record<string, unknown>>((acc, item) => {
    if (item.attribute_key === ELECTRONICS_DYNAMIC_LEAF_KEY) return acc;
    const value = item.attribute_value_json ?? item.attribute_value_text ?? item.attribute_value_number ?? item.attribute_value_boolean ?? null;
    if (value === null || value === undefined || value === "") return acc;
    acc[item.attribute_key] = value;
    return acc;
  }, {});
  const dynamicFeatures = Array.isArray(dynamicAttributes.features)
    ? dynamicAttributes.features.filter((item): item is string => typeof item === "string")
    : [];
  const shouldRenderDynamicElectronics = Boolean(dynamicLeafId);
  const schemaView = buildActiveListingSchemaView(listing, locale);
  const hasLeafSchemaView = schemaView.sections.some((section) => section.rows.length > 0);
  const specView = buildListingSpecView(listing, fields, attrs, locale);
  const attributeMap = new Map(
    attrs.map((item) => {
      const value = item.attribute_value_json ?? item.attribute_value_text ?? item.attribute_value_number ?? item.attribute_value_boolean ?? "";
      return [item.attribute_key, readAttributeValue(value, locale)];
    })
  );
  const configuredSections = (configuredSchema?.config.sections ?? []).filter((section) => section.visible).sort((a, b) => a.order - b.order).map((section) => ({
    key: section.key,
    title: labelForLocale(section.titles, locale),
    rows: configuredSchema!.config.fields.filter((field) => field.active && field.detail && field.sectionKey === section.key).sort((a, b) => a.order - b.order).flatMap((field) => {
      const direct = (listing as unknown as Record<string, unknown>)[field.key];
      const raw = direct ?? attributeMap.get(field.key);
      if (raw === null || raw === undefined || raw === "") return [];
      const option = field.options.find((item) => item.value === String(raw));
      return [{ key: field.key, label: labelForLocale(field.labels, locale), value: option ? labelForLocale(option.labels, locale) : String(raw) }];
    }),
  })).filter((section) => section.rows.length > 0);
  const hasConfiguredView = configuredSections.length > 0;
  const categoryLabel = [
    listing.category?.name
      ? localizeCategoryName({ locale, fallbackName: listing.category.name, slug: listing.category.slug })
      : "",
    listing.category_node?.name
      ? localizeCategoryName({ locale, fallbackName: listing.category_node.name, slug: listing.category_node.slug, path: listing.category_node.path })
      : "",
  ].filter(Boolean).join(" › ");
  const simpleCategoryKind = getSimpleCategoryKind(listing.category_node?.path ?? undefined, listing.category?.slug ?? null);
  const simpleCategoryConfig = getSimpleCategoryConfig(simpleCategoryKind);
  const provinceRelation = listing.provinces as NamedLocationRelation;
  const provinceEnglishName = provinceRelation?.name_en || provinceRelation?.name || listing.province;
  const localizedProvinceName = provinceEnglishName ? getProvinceLabel(provinceEnglishName, locale) : listing.province;
  const localizedDistrict = localizedDistrictName(listing.districts as NamedLocationRelation, locale, localizedProvinceName);
  const localizedAreaName = localizedLocationName(listing.areas as NamedLocationRelation, locale);
  const locationParts = listing.location_visibility === "exact"
    ? [localizedProvinceName, localizedDistrict, localizedAreaName || listing.neighborhood || attributeMap.get("neighborhood") || listing.address_optional].filter(Boolean)
    : [localizedProvinceName, localizedDistrict].filter(Boolean);
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
  const galleryLabels = locale === "fa"
    ? { open: "باز کردن عکس", close: "بستن", previous: "قبلی", next: "بعدی", photo: "عکس" }
    : locale === "ps"
      ? { open: "انځور پرانیستل", close: "تړل", previous: "مخکینی", next: "بل", photo: "انځور" }
      : { open: "Open photo", close: "Close", previous: "Previous", next: "Next", photo: "Photo" };
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
  const sourceTransparency = getSourceTransparency(listing, locale);
  const hasAccountSeller = Boolean(listing.user_id)
    && (!sourceTransparency.isExternal || sourceTransparency.ownershipStatus === "claimed");
  const canUseSahibashSellerTools = !isOwner && hasAccountSeller;
  let activeOwnershipClaim: { id: string; status: string } | null = null;
  let activeRemovalRequest: { id: string; status: string } | null = null;
  if (currentUser && sourceTransparency.isExternal) {
    const requestClient = await createSupabaseServerClient();
    const [claimResult, removalResult] = await Promise.all([
      requestClient
        .from("listing_claims")
        .select("id,status")
        .eq("listing_id", listing.id)
        .eq("claimant_user_id", currentUser.id)
        .in("status", ["initiated", "challenge_sent", "verified"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      requestClient
        .from("listing_removal_requests")
        .select("id,status")
        .eq("listing_id", listing.id)
        .eq("requester_user_id", currentUser.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    activeOwnershipClaim = claimResult.data as { id: string; status: string } | null;
    activeRemovalRequest = removalResult.data as { id: string; status: string } | null;
  }
  const hasContactPhone = Boolean(listing.public_contact_available ?? listing.contact_phone);
  const phonePrivacyLabel = hasContactPhone
    ? locale === "fa" ? "تماس در دسترس است" : locale === "ps" ? "اړیکه شته" : "Contact available"
    : t.listing.notProvided;
  const whatsappEnabled = Boolean((listing as unknown as { whatsapp_enabled?: boolean }).whatsapp_enabled);

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
    || attributeMap.get("make")
    || attributeMap.get("brand")
    || listing.vehicle_brand
    || vehicleVariant?.generation?.model?.brand?.name
    || "-";
  const vehicleModelValue = attributeMap.get("locked__model")
    || attributeMap.get("model")
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
  const vehicleDamageCardParts = (listing.vehicle_damage?.vehicle_damage_parts ?? []).map((part) => ({
    part_key: String(part.part_key ?? ""),
    part_label: String(part.part_label ?? ""),
    condition: String(part.condition ?? "original"),
  }));
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
  const aiFactLabels = locale === "fa"
    ? { price: "قیمت", location: "موقعیت", category: "دسته‌بندی", seller: "فروشنده" }
    : locale === "ps"
      ? { price: "بیه", location: "ځای", category: "کټګوري", seller: "پلورونکی" }
      : { price: "Price", location: "Location", category: "Category", seller: "Seller" };
  const aiAssistantFacts: ListingAiFact[] = [
    {
      key: "price",
      label: aiFactLabels.price,
      value: formatListingPrice(listing, locale, attributeMap as Map<string, unknown>),
    },
    {
      key: "location",
      label: aiFactLabels.location,
      value: locationParts.length > 0 ? locationParts.join(", ") : null,
    },
    { key: "category", label: aiFactLabels.category, value: categoryLabel || null },
    { key: "seller", label: aiFactLabels.seller, value: safeSellerName || null },
    ...cleanedVehicleMetricRows.slice(0, 4).map((row) => ({ key: `vehicle_metric_${row.label}`, label: row.label, value: row.value })),
    ...cleanedVehicleDetailRows.slice(0, 6).map((row) => ({ key: `vehicle_detail_${row.key}`, label: row.label, value: row.value })),
    ...filteredOverviewRows.slice(0, 5).map((row) => ({ key: `overview_${row.label}`, label: row.label, value: row.value })),
    ...filteredDedupedSections
      .flatMap((section) => section.rows.map((row) => ({ key: `detail_${row.key}`, label: row.label, value: row.value })))
      .slice(0, 8),
  ];
  const localizeDigits = (value: string) => {
    if (locale === "en") return value;
    const localeCode = locale === "fa" ? "fa-AF" : "ps-AF";
    return value.replace(/\d+/g, (segment) => {
      const numeric = Number(segment);
      return Number.isFinite(numeric) ? new Intl.NumberFormat(localeCode).format(numeric) : segment;
    });
  };
  const readSimpleValue = (key: string) => {
    const raw = attributeMap.get(key);
    if (!isMeaningfulValue(raw)) {
      return null;
    }
    const value = String(raw ?? "").trim();
    if (value.startsWith("[") && value.endsWith("]")) {
      try {
        const parsed = JSON.parse(value) as unknown;
        if (Array.isArray(parsed)) {
          const normalized = parsed.map((item) => String(item).trim()).filter((item) => isMeaningfulValue(item));
          return normalized.length > 0 ? localizeDigits(normalized.join(", ")) : null;
        }
      } catch {
        // fall back to raw string
      }
    }
    return localizeDigits(value);
  };
  const simpleQuickFacts = simpleCategoryConfig
    ? simpleCategoryConfig.topCards
        .map((card) => ({
          key: card.key,
          label: labelFor(locale, card.label),
          value: readSimpleValue(card.key),
        }))
        .filter((row) => isMeaningfulValue(row.value))
    : [];
  const simpleRows = simpleCategoryConfig
    ? simpleCategoryConfig.rows
        .map((row) => ({
          key: row.key,
          label: labelFor(locale, row.label),
          value: readSimpleValue(row.key),
        }))
        .filter((row) => isMeaningfulValue(row.value))
    : [];
  const simpleFeatureChips = (() => {
    const raw = readSimpleValue("features");
    if (!raw) return [] as string[];
    return String(raw)
      .split(",")
      .map((item) => item.trim())
      .filter((item) => isMeaningfulValue(item));
  })();
  const hasSimpleLeafView = Boolean(simpleCategoryConfig) && (simpleQuickFacts.length > 0 || simpleRows.length > 0);

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
      {qp.ownership === "received" ? (
        <div role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {locale === "fa"
            ? "درخواست مالکیت شما ثبت شد. اعلان تنها پس از بررسی مدیر به حساب شما وصل می‌شود."
            : locale === "ps"
              ? "ستاسو د مالکیت غوښتنه ثبت شوه. اعلان یوازې د مدیر له تایید وروسته ستاسو حساب ته تړل کېږي."
              : "Your ownership request was received. The listing will be connected to your account only after administrator verification."}
        </div>
      ) : null}
      {qp.ownership === "invalid" || qp.ownership === "rate-limited" ? (
        <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {locale === "fa"
            ? "درخواست مالکیت ثبت نشد. معلومات بررسی را کامل کنید و بعداً دوباره تلاش کنید."
            : locale === "ps"
              ? "د مالکیت غوښتنه ثبت نه شوه. د تایید معلومات بشپړ کړئ او وروسته بیا هڅه وکړئ."
              : "The ownership request was not submitted. Complete the verification details and try again later."}
        </div>
      ) : null}
      {qp.removal === "received" ? (
        <div role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {locale === "fa"
            ? "درخواست حذف ثبت شد. مدیر پس از تأیید مالکیت یا دلیل قانونی، اعلان را از دید عمومی خارج می‌کند."
            : locale === "ps"
              ? "د لرې کولو غوښتنه ثبت شوه. مدیر به د مالکیت یا قانوني دلیل له تایید وروسته اعلان له عامه لید څخه وباسي."
              : "Your removal request was received. An administrator will remove the listing from public view after verifying ownership or a valid rights reason."}
        </div>
      ) : null}
      {qp.removal === "invalid" || qp.removal === "rate-limited" ? (
        <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {locale === "fa"
            ? "درخواست حذف ثبت نشد. دلیل و جزئیات لازم را کامل کنید و بعداً دوباره تلاش کنید."
            : locale === "ps"
              ? "د لرې کولو غوښتنه ثبت نه شوه. دلیل او اړین معلومات بشپړ کړئ او وروسته بیا هڅه وکړئ."
              : "The removal request was not submitted. Complete the reason and verification details, then try again later."}
        </div>
      ) : null}
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
      {qp.report === "sent" && (
        <div role="status" className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {t.listing.reportSubmitted}
        </div>
      )}
      {qp.report === "invalid" && (
        <div role="alert" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {t.listing.reportInvalid}
        </div>
      )}
      {(qp.report === "error" || qp.report === "rate-limited") && (
        <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {t.listing.reportError}
        </div>
      )}
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link href={localizePath("/listings", locale)} className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm font-semibold">
          {t.listing.backToListings}
        </Link>
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-2)]">{categoryLabel || t.listing.category}</p>
      </div>
      <div className="space-y-4 pb-20 sm:pb-0">
        <ListingGallery images={listing.listing_images ?? []} title={displayTitle} labels={galleryLabels} />

        {isVehicleListing && listing.vehicle_damage ? (
          <VehicleDamageCard allOriginal={Boolean(listing.vehicle_damage.all_original)} parts={vehicleDamageCardParts} locale={locale} />
        ) : null}

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
          <p className="mt-3 text-3xl font-bold text-[var(--accent)]">{formatListingPrice(listing, locale, attributeMap)}</p>
          <div className="mt-4 grid gap-2 border-t border-[var(--line)] pt-3 text-sm text-[var(--ink-2)] sm:grid-cols-2">
            {locationParts.length > 0 ? <p>{locationParts.join(" / ")}</p> : null}
            <p className="sm:text-right">{t.listing.posted}: {postedDate}</p>
          </div>
        </section>

        {shouldRenderDynamicElectronics ? (
          <section className="rounded-2xl border border-[var(--line)] bg-white p-4 sm:p-5">
            <DynamicDetailSection
              leafId={dynamicLeafId!}
              lang={locale}
              attributes={dynamicAttributes}
              features={dynamicFeatures}
            />
          </section>
        ) : null}

        {hasConfiguredView ? (
          <section className="rounded-2xl border border-[var(--line)] bg-white p-4 sm:p-5">
            <h2 className="text-base font-bold">{t.listing.specifications}</h2>
            <div className="mt-3 space-y-3">{configuredSections.map((section) => <section key={section.key} className="overflow-hidden rounded-xl border border-[var(--line)]"><header className="border-b border-[var(--line)] bg-[var(--surface-2)] px-3 py-2"><h3 className="text-sm font-semibold">{section.title}</h3></header><div className="grid divide-y divide-[var(--line)] md:grid-cols-2">{section.rows.map((row) => <div key={row.key} className="flex items-start justify-between gap-3 px-3 py-2 text-sm"><span className="text-[var(--ink-2)]">{row.label}</span><span className="text-right font-semibold">{row.value}</span></div>)}</div></section>)}</div>
          </section>
        ) : hasSimpleLeafView ? (
          <section className="rounded-2xl border border-[var(--line)] bg-white p-4 sm:p-5">
            <h2 className="text-base font-bold">{labelFor(locale, simpleCategoryConfig!.title)}</h2>

            {simpleQuickFacts.length > 0 ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {simpleQuickFacts.map((fact) => (
                  <div key={`simple-fact-${fact.key}`} className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-3 text-sm">
                    <p className="text-[var(--ink-2)]">{fact.label}</p>
                    <p className="mt-1 font-semibold text-[var(--ink-1)]">{fact.value}</p>
                  </div>
                ))}
              </div>
            ) : null}

            {simpleRows.length > 0 ? (
              <div className="mt-3 grid overflow-hidden rounded-xl border border-[var(--line)] md:grid-cols-2">
                {simpleRows.map((row) => (
                  <div key={`simple-row-${row.key}`} className="flex items-start justify-between gap-3 border-b border-[var(--line)] px-3 py-2 text-sm last:border-b-0 md:nth-[2n]:border-l">
                    <span className="text-[var(--ink-2)]">{row.label}</span>
                    <span className="text-right font-semibold text-[var(--ink-1)]">{row.value}</span>
                  </div>
                ))}
              </div>
            ) : null}

            {simpleFeatureChips.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {simpleFeatureChips.map((feature) => (
                  <span key={`simple-feature-${feature}`} className="rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-3 py-1 text-xs font-semibold text-[var(--ink-1)]">
                    {feature}
                  </span>
                ))}
              </div>
            ) : null}
          </section>
        ) : hasLeafSchemaView ? (
          <section className="rounded-2xl border border-[var(--line)] bg-white p-4 sm:p-5">
            <h2 className="text-base font-bold">{t.listing.specifications}</h2>

            {schemaView.quickFacts.length > 0 ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {schemaView.quickFacts.map((fact) => (
                  <div key={`fact-${fact.key}`} className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-3 text-sm">
                    <p className="text-[var(--ink-2)]">{fact.label}</p>
                    {Array.isArray(fact.value) ? (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {fact.value.map((item) => (
                          <span key={`${fact.key}-${item}`} className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-[var(--ink-1)]">
                            {item}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-1 font-semibold text-[var(--ink-1)]">{fact.value}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : null}

            <div className="mt-3 space-y-3">
              {schemaView.sections.map((section) => (
                <section key={section.key} className="overflow-hidden rounded-xl border border-[var(--line)]">
                  <header className="border-b border-[var(--line)] bg-[var(--surface-2)] px-3 py-2">
                    <h3 className="text-sm font-semibold">{section.title}</h3>
                    {section.description ? <p className="mt-1 text-xs text-[var(--ink-2)]">{section.description}</p> : null}
                  </header>
                  <div className="grid divide-y divide-[var(--line)] md:grid-cols-2 md:divide-x md:divide-y-0">
                    {section.rows.map((row) => (
                      <div key={`${section.key}-${row.key}`} className="flex items-start justify-between gap-3 px-3 py-2 text-sm">
                        <span className="text-[var(--ink-2)]">{row.label}</span>
                        {Array.isArray(row.value) ? (
                          <div className="flex flex-wrap justify-end gap-1 text-right font-semibold text-[var(--ink-1)]">
                            {row.value.map((item) => (
                              <span key={`${section.key}-${row.key}-${item}`} className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-xs font-semibold text-[var(--ink-1)]">
                                {item}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-right font-semibold text-[var(--ink-1)]">{row.value}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </section>
        ) : null}

        {!hasConfiguredView && !hasSimpleLeafView && !hasLeafSchemaView && isVehicleListing ? (
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
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--surface-2)] px-3 py-1 text-xs font-bold text-[var(--ink-1)]">{sourceTransparency.sourceLabel}</span>
            <span className="rounded-full border border-[var(--line)] px-3 py-1 text-xs font-semibold text-[var(--ink-2)]">{sourceTransparency.freshnessLabel}</span>
          </div>
          {sourceTransparency.isExternal ? (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
              <p className="font-semibold">
                {sourceTransparency.ownershipStatus === "claimed"
                  ? locale === "fa"
                    ? "این اعلان از منبع بیرونی وارد شده، اما مالکیت آن اکنون توسط صاحباش تأیید شده است."
                    : locale === "ps"
                      ? "دا اعلان له بهرنۍ سرچینې راغلی، خو مالکیت یې اوس د صاحباش له خوا تایید شوی دی."
                      : "This listing was imported from an external source, and its ownership is now verified by Sahibash."
                  : locale === "fa"
                    ? "این اعلان از منبع بیرونی وارد شده و هنوز به حساب فروشنده در صاحباش وصل نیست. پیام و پیشنهاد پس از تأیید مالک فعال می‌شود."
                    : locale === "ps"
                      ? "دا اعلان له بهرنۍ سرچینې راغلی او لا د صاحباش د پلورونکي له حساب سره نه دی تړلی. پیغام او وړاندیز د مالک له تایید وروسته فعالېږي."
                      : "This listing came from an external source and is not yet connected to a Sahibash seller account. Messaging and offers activate after ownership verification."}
              </p>
              {sourceTransparency.needsAvailabilityWarning ? (
                <p className="mt-1">
                  {locale === "fa"
                    ? "لطفاً پیش از پرداخت یا سفر، موجودیت و جزئیات را دوباره تأیید کنید."
                    : locale === "ps"
                      ? "مهرباني وکړئ له پیسو ورکولو یا تګ مخکې شتون او معلومات بیا تایید کړئ."
                      : "Please confirm availability and details before paying or traveling."}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                {sourceTransparency.ownershipStatus !== "claimed" ? (
                  activeOwnershipClaim ? (
                    <span role="status" className="rounded-lg bg-emerald-100 px-3 py-2 text-xs font-bold text-emerald-800">
                      {locale === "fa" ? "درخواست مالکیت در حال بررسی است" : locale === "ps" ? "د مالکیت غوښتنه تر کتنې لاندې ده" : "Ownership request under review"}
                    </span>
                  ) : (
                    <Link href={ownershipRequestHref} className="rounded-lg bg-[var(--ink-1)] px-3 py-2 text-xs font-bold text-white">
                      {locale === "fa" ? "این اعلان من است" : locale === "ps" ? "دا زما اعلان دی" : "This is my listing"}
                    </Link>
                  )
                ) : null}
                {activeRemovalRequest ? (
                  <span role="status" className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-amber-800">
                    {locale === "fa" ? "درخواست حذف در حال بررسی است" : locale === "ps" ? "د لرې کولو غوښتنه تر کتنې لاندې ده" : "Removal request under review"}
                  </span>
                ) : (
                  <Link href={removalRequestHref} className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-xs font-bold text-[var(--ink-1)]">
                    {locale === "fa" ? "درخواست حذف" : locale === "ps" ? "د لرې کولو غوښتنه" : "Request removal"}
                  </Link>
                )}
              </div>
            </div>
          ) : null}
        </section>

        <section id="listing-contact" className="rounded-2xl border border-[var(--line)] bg-white p-4 sm:p-5">
          <h2 className="text-base font-bold">{t.listing.sellerInformation}</h2>
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <p><span className="text-[var(--ink-2)]">{t.listing.name}:</span> {listing.user_id ? <Link href={localizePath(`/sellers/${listing.user_id}`, locale)} className="font-semibold text-[var(--accent)] hover:underline">{safeSellerName}</Link> : <span className="font-semibold">{safeSellerName}</span>}</p>
            <p><span className="text-[var(--ink-2)]">{t.listing.phone}:</span> <span className="font-semibold">{phonePrivacyLabel}</span></p>
            {sellerJoinedDate ? (
              <p><span className="text-[var(--ink-2)]">{t.listing.joined}:</span> <span className="font-semibold">{sellerJoinedDate}</span></p>
            ) : null}
          </div>
          {listing.minimum_offer ? (
            <p className="mt-2 text-sm text-[var(--ink-2)]">{t.listing.minimumOffer}: {formatCurrencyAmount(listing.minimum_offer, listing.currency, locale)}</p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
          {hasContactPhone ? <ListingContactActions listingId={listing.id} title={displayTitle} locale={locale} canContact={sourceTransparency.canContact} isExternal={sourceTransparency.isExternal} hasPhone={hasContactPhone} whatsappEnabled={whatsappEnabled} /> : null}
            {canUseSahibashSellerTools ? (
              <Link href={composeHref} className="rounded-lg bg-[var(--ink-1)] px-4 py-2 text-sm font-semibold text-white">{t.listing.message}</Link>
            ) : null}
            {canUseSahibashSellerTools ? (
              <Link href={offerHref} className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white">{t.listing.offer}</Link>
            ) : null}
          </div>
          {sourceTransparency.isExternal && !hasAccountSeller ? (
            <p className="mt-3 rounded-xl bg-[var(--surface-2)] px-3 py-2 text-xs font-semibold text-[var(--ink-2)]">
              {locale === "fa"
                ? "این فروشنده هنوز صندوق پیام صاحباش ندارد. برای پرسش درباره موجودیت فقط از گزینه تماس منبع استفاده کنید و پیش‌پرداخت نفرستید."
                : locale === "ps"
                  ? "دا پلورونکی لا د صاحباش د پیغام صندوق نه لري. د شتون پوښتنې لپاره یوازې د سرچینې د اړیکې لاره وکاروئ او مخکې پیسې مه لېږئ."
                  : "This seller does not have a Sahibash inbox yet. Use the source contact option only to confirm availability, and do not send advance payment."}
            </p>
          ) : null}
        </section>

        {listing.province_id && listing.district_id && (
          <LocationCard
            location={{
              countryId: listing.country_id,
              provinceId: listing.province_id,
              districtId: listing.district_id,
              areaId: listing.area_id,
              provinceName: localizedProvinceName,
              districtName: localizedDistrict,
              areaName: localizedAreaName,
              addressText: listing.location_visibility === "exact" ? listing.address_text : null,
              latitude: listing.location_visibility === "exact" ? listing.latitude : null,
              longitude: listing.location_visibility === "exact" ? listing.longitude : null,
              accuracy: listing.location_accuracy,
              visibility: listing.location_visibility as LocationVisibility,
            }}
            locale={locale}
          />
        )}

        <ListingAiAssistant locale={locale} facts={aiAssistantFacts} isOwner={Boolean(isOwner)} />

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

        {!hasConfiguredView && !hasSimpleLeafView ? (
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
        ) : null}

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
        <FavoriteToggleButton
          listingId={listing.id}
          initialFavorited={isFavorited}
          addLabel={t.listing.addToFavorites}
          removeLabel={t.listing.removeFromFavorites}
        />
        <form action={createReportAction} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="listingId" value={listing.id} />
          <select name="reason" required defaultValue="" className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm">
            <option value="" disabled>{t.listing.selectReportReason}</option>
            <option value={t.listing.fraudOrScam}>{t.listing.fraudOrScam}</option>
            <option value={locale === "fa" ? "فروخته‌شده یا موجود نیست" : locale === "ps" ? "پلورل شوی یا نشته" : "Sold or unavailable"}>{locale === "fa" ? "فروخته‌شده یا موجود نیست" : locale === "ps" ? "پلورل شوی یا نشته" : "Sold or unavailable"}</option>
            <option value={t.listing.wrongCategory}>{t.listing.wrongCategory}</option>
            <option value={locale === "fa" ? "اطلاعات نادرست" : locale === "ps" ? "ناسم معلومات" : "Incorrect information"}>{locale === "fa" ? "اطلاعات نادرست" : locale === "ps" ? "ناسم معلومات" : "Incorrect information"}</option>
            <option value={t.listing.duplicateListing}>{t.listing.duplicateListing}</option>
            <option value={t.listing.prohibitedOrUnsafeItem}>{t.listing.prohibitedOrUnsafeItem}</option>
            <option value={t.listing.spamOrMisleading}>{t.listing.spamOrMisleading}</option>
            <option value={t.listing.other}>{t.listing.other}</option>
          </select>
          <input name="details" placeholder={t.listing.optionalDetails} className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm" />
          <button className="rounded-lg bg-[var(--ink-1)] px-4 py-2 text-sm font-semibold text-white">{t.listing.reportListing}</button>
        </form>
      </div>

      {(qp.translation === "unavailable" || translationUnavailable) ? (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {t.listing.translationUnavailable}
        </div>
      ) : null}

      <Suspense fallback={null}>
        <SimilarListingsSection listing={listing} locale={locale} />
      </Suspense>

      {canUseSahibashSellerTools ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-white/95 px-4 py-3 backdrop-blur sm:hidden">
          <div className="mx-auto flex w-full max-w-5xl gap-2">
            <Link href={composeHref} className="flex-1 rounded-lg bg-[var(--ink-1)] px-4 py-3 text-center text-sm font-semibold text-white">{t.listing.message}</Link>
            <Link href={offerHref} className="flex-1 rounded-lg bg-[var(--accent)] px-4 py-3 text-center text-sm font-semibold text-white">{t.listing.offer}</Link>
          </div>
        </div>
      ) : null}

      {qp.claim === "1" && sourceTransparency.isExternal && sourceTransparency.ownershipStatus !== "claimed" && !activeOwnershipClaim ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-lg font-bold">
                  {locale === "fa" ? "درخواست مالکیت اعلان" : locale === "ps" ? "د اعلان د مالکیت غوښتنه" : "Claim this listing"}
                </h3>
                <p className="mt-1 text-sm text-[var(--ink-2)]">
                  {locale === "fa"
                    ? "این کار مالکیت را فوراً منتقل نمی‌کند. معلوماتی بدهید که مدیر بتواند ارتباط شما با اعلان را بدون افشای معلومات خصوصی تأیید کند."
                    : locale === "ps"
                      ? "دا کار مالکیت سمدستي نه لېږدوي. داسې معلومات ورکړئ چې مدیر وکولای شي له اعلان سره ستاسو تړاو د شخصي معلوماتو له افشا پرته تایید کړي."
                      : "This does not transfer ownership immediately. Give the administrator enough information to verify your connection to the listing without exposing private information."}
                </p>
              </div>
              <Link href={listingHref} className="rounded px-2 py-1 text-sm text-[var(--ink-2)] hover:bg-[var(--surface-2)]">{t.listing.close}</Link>
            </div>
            <form action={submitExternalListingClaimAction} className="space-y-3">
              <input type="hidden" name="listingId" value={listing.id} />
              <label className="block text-sm font-semibold">
                {locale === "fa" ? "روش تأیید مالکیت" : locale === "ps" ? "د مالکیت د تایید لاره" : "How can we verify ownership?"}
                <textarea
                  name="claimantNote"
                  required
                  minLength={10}
                  maxLength={1000}
                  placeholder={locale === "fa" ? "مثلاً شماره تماس من با اعلان یکسان است یا می‌توانم اسناد مربوط را ارائه کنم." : locale === "ps" ? "لکه: زما د اړیکې شمېره له اعلان سره برابره ده یا اړوند اسناد وړاندې کولی شم." : "For example: my contact number matches the listing, or I can provide supporting documents."}
                  className="mt-2 min-h-28 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 font-normal"
                />
              </label>
              <p className="text-xs text-[var(--ink-2)]">
                {locale === "fa" ? "اسناد حساس را در این کادر ننویسید؛ مدیر در صورت نیاز روش امن بعدی را مشخص می‌کند." : locale === "ps" ? "حساس اسناد دلته مه لیکئ؛ مدیر به د اړتیا په صورت کې خوندي بله لاره وښيي." : "Do not paste sensitive documents here; an administrator will provide a secure next step if needed."}
              </p>
              <button className="w-full rounded-xl bg-[var(--ink-1)] px-4 py-3 text-sm font-bold text-white">
                {locale === "fa" ? "ارسال برای بررسی" : locale === "ps" ? "د کتنې لپاره لېږل" : "Submit for review"}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {qp.remove === "1" && sourceTransparency.isExternal && !activeRemovalRequest ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-lg font-bold">
                  {locale === "fa" ? "درخواست حذف اعلان" : locale === "ps" ? "د اعلان د لرې کولو غوښتنه" : "Request listing removal"}
                </h3>
                <p className="mt-1 text-sm text-[var(--ink-2)]">
                  {locale === "fa"
                    ? "برای جلوگیری از حذف نادرست، مدیر دلیل و ارتباط شما با اعلان را بررسی می‌کند. اعلان تا تأیید درخواست حذف نمی‌شود."
                    : locale === "ps"
                      ? "د ناسم لرې کولو د مخنیوي لپاره، مدیر دلیل او له اعلان سره ستاسو تړاو ګوري. اعلان تر تایید مخکې نه لرې کېږي."
                      : "To prevent malicious removals, an administrator verifies the reason and your connection to the listing. The listing stays public until approval."}
                </p>
              </div>
              <Link href={listingHref} className="rounded px-2 py-1 text-sm text-[var(--ink-2)] hover:bg-[var(--surface-2)]">{t.listing.close}</Link>
            </div>
            <form action={submitExternalListingRemovalAction} className="space-y-3">
              <input type="hidden" name="listingId" value={listing.id} />
              <label className="block text-sm font-semibold">
                {locale === "fa" ? "دلیل درخواست" : locale === "ps" ? "د غوښتنې دلیل" : "Reason for removal"}
                <select name="reasonCode" required defaultValue="" className="mt-2 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 font-normal">
                  <option value="" disabled>{locale === "fa" ? "انتخاب کنید" : locale === "ps" ? "غوره کړئ" : "Select a reason"}</option>
                  <option value="owner_request">{locale === "fa" ? "من مالک این اعلان هستم" : locale === "ps" ? "زه د دې اعلان مالک یم" : "I own this listing"}</option>
                  <option value="sold_or_unavailable">{locale === "fa" ? "فروخته شده یا دیگر موجود نیست" : locale === "ps" ? "پلورل شوی یا نور نشته" : "Sold or no longer available"}</option>
                  <option value="privacy_or_rights">{locale === "fa" ? "حریم خصوصی یا حقوق محتوا" : locale === "ps" ? "محرمیت یا د منځپانګې حقونه" : "Privacy or content rights"}</option>
                  <option value="wrong_information">{locale === "fa" ? "معلومات نادرست است" : locale === "ps" ? "معلومات ناسم دي" : "Information is incorrect"}</option>
                  <option value="other">{locale === "fa" ? "دلیل دیگر" : locale === "ps" ? "بل دلیل" : "Other"}</option>
                </select>
              </label>
              <label className="block text-sm font-semibold">
                {locale === "fa" ? "جزئیات برای بررسی" : locale === "ps" ? "د کتنې معلومات" : "Verification details"}
                <textarea
                  name="details"
                  required
                  minLength={10}
                  maxLength={1500}
                  placeholder={locale === "fa" ? "دلیل را توضیح دهید و بگویید مدیر چگونه می‌تواند آن را تأیید کند." : locale === "ps" ? "دلیل تشریح کړئ او ووایئ چې مدیر یې څنګه تاییدولی شي." : "Explain the reason and how an administrator can verify it."}
                  className="mt-2 min-h-28 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 font-normal"
                />
              </label>
              <button className="w-full rounded-xl bg-red-700 px-4 py-3 text-sm font-bold text-white">
                {locale === "fa" ? "ارسال درخواست حذف" : locale === "ps" ? "د لرې کولو غوښتنه لېږل" : "Submit removal request"}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {qp.compose === "1" && canUseSahibashSellerTools && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">{t.listing.sendMessage}</h3>
              <Link href={listingHref} className="rounded px-2 py-1 text-sm text-[var(--ink-2)] hover:bg-[var(--surface-2)]">
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

      {qp.offerbox === "1" && canUseSahibashSellerTools && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">{t.listing.sendYourOffer}</h3>
              <Link href={listingHref} className="rounded px-2 py-1 text-sm text-[var(--ink-2)] hover:bg-[var(--surface-2)]">
                {t.listing.close}
              </Link>
            </div>
            {listing.minimum_offer ? (
              <p className="mb-3 text-sm text-[var(--ink-2)]">
                {t.listing.minimumOffer}: {formatCurrencyAmount(listing.minimum_offer, listing.currency, locale)}
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
