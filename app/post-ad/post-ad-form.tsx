"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { createListingAction, uploadListingImageAction } from "@/lib/actions/listings";
import { CURRENCIES } from "@/lib/constants/marketplace";
import type { Category, CategoryField, CategoryNode } from "@/types/database";
import { VehicleSmartSelector, type VehicleSelection } from "@/components/vehicles/VehicleSmartSelector";
import { VehicleDamageDiagram, defaultDamageParts, type DamagePart } from "@/components/vehicles/VehicleDamageDiagram";
import type { AppLocale, TRANSLATIONS } from "@/lib/i18n/translations";
import { localizeCategoryName } from "@/lib/i18n/category-labels";
import { isDeprecatedCategoryPath } from "@/lib/categories/deprecatedPaths";
import { ACTIVE_HOME_CATEGORY_SLUGS } from "@/lib/categories/categoryTree";
import { parseSmartPostingText, type SmartPostingParseResult } from "@/lib/posting/smart-parser";
import { deleteMyDraftAction, getMyActiveDraftAction, saveListingDraftAction } from "@/lib/actions/drafts";

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
      ACTIVE_HOME_CATEGORY_SLUGS.includes(category.slug as (typeof ACTIVE_HOME_CATEGORY_SLUGS)[number])
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

  const showPhotoStep = Boolean(resolvedImageConfig?.requires_images || images.length > 0);
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
    for (const locationKey of LOCATION_DYNAMIC_KEYS) {
      allowedKeys.add(locationKey);
    }
    setDynamicValues((prev) => ({
      ...prev,
      ...(allowedKeys.has(primaryKey) && !CORE_DYNAMIC_KEYS.has(primaryKey) ? { [primaryKey]: value } : {}),
      ...(allowedKeys.has(secondaryKey) && !CORE_DYNAMIC_KEYS.has(secondaryKey) ? { [secondaryKey]: value } : {}),
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

  const requiredDynamicKeys = useMemo(() => {
    return new Set(
      dynamicFields
        .filter((field) => field.is_required && isRenderableDynamicField(field))
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

  const renderDynamicFields = dynamicFields.filter((field) => isRenderableDynamicField(field));
  const requiredDynamicFields = renderDynamicFields.filter((field) => field.is_required);
  const optionalDynamicFields = renderDynamicFields.filter((field) => !field.is_required);

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

  const renderDynamicFieldInput = (field: CategoryField) => {
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
      const options = fieldOptions(field.options_json);
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
                    <button key={category.id} type="button" onClick={() => void chooseRoot(category)} className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold">
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
              <div className="mt-3 divide-y divide-[var(--line)] overflow-hidden rounded-xl border border-[var(--line)]">
                {loadingTree ? <div className="px-4 py-3 text-sm text-[var(--ink-2)]">{t.postAd.loading}</div> : null}
                {!loadingTree && currentOptions.length === 0 && finalNode ? (
                  <div className="px-4 py-3 text-sm font-semibold text-green-700">
                    {t.postAd.finalCategorySelected}: {localizeCategoryName({ locale, fallbackName: finalNode.name, slug: finalNode.slug, path: finalNode.path })}
                  </div>
                ) : null}
                {!loadingTree
                  ? currentOptions.map((node) => (
                      <button key={node.id} type="button" onClick={() => void chooseNode(node)} className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold">
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
                <h3 className="text-sm font-bold">{t.postAd.additionalCategoryFields}</h3>
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

            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={onPickFiles} />
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
                      <img src={img.previewUrl} alt={`Upload ${index + 1}`} className="h-full w-full object-cover" />
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
                {provinceOptions.find((item) => item.id === selectedProvinceId)?.label ?? "-"}
                {" / "}
                {districtOptions.find((item) => item.id === selectedDistrictId)?.label ?? "-"}
              </p>
              <p><span className="font-semibold">{t.postAd.photosLabel}:</span> {images.length}</p>
            </div>
          </section>
        ) : null}

        {isPublishStep ? (
          <section className="rounded-2xl border border-[var(--line)] bg-white p-4">
            <h2 className="font-display text-lg font-bold">{t.postAd.publishStepTitle}</h2>
            <p className="mt-2 text-sm text-[var(--ink-2)]">{t.postAd.publishReady}</p>
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

          {!isPublishStep ? (
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
