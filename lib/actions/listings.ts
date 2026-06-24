"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSelectedCategoryNodeId, listingSchema, type ListingInput } from "@/lib/validators/listing";

const RESERVED_FORM_KEYS = new Set([
  "title",
  "description",
  "category_id",
  "category_node_id",
  "subcategory_id",
  "locked_specs_json",
  "vehicle_features_json",
  "selected_product_brand",
  "selected_product_series",
  "selected_product_model",
  "vehicle_variant_id",
  "damage_all_original",
  "damage_parts_json",
  "price",
  "currency",
  "city",
  "province",
  "district",
  "province_id",
  "district_id",
  "area_text",
  "latitude",
  "longitude",
  "location_source",
  "location_accuracy",
  "location_visibility",
  "is_location_confirmed",
  "neighborhood",
  "address_optional",
  "video_url",
  "contact_phone",
  "contact_name",
  "negotiable",
  "minimum_offer",
  "featured",
  "year",
  "mileage",
  "color",
  "vehicle_status",
  "warranty",
  "salvage_record",
  "plate_status",
  "seller_type",
  "exchange_available",
  "vehicle_type",
  "vehicle_subtype",
  "vehicle_brand",
  "vehicle_model",
  "vehicle_year",
  "vehicle_is_manual",
  "vehicle_is_classic",
  "vehicle_is_custom",
  "vehicle_manual_specs_json",
  "main_category_id",
  "child_category_id",
  "brand_id",
  "model_id",
  "electronics_category_id",
  "electronics_brand_id",
  "electronics_model_id",
  "manual_brand",
  "manual_model",
  "electronics_condition",
  "electronics_storage",
  "electronics_ram",
  "electronics_color",
  "electronics_battery_health",
  "electronics_warranty",
  "electronics_box_included",
  "electronics_charger_included",
  "electronics_repair_history",
  "electronics_network_registered",
  "electronics_area",
  "electronics_description",
  "suitable_for_students",
  "student_housing_type",
  "gender_allowed",
  "payment_period",
  "distance_to_university",
  "shared_allowed",
  "students_allowed",
  "room_type",
  "number_of_beds",
  "meals_included",
  "internet",
  "heating",
  "air_conditioning",
  "security",
  "contact_preferences",
]);

const VEHICLE_META_FIELDS: Record<string, { type: "text" | "number" | "boolean"; label: string; unit?: string | null }> = {
  year: { type: "number", label: "Year" },
  mileage: { type: "number", label: "KM", unit: "km" },
  color: { type: "text", label: "Color" },
  vehicle_status: { type: "text", label: "Vehicle Status" },
  warranty: { type: "text", label: "Warranty" },
  salvage_record: { type: "text", label: "Salvage Record" },
  plate_status: { type: "text", label: "Plate Status" },
  seller_type: { type: "text", label: "Seller Type" },
  exchange_available: { type: "boolean", label: "Exchange" },
  neighborhood: { type: "text", label: "Neighborhood" },
  video_url: { type: "text", label: "Video URL" },
  vehicle_type: { type: "text", label: "Vehicle Type" },
  vehicle_subtype: { type: "text", label: "Vehicle Subtype" },
  vehicle_brand: { type: "text", label: "Manual Brand" },
  vehicle_model: { type: "text", label: "Manual Model" },
  vehicle_is_manual: { type: "boolean", label: "Manual Entry" },
  vehicle_is_classic: { type: "boolean", label: "Classic Vehicle" },
  vehicle_is_custom: { type: "boolean", label: "Custom Vehicle" },
};

function toFormValueText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function toFormValueBoolean(value: FormDataEntryValue | null) {
  const text = toFormValueText(value).toLowerCase();
  return text === "true" || text === "1" || text === "on" || text === "yes";
}

function toAttributePayload(field: {
  id: number;
  field_key: string;
  field_type: string;
  unit: string | null;
}, rawValue: FormDataEntryValue | null) {
  const value = toFormValueText(rawValue);

  if (field.field_type === "boolean") {
    const booleanValue = value === "true" || value === "on" || value === "1";
    return {
      category_field_id: field.id,
      attribute_key: field.field_key,
      attribute_value_boolean: booleanValue,
      unit: field.unit,
    };
  }

  if (field.field_type === "number") {
    const numericValue = value === "" ? null : Number(value);
    return {
      category_field_id: field.id,
      attribute_key: field.field_key,
      attribute_value_number: Number.isFinite(numericValue as number) ? numericValue : null,
      unit: field.unit,
    };
  }

  return {
    category_field_id: field.id,
    attribute_key: field.field_key,
    attribute_value_text: value || null,
    unit: field.unit,
  };
}

function toLockedAttributePayload(key: string, value: unknown) {
  const attributeKey = `locked__${key}`;

  if (typeof value === "boolean") {
    return {
      category_field_id: null,
      attribute_key: attributeKey,
      attribute_value_boolean: value,
      unit: null,
    };
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return {
      category_field_id: null,
      attribute_key: attributeKey,
      attribute_value_number: value,
      unit: null,
    };
  }

  const textValue = String(value ?? "").trim();
  if (!textValue) {
    return null;
  }

  return {
    category_field_id: null,
    attribute_key: attributeKey,
    attribute_value_text: textValue,
    unit: null,
  };
}

async function persistLockedListingSpecs(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  listingId: string,
  formData: FormData
) {
  const raw = toFormValueText(formData.get("locked_specs_json"));
  if (!raw) {
    return;
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return;
  }

  const attributeRows = Object.entries(parsed)
    .map(([key, value]) => toLockedAttributePayload(key, value))
    .filter((row): row is NonNullable<typeof row> => Boolean(row));

  if (attributeRows.length === 0) {
    return;
  }

  await supabase.from("listing_attributes").insert(
    attributeRows.map((row) => ({
      listing_id: listingId,
      category_field_id: row.category_field_id,
      attribute_key: row.attribute_key,
      attribute_value_text: row.attribute_value_text ?? null,
      attribute_value_number: row.attribute_value_number ?? null,
      attribute_value_boolean: row.attribute_value_boolean ?? null,
      attribute_value_json: null,
      unit: row.unit ?? null,
    }))
  );
}

async function persistVehicleDamage(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  listingId: string,
  formData: FormData
) {
  const rawParts = toFormValueText(formData.get("damage_parts_json"));
  if (!rawParts) return;

  let parts: Array<{ key: string; label: string; condition: string }>;
  try {
    parts = JSON.parse(rawParts) as Array<{ key: string; label: string; condition: string }>;
  } catch {
    return;
  }

  const allOriginal = toFormValueText(formData.get("damage_all_original")) === "true";

  try {
    const { data: report, error: reportErr } = await supabase
      .from("vehicle_damage_reports")
      .upsert({ listing_id: listingId, all_original: allOriginal }, { onConflict: "listing_id" })
      .select("id")
      .single();

    if (reportErr || !report) return;

    await supabase.from("vehicle_damage_parts").delete().eq("damage_report_id", report.id);
    if (parts.length > 0) {
      await supabase.from("vehicle_damage_parts").insert(
        parts.map((p) => ({
          damage_report_id: report.id,
          part_key: p.key,
          part_label: p.label,
          condition: p.condition,
        }))
      );
    }
  } catch {
    // vehicle_damage_reports table may not exist yet; fail silently
  }
}

async function persistVehicleFeatures(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  listingId: string,
  formData: FormData
) {
  const raw = toFormValueText(formData.get("vehicle_features_json"));

  try {
    await supabase.from("listing_vehicle_features").delete().eq("listing_id", listingId);

    if (!raw) {
      return;
    }

    const parsed = JSON.parse(raw) as number[];
    const featureIds = Array.from(new Set(parsed.filter((value) => Number.isInteger(value) && value > 0)));

    if (featureIds.length === 0) {
      return;
    }

    await supabase.from("listing_vehicle_features").insert(
      featureIds.map((featureId) => ({
        listing_id: listingId,
        feature_id: featureId,
      }))
    );
  } catch {
    // listing_vehicle_features may not exist in older environments yet
  }
}

async function persistVehicleMetaAttributes(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  listingId: string,
  formData: FormData
) {
  type ListingAttributeUpsertRow = {
    listing_id: string;
    category_field_id: null;
    attribute_key: string;
    attribute_value_text: string | null;
    attribute_value_number: number | null;
    attribute_value_boolean: boolean | null;
    attribute_value_json: null;
    unit: string | null;
  };

  const rows = Object.entries(VEHICLE_META_FIELDS).flatMap(([key, config]) => {
    const raw = formData.get(key);

    if (config.type === "boolean") {
      const text = toFormValueText(raw);
      if (!["true", "false", "1", "0", "on"].includes(text)) {
        return [];
      }

      return [{
        listing_id: listingId,
        category_field_id: null,
        attribute_key: key,
        attribute_value_text: null,
        attribute_value_number: null,
        attribute_value_boolean: text === "true" || text === "1" || text === "on",
        attribute_value_json: null,
        unit: null,
      }] as ListingAttributeUpsertRow[];
    }

    const text = toFormValueText(raw);
    if (!text) {
      return [];
    }

    if (config.type === "number") {
      const numericValue = Number(text);
      if (!Number.isFinite(numericValue)) {
        return [];
      }

      return [{
        listing_id: listingId,
        category_field_id: null,
        attribute_key: key,
        attribute_value_text: null,
        attribute_value_number: numericValue,
        attribute_value_boolean: null,
        attribute_value_json: null,
        unit: config.unit ?? null,
      }] as ListingAttributeUpsertRow[];
    }

    return [{
      listing_id: listingId,
      category_field_id: null,
      attribute_key: key,
      attribute_value_text: text,
      attribute_value_number: null,
      attribute_value_boolean: null,
      attribute_value_json: null,
      unit: config.unit ?? null,
    }] as ListingAttributeUpsertRow[];
  });

  if (rows.length === 0) {
    return;
  }

  await supabase.from("listing_attributes").upsert(rows, {
    onConflict: "listing_id,attribute_key",
  });
}

async function persistListingCategoryPath(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  listingId: string,
  formData: FormData,
  fallback: {
    mainCategoryId: number;
    subcategoryId: number;
    childCategoryId: number;
  }
) {
  const parseId = (value: FormDataEntryValue | null, defaultValue: number) => {
    if (typeof value !== "string") return defaultValue;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultValue;
  };

  const mainCategoryId = parseId(formData.get("main_category_id"), fallback.mainCategoryId);
  const subcategoryId = parseId(formData.get("subcategory_id"), fallback.subcategoryId);
  const childCategoryId = parseId(formData.get("child_category_id"), fallback.childCategoryId);

  const parseOptionalId = (value: FormDataEntryValue | null) => {
    if (typeof value !== "string") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  };

  const brandId = parseOptionalId(formData.get("brand_id"));
  const modelId = parseOptionalId(formData.get("model_id"));

  try {
    await supabase
      .from("listing_category_path")
      .upsert(
        {
          listing_id: listingId,
          main_category_id: mainCategoryId,
          subcategory_id: subcategoryId,
          child_category_id: childCategoryId,
          brand_id: brandId,
          model_id: modelId,
        },
        { onConflict: "listing_id" }
      );
  } catch {
    // listing_category_path may not exist in older environments yet
  }
}

async function persistElectronicsListing(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  listingId: string,
  formData: FormData,
  fallback: {
    categoryNodeId: number;
    province: string | null;
    district: string | null;
    description: string;
    price: number;
    currency: "AFN" | "USD";
  }
) {
  const toNum = (value: FormDataEntryValue | null): number | null => {
    if (typeof value !== "string") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  };

  const categoryId = toNum(formData.get("electronics_category_id"));
  const brandId = toNum(formData.get("electronics_brand_id"));
  const modelId = toNum(formData.get("electronics_model_id"));
  const manualBrand = toFormValueText(formData.get("manual_brand")) || null;
  const manualModel = toFormValueText(formData.get("manual_model")) || null;

  if (!categoryId || (!brandId && !manualBrand)) {
    return;
  }

  const electronicsDescription = toFormValueText(formData.get("electronics_description")) || fallback.description;
  const area = toFormValueText(formData.get("electronics_area")) || null;
  const condition = toFormValueText(formData.get("electronics_condition")) || null;
  const storage = toFormValueText(formData.get("electronics_storage")) || null;
  const ram = toFormValueText(formData.get("electronics_ram")) || null;
  const color = toFormValueText(formData.get("electronics_color")) || null;
  const batteryHealth = toFormValueText(formData.get("electronics_battery_health")) || null;
  const warranty = toFormValueText(formData.get("electronics_warranty")) || null;
  const repairHistory = toFormValueText(formData.get("electronics_repair_history")) || null;
  const networkRegistered = toFormValueText(formData.get("electronics_network_registered")) || null;

  const toBool = (value: FormDataEntryValue | null) => {
    const text = toFormValueText(value);
    return text === "true" || text === "1" || text === "on";
  };

  try {
    await supabase
      .from("electronics_listings")
      .upsert(
        {
          listing_id: listingId,
          category_id: categoryId,
          brand_id: brandId,
          model_id: modelId,
          manual_brand: manualBrand,
          manual_model: manualModel,
          condition,
          price: fallback.price,
          currency: fallback.currency,
          storage,
          ram,
          color,
          battery_health: batteryHealth,
          warranty,
          box_included: toBool(formData.get("electronics_box_included")),
          charger_included: toBool(formData.get("electronics_charger_included")),
          repair_history: repairHistory,
          network_registered: networkRegistered,
          province: fallback.province,
          district: fallback.district,
          area,
          description: electronicsDescription,
        },
        { onConflict: "listing_id" }
      );
  } catch {
    // electronics_listings may not exist before migration is applied
  }
}

async function persistListingAttributes(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  listingId: string,
  categoryNodeId: number,
  formData: FormData,
  replaceExisting: boolean = false
) {
  const { data: fields } = await supabase
    .from("category_fields")
    .select("id, field_key, field_type, unit")
    .eq("category_node_id", categoryNodeId)
    .eq("is_active", true);

  const fieldMap = new Map((fields ?? []).map((field) => [field.field_key, field]));
  const attributeRows = Array.from(formData.entries())
    .filter(([key]) => !RESERVED_FORM_KEYS.has(key) && fieldMap.has(key))
    .map(([key, value]) => toAttributePayload(fieldMap.get(key)!, value))
    .filter((row) => Boolean(row.category_field_id));

  if (replaceExisting) {
    await supabase.from("listing_attributes").delete().eq("listing_id", listingId);
  }

  if (attributeRows.length === 0) {
    return;
  }

  await supabase.from("listing_attributes").insert(
    attributeRows.map((row) => ({
      listing_id: listingId,
      category_field_id: row.category_field_id,
      attribute_key: row.attribute_key,
      attribute_value_text: row.attribute_value_text ?? null,
      attribute_value_number: row.attribute_value_number ?? null,
      attribute_value_boolean: row.attribute_value_boolean ?? null,
      attribute_value_json: null,
      unit: row.unit ?? null,
    }))
  );
}

async function resolveCategoryContext(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  input: { category_id?: number | null; category_node_id?: number | null; subcategory_id?: number | null }
) {
  const categoryNodeId = getSelectedCategoryNodeId(input);

  if (!categoryNodeId) {
    return null;
  }

  const { data: categoryNode } = await supabase
    .from("category_nodes")
    .select("id, category_id, path, name")
    .eq("id", categoryNodeId)
    .single();

  if (!categoryNode) {
    return null;
  }

  return {
    categoryNodeId,
    categoryId: categoryNode.category_id,
    categoryPath: categoryNode.path,
  };
}

async function ensureCategoryPostingAllowed(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  input: { category_id?: number | null; category_node_id?: number | null; subcategory_id?: number | null }
): Promise<{ ok: true } | { ok: false; message: string }> {
  const categoryNodeId = getSelectedCategoryNodeId(input);
  if (!categoryNodeId) {
    return { ok: false, message: "Must select a category" };
  }

  const { data: node } = await supabase
    .from("category_nodes")
    .select("category_id, is_active")
    .eq("id", categoryNodeId)
    .maybeSingle();

  if (!node || !node.is_active) {
    return { ok: false, message: "Must select a category" };
  }

  const lifecycle = await supabase
    .from("categories")
    .select("is_active, is_coming_soon")
    .eq("id", node.category_id)
    .maybeSingle();

  if (!lifecycle.error && lifecycle.data) {
    const category = lifecycle.data as { is_active: boolean; is_coming_soon: boolean };
    if (!category.is_active) {
      return { ok: false, message: "Must select a category" };
    }
    if (category.is_coming_soon) {
      return { ok: false, message: "Posting in this category is not available yet." };
    }
    return { ok: true };
  }

  const fallback = await supabase
    .from("categories")
    .select("slug, is_active")
    .eq("id", node.category_id)
    .maybeSingle();

  if (fallback.error || !fallback.data || !fallback.data.is_active) {
    return { ok: false, message: "Must select a category" };
  }

  if (!["vehicles", "real-estate", "mobile-phones-tablets", "second-hand-items"].includes(String(fallback.data.slug))) {
    return { ok: false, message: "Posting in this category is not available yet." };
  }

  return { ok: true };
}

async function resolveLegacySubcategoryId(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  categoryId: number,
  categoryPath: string
) {
  const { data: legacySubcategories } = await supabase
    .from("subcategories")
    .select("id, slug, display_order")
    .eq("category_id", categoryId)
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (!legacySubcategories || legacySubcategories.length === 0) {
    return null;
  }

  const pathSegments = categoryPath
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .slice(1)
    .reverse();

  const bySlug = new Map(legacySubcategories.map((item) => [item.slug, item.id]));

  for (const segment of pathSegments) {
    const match = bySlug.get(segment);
    if (match) {
      return match;
    }
  }

  return legacySubcategories[0]?.id ?? null;
}

async function buildListingPayload(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  input: ListingInput,
  formData: FormData
) {
  const context = await resolveCategoryContext(supabase, input);
  if (!context) {
    return null;
  }

  const legacySubcategoryId = await resolveLegacySubcategoryId(
    supabase,
    context.categoryId,
    context.categoryPath
  );
  if (!legacySubcategoryId) {
    return null;
  }

  const province = input.province || null;

  const parseLocationId = (value: FormDataEntryValue | null): number | null => {
    const raw = toFormValueText(value);
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  };

  const provinceId = parseLocationId(formData.get("province_id"));
  const districtId = parseLocationId(formData.get("district_id"));
  const areaText = toFormValueText(formData.get("area_text")) || null;
  const latitudeRaw = toFormValueText(formData.get("latitude"));
  const longitudeRaw = toFormValueText(formData.get("longitude"));
  const latitude = latitudeRaw ? Number(latitudeRaw) : null;
  const longitude = longitudeRaw ? Number(longitudeRaw) : null;
  const locationSourceRaw = toFormValueText(formData.get("location_source")).toLowerCase();
  const locationSource = ["manual", "device", "browser", "gps", "map_pin"].includes(locationSourceRaw)
    ? locationSourceRaw
    : null;
  const locationAccuracyRaw = toFormValueText(formData.get("location_accuracy"));
  const locationAccuracy = locationAccuracyRaw ? Number(locationAccuracyRaw) : null;
  const locationVisibilityRaw = toFormValueText(formData.get("location_visibility")).toLowerCase();
  const locationVisibility = ["exact", "approximate", "hidden"].includes(locationVisibilityRaw)
    ? locationVisibilityRaw
    : "hidden";
  const isLocationConfirmed = toFormValueBoolean(formData.get("is_location_confirmed"));

  if (!provinceId || !districtId) {
    return null;
  }

  if (!isLocationConfirmed) {
    return null;
  }

  const [{ data: provinceRow }, { data: districtRow }] = await Promise.all([
    supabase.from("provinces").select("name").eq("id", provinceId).maybeSingle(),
    supabase.from("districts").select("name").eq("id", districtId).maybeSingle(),
  ]);

  const resolvedProvince = toFormValueText(formData.get("province")) || (provinceRow?.name ? String(provinceRow.name) : null);
  const resolvedDistrict = toFormValueText(formData.get("district")) || (districtRow?.name ? String(districtRow.name) : null);
  const resolvedCity = null;
  const variantId = input.vehicle_variant_id ?? null;
  const manualSpecsRaw = toFormValueText(formData.get("vehicle_manual_specs_json"));
  let manualSpecs: Record<string, unknown> = {};
  if (manualSpecsRaw) {
    try {
      manualSpecs = JSON.parse(manualSpecsRaw) as Record<string, unknown>;
    } catch {
      manualSpecs = {};
    }
  }

  const toBool = (value: string) => value === "true" || value === "1" || value === "on";
  const manualYearText = toFormValueText(formData.get("vehicle_year"));
  const manualYear = manualYearText ? Number(manualYearText) : null;
  const isManual = toBool(toFormValueText(formData.get("vehicle_is_manual")));
  const isClassicExplicit = toBool(toFormValueText(formData.get("vehicle_is_classic")));
  const isClassicByYear = Number.isFinite(manualYear as number) && (manualYear as number) < 2000;
  const isCustom = toBool(toFormValueText(formData.get("vehicle_is_custom")));

  const path = context.categoryPath || "";
  const isRealEstate = path.startsWith("real-estate");
  const listingPurpose = toFormValueText(formData.get("listing_purpose")).toLowerCase();
  const isRentListing = listingPurpose === "for rent";
  const isDormitory = path === "real-estate/dormitory";

  const normalizeChoice = (
    value: string,
    allowed: readonly string[]
  ): string | null => {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return null;
    return allowed.includes(normalized) ? normalized : null;
  };

  const explicitSuitable = toFormValueBoolean(formData.get("suitable_for_students"));
  const suitableForStudents = isRealEstate
    ? (isDormitory || (isRentListing && explicitSuitable))
    : false;

  const studentHousingType = isRealEstate
    ? normalizeChoice(toFormValueText(formData.get("student_housing_type")), ["house", "apartment", "room", "dormitory"])
      ?? (path.startsWith("real-estate/houses") ? "house"
        : path.startsWith("real-estate/apartments") ? "apartment"
          : path.startsWith("real-estate/rooms") ? "room"
            : isDormitory ? "dormitory"
              : null)
    : null;

  const genderAllowed = isRealEstate
    ? normalizeChoice(toFormValueText(formData.get("gender_allowed")), ["male", "female", "family", "everyone"])
    : null;

  const paymentPeriod = isRealEstate
    ? normalizeChoice(toFormValueText(formData.get("payment_period")), ["monthly", "yearly", "semester", "daily", "other"])
    : null;

  const distanceToUniversityText = toFormValueText(formData.get("distance_to_university"));
  const distanceToUniversity = distanceToUniversityText ? Number(distanceToUniversityText) : null;

  return {
    context,
    payload: {
      user_id: userId,
      title: input.title,
      description: input.description,
      category_id: context.categoryId,
      category_node_id: context.categoryNodeId,
      subcategory_id: legacySubcategoryId,
      vehicle_variant_id: variantId,
      price: input.price,
      currency: input.currency,
      city: resolvedCity,
      province: resolvedProvince,
      district: resolvedDistrict,
      province_id: provinceId,
      district_id: districtId,
      address_text: areaText,
      address_optional: input.address_optional || areaText,
      latitude: Number.isFinite(latitude as number) ? latitude : null,
      longitude: Number.isFinite(longitude as number) ? longitude : null,
      location_source: locationSource,
      location_accuracy: Number.isFinite(locationAccuracy as number) ? Math.round(locationAccuracy as number) : null,
      location_visibility: locationVisibility,
      is_location_confirmed: true,
      contact_phone: input.contact_phone,
      contact_name: input.contact_name || null,
      negotiable: input.negotiable ?? false,
      minimum_offer: input.minimum_offer ?? null,
      featured: input.featured ?? false,
      status: "pending" as const,
      vehicle_type: toFormValueText(formData.get("vehicle_type")) || null,
      vehicle_subtype: toFormValueText(formData.get("vehicle_subtype")) || null,
      vehicle_brand: toFormValueText(formData.get("vehicle_brand")) || null,
      vehicle_model: toFormValueText(formData.get("vehicle_model")) || null,
      vehicle_year: Number.isFinite(manualYear as number) ? manualYear : null,
      vehicle_is_manual: isManual,
      vehicle_is_classic: isClassicExplicit || isClassicByYear,
      vehicle_is_custom: isCustom,
      vehicle_manual_specs: manualSpecs,
      suitable_for_students: suitableForStudents,
      student_housing_type: studentHousingType,
      gender_allowed: genderAllowed,
      payment_period: paymentPeriod,
      distance_to_university: Number.isFinite(distanceToUniversity as number) ? distanceToUniversity : null,
    },
    formData,
  };
}

function validatePostingLocationFormData(formData: FormData): { ok: true } | { ok: false; message: string } {
  const provinceId = Number(toFormValueText(formData.get("province_id")));
  const districtId = Number(toFormValueText(formData.get("district_id")));
  const isConfirmed = toFormValueBoolean(formData.get("is_location_confirmed"));

  if (!Number.isFinite(provinceId) || provinceId <= 0 || !Number.isFinite(districtId) || districtId <= 0 || !isConfirmed) {
    return { ok: false, message: "Please add a location before publishing your ad." };
  }

  return { ok: true };
}

export async function createListingFormAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const parsed = listingSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return;
  }

  const input = parsed.data;
  const postingGuard = await ensureCategoryPostingAllowed(supabase, input);
  if (!postingGuard.ok) {
    return;
  }

  const locationGuard = validatePostingLocationFormData(formData);
  if (!locationGuard.ok) {
    return;
  }

  const listing = await buildListingPayload(supabase, user.id, input, formData);
  if (!listing) {
    return;
  }

  const { data, error } = await supabase
    .from("listings")
    .insert(listing.payload)
    .select("id")
    .single();

  if (error) {
    return;
  }

  await persistListingAttributes(supabase, data.id, listing.context.categoryNodeId, formData);
  await persistLockedListingSpecs(supabase, data.id, formData);
  await persistVehicleMetaAttributes(supabase, data.id, formData);
  await persistElectronicsListing(supabase, data.id, formData, {
    categoryNodeId: listing.context.categoryNodeId,
    province: listing.payload.province,
    district: listing.payload.district,
    description: listing.payload.description,
    price: listing.payload.price,
    currency: listing.payload.currency,
  });
  await persistListingCategoryPath(supabase, data.id, formData, {
    mainCategoryId: listing.context.categoryId,
    subcategoryId: listing.context.categoryNodeId,
    childCategoryId: listing.context.categoryNodeId,
  });
  await persistVehicleDamage(supabase, data.id, formData);
  await persistVehicleFeatures(supabase, data.id, formData);

  revalidatePath("/");
  revalidatePath("/listings");
  revalidatePath("/dashboard/my-ads");
  revalidatePath(`/listings/${data.id}`);
  
  redirect(`/listings/${data.id}`);
}

export async function createListingAction(formData: FormData): Promise<{
  ok: boolean;
  message: string;
  listingId?: string;
}> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const parsed = listingSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { ok: false, message: "Invalid listing data" };
  }

  const input = parsed.data;
  const postingGuard = await ensureCategoryPostingAllowed(supabase, input);
  if (!postingGuard.ok) {
    return { ok: false, message: postingGuard.message };
  }

  const locationGuard = validatePostingLocationFormData(formData);
  if (!locationGuard.ok) {
    return { ok: false, message: locationGuard.message };
  }

  const createdListing = await buildListingPayload(supabase, user.id, input, formData);
  if (!createdListing) {
    return { ok: false, message: "Must select a category" };
  }

  const { data, error } = await supabase
    .from("listings")
    .insert(createdListing.payload)
    .select("id")
    .single();

  if (error) {
    return { ok: false, message: error.message };
  }

  await persistListingAttributes(supabase, data.id, createdListing.context.categoryNodeId, formData);
  await persistLockedListingSpecs(supabase, data.id, formData);
  await persistVehicleMetaAttributes(supabase, data.id, formData);
  await persistElectronicsListing(supabase, data.id, formData, {
    categoryNodeId: createdListing.context.categoryNodeId,
    province: createdListing.payload.province,
    district: createdListing.payload.district,
    description: createdListing.payload.description,
    price: createdListing.payload.price,
    currency: createdListing.payload.currency,
  });
  await persistListingCategoryPath(supabase, data.id, formData, {
    mainCategoryId: createdListing.context.categoryId,
    subcategoryId: createdListing.context.categoryNodeId,
    childCategoryId: createdListing.context.categoryNodeId,
  });
  await persistVehicleDamage(supabase, data.id, formData);
  await persistVehicleFeatures(supabase, data.id, formData);

  revalidatePath("/");
  revalidatePath("/listings");
  revalidatePath("/dashboard/my-ads");
  revalidatePath(`/listings/${data.id}`);

  return {
    ok: true,
    message: "Listing created successfully",
    listingId: data.id,
  };
}

export async function updateListingAction(
  listingId: string,
  formData: FormData
): Promise<{
  ok: boolean;
  message: string;
}> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  // Verify ownership
  const { data: listing, error: fetchError } = await supabase
    .from("listings")
    .select("user_id, price, currency")
    .eq("id", listingId)
    .single();

  if (fetchError || !listing) {
    return { ok: false, message: "Listing not found" };
  }

  if (listing.user_id !== user.id) {
    return { ok: false, message: "Unauthorized" };
  }

  const parsed = listingSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { ok: false, message: "Invalid listing data" };
  }

  const input = parsed.data;
  const postingGuard = await ensureCategoryPostingAllowed(supabase, input);
  if (!postingGuard.ok) {
    return { ok: false, message: postingGuard.message };
  }

  const createdListing = await buildListingPayload(supabase, user.id, input, formData);
  if (!createdListing) {
    return { ok: false, message: "Must select a category" };
  }

  const updatePayload: Partial<typeof createdListing.payload> = { ...createdListing.payload };
  delete updatePayload.status;

  const { error } = await supabase
    .from("listings")
    .update(updatePayload)
    .eq("id", listingId);

  if (error) {
    return { ok: false, message: error.message };
  }

  // Track price change if price was modified
  if (listing.price !== input.price || listing.currency !== input.currency) {
    await supabase.from("listing_price_history").insert({
      listing_id: listingId,
      old_price: listing.price,
      new_price: input.price,
      currency: input.currency,
      changed_at: new Date().toISOString(),
      reason: "Owner update",
    });
  }

  await persistListingAttributes(supabase, listingId, createdListing.context.categoryNodeId, formData, true);
  await persistLockedListingSpecs(supabase, listingId, formData);
  await persistVehicleMetaAttributes(supabase, listingId, formData);
  await persistElectronicsListing(supabase, listingId, formData, {
    categoryNodeId: createdListing.context.categoryNodeId,
    province: createdListing.payload.province,
    district: createdListing.payload.district,
    description: createdListing.payload.description,
    price: createdListing.payload.price,
    currency: createdListing.payload.currency,
  });
  await persistListingCategoryPath(supabase, listingId, formData, {
    mainCategoryId: createdListing.context.categoryId,
    subcategoryId: createdListing.context.categoryNodeId,
    childCategoryId: createdListing.context.categoryNodeId,
  });
  await persistVehicleDamage(supabase, listingId, formData);
  await persistVehicleFeatures(supabase, listingId, formData);

  revalidatePath("/listings");
  revalidatePath("/dashboard/my-ads");
  revalidatePath(`/listings/${listingId}`);
  revalidatePath(`/listings/${listingId}/manage`);

  return { ok: true, message: "Listing updated successfully" };
}

export async function updateListingStatusAction(
  listingId: string,
  status: "approved" | "rejected" | "pending" | "sold" | "expired",
  rejectionReason?: string
): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const payload: Record<string, string | undefined> = {
    status,
  };

  if (status === "approved") {
    payload.approved_by = (await requireUser()).id;
  } else if (status === "rejected" && rejectionReason) {
    payload.approval_rejected_reason = rejectionReason;
  }

  const { error } = await supabase
    .from("listings")
    .update(payload)
    .eq("id", listingId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/");
  revalidatePath("/admin/listings");
  revalidatePath(`/listings/${listingId}`);
  return { ok: true, message: "Listing status updated" };
}

export async function deleteListingAction(listingId: string): Promise<{
  ok: boolean;
  message: string;
}> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  // Verify ownership or admin
  const { data: listing, error: fetchError } = await supabase
    .from("listings")
    .select("user_id")
    .eq("id", listingId)
    .single();

  if (fetchError || !listing) {
    return { ok: false, message: "Listing not found" };
  }

  if (listing.user_id !== user.id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return { ok: false, message: "Unauthorized" };
    }
  }

  // Delete related images from storage
  const { data: images } = await supabase
    .from("listing_images")
    .select("storage_path")
    .eq("listing_id", listingId);

  if (images && images.length > 0) {
    const paths = images
      .map((img) => img.storage_path)
      .filter(Boolean) as string[];
    if (paths.length > 0) {
      await supabase.storage.from("listing-images").remove(paths);
    }
  }

  const { error } = await supabase.from("listings").delete().eq("id", listingId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/");
  revalidatePath("/listings");
  revalidatePath("/dashboard/my-ads");
  revalidatePath("/admin/listings");
  return { ok: true, message: "Listing deleted" };
}

export async function uploadListingImageFormAction(
  formData: FormData
): Promise<void> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  // Accept both naming conventions from different forms
  const listingId =
    String(formData.get("listing_id") ?? formData.get("listingId") ?? "");
  const image = formData.get("image");

  if (!listingId || !(image instanceof File) || image.size === 0) {
    return;
  }

  // Verify ownership
  const { data: listing } = await supabase
    .from("listings")
    .select("user_id")
    .eq("id", listingId)
    .single();

  if (!listing || listing.user_id !== user.id) {
    return;
  }

  const ext = image.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${user.id}/${listingId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("listing-images")
    .upload(path, image, { cacheControl: "3600", upsert: false });

  if (uploadError) {
    return;
  }

  const { data: publicUrlData } = supabase.storage
    .from("listing-images")
    .getPublicUrl(path);

  const { error: insertError } = await supabase
    .from("listing_images")
    .insert({
      listing_id: listingId,
      public_url: publicUrlData.publicUrl,
      storage_path: path,
      is_primary: false,
      sort_order: 0,
    });

  if (insertError) {
    return;
  }

  revalidatePath(`/listings/${listingId}`);
  revalidatePath("/dashboard/my-ads");
}

export async function uploadListingImageAction(
  listingId: string,
  image: File,
  isPrimary: boolean = false
): Promise<{
  ok: boolean;
  message: string;
  imageId?: string;
}> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  if (!image || image.size === 0) {
    return { ok: false, message: "Invalid image" };
  }

  const ext = image.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${user.id}/${listingId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("listing-images")
    .upload(path, image, { cacheControl: "3600", upsert: false });

  if (uploadError) {
    return { ok: false, message: uploadError.message };
  }

  const { data: publicUrlData } = supabase.storage
    .from("listing-images")
    .getPublicUrl(path);

  const { data, error: insertError } = await supabase
    .from("listing_images")
    .insert({
      listing_id: listingId,
      public_url: publicUrlData.publicUrl,
      storage_path: path,
      is_primary: isPrimary,
      sort_order: 0,
    })
    .select("id")
    .single();

  if (insertError) {
    return { ok: false, message: insertError.message };
  }

  revalidatePath(`/listings/${listingId}`);
  revalidatePath("/dashboard/my-ads");

  return {
    ok: true,
    message: "Image uploaded successfully",
    imageId: data.id,
  };
}

export async function deleteListingImageAction(imageId: string): Promise<{
  ok: boolean;
  message: string;
}> {
  await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: image, error: fetchError } = await supabase
    .from("listing_images")
    .select("listing_id, storage_path")
    .eq("id", imageId)
    .single();

  if (fetchError || !image) {
    return { ok: false, message: "Image not found" };
  }

  // Delete from storage if path exists
  if (image.storage_path) {
    await supabase.storage.from("listing-images").remove([image.storage_path]);
  }

  const { error } = await supabase
    .from("listing_images")
    .delete()
    .eq("id", imageId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath(`/listings/${image.listing_id}`);
  revalidatePath("/dashboard/my-ads");

  return { ok: true, message: "Image deleted" };
}

export async function adminGetStatsAction(): Promise<{
  pending: number;
  approved: number;
  rejected: number;
  sold: number;
  reports: number;
}> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const [
    { count: pending },
    { count: approved },
    { count: rejected },
    { count: sold },
    { count: reports },
  ] = await Promise.all([
    supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved"),
    supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("status", "rejected"),
    supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("status", "sold"),
    supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
  ]);

  return {
    pending: pending ?? 0,
    approved: approved ?? 0,
    rejected: rejected ?? 0,
    sold: sold ?? 0,
    reports: reports ?? 0,
  };
}

export async function saveListingNoteAction(
  listingId: string,
  note: string
): Promise<{ ok: boolean; message: string }> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: listing, error: fetchError } = await supabase
    .from("listings")
    .select("user_id")
    .eq("id", listingId)
    .single();

  if (fetchError || !listing || listing.user_id !== user.id) {
    return { ok: false, message: "Unauthorized" };
  }

  const { error } = await supabase
    .from("listing_notes")
    .upsert(
      {
        listing_id: listingId,
        user_id: user.id,
        note,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "listing_id,user_id" }
    );

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath(`/listings/${listingId}/manage`);
  return { ok: true, message: "Note saved" };
}

export async function bumpListingAction(
  listingId: string
): Promise<{ ok: boolean; message: string }> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: listing, error: fetchError } = await supabase
    .from("listings")
    .select("user_id")
    .eq("id", listingId)
    .single();

  if (fetchError || !listing || listing.user_id !== user.id) {
    return { ok: false, message: "Unauthorized" };
  }

  const { error } = await supabase
    .from("listings")
    .update({ last_bumped_at: new Date().toISOString() })
    .eq("id", listingId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/");
  revalidatePath("/listings");
  revalidatePath(`/listings/${listingId}`);
  revalidatePath(`/listings/${listingId}/manage`);
  revalidatePath("/dashboard/my-ads");
  return { ok: true, message: "Listing bumped" };
}

export async function toggleListingFeaturedAction(
  listingId: string,
  featured: boolean
): Promise<{ ok: boolean; message: string }> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: listing, error: fetchError } = await supabase
    .from("listings")
    .select("user_id")
    .eq("id", listingId)
    .single();

  if (fetchError || !listing || listing.user_id !== user.id) {
    return { ok: false, message: "Unauthorized" };
  }

  const { error } = await supabase
    .from("listings")
    .update({ featured })
    .eq("id", listingId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/");
  revalidatePath("/listings");
  revalidatePath(`/listings/${listingId}`);
  revalidatePath(`/listings/${listingId}/manage`);
  revalidatePath("/dashboard/my-ads");
  return { ok: true, message: featured ? "Listing featured" : "Listing unfeatured" };
}

export async function toggleListingUrgentAction(
  listingId: string,
  urgent: boolean
): Promise<{ ok: boolean; message: string }> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: listing, error: fetchError } = await supabase
    .from("listings")
    .select("user_id")
    .eq("id", listingId)
    .single();

  if (fetchError || !listing || listing.user_id !== user.id) {
    return { ok: false, message: "Unauthorized" };
  }

  const { error } = await supabase
    .from("listings")
    .update({ urgent })
    .eq("id", listingId);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/");
  revalidatePath("/listings");
  revalidatePath(`/listings/${listingId}`);
  revalidatePath(`/listings/${listingId}/manage`);
  revalidatePath("/dashboard/my-ads");
  return { ok: true, message: urgent ? "Listing marked urgent" : "Urgent removed" };
}
