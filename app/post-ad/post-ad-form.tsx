"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { createListingAction, uploadListingImageAction } from "@/lib/actions/listings";
import { AFGHAN_PROVINCES, CURRENCIES } from "@/lib/constants/marketplace";
import type { Category, CategoryField, CategoryNode } from "@/types/database";
import {
  EMPTY_VEHICLE_SELECTION,
  VehicleSmartSelector,
  type VehicleSelection,
} from "@/components/vehicles/VehicleSmartSelector";
import { VehicleDamageDiagram, defaultDamageParts, type DamagePart } from "@/components/vehicles/VehicleDamageDiagram";
import { shouldShowVehicleDamageDiagram } from "@/lib/vehicles/damage-report";
import { getVehicleBranchFromPath, type VehicleBranchDefinition, type VehicleBranchKey } from "@/data/catalog/vehicles";
import type { AppLocale, TRANSLATIONS } from "@/lib/i18n/translations";
import { localizeCategoryName } from "@/lib/i18n/category-labels";
import { isDeprecatedCategoryPath } from "@/lib/categories/deprecatedPaths";
import { parseSmartPostingText, type SmartPostingParseResult } from "@/lib/posting/smart-parser";
import { deleteMyDraftAction, getMyActiveDraftAction, saveListingDraftAction } from "@/lib/actions/drafts";
import { getSchemaForCategoryPath } from "@/lib/posting/schemas";
import {
  getSimpleCategoryConfig,
  getSimpleCategoryFieldKeys,
  getSimpleCategoryKind,
  getSimpleCategoryModelOptions,
  labelFor,
  optionLabel,
  shouldUseSimpleCategoryFallback,
} from "@/lib/posting/simple-category-details";
import { ALLOWED_LISTING_IMAGE_TYPES, MAX_LISTING_IMAGE_BYTES } from "@/lib/posting/image-validation";

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

type ProvinceOption = { id: number; name: string };
type DistrictOption = { id: number; name: string; province_id: number };
type LocationMethod = "device" | "manual" | null;
type StoredLocation = {
  provinceId: number;
  districtId: number;
  areaText: string;
  locationVisibility: "exact" | "approximate" | "province_district";
};

const DRAFT_KEY = "sahibash_post_ad_draft_v2";
const PREVIOUS_LOCATION_KEY = "sahibash_previous_location";

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

const PHONE_DYNAMIC_KEYS = new Set([
  "release_year",
  "battery_health",
  "pta_status",
  "sim_type",
  "charging_port",
  "dual_sim",
  "face_unlock",
  "originality_status",
  "purchase_source",
  "screen_condition",
  "body_condition",
  "camera",
  "refresh_rate",
]);

const REAL_ESTATE_DYNAMIC_KEYS = new Set([
  "year_built",
  "construction_status",
  "ownership_type",
  "rent_period",
  "road_width",
  "facing",
  "solar_power",
  "kitchen",
  "balcony",
]);

const REAL_ESTATE_FIELD_OPTIONS = {
  construction_status: ["New", "Used", "Under Construction"],
  ownership_type: ["Owner", "Agent", "Tenant", "Heirs"],
  rent_period: ["Monthly", "Quarterly", "Yearly"],
  facing: ["North", "South", "East", "West", "Corner"],
} as const;

const REAL_ESTATE_FORM_FIELDS = [
  { key: "year_built", label: "Year built", type: "number" as const },
  { key: "construction_status", label: "Construction status", type: "select" as const },
  { key: "ownership_type", label: "Ownership type", type: "select" as const },
  { key: "rent_period", label: "Rent period", type: "select" as const },
  { key: "road_width", label: "Road width", type: "text" as const },
  { key: "facing", label: "Facing", type: "select" as const },
  { key: "solar_power", label: "Solar / backup power", type: "boolean" as const },
  { key: "kitchen", label: "Kitchen", type: "boolean" as const },
  { key: "balcony", label: "Balcony", type: "boolean" as const },
] as const;

const PHONE_FIELD_OPTIONS = {
  pta_status: ["Verified", "Unverified", "Unknown"],
  sim_type: ["Single SIM", "Dual SIM", "eSIM", "Dual SIM + eSIM"],
  charging_port: ["USB-C", "Lightning", "Micro-USB"],
  originality_status: ["Original", "Copy", "Unknown"],
  screen_condition: ["Excellent", "Good", "Fair", "Cracked"],
  body_condition: ["Excellent", "Good", "Fair", "Damaged"],
  refresh_rate: ["60Hz", "90Hz", "120Hz", "144Hz"],
} as const;

const PHONE_FORM_FIELDS = [
  { key: "release_year", label: "Release year", type: "number" as const },
  { key: "battery_health", label: "Battery health %", type: "number" as const },
  { key: "pta_status", label: "PTA / registration", type: "select" as const },
  { key: "sim_type", label: "SIM type", type: "select" as const },
  { key: "charging_port", label: "Charging port", type: "select" as const },
  { key: "dual_sim", label: "Dual SIM", type: "boolean" as const },
  { key: "face_unlock", label: "Face unlock", type: "boolean" as const },
  { key: "originality_status", label: "Originality / IMEI", type: "select" as const },
  { key: "purchase_source", label: "Purchase source", type: "text" as const },
  { key: "screen_condition", label: "Screen condition", type: "select" as const },
  { key: "body_condition", label: "Body condition", type: "select" as const },
  { key: "camera", label: "Camera", type: "text" as const },
  { key: "refresh_rate", label: "Refresh rate", type: "select" as const },
] as const;

function fieldOptions(optionsJson: Record<string, unknown> | string[] | null) {
  if (!optionsJson) return [];
  if (Array.isArray(optionsJson)) return optionsJson.map((value) => ({ value: String(value), label: String(value) }));
  return Object.entries(optionsJson).map(([value, label]) => ({ value, label: String(label) }));
}

function buildFallbackFields(categoryNodeId: number, path: string | undefined, rootSlug: string) {
  return getSchemaForCategoryPath(path ?? "", rootSlug).map((schemaField, index) => ({
    id: -(categoryNodeId * 100 + index + 1),
    category_node_id: categoryNodeId,
    field_key: schemaField.id,
    field_label: renderFieldLabel(schemaField.id),
    field_type: schemaField.type === "checkbox" ? "boolean" : schemaField.type,
    is_required: schemaField.required,
    options_json: schemaField.options?.map((option) => String(option.value)) ?? null,
    unit: schemaField.unit ?? null,
    display_order: index + 1,
    is_active: true,
    created_at: "",
    updated_at: "",
  }));
}

function renderFieldLabel(fieldKey: string) {
  return fieldKey.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function isOtherChoice(value: unknown) {
  return String(value ?? "").trim().toLowerCase() === "other";
}

function toPostingType(mode: PostMode, listingType: "for_sale" | "for_rent" | "wanted") {
  if (mode === "quick") return "quick" as const;
  if (listingType === "for_rent") return "rent" as const;
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

  if (rootSlug === "mobile-phones-tablets" || rootSlug === "electronics-computers") {
    return { requires_images: true, min_images: 1, max_images: 12, recommended_images: "3-8", allow_video: false };
  }

  return { requires_images: false, min_images: 0, max_images: 10, recommended_images: null, allow_video: false };
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
    initialListingType?: "for_sale" | "for_rent" | "wanted";
    initialMode?: PostMode;
  }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [draftStorageKey, setDraftStorageKey] = useState(DRAFT_KEY);
  const [pendingDraft, setPendingDraft] = useState<{
    core?: CoreForm;
    dynamicValues?: Record<string, string | boolean | string[]>;
    category?: { root_slug?: string; final_path?: string; listing_type?: "for_sale" | "for_rent" | "wanted" };
    location?: { province_id?: number; district_id?: number; area_text?: string; location_visibility?: "exact" | "approximate" | "province_district" };
  } | null>(null);

  const [step, setStep] = useState<Step>(1);
  const [stepError, setStepError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [categoryQuery, setCategoryQuery] = useState("");
  const [draftSaveState, setDraftSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const [selectedRoot, setSelectedRoot] = useState<Category | null>(null);
  const [pathNodes, setPathNodes] = useState<CategoryNode[]>([]);
  const [currentOptions, setCurrentOptions] = useState<CategoryNode[]>([]);
  const [finalNode, setFinalNode] = useState<CategoryNode | null>(null);
  const [dynamicFields, setDynamicFields] = useState<CategoryField[]>([]);
  const [usesPublishedSchema, setUsesPublishedSchema] = useState(false);
  const [dynamicValues, setDynamicValues] = useState<Record<string, string | boolean | string[]>>({});
  const [loadingTree, setLoadingTree] = useState(false);

  const [postingConfig, setPostingConfig] = useState<PostingConfig | null>(null);
  const [listingTypeChoice, setListingTypeChoice] = useState<"for_sale" | "for_rent" | "wanted">(initialListingType);
  const [postMode] = useState<PostMode>(initialMode);
  const [smartRawInput] = useState("");
  const [smartSuggestion, setSmartSuggestion] = useState<SmartPostingParseResult | null>(null);

  const [images, setImages] = useState<StagedImage[]>([]);

  const [vehicleSelection, setVehicleSelection] = useState<VehicleSelection>(EMPTY_VEHICLE_SELECTION);
  const [damageParts, setDamageParts] = useState<DamagePart[]>(defaultDamageParts());

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
    () => categories.filter((category) => category.is_active !== false && !category.is_coming_soon),
    [categories]
  );

  const comingSoonCategories = useMemo(
    () => categories.filter((category) => category.is_active !== false && category.is_coming_soon),
    [categories]
  );

  const filteredActiveCategories = useMemo(() => {
    const query = categoryQuery.trim().toLocaleLowerCase(locale);
    if (!query) return activeCategories;
    return activeCategories.filter((category) => {
      const localized = localizeCategoryName({ locale, fallbackName: category.name, slug: category.slug });
      return `${localized} ${category.name} ${category.slug}`.toLocaleLowerCase(locale).includes(query);
    });
  }, [activeCategories, categoryQuery, locale]);

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
  const simpleCategoryKind = useMemo(() => getSimpleCategoryKind(finalPath, rootSlug), [finalPath, rootSlug]);
  const simpleCategoryConfig = useMemo(() => getSimpleCategoryConfig(simpleCategoryKind), [simpleCategoryKind]);
  const usesSimpleCategoryFallback = shouldUseSimpleCategoryFallback(simpleCategoryConfig, usesPublishedSchema);
  const vehicleBranch = useMemo(() => getVehicleBranchFromPath(finalPath), [finalPath]);

  type VehicleBranchDetailField = {
    key: string;
    label: string;
    type: "text" | "number" | "select" | "boolean";
    options?: string[];
    required?: boolean;
  };

  const VEHICLE_BRANCH_DETAIL_FIELDS = useMemo<Record<VehicleBranchKey, VehicleBranchDetailField[]>>(() => ({
    cars: [
      { key: "vehicle_year", label: "Year", type: "number", required: true },
      { key: "vehicle_mileage", label: "Mileage", type: "text" },
      { key: "vehicle_transmission", label: "Transmission", type: "select", options: ["Automatic", "Manual", "CVT", "Other"] },
    ],
    motorcycles: [
      { key: "vehicle_year", label: "Year", type: "number", required: true },
      { key: "engine_capacity", label: "Engine capacity", type: "text" },
      { key: "vehicle_color", label: "Color", type: "text" },
    ],
    rickshaw: [
      { key: "vehicle_year", label: "Year", type: "number", required: true },
      { key: "vehicle_mileage", label: "Mileage", type: "text" },
      { key: "vehicle_load_capacity", label: "Load capacity", type: "text" },
    ],
    bicycles: [
      { key: "bicycle_type", label: "Bicycle type", type: "text", required: true },
      { key: "frame_size", label: "Frame size", type: "text" },
      { key: "bicycle_condition", label: "Condition", type: "select", options: ["New", "Used", "Excellent", "Good", "Fair", "Damaged"] },
    ],
    pickup: [
      { key: "vehicle_year", label: "Year", type: "number", required: true },
      { key: "vehicle_mileage", label: "Mileage", type: "text" },
      { key: "load_capacity", label: "Load capacity", type: "text" },
    ],
    vansMinibuses: [
      { key: "vehicle_year", label: "Year", type: "number", required: true },
      { key: "vehicle_mileage", label: "Mileage", type: "text" },
      { key: "seating_capacity", label: "Seating capacity", type: "text" },
    ],
    heavyTrucks: [
      { key: "vehicle_year", label: "Year", type: "number", required: true },
      { key: "vehicle_mileage", label: "Mileage", type: "text" },
      { key: "truck_body_type", label: "Body type", type: "text" },
    ],
    agricultural: [
      { key: "vehicle_year", label: "Year", type: "number", required: true },
      { key: "agricultural_type", label: "Agricultural vehicle type", type: "text" },
      { key: "vehicle_condition", label: "Condition", type: "select", options: ["New", "Used", "Excellent", "Good", "Fair"] },
    ],
    parts: [
      { key: "part_type", label: "Part type", type: "text", required: true },
      { key: "compatible_with", label: "Compatible with", type: "text" },
      { key: "part_condition", label: "Condition", type: "select", options: ["New", "Used", "Refurbished", "Damaged"] },
    ],
    damaged: [
      { key: "damage_type", label: "Damage type", type: "text", required: true },
      { key: "damage_description", label: "Damage description", type: "text" },
      { key: "vehicle_year", label: "Year", type: "number" },
    ],
    otherVehicles: [
      { key: "vehicle_year", label: "Year", type: "number" },
      { key: "vehicle_mileage", label: "Mileage", type: "text" },
      { key: "vehicle_description", label: "Description", type: "text" },
    ],
  }), []);

  const allowedVehicleDynamicKeys = useMemo(() => {
    const allowedKeys = new Set(dynamicFields.map((field) => field.field_key));
    for (const locationKey of LOCATION_DYNAMIC_KEYS) {
      allowedKeys.add(locationKey);
    }
    if (rootSlug === "mobile-phones-tablets") {
      for (const phoneKey of PHONE_DYNAMIC_KEYS) {
        allowedKeys.add(phoneKey);
      }
    }
    if (rootSlug === "real-estate") {
      for (const realEstateKey of REAL_ESTATE_DYNAMIC_KEYS) {
        allowedKeys.add(realEstateKey);
      }
    }
    for (const simpleKey of getSimpleCategoryFieldKeys(simpleCategoryKind)) {
      allowedKeys.add(simpleKey);
    }
    if (rootSlug === "vehicles" && vehicleBranch) {
      for (const field of VEHICLE_BRANCH_DETAIL_FIELDS[vehicleBranch.key] ?? []) {
        allowedKeys.add(field.key);
      }
    }
    return allowedKeys;
  }, [VEHICLE_BRANCH_DETAIL_FIELDS, dynamicFields, rootSlug, simpleCategoryKind, vehicleBranch]);

  const resolvedImageConfig = useMemo(() => {
    if (!finalNode) return null;
    return postingConfig ?? inferImageConfig(rootSlug, finalPath);
  }, [finalNode, finalPath, postingConfig, rootSlug]);

  // Photos are always offered as a dedicated step; category policy determines
  // whether they are optional or required.
  const showPhotoStep = true;
  const locationStep = showPhotoStep ? 4 : 3;
  const previewStep = showPhotoStep ? 5 : 4;
  const publishStep = showPhotoStep ? 6 : 5;
  const isLocationStep = step === locationStep;
  const isPreviewStep = step === previewStep;
  const isPublishStep = step === publishStep;

  const visualSteps = showPhotoStep
    ? [t.postAd.category, t.postAd.details, t.postAd.photos, t.postAd.location, t.postAd.preview, t.postAd.publish]
    : [t.postAd.category, t.postAd.details, t.postAd.location, t.postAd.preview, t.postAd.publish];

  const currentVisualStep = (() => {
    if (showPhotoStep) {
      return step;
    }
    if (step <= 2) return step;
    if (step === 3) return 3;
    if (step === 4) return 4;
    return 5;
  })();

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
        vehicleSubtypeRequired: "نوع وسیله نقلیه الزامی است.",
        vehicleBrandRequired: "برند وسیله نقلیه الزامی است.",
        vehicleModelRequired: "مدل وسیله نقلیه الزامی است.",
        partTypeRequired: "نوع پرزه الزامی است.",
        damageTypeRequired: "نوع خسارت الزامی است.",
        addLocationBeforePublish: "لطفا قبل از انتشار موقعیت را اضافه کنید.",
        detectOrChooseManual: "لطفا موقعیت دستگاه را تشخیص دهید یا روش دستی را انتخاب کنید.",
        completeRequiredFields: "لطفا فیلدهای الزامی را تکمیل کنید.",
        categoryRequired: "دسته بندی الزامی است.",
        searchCategories: "جستجوی دسته‌بندی",
        noCategoriesFound: "دسته‌بندی مطابق پیدا نشد.",
        savingDraft: "در حال ذخیره پیش‌نویس…",
        draftSaved: "پیش‌نویس ذخیره شد",
        draftSaveFailed: "ذخیره پیش‌نویس ناموفق بود",
        invalidImageType: "فقط تصاویر JPG، PNG، WebP یا HEIC پذیرفته می‌شوند.",
        imageTooLarge: "حجم هر تصویر باید کمتر از ۱۰ مگابایت باشد.",
        maxPhotosReached: "حداکثر تعداد تصاویر برای این دسته‌بندی رسیده است.",
        required: "الزامی",
        optional: "اختیاری",
        characters: "نویسه",
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
        vehicleSubtypeRequired: "د وسیلې ډول اړین دی.",
        vehicleBrandRequired: "د وسیلې برانډ اړین دی.",
        vehicleModelRequired: "د وسیلې ماډل اړین دی.",
        partTypeRequired: "د پرزې ډول اړین دی.",
        damageTypeRequired: "د زیان ډول اړین دی.",
        addLocationBeforePublish: "مهرباني وکړئ د خپرولو مخکې ځای اضافه کړئ.",
        detectOrChooseManual: "مهرباني وکړئ د وسیلې ځای ومومئ یا لاسي طریقه وټاکئ.",
        completeRequiredFields: "مهرباني وکړئ اړین فیلډونه بشپړ کړئ.",
        categoryRequired: "کټګوري اړینه ده.",
        searchCategories: "کټګورۍ ولټوئ",
        noCategoriesFound: "سمه کټګوري ونه موندل شوه.",
        savingDraft: "مسوده خوندي کېږي…",
        draftSaved: "مسوده خوندي شوه",
        draftSaveFailed: "مسوده خوندي نه شوه",
        invalidImageType: "یوازې JPG، PNG، WebP یا HEIC انځورونه منل کېږي.",
        imageTooLarge: "هر انځور باید له ۱۰ MB څخه کوچنی وي.",
        maxPhotosReached: "د دې کټګورۍ د انځورونو حد پوره شو.",
        required: "اړین",
        optional: "اختیاري",
        characters: "توري",
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
      vehicleSubtypeRequired: "Vehicle type is required.",
      vehicleBrandRequired: "Vehicle brand is required.",
      vehicleModelRequired: "Vehicle model is required.",
      partTypeRequired: "Part type is required.",
      damageTypeRequired: "Damage type is required.",
      addLocationBeforePublish: "Please add a location before publishing your ad.",
      detectOrChooseManual: "Please detect your device location or choose manual location.",
      completeRequiredFields: "Please complete required fields.",
      categoryRequired: "Category is required.",
      searchCategories: "Search categories",
      noCategoriesFound: "No matching category found.",
      savingDraft: "Saving draft…",
      draftSaved: "Draft saved",
      draftSaveFailed: "Draft could not be saved",
      invalidImageType: "Only JPG, PNG, WebP, or HEIC images are accepted.",
      imageTooLarge: "Each image must be smaller than 10 MB.",
      maxPhotosReached: "You have reached the photo limit for this category.",
      required: "Required",
      optional: "Optional",
      characters: "characters",
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

  const fetchFields = useCallback(async (categoryNodeId: number, path: string | undefined, rootSlugName: string) => {
    const supabase = createSupabaseBrowserClient();
    const { data: schemaRow } = await supabase.from("listing_schema_versions").select("config")
      .eq("category_node_id", categoryNodeId).eq("status", "published").maybeSingle();
    const schemaConfig = schemaRow?.config as { fields?: Array<Record<string, unknown>> } | undefined;
    if (Array.isArray(schemaConfig?.fields)) {
      const configured = schemaConfig.fields.filter((field) => field.active !== false && field.posting !== false).map((field, index) => {
        const localizedLabels = field.labels as Record<string, unknown> | undefined;
        const options = Array.isArray(field.options) ? field.options as Array<{ value?: unknown; labels?: Record<string, unknown> }> : [];
        return {
          id: -(categoryNodeId * 1000 + index + 1), category_node_id: categoryNodeId,
          field_key: String(field.key ?? ""), field_label: String(localizedLabels?.[locale] ?? localizedLabels?.en ?? field.key ?? ""),
          field_type: field.type, is_required: field.required === true,
          options_json: Object.fromEntries(options.map((option) => [String(option.value ?? ""), String(option.labels?.[locale] ?? option.labels?.en ?? option.value ?? "")])),
          unit: field.unit ?? null, display_order: Number(field.order ?? index), sort_order: Number(field.order ?? index),
          is_active: true, created_at: "", updated_at: "",
        } as CategoryField;
      }).filter((field) => field.field_key);
      setUsesPublishedSchema(true);
      setDynamicFields(configured);
      return;
    }
    setUsesPublishedSchema(false);
    const simpleKind = getSimpleCategoryKind(path, rootSlugName);
    if (simpleKind) {
      setDynamicFields([]);
      return;
    }

    const orderedBySort = await supabase
      .from("category_fields")
      .select("*")
      .eq("category_node_id", categoryNodeId)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("display_order", { ascending: true });

    if (!orderedBySort.error && orderedBySort.data && orderedBySort.data.length > 0) {
      setDynamicFields(orderedBySort.data as CategoryField[]);
      return;
    }

    const fallback = await supabase
      .from("category_fields")
      .select("*")
      .eq("category_node_id", categoryNodeId)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    const fallbackFields = (fallback.data as CategoryField[]) ?? [];
    if (fallbackFields.length > 0) {
      setDynamicFields(fallbackFields);
      return;
    }

    setDynamicFields(buildFallbackFields(categoryNodeId, path, rootSlugName) as CategoryField[]);
  }, [locale]);

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
    setVehicleSelection(EMPTY_VEHICLE_SELECTION);
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
      await Promise.all([fetchFields(root.id, root.path, category.slug), fetchPostingConfig(category.id)]);
    }

    setLoadingTree(false);
  }, [fetchFields]);

  async function chooseNode(node: CategoryNode) {
    setLoadingTree(true);
    setDynamicValues({});

    const nextPath = [...pathNodes, node];
    setPathNodes(nextPath);

    const children = await fetchChildren(node.id);
    setCurrentOptions(children);

    if (children.length === 0) {
      setFinalNode(node);
      setVehicleSelection(EMPTY_VEHICLE_SELECTION);
      setDamageParts(defaultDamageParts());
      await Promise.all([fetchFields(node.id, node.path, rootSlug), fetchPostingConfig(node.category_id)]);
    } else {
      setFinalNode(null);
      setDynamicFields([]);
      setPostingConfig(null);
    }

    setLoadingTree(false);
  }

  async function goBackCategoryLevel() {
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

  function updateDynamic(key: string, value: string | boolean | string[]) {
    if (!allowedVehicleDynamicKeys.has(key)) {
      return;
    }
    setDynamicValues((prev) => ({ ...prev, [key]: value }));
  }

  function updateDynamicAndResetDependents(key: string, value: string | boolean | string[]) {
    updateDynamic(key, value);
    if (!simpleCategoryConfig) return;

    const dependentFields = simpleCategoryConfig.fields.filter((field) => field.dependsOn === key);
    for (const dependent of dependentFields) {
      updateDynamic(dependent.key, "");
      updateDynamic(`${dependent.key}Custom`, "");
    }
  }

  function updateDynamicPair(primaryKey: string, secondaryKey: string, value: string | boolean | string[]) {
    setDynamicValues((prev) => ({
      ...prev,
      ...(allowedVehicleDynamicKeys.has(primaryKey) ? { [primaryKey]: value } : {}),
      ...(allowedVehicleDynamicKeys.has(secondaryKey) ? { [secondaryKey]: value } : {}),
    }));
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
        .select("id, name")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (!active) return;

      const normalizedRows = ((data ?? []) as Array<{ id: number; name: string }>)
        .map((row) => ({ id: row.id, rawName: row.name, norm: normalizeLocationName(String(row.name)) }));

      const whitelist = AFGHAN_PROVINCES.map((name) => ({
        name,
        norm: normalizeLocationName(name),
      }));

      const mapped = whitelist.reduce<ProvinceOption[]>((acc, item) => {
        const match = normalizedRows.find((row) => row.norm === item.norm);
        if (!match) return acc;
        acc.push({ id: match.id, name: item.name });
        return acc;
      }, []);

      setProvinceOptions(mapped);
    };

    void loadProvinces();
    return () => {
      active = false;
    };
  }, [normalizeLocationName]);

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
        .select("id, name, province_id")
        .eq("province_id", selectedProvinceId)
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (!active) return;
      setDistrictOptions((data ?? []) as DistrictOption[]);
      setSelectedDistrictId((prev) => {
        if (!prev) return null;
        return (data ?? []).some((row) => Number((row as { id: number }).id) === prev) ? prev : null;
      });
    };

    void loadDistricts();
    return () => {
      active = false;
    };
  }, [selectedProvinceId]);

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
          (option) => normalizeLocationName(option.name) === normalizeLocationName(provinceHint)
        );
        if (matchedProvince) {
          setSelectedProvinceId(matchedProvince.id);

          if (districtHint) {
            const supabase = createSupabaseBrowserClient();
            const { data: districtsForProvince } = await supabase
              .from("districts")
              .select("id, name, province_id")
              .eq("province_id", matchedProvince.id)
              .eq("is_active", true)
              .order("name", { ascending: true });

            const matchedDistrict = ((districtsForProvince ?? []) as DistrictOption[]).find(
              (option) => normalizeLocationName(option.name) === normalizeLocationName(districtHint)
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
    const invalidType = files.find((file) => !ALLOWED_LISTING_IMAGE_TYPES.has(file.type));
    if (invalidType) {
      setStepError(postAdCopy.invalidImageType);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    const oversized = files.find((file) => file.size > MAX_LISTING_IMAGE_BYTES);
    if (oversized) {
      setStepError(postAdCopy.imageTooLarge);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (images.length + files.length > maxImages) {
      setStepError(postAdCopy.maxPhotosReached);
    } else {
      setStepError(null);
    }

    const availableSlots = Math.max(0, maxImages - images.length);
    const next = files.slice(0, availableSlots).map((file, index) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      isPrimary: images.length === 0 && index === 0,
    }));

    setImages((prev) => [...prev, ...next]);
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
        dynamicValues: (details.dynamic_values as Record<string, string | boolean | string[]>) ?? {},
        category: (response.draft.category ?? {}) as { root_slug?: string; final_path?: string; listing_type?: "for_sale" | "for_rent" | "wanted" },
        location: (response.draft.location ?? {}) as { province_id?: number; district_id?: number; area_text?: string; location_visibility?: "exact" | "approximate" | "province_district" },
      });

    };

    void loadServerDraft();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      const raw = globalThis.localStorage?.getItem(draftStorageKey);
      if (!raw) return;
      const localDraft = JSON.parse(raw) as { core?: CoreForm; dynamicValues?: Record<string, string | boolean | string[]> };
      if (localDraft.core || localDraft.dynamicValues) {
        globalThis.queueMicrotask(() => setPendingDraft((current) => current ?? localDraft));
      }
    } catch {
      globalThis.localStorage?.removeItem(draftStorageKey);
    }
  }, [draftStorageKey]);

  async function continueDraft() {
    if (pendingDraft?.core) {
      setCore(pendingDraft.core);
    }
    if (pendingDraft?.dynamicValues) {
      setDynamicValues(pendingDraft.dynamicValues);
    }
    if (pendingDraft?.category?.listing_type) {
      setListingTypeChoice(pendingDraft.category.listing_type);
    }
    if (pendingDraft?.location) {
      setSelectedProvinceId(Number(pendingDraft.location.province_id) || null);
      setSelectedDistrictId(Number(pendingDraft.location.district_id) || null);
      setAreaText(String(pendingDraft.location.area_text ?? ""));
      setLocationVisibility(pendingDraft.location.location_visibility ?? "province_district");
      if (pendingDraft.location.province_id && pendingDraft.location.district_id) {
        setLocationMethod("manual");
        setLocationConfirmed(true);
      }
    }

    const finalPathToRestore = pendingDraft?.category?.final_path;
    const rootSlugToRestore = pendingDraft?.category?.root_slug;
    const rootCategory = activeCategories.find((category) => category.slug === rootSlugToRestore);
    if (rootCategory && finalPathToRestore) {
      setLoadingTree(true);
      const segments = finalPathToRestore.split("/").filter(Boolean);
      const paths = segments.map((_, index) => segments.slice(0, index + 1).join("/"));
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase
        .from("category_nodes")
        .select("*")
        .eq("category_id", rootCategory.id)
        .in("path", paths)
        .eq("is_active", true);
      const byPath = new Map(((data as CategoryNode[]) ?? []).map((node) => [node.path, node]));
      const restoredNodes = paths.map((path) => byPath.get(path)).filter((node): node is CategoryNode => Boolean(node));
      const restoredFinal = restoredNodes.at(-1) ?? null;
      if (restoredFinal?.path === finalPathToRestore) {
        setSelectedRoot(rootCategory);
        setPathNodes(restoredNodes);
        setCurrentOptions([]);
        setFinalNode(restoredFinal);
        await Promise.all([
          fetchFields(restoredFinal.id, restoredFinal.path, rootCategory.slug),
          fetchPostingConfig(rootCategory.id),
        ]);
      }
      setLoadingTree(false);
    }
    setPendingDraft(null);
  }

  function startNewWithoutDraft() {
    globalThis.localStorage?.removeItem(draftStorageKey);
    setPendingDraft(null);
  }

  useEffect(() => {
    const timer = setTimeout(async () => {
      const hasMeaningfulDraft = Boolean(
        finalPath || core.title.trim() || core.description.trim() || core.price.trim() || images.length > 0
      );
      if (!hasMeaningfulDraft) return;

      setDraftSaveState("saving");
      globalThis.localStorage?.setItem(
        draftStorageKey,
        JSON.stringify({ core, dynamicValues })
      );

      const result = await saveListingDraftAction({
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
      setDraftSaveState(result.ok ? "saved" : result.statusCode === 401 ? "idle" : "error");
    }, 900);

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

  const requiredDynamicKeys = useMemo(() => {
    return new Set(
      dynamicFields
        .filter((field) => field.is_required && !LOCATION_DYNAMIC_KEYS.has(field.field_key))
        .map((field) => field.field_key)
    );
  }, [dynamicFields]);

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

    if (usesSimpleCategoryFallback && simpleCategoryConfig) {
      for (const field of simpleCategoryConfig.fields.filter((item) => item.required)) {
        const value = dynamicValues[field.key];
        if (field.type === "multiselect") {
          if (!Array.isArray(value) || value.length === 0) {
            return `${labelFor(locale, field.label)} ${postAdCopy.fieldRequiredSuffix}`;
          }
          continue;
        }

        if (field.allowCustom && isOtherChoice(value)) {
          const customValue = String(dynamicValues[`${field.key}Custom`] ?? "").trim();
          if (!customValue) {
            return `${labelFor(locale, field.label)} ${postAdCopy.fieldRequiredSuffix}`;
          }
        }

        if (!String(value ?? "").trim()) {
          return `${labelFor(locale, field.label)} ${postAdCopy.fieldRequiredSuffix}`;
        }
      }
    }

    for (const key of requiredDynamicKeys) {
      if (!String(dynamicValues[key] ?? "").trim()) {
        return `${renderFieldLabel(key)} ${postAdCopy.fieldRequiredSuffix}`;
      }
    }

    const isVehicle = rootSlug === "vehicles";
    if (isVehicle && !simpleCategoryConfig) {
      const selectedSubtype = vehicleSelection.subtype?.name?.trim() ?? "";
      const selectedBrand = vehicleSelection.brand?.slug && vehicleSelection.brand.slug !== "other-brand"
        ? vehicleSelection.brand.name.trim()
        : vehicleSelection.otherBrand.trim();
      const selectedModel = vehicleSelection.model?.slug && vehicleSelection.model.slug !== "other-model"
        ? vehicleSelection.model.name.trim()
        : vehicleSelection.otherModel.trim();

      if (vehicleBranch?.key === "parts" && !selectedSubtype) return postAdCopy.partTypeRequired;
      if (vehicleBranch?.key === "damaged" && !selectedSubtype) return postAdCopy.damageTypeRequired;
      if (vehicleBranch?.subtypeMode === "required" && !selectedSubtype) return postAdCopy.vehicleSubtypeRequired;
      if (vehicleBranch?.brandMode === "required" && !selectedBrand) return postAdCopy.vehicleBrandRequired;
      if (vehicleBranch?.modelMode === "required" && !selectedModel) return postAdCopy.vehicleModelRequired;

      const branchFields = vehicleBranch ? VEHICLE_BRANCH_DETAIL_FIELDS[vehicleBranch.key] ?? [] : [];
      for (const field of branchFields) {
        if (field.required) {
          const value = dynamicValues[field.key];
          if (!String(value ?? "").trim()) {
            return `${field.label} ${postAdCopy.fieldRequiredSuffix}`;
          }
        }
      }
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

  function validateLocationStep() {
    if (!selectedProvinceId || !selectedDistrictId) {
      return postAdCopy.addLocationBeforePublish;
    }
    if (!locationMethod) {
      return postAdCopy.addLocationBeforePublish;
    }
    if (locationMethod === "device" && !locationConfirmed) {
      return postAdCopy.detectedLocationNeedsConfirmation;
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
      setStep(2);
      return;
    }

    if (step === 2) {
      const err = validateDetailsStep();
      if (err) {
        setStepError(err);
        return;
      }
      setStep(showPhotoStep ? 3 : 3);
      return;
    }

    if (step === 3 && showPhotoStep) {
      const err = validatePhotoStep();
      if (err) {
        setStepError(err);
        return;
      }
      setStep(4);
      return;
    }

    if (step === locationStep) {
      const err = validateLocationStep();
      if (err) {
        setStepError(err);
        return;
      }
      setStep(previewStep);
      return;
    }

    if (step === previewStep) {
      setStep(publishStep);
    }
  }

  function goPrev() {
    setError(null);
    setStepError(null);

    if (step === publishStep) {
      setStep(previewStep);
      return;
    }

    if (step === previewStep) {
      setStep(locationStep);
      return;
    }

    if (step === locationStep) {
      setStep(showPhotoStep ? 3 : 2);
      return;
    }

    if (step === 3 && showPhotoStep) {
      setStep(2);
      return;
    }

    if (step === 2) {
      setStep(1);
    }
  }

  async function onPublish() {
    setError(null);
    setStepError(null);

    const categoryErr = validateCategoryStep();
    const detailErr = validateDetailsStep();
    const photoErr = showPhotoStep ? validatePhotoStep() : null;
    const locationErr = validateLocationStep();

    if (categoryErr || detailErr || photoErr || locationErr) {
      setError(categoryErr || detailErr || photoErr || locationErr || postAdCopy.completeRequiredFields);
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
    form.set("province", selectedProvince?.name ?? "");
    form.set("district", selectedDistrict?.name ?? "");
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

    if (vehicleSelection.specs.length > 0) {
      const lockedSpecs: Record<string, string> = {};
      for (const spec of vehicleSelection.specs) {
        if (spec.is_locked) {
          lockedSpecs[spec.spec_key] = spec.spec_value;
        }
      }
      if (Object.keys(lockedSpecs).length > 0) {
        form.set("locked_specs_json", JSON.stringify(lockedSpecs));
      }
    }

    if (rootSlug === "vehicles") {
      const resolvedBrand = vehicleSelection.brand?.slug && vehicleSelection.brand.slug !== "other-brand"
        ? vehicleSelection.brand.name
        : vehicleSelection.otherBrand.trim();
      const resolvedModel = vehicleSelection.model?.slug && vehicleSelection.model.slug !== "other-model"
        ? vehicleSelection.model.name
        : vehicleSelection.otherModel.trim();

      if (vehicleSelection.branchLabel) form.set("vehicle_type", vehicleSelection.branchLabel);
      if (vehicleSelection.subtype?.name) form.set("vehicle_subtype", vehicleSelection.subtype.name);
      if (resolvedBrand) form.set("vehicle_brand", resolvedBrand);
      if (resolvedModel) form.set("vehicle_model", resolvedModel);
      form.set("vehicle_is_manual", "true");

      form.set("damage_parts_json", JSON.stringify(damageParts));
      const nonOriginal = damageParts.filter((part) => part.condition !== "original");
      form.set("damage_all_original", nonOriginal.length === 0 ? "true" : "false");
    }

    for (const [key, value] of Object.entries(dynamicValues)) {
      if (LOCATION_DYNAMIC_KEYS.has(key)) {
        continue;
      }
      if (Array.isArray(value)) {
        if (value.length > 0) {
          form.set(key, JSON.stringify(value));
        }
      } else if (typeof value === "boolean") {
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
          // The listing already exists at this point. Move to its management
          // page so retrying cannot accidentally create a duplicate listing.
          window.location.assign(`/listings/${created.listingId}/manage?upload=partial`);
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
      window.location.assign(destination);
    });
  }

  const renderDynamicFields = dynamicFields.filter((field) => !LOCATION_DYNAMIC_KEYS.has(field.field_key));
  const previewDynamicEntries = renderDynamicFields.flatMap((field) => {
    const value = dynamicValues[field.field_key];
    if (value === undefined || value === null || value === "" || value === false) return [];
    const displayValue = Array.isArray(value)
      ? value.join(", ")
      : field.field_type === "boolean"
        ? "✓"
        : String(value);
    return [{ key: field.field_key, label: field.field_label, value: displayValue }];
  });
  const extraPhoneFields = !usesPublishedSchema && !simpleCategoryConfig && rootSlug === "mobile-phones-tablets"
    ? PHONE_FORM_FIELDS.filter((field) => !dynamicFields.some((dynamicField) => dynamicField.field_key === field.key))
    : [];
  const extraRealEstateFields = !usesPublishedSchema && !simpleCategoryConfig && rootSlug === "real-estate"
    ? REAL_ESTATE_FORM_FIELDS.filter((field) => !dynamicFields.some((dynamicField) => dynamicField.field_key === field.key))
    : [];

  function renderVehicleField(field: VehicleBranchDetailField) {
    const value = dynamicValues[field.key];

    if (field.type === "boolean") {
      return (
        <label key={field.key} className="flex items-center gap-2 rounded-xl border border-[var(--line)] px-3 py-3 text-sm font-semibold">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateDynamic(field.key, event.target.checked)}
            className="h-4 w-4"
          />
          {field.label}
        </label>
      );
    }

    const commonProps = {
      value: String(value ?? ""),
      onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => updateDynamic(field.key, event.target.value),
      className: "mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2",
    };

    if (field.type === "select") {
      return (
        <label key={field.key} className="text-sm font-semibold">
          {field.label}
          <select
            value={String(value ?? "")}
            onChange={(event) => updateDynamic(field.key, event.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
          >
            <option value="">Select</option>
            {(field.options ?? []).map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>
      );
    }

    return (
      <label key={field.key} className="text-sm font-semibold">
        {field.label}
        <input
          type={field.type === "number" ? "number" : "text"}
          {...commonProps}
        />
      </label>
    );
  }

  function renderVehicleDetailsSection(branch: VehicleBranchDefinition) {
    const branchFields = VEHICLE_BRANCH_DETAIL_FIELDS[branch.key] ?? [];
    const branchSpecificHint = (() => {
      switch (branch.key) {
        case "parts":
          return "Enter the part type, compatibility, and condition for this listing.";
        case "damaged":
          return "Select the damage type and describe the condition of the vehicle.";
        case "bicycles":
          return "Choose bicycle-specific details and condition to improve matching.";
        case "rickshaw":
          return "Select the rickshaw type and provide key vehicle details.";
        case "otherVehicles":
          return "Provide details for this less common vehicle type.";
        default:
          return "Choose the vehicle type, brand, model and other details that match your listing.";
      }
    })();

    return (
      <section className="mt-4 space-y-4 rounded-xl border border-[var(--line)] p-3">
        <h3 className="text-sm font-bold">{t.postAd.vehicleDetails}</h3>
        <p className="text-sm text-[var(--ink-2)]">{branchSpecificHint}</p>
        <VehicleSmartSelector
          key={finalNode?.path ?? "vehicle-selector"}
          categoryPath={finalNode?.path ?? null}
          onChange={setVehicleSelection}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          {branchFields.map((field) => renderVehicleField(field))}
        </div>

      </section>
    );
  }

  const vehicleDetailsSection = rootSlug === "vehicles" && !simpleCategoryConfig && vehicleBranch
    ? renderVehicleDetailsSection(vehicleBranch)
    : null;

  const simpleCategoryFieldsSection = simpleCategoryConfig && usesSimpleCategoryFallback ? (
    <section className="mt-4 rounded-xl border border-[var(--line)] p-3">
      <h3 className="text-sm font-bold">{labelFor(locale, simpleCategoryConfig.title)}</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {simpleCategoryConfig.fields.map((field) => {
          const value = dynamicValues[field.key];
          const customKey = `${field.key}Custom`;
          const customValue = String(dynamicValues[customKey] ?? "");

          if (field.key === "model" && field.dependsOn && simpleCategoryKind) {
            const selectedParent = String(dynamicValues[field.dependsOn] ?? "");
            const modelOptions = getSimpleCategoryModelOptions(simpleCategoryKind, selectedParent);
            if (modelOptions.length === 0 || isOtherChoice(selectedParent)) {
              return (
                <label key={field.key} className="text-sm font-semibold">
                  {labelFor(locale, field.label)}
                  <input
                    type="text"
                    value={String(value ?? "")}
                    onChange={(event) => updateDynamic(field.key, event.target.value)}
                    className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
                  />
                </label>
              );
            }

            return (
              <label key={field.key} className="text-sm font-semibold">
                {labelFor(locale, field.label)}
                <select
                  value={String(value ?? "")}
                  onChange={(event) => {
                    const selected = event.target.value;
                    updateDynamicAndResetDependents(field.key, selected);
                    if (!isOtherChoice(selected)) {
                      updateDynamic(customKey, "");
                    }
                  }}
                  className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
                >
                  <option value="">{t.postAd.select}</option>
                  {modelOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                  <option value="Other">Other</option>
                </select>
                {field.allowCustom && isOtherChoice(value) ? (
                  <input
                    type="text"
                    value={customValue}
                    onChange={(event) => updateDynamic(customKey, event.target.value)}
                    placeholder="Please specify"
                    className="mt-2 w-full rounded-xl border border-[var(--line)] px-3 py-2"
                  />
                ) : null}
              </label>
            );
          }

          if (field.type === "multiselect") {
            const selected = Array.isArray(value) ? value : [];
            return (
              <div key={field.key} className="sm:col-span-2 text-sm font-semibold">
                <p>{labelFor(locale, field.label)}</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {(field.options ?? []).map((option) => {
                    const checked = selected.includes(option.value);
                    return (
                      <label key={option.value} className="flex items-center gap-2 rounded-xl border border-[var(--line)] px-3 py-2 text-sm font-medium">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) => {
                            const next = event.target.checked
                              ? [...selected, option.value]
                              : selected.filter((item) => item !== option.value);
                            updateDynamic(field.key, next);
                          }}
                          className="h-4 w-4"
                        />
                        {optionLabel(locale, option)}
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          }

          if (field.type === "textarea") {
            return (
              <label key={field.key} className="text-sm font-semibold sm:col-span-2">
                {labelFor(locale, field.label)}
                <textarea
                  value={String(value ?? "")}
                  onChange={(event) => updateDynamic(field.key, event.target.value)}
                  className="mt-1 min-h-28 w-full rounded-xl border border-[var(--line)] px-3 py-2"
                />
              </label>
            );
          }

          if (field.type === "select") {
            return (
              <label key={field.key} className="text-sm font-semibold">
                {labelFor(locale, field.label)}
                <select
                  value={String(value ?? "")}
                  onChange={(event) => {
                    const selected = event.target.value;
                    updateDynamicAndResetDependents(field.key, selected);
                    if (!isOtherChoice(selected)) {
                      updateDynamic(customKey, "");
                    }
                  }}
                  className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
                >
                  <option value="">{t.postAd.select}</option>
                  {(field.options ?? []).map((option) => (
                    <option key={option.value} value={option.value}>{optionLabel(locale, option)}</option>
                  ))}
                </select>
                {field.allowCustom && isOtherChoice(value) ? (
                  <input
                    type="text"
                    value={customValue}
                    onChange={(event) => updateDynamic(customKey, event.target.value)}
                    placeholder="Please specify"
                    className="mt-2 w-full rounded-xl border border-[var(--line)] px-3 py-2"
                  />
                ) : null}
              </label>
            );
          }

          return (
            <label key={field.key} className="text-sm font-semibold">
              {labelFor(locale, field.label)}
              <input
                type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                min={field.min}
                max={field.max}
                value={String(value ?? "")}
                onChange={(event) => updateDynamic(field.key, event.target.value)}
                className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
              />
            </label>
          );
        })}
      </div>
    </section>
  ) : null;

  const vehicleDamageSection = shouldShowVehicleDamageDiagram(rootSlug, vehicleBranch?.key) ? (
    <section className="mt-4 rounded-xl border border-[var(--line)] p-3">
      <h3 className="mb-3 text-sm font-bold">{t.postAd.damagePaintReport}</h3>
      <VehicleDamageDiagram value={damageParts} onChange={setDamageParts} locale={locale} />
    </section>
  ) : null;

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
      <div className="sticky top-0 z-10 overflow-hidden rounded-2xl border border-emerald-950/10 bg-[#103b32] px-4 py-4 text-white shadow-lg shadow-emerald-950/10">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f4d99c]">{t.postAd.postAd}</p>
            <p className="mt-1 text-sm font-semibold">{t.postAd.step} {currentVisualStep} {t.postAd.of} {visualSteps.length}</p>
          </div>
          <p className={`text-xs font-semibold ${draftSaveState === "error" ? "text-red-200" : "text-white/70"}`} aria-live="polite">
            {draftSaveState === "saving" ? postAdCopy.savingDraft : draftSaveState === "saved" ? postAdCopy.draftSaved : draftSaveState === "error" ? postAdCopy.draftSaveFailed : ""}
          </p>
        </div>
        <div className="mt-4 grid grid-cols-6 gap-1" aria-label={`${t.postAd.step} ${currentVisualStep} ${t.postAd.of} ${visualSteps.length}`}>
          {visualSteps.map((label, index) => {
            const number = index + 1;
            const complete = number < currentVisualStep;
            const current = number === currentVisualStep;
            return (
              <div key={label} className="min-w-0 text-center">
                <div className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${complete ? "bg-[#e6b85c] text-[#173c32]" : current ? "bg-white text-[#173c32] ring-4 ring-white/15" : "bg-white/10 text-white/60"}`}>
                  {complete ? "✓" : number}
                </div>
                <p className={`mt-1 hidden truncate text-[10px] sm:block ${current ? "text-white" : "text-white/55"}`}>{label}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {pendingDraft ? (
          <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
            <p className="text-sm font-semibold">{postAdCopy.draftContinuePrompt}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void continueDraft()}
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
                <label className="mt-4 block text-sm font-semibold">
                  <span className="sr-only">{postAdCopy.searchCategories}</span>
                  <input
                    type="search"
                    value={categoryQuery}
                    onChange={(event) => setCategoryQuery(event.target.value)}
                    placeholder={postAdCopy.searchCategories}
                    className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
                  />
                </label>
                <div className="mt-3 divide-y divide-[var(--line)] overflow-hidden rounded-xl border border-[var(--line)]">
                  {filteredActiveCategories.map((category) => (
                    <button key={category.id} type="button" onClick={() => void chooseRoot(category)} className="flex w-full items-center justify-between px-4 py-3 text-start text-sm font-semibold transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-600">
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
                  {filteredActiveCategories.length === 0 ? <p className="px-4 py-6 text-center text-sm text-[var(--ink-2)]">{postAdCopy.noCategoriesFound}</p> : null}
                </div>

                {comingSoonCategories.length > 0 ? (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">{t.postAd.comingSoon}</p>
                    <div className="mt-2 space-y-2">
                      {comingSoonCategories.map((category) => (
                        <div key={category.id} className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
                          <p className="text-sm font-semibold text-slate-700">
                            {localizeCategoryName({ locale, fallbackName: category.name, slug: category.slug })}
                          </p>
                          <Link href={`/categories/${category.slug}`} className="rounded-lg border border-amber-300 px-2 py-1 text-xs font-semibold text-amber-700">
                            {t.postAd.notifyMe}
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="mt-3 divide-y divide-[var(--line)] overflow-hidden rounded-xl border border-[var(--line)]">
                {loadingTree ? <div className="px-4 py-3 text-sm text-[var(--ink-2)]">{t.postAd.loading}</div> : null}
                {!loadingTree && currentOptions.length === 0 && finalNode ? (
                  <div className="px-4 py-3 text-sm font-semibold text-green-700">
                    {t.postAd.finalCategorySelected}: {localizeCategoryName({ locale, fallbackName: finalNode.name, slug: finalNode.slug, path: finalNode.path })}
                  </div>
                ) : null}
                {!loadingTree
                  ? currentOptions.map((node) => (
                      <button key={node.id} type="button" onClick={() => void chooseNode(node)} className="flex w-full items-center justify-between px-4 py-3 text-start text-sm font-semibold transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-600">
                        <span className="break-words">
                          {localizeCategoryName({ locale, fallbackName: node.name, slug: node.slug, path: node.path })}
                        </span>
                        <span aria-hidden>&gt;</span>
                      </button>
                    ))
                  : null}
              </div>
            )}
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
                {rootSlug === "real-estate" ? (
                  <button
                    type="button"
                    onClick={() => setListingTypeChoice("for_rent")}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold ${listingTypeChoice === "for_rent" ? "bg-[var(--ink-1)] text-white" : "border border-[var(--line)] bg-white"}`}
                  >
                    {t.postAd.forRent}
                  </button>
                ) : null}
              </div>
            </div>

            <p className="mt-3 rounded-lg bg-[var(--surface-2)] px-3 py-2 text-sm font-semibold break-words">{breadcrumb || t.postAd.categoryNotSelected}</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold sm:col-span-2">{t.postAd.title} <span className="text-red-600">*</span>
                <input value={core.title} minLength={5} maxLength={120} required onChange={(event) => updateCore("title", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2.5 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10" />
                <span className="mt-1 block text-end text-xs font-normal text-[var(--ink-2)]">{core.title.length}/120 {postAdCopy.characters}</span>
              </label>
              <label className="text-sm font-semibold sm:col-span-2">{t.postAd.description} <span className="text-red-600">*</span>
                <textarea rows={6} value={core.description} minLength={20} maxLength={5000} required onChange={(event) => updateCore("description", event.target.value)} className="mt-1 w-full resize-y rounded-xl border border-[var(--line)] px-3 py-2.5 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10" />
                <span className="mt-1 block text-end text-xs font-normal text-[var(--ink-2)]">{core.description.length}/5000 {postAdCopy.characters}</span>
              </label>
              <label className="text-sm font-semibold">{t.postAd.price} <span className="text-red-600">*</span>
                <input type="number" inputMode="decimal" min={1} required value={core.price} onChange={(event) => updateCore("price", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2.5 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10" />
              </label>
              <label className="text-sm font-semibold">{t.postAd.currency}
                <select value={core.currency} onChange={(event) => updateCore("currency", event.target.value as "AFN" | "USD")} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2">
                  {CURRENCIES.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold">{t.postAd.contactPhone} <span className="text-red-600">*</span>
                <input type="tel" inputMode="tel" autoComplete="tel" minLength={7} maxLength={20} required value={core.contact_phone} onChange={(event) => updateCore("contact_phone", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2.5 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10" />
              </label>
              <label className="text-sm font-semibold">{t.postAd.contactName}
                <input autoComplete="name" maxLength={80} value={core.contact_name} onChange={(event) => updateCore("contact_name", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2.5 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10" />
              </label>
              <label className="text-sm font-semibold sm:col-span-2">{t.postAd.contactPreferences}
                <input value={core.contact_preferences} onChange={(event) => updateCore("contact_preferences", event.target.value)} placeholder={t.postAd.contactPreferencesPlaceholder} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
              </label>
              <p className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--ink-2)] sm:col-span-2">
                {t.postAd.locationMovedNote}
              </p>
            </div>

            {vehicleDetailsSection}

            {simpleCategoryFieldsSection}

            {(!simpleCategoryConfig || usesPublishedSchema) && renderDynamicFields.length > 0 ? (
              <section className="mt-4 rounded-xl border border-[var(--line)] p-3">
                <h3 className="text-sm font-bold">{t.postAd.additionalCategoryFields}</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {renderDynamicFields.map((field) => {
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
                            {field.field_label} {field.is_required ? <span className="text-red-600">*</span> : null}
                          </span>
                        </label>
                      );
                    }

                    if (field.field_type === "select") {
                      const options = fieldOptions(field.options_json);
                      return (
                        <label key={field.id} className="text-sm font-semibold">
                          {field.field_label} {field.is_required ? <span className="text-red-600">*</span> : null}
                          <select
                            required={field.is_required}
                            value={String(value ?? "")}
                            onChange={(event) => updateDynamic(field.field_key, event.target.value)}
                            className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
                          >
                            <option value="">{t.postAd.select}</option>
                            {options.map((option) => (
                              <option key={`${field.id}-${option.value}`} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </label>
                      );
                    }

                    return (
                      <label key={field.id} className="text-sm font-semibold">
                        {field.field_label} {field.is_required ? <span className="text-red-600">*</span> : null}
                        <input
                          required={field.is_required}
                          type={field.field_type === "number" ? "number" : field.field_type === "date" ? "date" : "text"}
                          value={String(value ?? "")}
                          onChange={(event) => updateDynamic(field.field_key, event.target.value)}
                          className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
                        />
                      </label>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {vehicleDamageSection}

            {!simpleCategoryConfig && extraPhoneFields.length > 0 ? (
              <section className="mt-4 rounded-xl border border-[var(--line)] p-3">
                <h3 className="text-sm font-bold">Phone details</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {extraPhoneFields.map((field) => {
                    const value = dynamicValues[field.key];

                    if (field.type === "boolean") {
                      return (
                        <label key={field.key} className="text-sm font-semibold">
                          <span className="flex items-center gap-2 rounded-xl border border-[var(--line)] px-3 py-3">
                            <input
                              type="checkbox"
                              checked={Boolean(value)}
                              onChange={(event) => updateDynamic(field.key, event.target.checked)}
                              className="h-4 w-4"
                            />
                            {field.label}
                          </span>
                        </label>
                      );
                    }

                    if (field.type === "select") {
                      return (
                        <label key={field.key} className="text-sm font-semibold">
                          {field.label}
                          <select
                            value={String(value ?? "")}
                            onChange={(event) => updateDynamic(field.key, event.target.value)}
                            className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
                          >
                            <option value="">Select</option>
                            {(PHONE_FIELD_OPTIONS[field.key as keyof typeof PHONE_FIELD_OPTIONS] ?? []).map((option) => (
                              <option key={`${field.key}-${option}`} value={option}>{option}</option>
                            ))}
                          </select>
                        </label>
                      );
                    }

                    return (
                      <label key={field.key} className="text-sm font-semibold">
                        {field.label}
                        <input
                          type={field.type === "number" ? "number" : "text"}
                          value={String(value ?? "")}
                          onChange={(event) => updateDynamic(field.key, event.target.value)}
                          className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
                        />
                      </label>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {!simpleCategoryConfig && extraRealEstateFields.length > 0 ? (
              <section className="mt-4 rounded-xl border border-[var(--line)] p-3">
                <h3 className="text-sm font-bold">{t.postAd.realEstateDetails}</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {extraRealEstateFields.map((field) => {
                    const value = dynamicValues[field.key];

                    if (field.type === "boolean") {
                      return (
                        <label key={field.key} className="text-sm font-semibold">
                          <span className="flex items-center gap-2 rounded-xl border border-[var(--line)] px-3 py-3">
                            <input
                              type="checkbox"
                              checked={Boolean(value)}
                              onChange={(event) => updateDynamic(field.key, event.target.checked)}
                              className="h-4 w-4"
                            />
                            {field.label}
                          </span>
                        </label>
                      );
                    }

                    if (field.type === "select") {
                      return (
                        <label key={field.key} className="text-sm font-semibold">
                          {field.label}
                          <select
                            value={String(value ?? "")}
                            onChange={(event) => updateDynamic(field.key, event.target.value)}
                            className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
                          >
                            <option value="">Select</option>
                            {(REAL_ESTATE_FIELD_OPTIONS[field.key as keyof typeof REAL_ESTATE_FIELD_OPTIONS] ?? []).map((option) => (
                              <option key={`${field.key}-${option}`} value={option}>{option}</option>
                            ))}
                          </select>
                        </label>
                      );
                    }

                    return (
                      <label key={field.key} className="text-sm font-semibold">
                        {field.label}
                        <input
                          type={field.type === "number" ? "number" : "text"}
                          value={String(value ?? "")}
                          onChange={(event) => updateDynamic(field.key, event.target.value)}
                          className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
                        />
                      </label>
                    );
                  })}
                </div>
              </section>
            ) : null}

            <label className="mt-4 flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={core.rulesAccepted} onChange={(event) => updateCore("rulesAccepted", event.target.checked)} className="h-4 w-4" />
              {t.postAd.confirmRules}
            </label>
          </section>
        ) : null}

        {step === 3 && showPhotoStep ? (
          <section className="rounded-2xl border border-[var(--line)] bg-white p-4">
            <h2 className="font-display text-lg font-bold">{t.postAd.photosStepTitle}</h2>
            <p className="mt-1 text-sm text-[var(--ink-2)]">
              {resolvedImageConfig?.requires_images ? t.postAd.photosRequired : t.postAd.photosOptional}
              {resolvedImageConfig?.recommended_images ? ` ${t.postAd.recommended}: ${resolvedImageConfig.recommended_images}` : ""}
            </p>

            <p className="mt-2 text-xs text-[var(--ink-2)]">JPG, PNG, WebP or HEIC · 10 MB max per photo · {images.length}/{resolvedImageConfig?.max_images ?? 10}</p>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple className="hidden" onChange={onPickFiles} />
            {images.length === 0 ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 w-full rounded-2xl border-2 border-dashed border-[var(--line)] py-10 text-sm font-semibold"
              >
                {t.postAd.addPhotos}
              </button>
            ) : (
              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  {images.map((img, index) => (
                    <div key={`${img.previewUrl}-${index}`} className="relative aspect-square overflow-hidden rounded-xl border border-[var(--line)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.previewUrl} alt={`${core.title || t.postAd.photosLabel} ${index + 1}`} className="h-full w-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/50 p-1 text-[10px] font-semibold text-white">
                        <button type="button" onClick={() => setPrimary(index)}>{t.postAd.primary}</button>
                        <button type="button" onClick={() => removeImage(index)}>{t.postAd.remove}</button>
                      </div>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-xl border border-[var(--line)] px-3 py-2 text-sm font-semibold">
                  {t.postAd.addMore}
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
                      <option key={province.id} value={province.id}>{province.name}</option>
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
                      <option key={district.id} value={district.id}>{district.name}</option>
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

        {isPreviewStep ? (
          <section className="rounded-2xl border border-[var(--line)] bg-white p-4">
            <h2 className="font-display text-lg font-bold">{t.postAd.previewStepTitle}</h2>
            <div className="mt-3 grid gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3 text-sm">
              <p><span className="font-semibold">{t.postAd.categoryLabel}:</span> {breadcrumb || "-"}</p>
              <p><span className="font-semibold">{t.postAd.title}:</span> {core.title || "-"}</p>
              <p><span className="font-semibold">{t.postAd.description}:</span> {core.description || "-"}</p>
              <p><span className="font-semibold">{t.postAd.price}:</span> {core.price ? `${core.price} ${core.currency}` : "-"}</p>
              <p>
                <span className="font-semibold">{t.postAd.provinceDistrict}:</span>{" "}
                {provinceOptions.find((item) => item.id === selectedProvinceId)?.name ?? "-"}
                {" / "}
                {districtOptions.find((item) => item.id === selectedDistrictId)?.name ?? "-"}
              </p>
              <p><span className="font-semibold">{t.postAd.photosLabel}:</span> {images.length}</p>
              {previewDynamicEntries.map((entry) => (
                <p key={entry.key}><span className="font-semibold">{entry.label}:</span> {entry.value}</p>
              ))}
            </div>
          </section>
        ) : null}

        {isPublishStep ? (
          <section className="rounded-2xl border border-[var(--line)] bg-white p-4">
            <h2 className="font-display text-lg font-bold">{t.postAd.publishStepTitle}</h2>
            <p className="mt-2 text-sm text-[var(--ink-2)]">{t.postAd.publishReady}</p>
          </section>
        ) : null}

        {stepError ? <p role="alert" aria-live="assertive" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{stepError}</p> : null}
        {error ? <p role="alert" aria-live="assertive" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p> : null}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--line)] bg-white px-4 py-3">
        <div className="mx-auto flex w-full max-w-5xl gap-2">
          {step > 1 ? (
            <button type="button" onClick={goPrev} className="rounded-xl border border-[var(--line)] px-4 py-3 text-sm font-semibold">
              {t.postAd.back}
            </button>
          ) : null}

          {!isPublishStep ? (
            <button type="button" onClick={goNext} disabled={loadingTree} className="flex-1 rounded-xl bg-[#a7442f] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#8d3524] disabled:cursor-not-allowed disabled:opacity-60">
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
