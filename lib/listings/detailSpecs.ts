import type { CategoryField, ListingAttribute, ListingWithRelations } from "@/types/database";
import type { AppLocale } from "@/lib/i18n/translations";

type FieldMeta = {
  label: string;
  group: string;
};

type AttrOut = {
  key: string;
  label: string;
  value: string;
  group: string;
};

const LOCKED_SPEC_PREFIX = "locked__";

const LOCKED_LABELS: Record<string, string> = {
  make: "Make",
  brand: "Brand",
  model: "Model",
  series: "Series",
  variant: "Variant",
  operating_system: "Operating System",
  screen_size: "Screen Size",
  device_type: "Device Type",
  sim_type: "SIM Type",
  release_year: "Release Year",
  network_type: "Network Type",
  charging_port: "Charging Port",
  biometric: "Face ID / Fingerprint",
  processor: "Processor",
  vehicle_type: "Vehicle Type",
  body_type: "Body Type",
  fuel_type: "Fuel Type",
  gear: "Gear / Transmission",
  transmission: "Transmission",
  engine_power: "Engine Power",
  engine_capacity: "Engine Capacity",
  engine_size: "Engine Size",
  wheel_drive: "Wheel Drive",
  drive_type: "Wheel Drive",
  doors: "Doors",
  seats: "Seats",
};

const USER_LABELS: Record<string, string> = {
  year: "Year",
  mileage: "Mileage (KM)",
  color: "Color",
  vehicle_status: "Vehicle Status",
  warranty: "Warranty",
  salvage_record: "Salvage Record",
  plate_status: "Plate Status",
  seller_type: "Seller Type",
  exchange_available: "Exchange",
  neighborhood: "Neighborhood",
  video_url: "Video URL",
  drive_type: "Drive Type",
  doors: "Doors",
  seats: "Seats",
};

const GROUP_PRIORITY = ["locked_specs", "property_details", "category_specific", "interior_features", "exterior_features", "location_nearby", "transportation", "view", "utilities"];

function isLockedSpecKey(key: string) {
  return key.startsWith(LOCKED_SPEC_PREFIX);
}

function unlockedKey(key: string) {
  return key.startsWith(LOCKED_SPEC_PREFIX) ? key.slice(LOCKED_SPEC_PREFIX.length) : key;
}

function normalize(value: string) {
  return value.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function yesNo(locale: AppLocale, value: boolean) {
  if (locale === "fa") return value ? "بلی" : "خیر";
  if (locale === "ps") return value ? "هو" : "نه";
  return value ? "Yes" : "No";
}

function toValue(attr: ListingAttribute, locale: AppLocale): string | null {
  if (typeof attr.attribute_value_text === "string" && attr.attribute_value_text.trim().length > 0) {
    const text = attr.attribute_value_text.trim();
    if (["-", "null", "undefined"].includes(text.toLowerCase())) {
      return null;
    }
    return text;
  }
  if (typeof attr.attribute_value_number === "number") {
    return String(attr.attribute_value_number);
  }
  if (typeof attr.attribute_value_boolean === "boolean") {
    return yesNo(locale, attr.attribute_value_boolean);
  }
  if (attr.attribute_value_json) {
    return JSON.stringify(attr.attribute_value_json);
  }
  return null;
}

export function buildListingSpecView(
  listing: ListingWithRelations,
  fields: CategoryField[],
  attributes: ListingAttribute[],
  locale: AppLocale
): {
  basicRows: Array<{ label: string; value: string }>;
  grouped: Record<string, AttrOut[]>;
} {
  const fieldMap = new Map<string, FieldMeta>();
  for (const field of fields) {
    fieldMap.set(field.field_key, {
      label: field.field_label,
      group: field.group_key ?? "property_details",
    });
  }

  const grouped: Record<string, AttrOut[]> = {};
  for (const attr of attributes) {
    const value = toValue(attr, locale);
    if (!value) continue;

    const rawKey = unlockedKey(attr.attribute_key);
    const meta = fieldMap.get(rawKey);
    const label = isLockedSpecKey(attr.attribute_key)
      ? (LOCKED_LABELS[rawKey] ?? normalize(rawKey))
      : (meta?.label ?? USER_LABELS[rawKey] ?? LOCKED_LABELS[rawKey] ?? normalize(rawKey));
    const group = isLockedSpecKey(attr.attribute_key)
      ? "locked_specs"
      : (meta?.group ?? "property_details");

    if (!grouped[group]) grouped[group] = [];
    grouped[group].push({
      key: rawKey,
      label,
      value,
      group,
    });
  }

  for (const groupKey of Object.keys(grouped)) {
    grouped[groupKey].sort((a, b) => {
      const aPriority = GROUP_PRIORITY.includes(groupKey) ? 0 : 1;
      const bPriority = GROUP_PRIORITY.includes(groupKey) ? 0 : 1;
      if (aPriority !== bPriority) return aPriority - bPriority;
      return a.label.localeCompare(b.label);
    });
  }

  const basicLabels = locale === "fa"
    ? {
        price: "قیمت",
        propertyType: "نوع ملک",
        listingType: "نوع اعلان",
        listingDate: "تاریخ اعلان",
        listingId: "شناسه اعلان",
        province: "ولایت",
        district: "ولسوالی",
        area: "ساحه",
        address: "آدرس",
      }
    : locale === "ps"
      ? {
          price: "بیه",
          propertyType: "د ملک ډول",
          listingType: "د اعلان ډول",
          listingDate: "د اعلان نېټه",
          listingId: "د اعلان پېژند",
          province: "ولایت",
          district: "ولسوالي",
          area: "سیمه",
          address: "پته",
        }
      : {
          price: "Price",
          propertyType: "Property Type",
          listingType: "Listing Type",
          listingDate: "Listing Date",
          listingId: "Listing ID",
          province: "Province",
          district: "District",
          area: "Area",
          address: "Address",
        };

  const basicRows = [
    { label: basicLabels.price, value: `${new Intl.NumberFormat("en-US").format(listing.price)} ${listing.currency}` },
    { label: basicLabels.propertyType, value: listing.category_node?.name ?? "" },
    { label: basicLabels.listingType, value: grouped.property_details?.find((x) => x.key === "rental_type")?.value ?? "" },
    { label: basicLabels.listingDate, value: new Date(listing.created_at).toLocaleDateString() },
    { label: basicLabels.listingId, value: listing.id },
    { label: basicLabels.province, value: listing.province ?? "" },
    { label: basicLabels.district, value: listing.district ?? "" },
    { label: basicLabels.area, value: listing.neighborhood ?? "" },
    { label: basicLabels.address, value: listing.address_optional ?? "" },
  ].filter((row) => {
    const normalized = String(row.value ?? "").trim().toLowerCase();
    return Boolean(normalized) && normalized !== "-" && normalized !== "null" && normalized !== "undefined";
  });

  return { basicRows, grouped };
}
