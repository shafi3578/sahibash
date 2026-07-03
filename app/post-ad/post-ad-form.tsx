"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { createListingAction, uploadListingImageAction } from "@/lib/actions/listings";
import { CURRENCIES } from "@/lib/constants/marketplace";
import type { Category, CategoryField, CategoryNode } from "@/types/database";
import { VehicleSmartSelector, type VehicleSelection } from "@/components/vehicles/VehicleSmartSelector";
import { VehicleDamageDiagram, defaultDamageParts, type DamagePart } from "@/components/vehicles/VehicleDamageDiagram";
import { BrandModelSelector } from "@/components/posting/BrandModelSelector";
import type { AppLocale, TRANSLATIONS } from "@/lib/i18n/translations";
import { localizeCategoryName } from "@/lib/i18n/category-labels";
import { isDeprecatedCategoryPath } from "@/lib/categories/deprecatedPaths";
import { ACTIVE_LISTING_SCHEMAS } from "@/lib/listingSchemas";
import { parseSmartPostingText, type SmartPostingParseResult } from "@/lib/posting/smart-parser";
import { deleteMyDraftAction, getMyActiveDraftAction, saveListingDraftAction } from "@/lib/actions/drafts";
import type { ListingSchemaDefinition, SchemaFieldContext } from "@/lib/listingSchemas/shared";
import type { CatalogModel } from "@/lib/catalog/types";
import { generateAutoFill } from "@/lib/catalog/utils";
import { getTemplateIdFromPath, getPropertyTemplate } from "@/lib/data/catalogs/realEstate";

type Props = { categories: Category[] };
type Dictionary = (typeof TRANSLATIONS)["en"];
type PostMode = "standard" | "quick";

type Step = 1 | 2 | 3 | 4 | 5 | 6;

type StagedImage = { file: File; previewUrl: string; isPrimary: boolean };

type PostingConfig = {
  requires_images: boolean;
  min_images: number;
  max_images: number;
  recommended_images: string | null;
  allow_video: boolean;
};

type CoreForm = {
  title: string;
  description: string;
  address_optional: string;
  contact_phone: string;
  contact_name: string;
  contact_preferences: string;
  price: string;
  currency: "AFN" | "USD";
  negotiable: boolean;
  minimum_offer: string;
  rulesAccepted: boolean;
};

type LocationNameRow = {
  id: number;
  name: string | null;
  name_en: string | null;
  name_fa: string | null;
  name_ps: string | null;
  aliases: string[] | null;
};
type ProvinceOption = { id: number; label: string; candidates: string[] };
type DistrictOption = { id: number; label: string; candidates: string[]; province_id: number };
type LocationMethod = "device" | "manual" | null;
type StoredLocation = {
  provinceId: number;
  districtId: number;
  areaText: string;
  locationVisibility: "exact" | "approximate" | "province_district";
};

type PostingFieldInput = {
  id: number | string;
  field_key: string;
  field_label: string;
  field_type: "text" | "number" | "select" | "boolean" | "date";
  is_required: boolean;
  display_order?: number | null;
  sort_order?: number | null;
  options_json?: Record<string, unknown> | string[] | null;
};

type AutoFilledSpec = {
  key: string;
  label: string;
  value: string;
  source: string;
  confidence: number;
  editable: boolean;
  fieldKey?: string;
};

const DRAFT_KEY = "sahibash_post_ad_draft_v2";
const PREVIOUS_LOCATION_KEY = "sahibash_previous_location";
const POSTING_ACTIVE_CATEGORY_SLUGS = ["vehicles", "real-estate", "mobile-phones-tablets", "phones-electronics", "second-hand-items"] as const;

const LOCATION_DYNAMIC_KEYS = new Set([
  "city",
  "province",
  "district",
  "province_id",
  "district_id",
  "area",
  "area_text",
  "neighborhood",
  "location_visibility",
  "is_location_confirmed",
  "location_source",
  "latitude",
  "longitude",
  "location_accuracy",
]);

const CORE_DYNAMIC_KEYS = new Set([
  "title",
  "description",
  "price",
  "currency",
  "contact_phone",
  "contact_name",
  "contact_preferences",
  "meeting_preference",
  "address_optional",
  "minimum_offer",
  "negotiable",
]);

function isRenderableDynamicField(field: CategoryField) {
  return !LOCATION_DYNAMIC_KEYS.has(field.field_key) && !CORE_DYNAMIC_KEYS.has(field.field_key);
}

/**
 * Determines which field keys are relevant for a specific category path.
 * Filters out irrelevant fields based on category logic.
 */
function getCategoryRelevantFieldKeys(categoryPath: string | undefined, categorySlug: string | undefined): Set<string> {
  if (!categoryPath && !categorySlug) return new Set();

  const relevantFields = new Set<string>();
  const path = categoryPath?.toLowerCase() ?? "";
  const slug = categorySlug?.toLowerCase() ?? "";

  // Phones & Electronics - only show tech specs
  if (slug.includes("phone") || slug.includes("mobile") || slug.includes("tablet") || slug.includes("electronic")) {
    relevantFields.add("screen_size");
    relevantFields.add("storage_capacity");
    relevantFields.add("ram");
    relevantFields.add("processor");
    relevantFields.add("camera");
    relevantFields.add("rear_camera");
    relevantFields.add("front_camera");
    relevantFields.add("battery");
    relevantFields.add("operating_system");
    relevantFields.add("os");
    relevantFields.add("color");
    relevantFields.add("condition");
    relevantFields.add("warranty");
    relevantFields.add("purchased_from");
    relevantFields.add("trade_in");
    relevantFields.add("charger_included");
    relevantFields.add("original_box");
    relevantFields.add("from");
    relevantFields.add("water_resistance");
    relevantFields.add("display_type");
    relevantFields.add("refresh_rate");
    relevantFields.add("production_year");
    return relevantFields;
  }

  // Vehicles - only show vehicle-specific specs
  if (slug.includes("vehicle") || slug.includes("car") || slug.includes("motorcycle") || slug.includes("truck")) {
    relevantFields.add("make");
    relevantFields.add("model");
    relevantFields.add("year");
    relevantFields.add("mileage");
    relevantFields.add("color");
    relevantFields.add("body_type");
    relevantFields.add("fuel_type");
    relevantFields.add("transmission");
    relevantFields.add("engine_type");
    relevantFields.add("engine_capacity");
    relevantFields.add("seats");
    relevantFields.add("doors");
    relevantFields.add("vin");
    relevantFields.add("condition");
    relevantFields.add("interior_color");
    relevantFields.add("registration_year");
    relevantFields.add("accident_history");
    relevantFields.add("ownership");
    relevantFields.add("service_history");
    relevantFields.add("brake_type");
    relevantFields.add("drive_type");
    return relevantFields;
  }

  // Real Estate - property-specific fields only
  if (slug.includes("real") || slug.includes("estate") || slug.includes("property") || slug.includes("land") || slug.includes("apartment") || slug.includes("house")) {
    relevantFields.add("property_type");
    relevantFields.add("bedrooms");
    relevantFields.add("bathrooms");
    relevantFields.add("area");
    relevantFields.add("total_area");
    relevantFields.add("built_area");
    relevantFields.add("furnished");
    relevantFields.add("purpose");
    relevantFields.add("lease_term");
    relevantFields.add("lease_terms");
    relevantFields.add("floor");
    relevantFields.add("building_age");
    relevantFields.add("parking");
    relevantFields.add("elevator");
    relevantFields.add("garden");
    relevantFields.add("balcony");
    relevantFields.add("condition");
    relevantFields.add("heating");
    relevantFields.add("cooling");
    relevantFields.add("utility");
    relevantFields.add("amenities");
    relevantFields.add("zoning");
    relevantFields.add("legal_status");
    return relevantFields;
  }

  // Laptops & Computers
  if (slug.includes("laptop") || slug.includes("computer") || slug.includes("desktop")) {
    relevantFields.add("brand");
    relevantFields.add("model");
    relevantFields.add("processor");
    relevantFields.add("ram");
    relevantFields.add("storage_capacity");
    relevantFields.add("graphics");
    relevantFields.add("screen_size");
    relevantFields.add("display_type");
    relevantFields.add("operating_system");
    relevantFields.add("condition");
    relevantFields.add("warranty");
    relevantFields.add("battery_health");
    relevantFields.add("keyboard_condition");
    relevantFields.add("trackpad_condition");
    relevantFields.add("color");
    relevantFields.add("production_year");
    return relevantFields;
  }

  // TVs & Displays
  if (slug.includes("tv") || slug.includes("television") || slug.includes("monitor") || slug.includes("display")) {
    relevantFields.add("screen_size");
    relevantFields.add("resolution");
    relevantFields.add("type");
    relevantFields.add("display_technology");
    relevantFields.add("refresh_rate");
    relevantFields.add("hdr");
    relevantFields.add("smart_tv");
    relevantFields.add("operating_system");
    relevantFields.add("color");
    relevantFields.add("condition");
    relevantFields.add("brand");
    relevantFields.add("model");
    relevantFields.add("warranty");
    relevantFields.add("production_year");
    return relevantFields;
  }

  // For general items, show only universal fields
  relevantFields.add("condition");
  relevantFields.add("color");
  relevantFields.add("material");
  relevantFields.add("size");
  relevantFields.add("weight");
  relevantFields.add("age");
  relevantFields.add("brand");
  relevantFields.add("model");

  return relevantFields;
}

function fieldOptions(optionsJson: Record<string, unknown> | string[] | null) {
  if (!optionsJson) return [];
  if (Array.isArray(optionsJson)) return optionsJson.map((value) => String(value));
  return Object.values(optionsJson).map((value) => String(value));
}

function renderFieldLabel(fieldKey: string) {
  return fieldKey.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function toLocationCandidates(row: LocationNameRow) {
  const aliases = Array.isArray(row.aliases)
    ? row.aliases.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    : [];

  return [row.name_en, row.name_fa, row.name_ps, row.name, ...aliases]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.trim());
}

function getLocationLabel(row: LocationNameRow, locale: AppLocale) {
  if (locale === "fa") {
    return row.name_fa || row.name_en || row.name || "";
  }
  if (locale === "ps") {
    return row.name_ps || row.name_en || row.name || "";
  }
  return row.name_en || row.name || row.name_fa || row.name_ps || "";
}

function toPostingType(mode: PostMode, listingType: "for_sale" | "wanted") {
  if (mode === "quick") return "quick" as const;
  return listingType === "wanted" ? ("wanted" as const) : ("sell" as const);
}

function inferImageConfig(rootSlug: string, path: string | undefined): PostingConfig {
  if (rootSlug === "vehicles") {
    return { requires_images: true, min_images: 1, max_images: 15, recommended_images: "6-15", allow_video: true };
  }

  if (rootSlug === "real-estate") {
    if ((path ?? "").includes("/land")) {
      return { requires_images: false, min_images: 0, max_images: 15, recommended_images: "1-8", allow_video: true };
    }
    return { requires_images: true, min_images: 1, max_images: 15, recommended_images: "5-15", allow_video: true };
  }

  if (rootSlug === "mobile-phones-tablets" || rootSlug === "phones-electronics" || rootSlug === "electronics-computers") {
    return { requires_images: true, min_images: 1, max_images: 12, recommended_images: "3-8", allow_video: false };
  }

  if (rootSlug === "second-hand-items") {
    return { requires_images: true, min_images: 1, max_images: 12, recommended_images: "3-8", allow_video: false };
  }

  return { requires_images: false, min_images: 0, max_images: 10, recommended_images: null, allow_video: false };
}

function buildPostingSchemaContext(rootSlug: string, path: string): SchemaFieldContext {
  return {
    listing: {} as never,
    attributes: new Map(),
    locale: "en",
    path,
    rootSlug,
  };
}

function getPostingSchema(rootSlug: string): ListingSchemaDefinition | null {
  return ACTIVE_LISTING_SCHEMAS.find((schema) => schema.rootSlugs.includes(rootSlug)) ?? null;
}

function inferSyntheticFieldType(fieldKey: string): PostingFieldInput["field_type"] {
  if (["rooms", "bathrooms", "floors", "floor_number", "total_floors", "warehouse_size", "land_size", "building_size", "mileage", "year"].includes(fieldKey)) {
    return "number";
  }

  if ([
    "exchange_possible",
    "exchange",
    "box_available",
    "box_carton",
    "charger_available",
    "charger",
    "furnished",
    "family_only",
    "security",
    "elevator",
    "truck_access",
    "loading_access",
    "parking",
    "yard",
    "water",
    "electricity",
    "gas",
    "boundary_wall",
    "delivery_possible",
  ].includes(fieldKey)) {
    return "boolean";
  }

  if (["property_type", "document_type", "condition", "storage", "ram"].includes(fieldKey)) {
    return "select";
  }

  return "text";
}

function inferSyntheticFieldOptions(fieldKey: string): string[] {
  switch (fieldKey) {
    case "property_type":
      return ["House", "Apartment", "Land", "Shop", "Office", "Warehouse", "Room", "Dormitory", "Other"];
    case "document_type":
      return ["Qabala", "Title Deed", "Customary Document", "No Document"];
    case "condition":
      return ["New", "Like New", "Good", "Fair", "Used"];
    case "storage":
      return ["32GB", "64GB", "128GB", "256GB", "512GB"];
    case "ram":
      return ["2GB", "4GB", "6GB", "8GB", "12GB", "16GB"];
    case "color":
      return ["Black", "White", "Blue", "Red", "Green", "Silver", "Gold", "Gray", "Other"];
    default:
      return [];
  }
}

function humanizeSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function PostAdForm({
    categories,
    t,
    locale,
    initialListingType = "for_sale",
    initialMode = "standard",
  }: Props & {
    t: Dictionary;
    locale: AppLocale;
    initialListingType?: "for_sale" | "wanted";
    initialMode?: PostMode;
  }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [draftStorageKey, setDraftStorageKey] = useState(DRAFT_KEY);
  const [pendingDraft, setPendingDraft] = useState<{
    core?: CoreForm;
    dynamicValues?: Record<string, string | boolean>;
  } | null>(null);

  const [step, setStep] = useState<Step>(1);
  const [stepError, setStepError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const [selectedRoot, setSelectedRoot] = useState<Category | null>(null);
  const [pathNodes, setPathNodes] = useState<CategoryNode[]>([]);
  const [currentOptions, setCurrentOptions] = useState<CategoryNode[]>([]);
  const [finalNode, setFinalNode] = useState<CategoryNode | null>(null);
  const [dynamicFields, setDynamicFields] = useState<CategoryField[]>([]);
  const [dynamicValues, setDynamicValues] = useState<Record<string, string | boolean>>({});
  const [showOptionalDetails, setShowOptionalDetails] = useState(false);
  const [loadingTree, setLoadingTree] = useState(false);

  const [postingConfig, setPostingConfig] = useState<PostingConfig | null>(null);
  const [listingTypeChoice, setListingTypeChoice] = useState<"for_sale" | "wanted">(initialListingType);
  const [postMode] = useState<PostMode>(initialMode);
  const [smartRawInput] = useState("");
  const [smartSuggestion, setSmartSuggestion] = useState<SmartPostingParseResult | null>(null);

  const [images, setImages] = useState<StagedImage[]>([]);

  const [vehicleSelection, setVehicleSelection] = useState<VehicleSelection>({
    brand: null,
    series: null,
    model: null,
    generation: null,
    variant: null,
    specs: [],
  });
  const [damageParts, setDamageParts] = useState<DamagePart[]>(defaultDamageParts());
  const [autoFilledSpecs, setAutoFilledSpecs] = useState<AutoFilledSpec[]>([]);
  const [catalogFieldOptions, setCatalogFieldOptions] = useState<Record<string, string[]>>({});
  const [selectedCatalogModel, setSelectedCatalogModel] = useState<CatalogModel | null>(null);

  const [core, setCore] = useState<CoreForm>({
    title: "",
    description: "",
    address_optional: "",
    contact_phone: "",
    contact_name: "",
    contact_preferences: "",
    price: "",
    currency: "AFN",
    negotiable: false,
    minimum_offer: "",
    rulesAccepted: false,
  });

  const [provinceOptions, setProvinceOptions] = useState<ProvinceOption[]>([]);
  const [districtOptions, setDistrictOptions] = useState<DistrictOption[]>([]);
  const [locationMethod, setLocationMethod] = useState<LocationMethod>(null);
  const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(null);
  const [areaText, setAreaText] = useState("");
  const [locationVisibility, setLocationVisibility] = useState<"exact" | "approximate" | "province_district">("province_district");
  const [deviceLatitude, setDeviceLatitude] = useState<number | null>(null);
  const [deviceLongitude, setDeviceLongitude] = useState<number | null>(null);
  const [deviceAccuracy, setDeviceAccuracy] = useState<number | null>(null);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationHint, setLocationHint] = useState<string | null>(null);
  const previousLocation = useMemo<StoredLocation | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      const raw = globalThis.localStorage?.getItem(PREVIOUS_LOCATION_KEY);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw) as StoredLocation;
      if (parsed?.provinceId && parsed?.districtId) {
        return parsed;
      }
    } catch {
      // ignore invalid previous location payload
    }

    return null;
  }, []);

  const activeCategories = useMemo(
    () => categories.filter((category) =>
      POSTING_ACTIVE_CATEGORY_SLUGS.includes(category.slug as (typeof POSTING_ACTIVE_CATEGORY_SLUGS)[number])
      && !category.is_coming_soon
    ),
    [categories]
  );
  const breadcrumb = useMemo(
    () =>
      pathNodes
        .map((node) =>
          localizeCategoryName({
            locale,
            fallbackName: node.name,
            slug: node.slug,
            path: node.path,
          })
        )
        .join(" -> "),
    [pathNodes, locale]
  );
  const rootSlug = selectedRoot?.slug ?? "";
  const finalPath = finalNode?.path;

  const resolvedImageConfig = useMemo(() => {
    if (!finalNode) return null;
    return postingConfig ?? inferImageConfig(rootSlug, finalPath);
  }, [finalNode, finalPath, postingConfig, rootSlug]);

  const postingSchema = useMemo(() => getPostingSchema(rootSlug), [rootSlug]);

  const schemaContext = useMemo(
    () => buildPostingSchemaContext(rootSlug, finalPath ?? rootSlug),
    [finalPath, rootSlug]
  );

  const schemaVisibleKeys = useMemo(() => {
    if (!postingSchema) return null;

    return new Set(
      postingSchema.fields
        .filter((field) => (field.showIf ? field.showIf(schemaContext) : true))
        .map((field) => field.key)
    );
  }, [postingSchema, schemaContext]);

  const schemaFieldOrder = useMemo(() => {
    if (!postingSchema) return new Map<string, number>();
    return new Map(postingSchema.fields.map((field) => [field.key, field.order]));
  }, [postingSchema]);

  const schemaRequiredKeys = useMemo(
    () => new Set((postingSchema?.requiredFields ?? []).filter((key) => !CORE_DYNAMIC_KEYS.has(key as never))),
    [postingSchema]
  );

  const lockedFieldKeys = useMemo(
    () => new Set(autoFilledSpecs.filter((spec) => spec.fieldKey && !spec.editable).map((spec) => spec.fieldKey!)),
    [autoFilledSpecs]
  );

  const schemaSyntheticFields = useMemo<PostingFieldInput[]>(() => {
    if (!postingSchema || !schemaVisibleKeys) return [];

    const dbFieldKeys = new Set(dynamicFields.map((field) => field.field_key));

    return postingSchema.fields
      .filter((field) => schemaVisibleKeys.has(field.key))
      .filter((field) => !dbFieldKeys.has(field.key))
      .filter((field) => !CORE_DYNAMIC_KEYS.has(field.key as never))
      .filter((field) => !lockedFieldKeys.has(field.key))
      .map((field) => {
        const options = inferSyntheticFieldOptions(field.key);
        return {
          id: `schema-${field.key}`,
          field_key: field.key,
          field_label: field.label[locale],
          field_type: inferSyntheticFieldType(field.key),
          is_required: schemaRequiredKeys.has(field.key),
          display_order: field.order,
          sort_order: field.order,
          options_json: options.length > 0 ? options : null,
        };
      });
  }, [dynamicFields, locale, lockedFieldKeys, postingSchema, schemaRequiredKeys, schemaVisibleKeys]);

  useEffect(() => {
    let cancelled = false;

    async function resolveAutoFilledSpecs() {
      if (!finalPath || !rootSlug) {
        if (!cancelled) {
          setAutoFilledSpecs([]);
          setCatalogFieldOptions({});
        }
        return;
      }

      const segments = finalPath.split("/").filter(Boolean);
      const resolvedSpecs: AutoFilledSpec[] = [];
      const resolvedOptions: Record<string, string[]> = {};

      if (rootSlug === "real-estate") {
        // Use property template for auto-filled specs
        const templateId = getTemplateIdFromPath(finalPath);
        if (templateId) {
          const template = getPropertyTemplate(templateId);
          if (template) {
            // Add template's stable specs
            template.stableSpecs.forEach((spec) => {
              resolvedSpecs.push({
                key: spec.key,
                label: spec.label[locale] || spec.label.en,
                value: String(spec.value),
                source: "property_template",
                confidence: spec.confidence,
                editable: spec.editable,
                fieldKey: spec.key,
              });
            });
          }
        }
      }

      if (rootSlug === "second-hand-items") {
        const leafName = pathNodes[pathNodes.length - 1]?.name ?? humanizeSlug(segments[segments.length - 1] ?? "");
        resolvedSpecs.push({ key: "item_type", label: "Item Type", value: leafName, source: "category_path", confidence: 0.95, editable: false, fieldKey: "item_type" });
      }

      if (rootSlug === "vehicles") {
        const vehicleType = pathNodes[1]?.name ?? humanizeSlug(segments[1] ?? "vehicle");
        resolvedSpecs.push({ key: "vehicle_type", label: "Vehicle Type", value: vehicleType, source: "category_path", confidence: 0.95, editable: false });

        if ((segments[1] ?? "") === "cars" && pathNodes[2]?.name) {
          resolvedSpecs.push({ key: "make", label: "Make / Brand", value: pathNodes[2].name, source: "category_path", confidence: 1, editable: false, fieldKey: "make" });
        }
        if ((segments[1] ?? "") === "cars" && pathNodes[3]?.name) {
          resolvedSpecs.push({ key: "model", label: "Model", value: pathNodes[3].name, source: "category_path", confidence: 1, editable: false, fieldKey: "model" });
        }
      }

      if (rootSlug === "phones-electronics" || rootSlug === "mobile-phones-tablets") {
        const subcategorySlug = segments[1] ?? "";
        const brandSlug = segments[2] ?? "";
        const modelSlug = segments[3] ?? "";

        const subcategoryName = pathNodes[1]?.name ?? humanizeSlug(subcategorySlug);
        if (subcategoryName) {
          resolvedSpecs.push({ key: "device_type", label: "Device Type", value: subcategoryName, source: "category_path", confidence: 0.95, editable: false });
        }
        if (pathNodes[2]?.name) {
          resolvedSpecs.push({ key: "brand", label: "Brand", value: pathNodes[2].name, source: "category_path", confidence: 1, editable: false, fieldKey: "brand" });
        }
        if (pathNodes[3]?.name) {
          resolvedSpecs.push({ key: "model", label: "Model", value: pathNodes[3].name, source: "category_path", confidence: 1, editable: false, fieldKey: "model" });
        }

        if (subcategorySlug && brandSlug && modelSlug) {
          const supabase = createSupabaseBrowserClient();
          const { data: category } = await supabase
            .from("electronics_categories")
            .select("id")
            .eq("slug", subcategorySlug)
            .eq("is_active", true)
            .maybeSingle();

          if (category?.id) {
            const { data: brand } = await supabase
              .from("electronics_brands")
              .select("id")
              .eq("category_id", category.id)
              .eq("slug", brandSlug)
              .eq("is_active", true)
              .maybeSingle();

            if (brand?.id) {
              const { data: model } = await supabase
                .from("electronics_models")
                .select("id, release_year")
                .eq("brand_id", brand.id)
                .eq("slug", modelSlug)
                .eq("is_active", true)
                .maybeSingle();

              if (model?.id) {
                const [{ data: specs }, { data: options }] = await Promise.all([
                  supabase
                    .from("electronics_model_specs")
                    .select("spec_key, spec_label, spec_value")
                    .eq("model_id", model.id)
                    .eq("is_public", true),
                  supabase
                    .from("electronics_model_options")
                    .select("option_type, option_value")
                    .eq("model_id", model.id)
                    .order("option_type", { ascending: true })
                    .order("sort_order", { ascending: true }),
                ]);

                if (model.release_year) {
                  resolvedSpecs.push({ key: "release_year", label: "Release Year", value: String(model.release_year), source: "device_catalog", confidence: 0.98, editable: false });
                }

                for (const spec of specs ?? []) {
                  const value = String(spec.spec_value ?? "").trim();
                  if (!value) continue;
                  resolvedSpecs.push({
                    key: String(spec.spec_key),
                    label: String(spec.spec_label ?? spec.spec_key),
                    value,
                    source: "device_catalog",
                    confidence: 0.95,
                    editable: false,
                  });
                }

                for (const option of options ?? []) {
                  const key = String(option.option_type ?? "").trim();
                  const value = String(option.option_value ?? "").trim();
                  if (!key || !value) continue;
                  if (!resolvedOptions[key]) resolvedOptions[key] = [];
                  if (!resolvedOptions[key].includes(value)) resolvedOptions[key].push(value);
                }
              }
            }
          }
        }
      }

      if (!cancelled) {
        const deduped = new Map<string, AutoFilledSpec>();
        for (const spec of resolvedSpecs) {
          if (!spec.value || deduped.has(spec.key)) continue;
          deduped.set(spec.key, spec);
        }
        setAutoFilledSpecs(Array.from(deduped.values()));
        setCatalogFieldOptions(resolvedOptions);
      }
    }

    void resolveAutoFilledSpecs();
    return () => {
      cancelled = true;
    };
  }, [finalPath, pathNodes, rootSlug]);

  useEffect(() => {
    if (autoFilledSpecs.length === 0) return;

    setDynamicValues((prev) => {
      const next = { ...prev };
      for (const spec of autoFilledSpecs) {
        if (spec.fieldKey) {
          next[spec.fieldKey] = spec.value;
        }
      }
      return next;
    });
  }, [autoFilledSpecs]);

  const detailsStep = 2;
  const photosStep = 3;
  const locationStep = 4;
  const contactStep = 5;
  const reviewStep = 6;
  const isDetailsStep = step === detailsStep;
  const isPhotosStep = step === photosStep;
  const isLocationStep = step === locationStep;
  const isContactStep = step === contactStep;
  const isReviewStep = step === reviewStep;

  const visualSteps = [t.postAd.category, t.postAd.details, t.postAd.photosStepTitle, t.postAd.whereLocated, "Contact", t.postAd.publish];

  const currentVisualStep = step;

  const postAdCopy = useMemo(() => {
    if (locale === "fa") {
      return {
        draftContinuePrompt: "یک اعلان ناتمام دارید. ادامه می دهید؟",
        continueDraft: "ادامه پیش نویس",
        startNewAd: "شروع اعلان جدید",
        quickModeHint: "حالت ثبت سریع: ابتدا موارد ضروری را وارد کنید، سپس پیش از انتشار بازبینی کنید.",
        autoDetectDetails: "تشخیص خودکار جزئیات",
        suggestedCategory: "دسته بندی پیشنهادی",
        other: "سایر",
        confidence: "اعتماد",
        detectedListingType: "نوع اعلان تشخیص شده",
        applySuggestion: "اعمال پیشنهاد",
        dismiss: "بستن",
        usePreviousLocation: "استفاده از موقعیت قبلی",
        applyPreviousLocation: "ولایت/ولسوالی قبلی شما اعمال می شود",
        couldNotDetectLocation: "موقعیت شما تشخیص نشد. لطفا به صورت دستی انتخاب کنید.",
        detectedLocationNeedsConfirmation: "موقعیت شما تشخیص شد. لطفا قبل از انتشار آن را تایید کنید.",
        confirmProvinceDistrictForDetected: "لطفا ولایت و ولسوالی موقعیت تشخیص شده را تایید کنید.",
        locationConfirmed: "موقعیت تایید شد.",
        noPreviousLocation: "هنوز موقعیت قبلی ذخیره نشده است.",
        previousLocationApplied: "موقعیت قبلی اعمال شد.",
        selectFinalCategory: "برای ادامه یک دسته نهایی انتخاب کنید.",
        categoryComingSoon: "این دسته به زودی فعال می شود. ثبت اعلان فعلا در دسترس نیست.",
        titleMin: "عنوان باید حداقل ۵ کاراکتر باشد.",
        descriptionMin: "توضیحات باید حداقل ۲۰ کاراکتر باشد.",
        invalidPrice: "لطفا قیمت معتبر وارد کنید.",
        contactPhoneRequired: "شماره تماس الزامی است.",
        acceptRulesRequired: "برای ادامه باید قوانین ثبت اعلان را بپذیرید.",
        fieldRequiredSuffix: "الزامی است.",
        vehicleYearRequired: "سال وسیله نقلیه الزامی است.",
        addLocationBeforePublish: "لطفا قبل از انتشار موقعیت را اضافه کنید.",
        detectOrChooseManual: "لطفا موقعیت دستگاه را تشخیص دهید یا روش دستی را انتخاب کنید.",
        completeRequiredFields: "لطفا فیلدهای الزامی را تکمیل کنید.",
        categoryRequired: "دسته بندی الزامی است.",
      };
    }

    if (locale === "ps") {
      return {
        draftContinuePrompt: "تاسې یو نیمګړی اعلان لرئ. دوام ورکړئ؟",
        continueDraft: "د مسودې دوام",
        startNewAd: "نوی اعلان پیل کړئ",
        quickModeHint: "د چټک اعلان حالت: لومړی اړین معلومات ولیکئ، بیا د خپرولو مخکې بیاکتنه وکړئ.",
        autoDetectDetails: "جزئیات په اوتومات ډول ومومئ",
        suggestedCategory: "وړاندیز شوې کټګوري",
        other: "نور",
        confidence: "باور",
        detectedListingType: "موندل شوی اعلان ډول",
        applySuggestion: "وړاندیز پلي کړئ",
        dismiss: "بندول",
        usePreviousLocation: "پخوانی ځای وکاروئ",
        applyPreviousLocation: "ستاسو پخوانی ولایت/ولسوالي پلي کېږي",
        couldNotDetectLocation: "ستاسو ځای ونه موندل شو. مهرباني وکړئ لاسي انتخاب وکړئ.",
        detectedLocationNeedsConfirmation: "ستاسو ځای وموندل شو. مهرباني وکړئ د خپرولو مخکې یې تایید کړئ.",
        confirmProvinceDistrictForDetected: "مهرباني وکړئ د موندل شوي ځای ولایت او ولسوالي تایید کړئ.",
        locationConfirmed: "ځای تایید شو.",
        noPreviousLocation: "تر اوسه پخوانی ځای نه دی خوندي شوی.",
        previousLocationApplied: "پخوانی ځای پلي شو.",
        selectFinalCategory: "د دوام لپاره وروستۍ کټګوري وټاکئ.",
        categoryComingSoon: "دا کټګوري ژر فعالیږي. اعلان ثبتول اوس نه دي موجود.",
        titleMin: "سرلیک باید لږ تر لږه ۵ توري ولري.",
        descriptionMin: "تفصیل باید لږ تر لږه ۲۰ توري ولري.",
        invalidPrice: "مهرباني وکړئ سم قیمت دننه کړئ.",
        contactPhoneRequired: "د اړیکې شمېره اړینه ده.",
        acceptRulesRequired: "د دوام لپاره باید د اعلان قوانین ومنئ.",
        fieldRequiredSuffix: "اړین دی.",
        vehicleYearRequired: "د موټر کال اړین دی.",
        addLocationBeforePublish: "مهرباني وکړئ د خپرولو مخکې ځای اضافه کړئ.",
        detectOrChooseManual: "مهرباني وکړئ د وسیلې ځای ومومئ یا لاسي طریقه وټاکئ.",
        completeRequiredFields: "مهرباني وکړئ اړین فیلډونه بشپړ کړئ.",
        categoryRequired: "کټګوري اړینه ده.",
      };
    }

    return {
      draftContinuePrompt: "You have an unfinished ad. Continue?",
      continueDraft: "Continue draft",
      startNewAd: "Start new ad",
      quickModeHint: "Quick post mode: add essentials first, then review before publishing.",
      autoDetectDetails: "Auto-detect details",
      suggestedCategory: "Suggested category",
      other: "Other",
      confidence: "Confidence",
      detectedListingType: "Detected listing type",
      applySuggestion: "Apply suggestion",
      dismiss: "Dismiss",
      usePreviousLocation: "Use Previous Location",
      applyPreviousLocation: "Apply your last used province/district",
      couldNotDetectLocation: "We could not detect your location. Please choose manually.",
      detectedLocationNeedsConfirmation: "We detected your location. Please confirm it before publishing.",
      confirmProvinceDistrictForDetected: "Please confirm province and district for the detected location.",
      locationConfirmed: "Location confirmed.",
      noPreviousLocation: "No previous location saved yet.",
      previousLocationApplied: "Previous location applied.",
      selectFinalCategory: "Select a final category to continue.",
      categoryComingSoon: "This category is coming soon. Posting is not available yet.",
      titleMin: "Title must be at least 5 characters.",
      descriptionMin: "Description must be at least 20 characters.",
      invalidPrice: "Please enter a valid price.",
      contactPhoneRequired: "Contact phone is required.",
      acceptRulesRequired: "You must accept the posting rules to continue.",
      fieldRequiredSuffix: "is required.",
      vehicleYearRequired: "Vehicle year is required.",
      addLocationBeforePublish: "Please add a location before publishing your ad.",
      detectOrChooseManual: "Please detect your device location or choose manual location.",
      completeRequiredFields: "Please complete required fields.",
      categoryRequired: "Category is required.",
    };
  }, [locale]);

  async function fetchChildren(parentId: number) {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase
      .from("category_nodes")
      .select("*")
      .eq("parent_id", parentId)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    return ((data as CategoryNode[]) ?? []).filter((node) => !isDeprecatedCategoryPath(node.path));
  }

  async function fetchRootNode(categoryId: number) {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase
      .from("category_nodes")
      .select("*")
      .eq("category_id", categoryId)
      .is("parent_id", null)
      .eq("is_active", true)
      .maybeSingle();

    const parsed = (data as CategoryNode | null) ?? null;
    if (parsed && isDeprecatedCategoryPath(parsed.path)) {
      return null;
    }
    return parsed;
  }

  async function fetchFields(categoryNodeId: number) {
    const supabase = createSupabaseBrowserClient();
    const orderedBySort = await supabase
      .from("category_fields")
      .select("*")
      .eq("category_node_id", categoryNodeId)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("display_order", { ascending: true });

    if (!orderedBySort.error && orderedBySort.data) {
      setDynamicFields(orderedBySort.data as CategoryField[]);
      return;
    }

    const fallback = await supabase
      .from("category_fields")
      .select("*")
      .eq("category_node_id", categoryNodeId)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    setDynamicFields((fallback.data as CategoryField[]) ?? []);
  }

  async function fetchPostingConfig(categoryId: number) {
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("posting_category_config")
      .select("requires_images, min_images, max_images, recommended_images, allow_video")
      .eq("category_id", categoryId)
      .eq("is_active", true)
      .maybeSingle();

    if (error || !data) {
      setPostingConfig(null);
      return;
    }

    setPostingConfig({
      requires_images: Boolean((data as Record<string, unknown>).requires_images),
      min_images: Number((data as Record<string, unknown>).min_images ?? 0),
      max_images: Number((data as Record<string, unknown>).max_images ?? 10),
      recommended_images: ((data as Record<string, unknown>).recommended_images as string | null) ?? null,
      allow_video: Boolean((data as Record<string, unknown>).allow_video),
    });
  }

  const chooseRoot = useCallback(async (category: Category) => {
    if (category.is_coming_soon) {
      return;
    }

    setLoadingTree(true);
    setSelectedRoot(category);
    setFinalNode(null);
    setDynamicFields([]);
    setDynamicValues({});
    setPostingConfig(null);
    setVehicleSelection({ brand: null, series: null, model: null, generation: null, variant: null, specs: [] });
    setDamageParts(defaultDamageParts());

    const root = await fetchRootNode(category.id);
    if (!root) {
      setPathNodes([]);
      setCurrentOptions([]);
      setLoadingTree(false);
      return;
    }

    setPathNodes([root]);
    const children = await fetchChildren(root.id);
    setCurrentOptions(children);

    if (children.length === 0) {
      setFinalNode(root);
      await Promise.all([fetchFields(root.id), fetchPostingConfig(category.id)]);
    }

    setLoadingTree(false);
  }, []);

  async function chooseNode(node: CategoryNode) {
    setLoadingTree(true);

    const nextPath = [...pathNodes, node];
    setPathNodes(nextPath);

    const children = await fetchChildren(node.id);
    setCurrentOptions(children);

    if (children.length === 0) {
      setFinalNode(node);
      setVehicleSelection({ brand: null, series: null, model: null, generation: null, variant: null, specs: [] });
      setDamageParts(defaultDamageParts());
      await Promise.all([fetchFields(node.id), fetchPostingConfig(node.category_id)]);
    } else {
      setFinalNode(null);
      setDynamicFields([]);
      setPostingConfig(null);
    }

    setLoadingTree(false);
  }

  async function goBackCategoryLevel() {
    // If we're going back from a model selection, just clear the model
    if (selectedCatalogModel && finalNode?.type === "model") {
      setSelectedCatalogModel(null);
      setAutoFilledSpecs([]);
      const next = pathNodes.slice(0, -1);
      setPathNodes(next);
      setFinalNode(next[next.length - 1] || null);
      return;
    }

    if (pathNodes.length <= 1) {
      setSelectedRoot(null);
      setPathNodes([]);
      setCurrentOptions([]);
      setFinalNode(null);
      setDynamicFields([]);
      setPostingConfig(null);
      return;
    }

    const next = pathNodes.slice(0, -1);
    const parent = next[next.length - 1];

    setPathNodes(next);
    setFinalNode(null);
    setDynamicFields([]);
    setPostingConfig(null);

    setLoadingTree(true);
    setCurrentOptions(await fetchChildren(parent.id));
    setLoadingTree(false);
  }

  function updateCore<K extends keyof CoreForm>(key: K, value: CoreForm[K]) {
    setCore((prev) => ({ ...prev, [key]: value }));
  }

  function updateDynamic(key: string, value: string | boolean) {
    if (CORE_DYNAMIC_KEYS.has(key)) {
      return;
    }
    const allowedKeys = new Set(dynamicFields.map((field) => field.field_key));
    for (const field of schemaSyntheticFields) {
      allowedKeys.add(field.field_key);
    }
    for (const fieldKey of lockedFieldKeys) {
      allowedKeys.add(fieldKey);
    }
    for (const locationKey of LOCATION_DYNAMIC_KEYS) {
      allowedKeys.add(locationKey);
    }
    if (!allowedKeys.has(key)) {
      return;
    }
    setDynamicValues((prev) => ({ ...prev, [key]: value }));
  }

  function updateDynamicPair(primaryKey: string, secondaryKey: string, value: string | boolean) {
    const allowedKeys = new Set(dynamicFields.map((field) => field.field_key));
    for (const field of schemaSyntheticFields) {
      allowedKeys.add(field.field_key);
    }
    for (const fieldKey of lockedFieldKeys) {
      allowedKeys.add(fieldKey);
    }
    for (const locationKey of LOCATION_DYNAMIC_KEYS) {
      allowedKeys.add(locationKey);
    }
    setDynamicValues((prev) => ({
      ...prev,
      ...(allowedKeys.has(primaryKey) && !CORE_DYNAMIC_KEYS.has(primaryKey) ? { [primaryKey]: value } : {}),
      ...(allowedKeys.has(secondaryKey) && !CORE_DYNAMIC_KEYS.has(secondaryKey) ? { [secondaryKey]: value } : {}),
    }));
  }

  function handleCatalogModelSelected(model: CatalogModel) {
    setSelectedCatalogModel(model);
    const autoFill = generateAutoFill(model);
    
    // Create auto-filled specs
    const newAutoFilledSpecs = autoFill.autoFilledSpecs.map((spec) => ({
      key: spec.key,
      label: spec.label,
      value: Array.isArray(spec.value) ? spec.value.join(", ") : String(spec.value),
      source: spec.source,
      confidence: spec.confidence,
      editable: spec.editable,
      fieldKey: spec.key,
    }));

    setAutoFilledSpecs(newAutoFilledSpecs);

    // Auto-populate dynamic values for auto-filled specs
    const newDynamicValues = { ...dynamicValues };
    autoFill.autoFilledSpecs.forEach((spec) => {
      newDynamicValues[spec.key] = Array.isArray(spec.value) ? spec.value[0] : String(spec.value);
    });
    setDynamicValues(newDynamicValues);

    // Create a synthetic CategoryNode from the selected model to make it the final category
    const modelNode: CategoryNode = {
      id: `model_${model.id}`,
      parentId: finalNode?.id,
      name: model.name,
      slug: model.name.toLowerCase().replace(/\s+/g, "-"),
      labelKey: "",
      type: "model",
      active: true,
      sortOrder: 0,
      finalNode: true,
      category_id: finalNode?.category_id,
      path: `${finalNode?.path || ""}/${model.name}`,
    };

    // Update pathNodes to include the model
    setPathNodes([...pathNodes, modelNode]);
    
    // Set the model as the final node
    setFinalNode(modelNode);
  }

  const normalizeLocationName = useCallback((value: string) => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .replace("daikundi", "daykundi")
      .replace("jawzjan", "jowzjan")
      .replace("sar e pol", "sar-e pol")
      .replace("maidan wardak", "wardak");
  }, []);

  useEffect(() => {
    let active = true;

    const loadProvinces = async () => {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase
        .from("provinces")
        .select("id, name, name_en, name_fa, name_ps, aliases")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (!active) return;

      const mapped = ((data ?? []) as LocationNameRow[])
        .map((row) => {
          const label = getLocationLabel(row, locale);
          if (!label) return null;
          return {
            id: row.id,
            label,
            candidates: toLocationCandidates(row),
          } satisfies ProvinceOption;
        })
        .filter((row): row is ProvinceOption => Boolean(row));

      setProvinceOptions(mapped);
    };

    void loadProvinces();
    return () => {
      active = false;
    };
  }, [locale, normalizeLocationName]);

  useEffect(() => {
    let active = true;

    const loadDistricts = async () => {
      if (!selectedProvinceId) {
        setDistrictOptions([]);
        setSelectedDistrictId(null);
        return;
      }

      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase
        .from("districts")
        .select("id, province_id, name, name_en, name_fa, name_ps, aliases")
        .eq("province_id", selectedProvinceId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (!active) return;

      const mapped = ((data ?? []) as Array<LocationNameRow & { province_id: number }>)
        .map((row) => {
          const label = getLocationLabel(row, locale);
          if (!label) return null;
          return {
            id: row.id,
            province_id: row.province_id,
            label,
            candidates: toLocationCandidates(row),
          } satisfies DistrictOption;
        })
        .filter((row): row is DistrictOption => Boolean(row));

      setDistrictOptions(mapped);
      setSelectedDistrictId((prev) => {
        if (!prev) return null;
        return mapped.some((row) => row.id === prev) ? prev : null;
      });
    };

    void loadDistricts();
    return () => {
      active = false;
    };
  }, [locale, selectedProvinceId]);

  async function attemptReverseGeocode(latitude: number, longitude: number) {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(String(latitude))}&lon=${encodeURIComponent(String(longitude))}&accept-language=en`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
      });

      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as {
        address?: {
          state?: string;
          province?: string;
          county?: string;
          city_district?: string;
          municipality?: string;
          town?: string;
          city?: string;
        };
      };

      const provinceHint = payload.address?.state || payload.address?.province || "";
      const districtHint = payload.address?.county || payload.address?.city_district || payload.address?.municipality || payload.address?.town || payload.address?.city || "";

      if (provinceHint) {
        const matchedProvince = provinceOptions.find(
          (option) => option.candidates.some((name) => normalizeLocationName(name) === normalizeLocationName(provinceHint))
        );
        if (matchedProvince) {
          setSelectedProvinceId(matchedProvince.id);

          if (districtHint) {
            const supabase = createSupabaseBrowserClient();
            const { data: districtsForProvince } = await supabase
              .from("districts")
              .select("id, province_id, name, name_en, name_fa, name_ps, aliases")
              .eq("province_id", matchedProvince.id)
              .eq("is_active", true)
              .order("sort_order", { ascending: true });

            const districtRows = ((districtsForProvince ?? []) as Array<LocationNameRow & { province_id: number }>)
              .map((row) => ({
                id: row.id,
                province_id: row.province_id,
                label: getLocationLabel(row, locale),
                candidates: toLocationCandidates(row),
              }));

            const matchedDistrict = districtRows.find((option) =>
              option.candidates.some((name) => normalizeLocationName(name) === normalizeLocationName(districtHint))
            );

            if (matchedDistrict) {
              setSelectedDistrictId(matchedDistrict.id);
            }
          }
        }
      }
    } catch {
      // Best-effort only.
    }
  }

  function handleUseMyLocation() {
    setLocationMethod("device");
    setLocationConfirmed(false);
    setLocationHint(null);

    if (!navigator.geolocation) {
      setLocationHint(postAdCopy.couldNotDetectLocation);
      setLocationMethod("manual");
      return;
    }

    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsDetectingLocation(false);
        setDeviceLatitude(position.coords.latitude);
        setDeviceLongitude(position.coords.longitude);
        setDeviceAccuracy(Number.isFinite(position.coords.accuracy) ? Math.round(position.coords.accuracy) : null);
        setLocationHint(postAdCopy.detectedLocationNeedsConfirmation);
        void attemptReverseGeocode(position.coords.latitude, position.coords.longitude);
      },
      () => {
        setIsDetectingLocation(false);
        setLocationMethod("manual");
        setLocationHint(postAdCopy.couldNotDetectLocation);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }

  function handleConfirmDetectedLocation() {
    if (!selectedProvinceId || !selectedDistrictId || deviceLatitude === null || deviceLongitude === null) {
      setStepError(postAdCopy.confirmProvinceDistrictForDetected);
      return;
    }
    setLocationConfirmed(true);
    setLocationHint(postAdCopy.locationConfirmed);
  }

  function handleUsePreviousLocation() {
    if (!previousLocation) {
      setLocationHint(postAdCopy.noPreviousLocation);
      return;
    }

    setLocationMethod("manual");
    setSelectedProvinceId(previousLocation.provinceId);
    setSelectedDistrictId(previousLocation.districtId);
    setAreaText(previousLocation.areaText || "");
    setLocationVisibility(previousLocation.locationVisibility || "province_district");
    setLocationConfirmed(true);
    setLocationHint(postAdCopy.previousLocationApplied);
  }

  function onPickFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    const maxImages = Math.max(1, resolvedImageConfig?.max_images ?? 10);
    const next = files.map((file, index) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      isPrimary: images.length === 0 && index === 0,
    }));

    setImages((prev) => [...prev, ...next].slice(0, maxImages));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function setPrimary(index: number) {
    setImages((prev) => prev.map((img, i) => ({ ...img, isPrimary: i === index })));
  }

  function removeImage(index: number) {
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length > 0 && !next.some((img) => img.isPrimary)) {
        next[0] = { ...next[0], isPrimary: true };
      }
      return next;
    });
  }

  useEffect(() => {
    let active = true;

    const resolveDraftScope = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data } = await supabase.auth.getUser();
        const userId = data.user?.id ?? "guest";
        if (!active) return;
        setDraftStorageKey(`${DRAFT_KEY}:${userId}`);
      } catch {
        if (!active) return;
        setDraftStorageKey(`${DRAFT_KEY}:guest`);
      }
    };

    void resolveDraftScope();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadServerDraft = async () => {
      const response = await getMyActiveDraftAction();
      if (!active || !response.ok || !response.draft) {
        return;
      }

      const details = (response.draft.details ?? {}) as Record<string, unknown>;

      setPendingDraft({
        core: {
          ...core,
          title: String(details.title ?? ""),
          description: String(details.description ?? ""),
          address_optional: String(details.address_optional ?? ""),
          contact_phone: String(details.contact_phone ?? ""),
          contact_name: String(details.contact_name ?? ""),
          contact_preferences: String(details.contact_preferences ?? ""),
          price: String(details.price ?? ""),
          currency: String(details.currency ?? "AFN") as "AFN" | "USD",
          negotiable: Boolean(details.negotiable),
          minimum_offer: String(details.minimum_offer ?? ""),
          rulesAccepted: true,
        },
        dynamicValues: (details.dynamic_values as Record<string, string | boolean>) ?? {},
      });

    };

    void loadServerDraft();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function continueDraft() {
    if (pendingDraft?.core) {
      setCore(pendingDraft.core);
    }
    if (pendingDraft?.dynamicValues) {
      const allowedKeys = new Set(dynamicFields.map((field) => field.field_key));
      for (const field of schemaSyntheticFields) {
        allowedKeys.add(field.field_key);
      }
      for (const fieldKey of lockedFieldKeys) {
        allowedKeys.add(fieldKey);
      }
      for (const key of LOCATION_DYNAMIC_KEYS) {
        allowedKeys.add(key);
      }

      const filtered: Record<string, string | boolean> = {};
      for (const [key, value] of Object.entries(pendingDraft.dynamicValues)) {
        if (allowedKeys.has(key)) {
          filtered[key] = value;
        }
      }

      setDynamicValues(filtered);
    }
    setPendingDraft(null);
  }

  function startNewWithoutDraft() {
    globalThis.localStorage?.removeItem(draftStorageKey);
    setPendingDraft(null);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      globalThis.localStorage?.setItem(
        draftStorageKey,
        JSON.stringify({ core, dynamicValues })
      );

      void saveListingDraftAction({
        postingType: toPostingType(postMode, listingTypeChoice),
        category: {
          root_slug: rootSlug,
          final_path: finalPath,
          listing_type: listingTypeChoice,
        },
        details: {
          title: core.title,
          description: core.description,
          address_optional: core.address_optional,
          contact_phone: core.contact_phone,
          contact_name: core.contact_name,
          contact_preferences: core.contact_preferences,
          price: core.price,
          currency: core.currency,
          negotiable: core.negotiable,
          minimum_offer: core.minimum_offer,
          dynamic_values: dynamicValues,
        },
        photos: images.map((img, index) => ({
          name: img.file.name,
          size: img.file.size,
          index,
          is_primary: img.isPrimary,
        })),
        location: {
          province_id: selectedProvinceId,
          district_id: selectedDistrictId,
          area_text: areaText,
          location_visibility: locationVisibility,
        },
        language: locale,
        status: "in_progress",
      });
    }, 600);

    return () => clearTimeout(timer);
  }, [
    core,
    dynamicValues,
    draftStorageKey,
    images,
    selectedProvinceId,
    selectedDistrictId,
    areaText,
    locationVisibility,
    locale,
    rootSlug,
    finalPath,
    postMode,
    listingTypeChoice,
  ]);

  const renderDynamicFields = useMemo(() => {
    // Get relevant field keys for the current category
    const categoryRelevantKeys = getCategoryRelevantFieldKeys(finalPath, finalNode?.slug);
    const hasRelevantFields = categoryRelevantKeys.size > 0;

    const filtered = dynamicFields.filter((field) => {
      if (!isRenderableDynamicField(field)) return false;
      if (lockedFieldKeys.has(field.field_key)) return false;
      
      // Filter by category relevance - only show relevant fields for this category
      if (hasRelevantFields && !categoryRelevantKeys.has(field.field_key)) {
        return false;
      }
      
      if (!schemaVisibleKeys) return true;
      return schemaVisibleKeys.has(field.field_key);
    });

    return [...filtered, ...schemaSyntheticFields].sort((a, b) => {
      const orderA = schemaFieldOrder.get(a.field_key) ?? Number.MAX_SAFE_INTEGER;
      const orderB = schemaFieldOrder.get(b.field_key) ?? Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return (a.display_order ?? a.sort_order ?? 0) - (b.display_order ?? b.sort_order ?? 0);
    });
  }, [dynamicFields, lockedFieldKeys, schemaFieldOrder, schemaSyntheticFields, schemaVisibleKeys, finalPath, finalNode]);

  const requiredDynamicKeys = useMemo(() => {
    return new Set(
      renderDynamicFields
        .filter((field) => field.is_required || schemaRequiredKeys.has(field.field_key))
        .map((field) => field.field_key)
    );
  }, [renderDynamicFields, schemaRequiredKeys]);

  function validateCategoryStep() {
    if (!selectedRoot || !finalNode) {
      return postAdCopy.selectFinalCategory;
    }
    if (selectedRoot.is_coming_soon) {
      return postAdCopy.categoryComingSoon;
    }
    return null;
  }

  function validateDetailsStep() {
    if (!core.title || core.title.trim().length < 5) return postAdCopy.titleMin;
    if (!core.description || core.description.trim().length < 20) return postAdCopy.descriptionMin;
    if (!core.price || Number(core.price) <= 0) return postAdCopy.invalidPrice;
    if (!core.contact_phone) return postAdCopy.contactPhoneRequired;
    if (!core.rulesAccepted) return postAdCopy.acceptRulesRequired;

    for (const key of requiredDynamicKeys) {
      if (!String(dynamicValues[key] ?? "").trim()) {
        return `${renderFieldLabel(key)} ${postAdCopy.fieldRequiredSuffix}`;
      }
    }

    return null;
  }

  function validateLocationStep() {
    if (!selectedProvinceId || !selectedDistrictId) {
      return postAdCopy.addLocationBeforePublish;
    }

    if (locationMethod === "device") {
      if (deviceLatitude === null || deviceLongitude === null) {
        return postAdCopy.detectOrChooseManual;
      }
      if (!locationConfirmed) {
        return postAdCopy.detectedLocationNeedsConfirmation;
      }
    }

    if (!locationMethod) {
      return postAdCopy.addLocationBeforePublish;
    }

    return null;
  }

  function validatePhotoStep() {
    if (!resolvedImageConfig) return null;
    if (resolvedImageConfig.requires_images && images.length < Math.max(1, resolvedImageConfig.min_images)) {
      return `Please upload at least ${Math.max(1, resolvedImageConfig.min_images)} photo(s).`;
    }
    return null;
  }

  function goNext() {
    setError(null);
    setStepError(null);

    if (step === 1) {
      const err = validateCategoryStep();
      if (err) {
        setStepError(err);
        return;
      }
      setStep(detailsStep);
      return;
    }

    if (step === detailsStep) {
      const err = validateDetailsStep();
      if (err) {
        setStepError(err);
        return;
      }
      setStep(photosStep);
      return;
    }

    if (step === photosStep) {
      const photoErr = validatePhotoStep();
      if (photoErr) {
        setStepError(photoErr);
        return;
      }
      setStep(locationStep);
      return;
    }

    if (step === locationStep) {
      const err = validateLocationStep();
      if (err) {
        setStepError(err);
        return;
      }
      setStep(contactStep);
      return;
    }

    if (step === contactStep) {
      setStep(reviewStep);
      return;
    }

    if (step === reviewStep) {
      // Proceed to publish
    }
  }

  function goPrev() {
    setError(null);
    setStepError(null);

    if (step === reviewStep) {
      setStep(contactStep);
      return;
    }

    if (step === contactStep) {
      setStep(locationStep);
      return;
    }

    if (step === locationStep) {
      setStep(photosStep);
      return;
    }

    if (step === photosStep) {
      setStep(detailsStep);
      return;
    }

    if (step === detailsStep) {
      setStep(1);
    }
  }

  async function onPublish() {
    setError(null);
    setStepError(null);

    const categoryErr = validateCategoryStep();
    const detailErr = validateDetailsStep();
    const locationErr = validateLocationStep();

    if (categoryErr || detailErr || locationErr) {
      setError(categoryErr || detailErr || locationErr || postAdCopy.completeRequiredFields);
      return;
    }

    if (!selectedRoot || !finalNode) {
      setError(postAdCopy.categoryRequired);
      return;
    }

    try {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        window.location.assign(`/login?redirect=${encodeURIComponent("/post-ad/create?posting=sell")}&reason=post`);
        return;
      }
    } catch {
      window.location.assign(`/login?redirect=${encodeURIComponent("/post-ad/create?posting=sell")}&reason=post`);
      return;
    }

    const selectedProvince = provinceOptions.find((item) => item.id === selectedProvinceId);
    const selectedDistrict = districtOptions.find((item) => item.id === selectedDistrictId);

    const form = new FormData();
    form.set("title", core.title);
    form.set("description", core.description);
    form.set("category_id", String(selectedRoot.id));
    form.set("category_node_id", String(finalNode.id));
    form.set("subcategory_id", String(pathNodes[1]?.id ?? finalNode.id));
    form.set("price", core.price);
    form.set("listing_type", listingTypeChoice);
    form.set("currency", core.currency);
    form.set("province", selectedProvince?.label ?? "");
    form.set("district", selectedDistrict?.label ?? "");
    form.set("province_id", String(selectedProvinceId ?? ""));
    form.set("district_id", String(selectedDistrictId ?? ""));
    form.set("area_text", areaText);
    form.set("address_optional", core.address_optional || areaText);
    if (deviceLatitude !== null) form.set("latitude", String(deviceLatitude));
    if (deviceLongitude !== null) form.set("longitude", String(deviceLongitude));
    if (deviceAccuracy !== null) form.set("location_accuracy", String(deviceAccuracy));
    form.set("location_source", locationMethod === "device" ? "device" : "manual");
    const submitLocationVisibility = locationVisibility === "province_district" ? "hidden" : locationVisibility;
    form.set("location_visibility", submitLocationVisibility);
    form.set("is_location_confirmed", locationMethod === "device" ? (locationConfirmed ? "true" : "false") : "true");
    form.set("contact_phone", core.contact_phone);
    form.set("contact_name", core.contact_name);
    form.set("meeting_preference", core.contact_preferences);
    form.set("negotiable", core.negotiable ? "true" : "false");
    if (core.minimum_offer) form.set("minimum_offer", core.minimum_offer);

    form.set("main_category_id", String(selectedRoot.id));
    form.set("subcategory_id", String(pathNodes[1]?.id ?? finalNode.id));
    form.set("child_category_id", String(finalNode.id));

    const asAny = vehicleSelection as unknown as {
      brand?: { id?: number | null } | null;
      model?: { id?: number | null } | null;
      variant?: { id?: number | null } | null;
      specs?: Array<{ spec_key: string; spec_value: string; is_locked?: boolean }>;
    };

    if (asAny.brand?.id) form.set("brand_id", String(asAny.brand.id));
    if (asAny.model?.id) form.set("model_id", String(asAny.model.id));
    if (asAny.variant?.id) form.set("vehicle_variant_id", String(asAny.variant.id));

    if (asAny.specs && asAny.specs.length > 0) {
      const lockedSpecs: Record<string, string> = {};
      for (const spec of asAny.specs) {
        if (spec.is_locked) {
          lockedSpecs[spec.spec_key] = spec.spec_value;
        }
      }
      if (Object.keys(lockedSpecs).length > 0) {
        form.set("locked_specs_json", JSON.stringify(lockedSpecs));
      }
    }

    if (rootSlug === "vehicles") {
      form.set("damage_parts_json", JSON.stringify(damageParts));
      const nonOriginal = damageParts.filter((part) => part.condition !== "original");
      form.set("damage_all_original", nonOriginal.length === 0 ? "true" : "false");
    }

    for (const [key, value] of Object.entries(dynamicValues)) {
      if (LOCATION_DYNAMIC_KEYS.has(key)) {
        continue;
      }
      if (CORE_DYNAMIC_KEYS.has(key)) {
        continue;
      }
      if (typeof value === "boolean") {
        if (value) form.set(key, "true");
      } else if (String(value).trim()) {
        form.set(key, String(value));
      }
    }

    startTransition(async () => {
      setStatus(t.postAd.publishing);
      const created = await createListingAction(form);
      if (!created.ok || !created.listingId) {
        setError(created.message || postAdCopy.completeRequiredFields);
        setStatus(null);
        return;
      }

      const ordered = [...images].sort((a, b) => (a.isPrimary ? -1 : b.isPrimary ? 1 : 0));
      for (let i = 0; i < ordered.length; i += 1) {
        setStatus(t.postAd.publishing);
        const uploaded = await uploadListingImageAction(created.listingId, ordered[i].file, ordered[i].isPrimary);
        if (!uploaded.ok) {
          setError(uploaded.message || postAdCopy.completeRequiredFields);
          setStatus(null);
          return;
        }
      }

      globalThis.localStorage?.removeItem(draftStorageKey);
      if (selectedProvinceId && selectedDistrictId) {
        const snapshot: StoredLocation = {
          provinceId: selectedProvinceId,
          districtId: selectedDistrictId,
          areaText,
          locationVisibility,
        };
        globalThis.localStorage?.setItem(PREVIOUS_LOCATION_KEY, JSON.stringify(snapshot));
      }
      await deleteMyDraftAction();
      setStatus(t.postAd.publishing);
      const destination = `/listings/${created.listingId}/manage`;
      router.push(destination);
      router.refresh();
      window.location.assign(destination);
    });
  }

  const requiredDynamicFields = renderDynamicFields.filter((field) => requiredDynamicKeys.has(field.field_key));
  const optionalDynamicFields = renderDynamicFields.filter((field) => !requiredDynamicKeys.has(field.field_key));

  const optionalDetailsLabel = locale === "fa"
    ? "جزئیات بیشتر"
    : locale === "ps"
      ? "نور جزئیات"
      : "More details";
  const hideOptionalDetailsLabel = locale === "fa"
    ? "پنهان کردن جزئیات بیشتر"
    : locale === "ps"
      ? "نور جزئیات پټ کړئ"
      : "Hide more details";
  const optionalCoreFieldCount = 2;
  const totalOptionalFieldCount = optionalDynamicFields.length + optionalCoreFieldCount;

  const detailSectionTitle = useMemo(() => {
    if (rootSlug === "real-estate") return t.postAd.realEstateDetails;
    if (rootSlug === "phones-electronics" || rootSlug === "mobile-phones-tablets") return t.postAd.phonesElectronicsDetails;
    if (rootSlug === "second-hand-items") return t.postAd.secondHandDetails;
    if (rootSlug === "vehicles") return t.postAd.vehicleDetails;
    return t.postAd.additionalCategoryFields;
  }, [rootSlug, t.postAd]);

  const renderDynamicFieldInput = (field: PostingFieldInput) => {
    const value = dynamicValues[field.field_key];

    if (field.field_type === "boolean") {
      return (
        <label key={field.id} className="text-sm font-semibold">
          <span className="flex items-center gap-2 rounded-xl border border-[var(--line)] px-3 py-3">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(event) => updateDynamic(field.field_key, event.target.checked)}
              className="h-4 w-4"
            />
            {field.field_label}
          </span>
        </label>
      );
    }

    if (field.field_type === "select") {
      const options = catalogFieldOptions[field.field_key] ?? fieldOptions(field.options_json ?? null);
      return (
        <label key={field.id} className="text-sm font-semibold">
          {field.field_label}
          <select
            value={String(value ?? "")}
            onChange={(event) => updateDynamic(field.field_key, event.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
          >
            <option value="">{t.postAd.select}</option>
            {options.map((option) => (
              <option key={`${field.id}-${option}`} value={option}>{option}</option>
            ))}
          </select>
        </label>
      );
    }

    return (
      <label key={field.id} className="text-sm font-semibold">
        {field.field_label}
        <input
          type={field.field_type === "number" ? "number" : field.field_type === "date" ? "date" : "text"}
          value={String(value ?? "")}
          onChange={(event) => updateDynamic(field.field_key, event.target.value)}
          className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
        />
      </label>
    );
  };

  const suggestedCategoryLabel = useMemo(() => {
    if (!smartSuggestion || smartSuggestion.categorySlug === "other") {
      return null;
    }

    const category = activeCategories.find((item) => item.slug === smartSuggestion.categorySlug);
    if (!category) {
      return null;
    }

    return localizeCategoryName({
      locale,
      fallbackName: category.name,
      slug: category.slug,
    });
  }, [activeCategories, locale, smartSuggestion]);

  const applySmartSuggestion = useCallback(async () => {
    if (!smartSuggestion) return;

    if (smartSuggestion.categorySlug !== "other") {
      const suggestedRoot = activeCategories.find((item) => item.slug === smartSuggestion.categorySlug);
      if (suggestedRoot) {
        await chooseRoot(suggestedRoot);
      }
    }
  }, [activeCategories, chooseRoot, smartSuggestion]);

  return (
    <div className="relative pb-28">
      <div className="sticky top-0 z-10 rounded-2xl bg-sky-700 px-4 py-3 text-white">
        <p className="text-xs font-semibold uppercase tracking-wide">{t.postAd.postAd}</p>
        <p className="text-sm">{t.postAd.step} {currentVisualStep} {t.postAd.of} {visualSteps.length}</p>
        <p className="mt-1 text-xs text-sky-100">{visualSteps.join(" -> ")}</p>
      </div>

      <div className="mt-4 space-y-4">
        {pendingDraft ? (
          <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
            <p className="text-sm font-semibold">{postAdCopy.draftContinuePrompt}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={continueDraft}
                className="rounded-xl bg-[var(--ink-1)] px-4 py-2 text-sm font-semibold text-white"
              >
                {postAdCopy.continueDraft}
              </button>
              <button
                type="button"
                onClick={startNewWithoutDraft}
                className="rounded-xl border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold"
              >
                {postAdCopy.startNewAd}
              </button>
            </div>
          </section>
        ) : null}

        {postMode !== "standard" ? (
          <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
            <p className="text-sm font-semibold">{postAdCopy.quickModeHint}</p>
            <button
              type="button"
              onClick={() => {
                const parsed = parseSmartPostingText({
                  rawText: smartRawInput,
                  title: core.title,
                  description: core.description,
                });
                setSmartSuggestion(parsed);
                if (smartRawInput.trim()) {
                  if (!core.title.trim()) {
                    updateCore("title", parsed.titleSuggestion || smartRawInput.slice(0, 100));
                  }
                  if (!core.description.trim()) {
                    updateCore("description", parsed.descriptionSuggestion || smartRawInput);
                  }
                }
                if (parsed.price && !core.price) {
                  updateCore("price", String(parsed.price));
                }
                if (parsed.negotiable) {
                  updateCore("negotiable", true);
                }
                if (parsed.storage) {
                  updateDynamicPair("storage", "electronics_storage", parsed.storage);
                }
                if (parsed.ram) {
                  updateDynamicPair("ram", "electronics_ram", parsed.ram);
                }
              }}
              className="mt-3 rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold"
            >
              {postAdCopy.autoDetectDetails}
            </button>

            {smartSuggestion ? (
              <div className="mt-3 rounded-xl border border-[var(--line)] bg-white p-3 text-sm">
                <p className="font-semibold">
                  {postAdCopy.suggestedCategory}: {suggestedCategoryLabel ?? postAdCopy.other}
                </p>
                <p className="mt-1 text-xs text-[var(--ink-2)]">
                  {postAdCopy.confidence}: {Math.round(smartSuggestion.confidence * 100)}% {smartSuggestion.reasons.length > 0 ? `(${smartSuggestion.reasons.join(", ")})` : ""}
                </p>
                <p className="mt-1 text-xs text-[var(--ink-2)]">
                  {postAdCopy.detectedListingType}: {t.postAd.forSale}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void applySmartSuggestion()}
                    className="rounded-lg bg-[var(--ink-1)] px-3 py-2 text-xs font-semibold text-white"
                  >
                    {postAdCopy.applySuggestion}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSmartSuggestion(null)}
                    className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold"
                  >
                    {postAdCopy.dismiss}
                  </button>
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        {step === 1 ? (
          <section className="rounded-2xl border border-[var(--line)] bg-white p-4">
            <h2 className="font-display text-lg font-bold">{t.postAd.categoryStepTitle}</h2>
            <p className="mt-1 text-sm text-[var(--ink-2)]">{t.postAd.categoryStepSubtitle}</p>

            {breadcrumb ? <p className="mt-3 rounded-lg bg-[var(--surface-2)] px-3 py-2 text-sm font-semibold break-words">{breadcrumb}</p> : null}
            {selectedRoot ? (
              <button type="button" onClick={goBackCategoryLevel} className="mt-2 rounded-xl border border-[var(--line)] px-3 py-2 text-sm font-semibold">
                {t.postAd.backOneLevel}
              </button>
            ) : null}

            {!selectedRoot ? (
              <>
                <div className="mt-3 divide-y divide-[var(--line)] overflow-hidden rounded-xl border border-[var(--line)]">
                  {activeCategories.map((category) => (
                    <button key={category.id} type="button" onClick={() => void chooseRoot(category)} className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold hover:bg-[var(--surface-2)]">
                      <span>
                        {localizeCategoryName({
                          locale,
                          fallbackName: category.slug === "mobile-phones-tablets" ? "Phones & Electronics" : category.name,
                          slug: category.slug,
                        })}
                      </span>
                      <span aria-hidden>&gt;</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="mt-3 divide-y divide-[var(--line)] overflow-hidden rounded-xl border border-[var(--line)]">
                  {loadingTree ? <div className="px-4 py-3 text-sm text-[var(--ink-2)]">{t.postAd.loading}</div> : null}
                  {!loadingTree && currentOptions.length === 0 && finalNode ? (
                    <div className="px-4 py-3 text-sm font-semibold text-green-700">
                      {t.postAd.finalCategorySelected}: {localizeCategoryName({ locale, fallbackName: finalNode.name, slug: finalNode.slug, path: finalNode.path })}
                    </div>
                  ) : null}
                  {!loadingTree
                    ? currentOptions.map((node) => (
                        <button key={node.id} type="button" onClick={() => void chooseNode(node)} className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold hover:bg-[var(--surface-2)]">
                          <span className="break-words">
                            {localizeCategoryName({ locale, fallbackName: node.name, slug: node.slug, path: node.path })}
                          </span>
                          <span aria-hidden>&gt;</span>
                        </button>
                      ))
                    : null}
                </div>
              </>
            )}

            {/* Brand/Model Selector in Step 1 for catalog categories */}
            {(rootSlug === "phones-electronics" || rootSlug === "mobile-phones-tablets" || rootSlug === "vehicles" || (rootSlug === "second-hand-items" && finalNode?.slug === "laptops")) && finalNode && currentOptions.length === 0 && !selectedCatalogModel ? (
              <div className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
                <p className="text-sm font-semibold mb-3">Select Brand and Model:</p>
                {(() => {
                  // For phones category, detect if finalNode is a series/brand like "Apple iPhone", "Samsung Galaxy S24"
                  // Extract brand from the node name
                  const BRAND_NAMES = ["apple", "samsung", "xiaomi", "huawei", "oppo", "vivo", "oneplus", "nokia", "honor", "realme", "google", "sony"];
                  let forceBrand: string | undefined;
                  
                  if (rootSlug === "phones-electronics" || rootSlug === "mobile-phones-tablets") {
                    const nodeName = finalNode?.name?.toLowerCase() || "";
                    const matchedBrand = BRAND_NAMES.find(brand => nodeName.includes(brand));
                    if (matchedBrand) {
                      forceBrand = matchedBrand;
                    }
                  }
                  
                  return (
                    <BrandModelSelector
                      category={
                        rootSlug === "vehicles"
                          ? "vehicles"
                          : (rootSlug === "second-hand-items" && finalNode?.slug === "laptops")
                            ? "laptops"
                            : "phones"
                      }
                      subcategory={finalNode?.slug}
                      onModelSelected={handleCatalogModelSelected}
                      selectedModelId={selectedCatalogModel?.id}
                      forceSelectedBrand={forceBrand}
                    />
                  );
                })()}
              </div>
            ) : null}
          </section>
        ) : null}

        {step === 2 ? (
          <section className="rounded-2xl border border-[var(--line)] bg-white p-4">
            <h2 className="font-display text-lg font-bold">{t.postAd.detailsStepTitle}</h2>
            <p className="mt-1 text-sm text-[var(--ink-2)]">{t.postAd.detailsStepSubtitle}</p>

            <div className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
              <p className="text-sm font-semibold">{t.postAd.listingPurpose}</p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setListingTypeChoice("for_sale")}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold ${listingTypeChoice === "for_sale" ? "bg-[var(--ink-1)] text-white" : "border border-[var(--line)] bg-white"}`}
                >
                  {t.postAd.forSale}
                </button>
              </div>
            </div>

            <p className="mt-3 rounded-lg bg-[var(--surface-2)] px-3 py-2 text-sm font-semibold break-words">{breadcrumb || t.postAd.categoryNotSelected}</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold sm:col-span-2">{t.postAd.title}
                <input value={core.title} onChange={(event) => updateCore("title", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
              </label>
              <label className="text-sm font-semibold sm:col-span-2">{t.postAd.description}
                <textarea rows={4} value={core.description} onChange={(event) => updateCore("description", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
              </label>
              <label className="text-sm font-semibold">{t.postAd.price}
                <input type="number" min={1} value={core.price} onChange={(event) => updateCore("price", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
              </label>
              <label className="text-sm font-semibold">{t.postAd.currency}
                <select value={core.currency} onChange={(event) => updateCore("currency", event.target.value as "AFN" | "USD")} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2">
                  {CURRENCIES.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold">{t.postAd.contactPhone}
                <input value={core.contact_phone} onChange={(event) => updateCore("contact_phone", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
              </label>
              <p className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--ink-2)] sm:col-span-2">
                {t.postAd.locationMovedNote}
              </p>
            </div>

            {rootSlug === "vehicles" ? (
              <section className="mt-4 space-y-4 rounded-xl border border-[var(--line)] p-3">
                <h3 className="text-sm font-bold">{t.postAd.vehicleDetails}</h3>
                <VehicleSmartSelector categoryNodeId={finalNode?.id ?? 0} onChange={setVehicleSelection} />
                <div>
                  <p className="mb-2 text-sm font-semibold">{t.postAd.damagePaintReport}</p>
                  <VehicleDamageDiagram value={damageParts} onChange={setDamageParts} />
                </div>
              </section>
            ) : null}

            {renderDynamicFields.length > 0 ? (
              <section className="mt-4 rounded-xl border border-[var(--line)] p-3">
                <h3 className="text-sm font-bold">{detailSectionTitle}</h3>
                {requiredDynamicFields.length > 0 ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {requiredDynamicFields.map((field) => renderDynamicFieldInput(field))}
                  </div>
                ) : null}
              </section>
            ) : null}

            {totalOptionalFieldCount > 0 ? (
              <section className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
                <button
                  type="button"
                  onClick={() => setShowOptionalDetails((prev) => !prev)}
                  className="inline-flex items-center rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm font-semibold"
                >
                  {showOptionalDetails ? hideOptionalDetailsLabel : optionalDetailsLabel} ({totalOptionalFieldCount})
                </button>
                {showOptionalDetails ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="text-sm font-semibold">{t.postAd.contactName}
                      <input value={core.contact_name} onChange={(event) => updateCore("contact_name", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2" />
                    </label>
                    <label className="text-sm font-semibold sm:col-span-2">{t.postAd.contactPreferences}
                      <input value={core.contact_preferences} onChange={(event) => updateCore("contact_preferences", event.target.value)} placeholder={t.postAd.contactPreferencesPlaceholder} className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2" />
                    </label>
                    {optionalDynamicFields.map((field) => renderDynamicFieldInput(field))}
                  </div>
                ) : null}
              </section>
            ) : null}

            {/* Photos moved to separate Step 3 */}
          </section>
        ) : null}

        {isPhotosStep ? (
          <section className="rounded-2xl border border-[var(--line)] bg-white p-4">
            <h2 className="font-display text-lg font-bold">{t.postAd.photosStepTitle}</h2>
            <p className="mt-1 text-sm text-[var(--ink-2)]">
              {resolvedImageConfig?.requires_images ? t.postAd.photosRequired : t.postAd.photosOptional}
            </p>

            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={onPickFiles} />
            {images.length === 0 ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 w-full rounded-xl border-2 border-dashed border-[var(--line)] bg-[var(--surface-2)] py-12 text-sm font-semibold hover:bg-blue-50 transition-colors"
              >
                <div className="flex flex-col items-center gap-2">
                  <span className="text-2xl">📸</span>
                  <span>{t.postAd.addPhotos}</span>
                </div>
              </button>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {images.map((img, index) => (
                    <div key={`${img.previewUrl}-${index}`} className="relative aspect-square overflow-hidden rounded-lg border border-[var(--line)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.previewUrl} alt={`Upload ${index + 1}`} className="h-full w-full object-cover" />
                      <div className="absolute inset-x-0 top-0 flex justify-end p-2">
                        {img.isPrimary && (
                          <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">Primary</span>
                        )}
                      </div>
                      <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/50 p-1 text-[10px] font-semibold text-white">
                        <button type="button" onClick={() => setPrimary(index)} className="hover:bg-black/70 px-1 py-1 rounded">
                          {img.isPrimary ? "✓ Primary" : "Set Primary"}
                        </button>
                        <button type="button" onClick={() => removeImage(index)} className="hover:bg-black/70 px-1 py-1 rounded">
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-lg border border-[var(--line)] bg-blue-50 text-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-100">
                  + {t.postAd.addMore}
                </button>
              </div>
            )}
          </section>
        ) : null}

        {isLocationStep ? (
          <section className="rounded-2xl border border-[var(--line)] bg-white p-4">
            <h2 className="font-display text-lg font-bold">{t.postAd.whereLocated}</h2>
            <p className="mt-1 text-sm text-[var(--ink-2)]">{t.postAd.chooseLocationMethod}</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={handleUseMyLocation}
                className={`rounded-xl border p-4 text-left ${locationMethod === "device" ? "border-emerald-600 bg-emerald-50" : "border-[var(--line)]"}`}
              >
                <p className="text-sm font-bold">{t.postAd.useMyLocation}</p>
                <p className="mt-1 text-xs text-[var(--ink-2)]">{t.postAd.detectAutomatically}</p>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLocationMethod("manual");
                  setLocationConfirmed(true);
                  setLocationHint(null);
                }}
                className={`rounded-xl border p-4 text-left ${locationMethod === "manual" ? "border-sky-600 bg-sky-50" : "border-[var(--line)]"}`}
              >
                <p className="text-sm font-bold">{t.postAd.manualLocation}</p>
                <p className="mt-1 text-xs text-[var(--ink-2)]">{t.postAd.chooseProvinceDistrict}</p>
              </button>
              <button
                type="button"
                onClick={handleUsePreviousLocation}
                className={`rounded-xl border p-4 text-left ${previousLocation ? "border-amber-500 bg-amber-50" : "border-[var(--line)] opacity-60"}`}
              >
                <p className="text-sm font-bold">{postAdCopy.usePreviousLocation}</p>
                <p className="mt-1 text-xs text-[var(--ink-2)]">{postAdCopy.applyPreviousLocation}</p>
              </button>
            </div>

            {isDetectingLocation ? (
              <p className="mt-3 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-sm">{t.postAd.detectingLocation}</p>
            ) : null}

            {locationHint ? (
              <p className="mt-3 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-sm">{locationHint}</p>
            ) : null}

            {(locationMethod === "manual" || locationMethod === "device") ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-semibold">{t.postAd.province}
                  <select
                    value={selectedProvinceId ? String(selectedProvinceId) : ""}
                    onChange={(event) => {
                      setSelectedProvinceId(event.target.value ? Number(event.target.value) : null);
                      setLocationConfirmed(locationMethod === "manual");
                    }}
                    className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
                  >
                    <option value="">{t.postAd.select} {t.postAd.province}</option>
                    {provinceOptions.map((province) => (
                      <option key={province.id} value={province.id}>{province.label}</option>
                    ))}
                  </select>
                </label>

                <label className="text-sm font-semibold">{t.postAd.district}
                  <select
                    value={selectedDistrictId ? String(selectedDistrictId) : ""}
                    onChange={(event) => {
                      setSelectedDistrictId(event.target.value ? Number(event.target.value) : null);
                      setLocationConfirmed(locationMethod === "manual");
                    }}
                    className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
                    disabled={!selectedProvinceId}
                  >
                    <option value="">{t.postAd.select} {t.postAd.district}</option>
                    {districtOptions.map((district) => (
                      <option key={district.id} value={district.id}>{district.label}</option>
                    ))}
                  </select>
                </label>

                <label className="text-sm font-semibold sm:col-span-2">{t.postAd.areaNeighborhoodOptional}
                  <input value={areaText} onChange={(event) => setAreaText(event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
                </label>

                <label className="text-sm font-semibold sm:col-span-2">{t.postAd.locationVisibility}
                  <select value={locationVisibility} onChange={(event) => setLocationVisibility(event.target.value as "exact" | "approximate" | "province_district")} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2">
                    <option value="province_district">{t.postAd.hideExactShowProvinceDistrict}</option>
                    <option value="approximate">{t.postAd.showApproximateLocation}</option>
                    <option value="exact">{t.postAd.showExactLocation}</option>
                  </select>
                </label>

                {locationMethod === "device" && deviceLatitude !== null && deviceLongitude !== null ? (
                  <div className="sm:col-span-2 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3 text-sm">
                    <p className="font-semibold">{t.postAd.detectedLocation}</p>
                    <p className="mt-1">{t.postAd.latitude}: {deviceLatitude.toFixed(6)}</p>
                    <p>{t.postAd.longitude}: {deviceLongitude.toFixed(6)}</p>
                    <p>{t.postAd.accuracy}: {deviceAccuracy !== null ? `${deviceAccuracy} m` : t.postAd.unknown}</p>
                    <button type="button" onClick={handleConfirmDetectedLocation} className="mt-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white">
                      {t.postAd.confirmLocation}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>
        ) : null}

        {isContactStep ? (
          <section className="rounded-2xl border border-[var(--line)] bg-white p-4">
            <h2 className="font-display text-lg font-bold">Contact Information</h2>
            <p className="mt-1 text-sm text-[var(--ink-2)]">How should buyers contact you?</p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold sm:col-span-2">{t.postAd.contactPhone}
                <input value={core.contact_phone} onChange={(event) => updateCore("contact_phone", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" placeholder="Your phone number" />
              </label>
              <label className="text-sm font-semibold">{t.postAd.contactName}
                <input value={core.contact_name} onChange={(event) => updateCore("contact_name", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" placeholder="Your name (optional)" />
              </label>
              <label className="text-sm font-semibold sm:col-span-2">{t.postAd.contactPreferences}
                <input value={core.contact_preferences} onChange={(event) => updateCore("contact_preferences", event.target.value)} placeholder={t.postAd.contactPreferencesPlaceholder} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
              </label>
            </div>
          </section>
        ) : null}

        {isReviewStep ? (
          <section className="rounded-2xl border border-[var(--line)] bg-white p-4">
            <h2 className="font-display text-lg font-bold">Review Your Listing</h2>
            <p className="mt-1 text-sm text-[var(--ink-2)]">Please review all details before publishing</p>

            {/* Locked specs if applicable */}
            {(() => {
              const lockedSpecs = autoFilledSpecs.filter((spec) => !spec.editable);
              return lockedSpecs.length > 0 ? (
                <section className="mt-4 rounded-xl border-2 border-blue-300 bg-blue-50 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">✓</span>
                    <h3 className="text-sm font-bold text-blue-900">Item Specifications</h3>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {lockedSpecs.map((spec) => (
                      <div key={spec.key} className="rounded-lg bg-white p-3 border border-blue-200">
                        <p className="text-xs font-semibold text-[var(--ink-2)]">{spec.label}</p>
                        <p className="text-sm font-bold text-blue-900 mt-1">{spec.value}</p>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null;
            })()}

            {/* Complete listing summary */}
            <section className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4 space-y-3">
              <h3 className="text-sm font-bold">Listing Summary</h3>
              <div className="bg-white rounded-lg p-3 space-y-2 text-sm">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-[var(--ink-2)]">Category:</span>
                  <span className="font-semibold">{breadcrumb || "-"}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-[var(--ink-2)]">Title:</span>
                  <span className="font-semibold text-right">{core.title || "-"}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-[var(--ink-2)]">Price:</span>
                  <span className="font-semibold">{core.price ? `${core.price} ${core.currency}` : "-"}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-[var(--ink-2)]">Photos:</span>
                  <span className="font-semibold">{images.length} uploaded</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-[var(--ink-2)]">Location:</span>
                  <span className="font-semibold text-right">
                    {provinceOptions.find((p) => p.id === selectedProvinceId)?.label ?? "-"}
                    {districtOptions.find((d) => d.id === selectedDistrictId) && (
                      <> / {districtOptions.find((d) => d.id === selectedDistrictId)?.label}</>
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--ink-2)]">Contact:</span>
                  <span className="font-semibold">{core.contact_phone || "Not provided"}</span>
                </div>
              </div>
            </section>

            <label className="mt-4 flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={core.rulesAccepted} onChange={(event) => updateCore("rulesAccepted", event.target.checked)} className="h-4 w-4" />
              I agree to the terms and conditions
            </label>
          </section>
        ) : null}

        {stepError ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{stepError}</p> : null}
        {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p> : null}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--line)] bg-white px-4 py-3">
        <div className="mx-auto flex w-full max-w-5xl gap-2">
          {step > 1 ? (
            <button type="button" onClick={goPrev} className="rounded-xl border border-[var(--line)] px-4 py-3 text-sm font-semibold">
              {t.postAd.back}
            </button>
          ) : null}

          {!isReviewStep ? (
            <button type="button" onClick={goNext} className="flex-1 rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-bold text-white">
              {t.postAd.continue}
            </button>
          ) : (
            <button type="button" onClick={() => void onPublish()} disabled={isPending} className="flex-1 rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-bold text-white disabled:opacity-60">
              {isPending ? status ?? t.postAd.publishing : t.postAd.publish}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
