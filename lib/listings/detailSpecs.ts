import type { CategoryField, ListingAttribute, ListingWithRelations } from "@/types/database";

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

function toValue(attr: ListingAttribute): string | null {
  if (typeof attr.attribute_value_text === "string" && attr.attribute_value_text.trim().length > 0) {
    return attr.attribute_value_text.trim();
  }
  if (typeof attr.attribute_value_number === "number") {
    return String(attr.attribute_value_number);
  }
  if (typeof attr.attribute_value_boolean === "boolean") {
    return attr.attribute_value_boolean ? "Yes" : "No";
  }
  if (attr.attribute_value_json) {
    return JSON.stringify(attr.attribute_value_json);
  }
  return null;
}

export function buildListingSpecView(
  listing: ListingWithRelations,
  fields: CategoryField[],
  attributes: ListingAttribute[]
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
    const value = toValue(attr);
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

  const basicRows = [
    { label: "Price", value: `${new Intl.NumberFormat("en-US").format(listing.price)} ${listing.currency}` },
    { label: "Property Type", value: listing.category_node?.name ?? "-" },
    { label: "Listing Type", value: grouped.property_details?.find((x) => x.key === "rental_type")?.value ?? "-" },
    { label: "Listing Date", value: new Date(listing.created_at).toLocaleDateString() },
    { label: "Listing ID", value: listing.id },
    { label: "Province", value: listing.province ?? "-" },
    { label: "District", value: listing.district ?? "-" },
    { label: "Area", value: listing.city ?? "-" },
    { label: "Address", value: listing.address_optional ?? "-" },
  ];

  return { basicRows, grouped };
}
