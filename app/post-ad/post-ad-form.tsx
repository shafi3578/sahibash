"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { createListingAction, uploadListingImageAction } from "@/lib/actions/listings";
import { AFGHAN_PROVINCES, CURRENCIES } from "@/lib/constants/marketplace";
import type { Category, CategoryField, CategoryNode } from "@/types/database";
import { VehicleSmartSelector, type VehicleSelection } from "@/components/vehicles/VehicleSmartSelector";
import { VehicleDamageDiagram, defaultDamageParts, type DamagePart } from "@/components/vehicles/VehicleDamageDiagram";
import type { AppLocale, TRANSLATIONS } from "@/lib/i18n/translations";
import { localizeCategoryName } from "@/lib/i18n/category-labels";
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
const ACTIVE_POSTING_CATEGORY_SLUGS = [
  "vehicles",
  "real-estate",
  "mobile-phones-tablets",
  "electronics-computers",
  "jobs",
  "services",
  "home-furniture-appliances",
  "farm-animals",
  "wanted-request-ads",
  "second-hand-items",
] as const;

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

function fieldOptions(optionsJson: Record<string, unknown> | string[] | null) {
  if (!optionsJson) return [];
  if (Array.isArray(optionsJson)) return optionsJson.map((value) => String(value));
  return Object.values(optionsJson).map((value) => String(value));
}

function renderFieldLabel(fieldKey: string) {
  return fieldKey.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
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

  if (rootSlug === "mobile-phones-tablets" || rootSlug === "electronics-computers") {
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
  const [loadingTree, setLoadingTree] = useState(false);

  const [postingConfig, setPostingConfig] = useState<PostingConfig | null>(null);
  const [listingTypeChoice, setListingTypeChoice] = useState<"for_sale" | "wanted">(initialListingType);
  const [postMode] = useState<PostMode>(initialMode);
  const [smartRawInput, setSmartRawInput] = useState("");
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
  const [previousLocation, setPreviousLocation] = useState<StoredLocation | null>(null);

  const activeCategories = useMemo(
    () => categories.filter((category) =>
      ACTIVE_POSTING_CATEGORY_SLUGS.includes(category.slug as (typeof ACTIVE_POSTING_CATEGORY_SLUGS)[number])
      && !category.is_coming_soon
    ),
    [categories]
  );

  const comingSoonCategories = useMemo(
    () => categories.filter((category) =>
      !ACTIVE_POSTING_CATEGORY_SLUGS.includes(category.slug as (typeof ACTIVE_POSTING_CATEGORY_SLUGS)[number])
      || category.is_coming_soon
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
  const isRealEstate = rootSlug === "real-estate";
  const isDormitory = finalPath === "real-estate/dormitory";
  const isStudentCollection = finalPath === "real-estate/room-house-for-students";
  const isHouseCategory = (finalPath ?? "").startsWith("real-estate/houses");
  const isApartmentCategory = (finalPath ?? "").startsWith("real-estate/apartments");
  const isRoomCategory = (finalPath ?? "").startsWith("real-estate/rooms");
  const listingPurpose = String(dynamicValues.listing_purpose ?? "");
  const showStudentSuitabilityToggle = isRealEstate
    && !isDormitory
    && (isHouseCategory || isApartmentCategory || isRoomCategory)
    && listingPurpose === "For Rent";
  const suitableForStudents = Boolean(dynamicValues.suitable_for_students);

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

  async function fetchChildren(parentId: number) {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase
      .from("category_nodes")
      .select("*")
      .eq("parent_id", parentId)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    return (data as CategoryNode[]) ?? [];
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

    return (data as CategoryNode | null) ?? null;
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

      if (node.path === "real-estate/dormitory") {
        setDynamicValues((prev) => ({
          ...prev,
          listing_purpose: "For Rent",
          suitable_for_students: true,
          student_housing_type: "dormitory",
        }));
      }
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
    setDynamicValues((prev) => ({ ...prev, [key]: value }));
  }

  function updateDynamicPair(primaryKey: string, secondaryKey: string, value: string | boolean) {
    setDynamicValues((prev) => ({
      ...prev,
      [primaryKey]: value,
      [secondaryKey]: value,
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
    try {
      const raw = globalThis.localStorage?.getItem(PREVIOUS_LOCATION_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as StoredLocation;
      if (parsed?.provinceId && parsed?.districtId) {
        setPreviousLocation(parsed);
      }
    } catch {
      // ignore invalid previous location payload
    }
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
      setLocationHint("We could not detect your location. Please choose manually.");
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
        setLocationHint("We detected your location. Please confirm it before publishing.");
        void attemptReverseGeocode(position.coords.latitude, position.coords.longitude);
      },
      () => {
        setIsDetectingLocation(false);
        setLocationMethod("manual");
        setLocationHint("We could not detect your location. Please choose manually.");
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
      setStepError("Please confirm province and district for the detected location.");
      return;
    }
    setLocationConfirmed(true);
    setLocationHint("Location confirmed.");
  }

  function handleUsePreviousLocation() {
    if (!previousLocation) {
      setLocationHint("No previous location saved yet.");
      return;
    }

    setLocationMethod("manual");
    setSelectedProvinceId(previousLocation.provinceId);
    setSelectedDistrictId(previousLocation.districtId);
    setAreaText(previousLocation.areaText || "");
    setLocationVisibility(previousLocation.locationVisibility || "province_district");
    setLocationConfirmed(true);
    setLocationHint("Previous location applied.");
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
      const category = (response.draft.category ?? {}) as Record<string, unknown>;

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

      const listingTypeFromDraft = String(category.listing_type ?? "");
      if (listingTypeFromDraft === "wanted") {
        setListingTypeChoice("wanted");
      }
    };

    void loadServerDraft();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const raw = globalThis.localStorage?.getItem(draftStorageKey);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as {
        core?: CoreForm;
        dynamicValues?: Record<string, string | boolean>;
      };
      setPendingDraft(parsed);
    } catch {
      // ignore broken draft
    }
  }, [draftStorageKey]);

  function continueDraft() {
    if (pendingDraft?.core) {
      setCore(pendingDraft.core);
    }
    if (pendingDraft?.dynamicValues) {
      setDynamicValues(pendingDraft.dynamicValues);
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
        .filter((field) => field.is_required && !LOCATION_DYNAMIC_KEYS.has(field.field_key))
        .map((field) => field.field_key)
    );
  }, [dynamicFields]);

  function validateCategoryStep() {
    if (!selectedRoot || !finalNode) {
      return "Select a final category to continue.";
    }
    if (selectedRoot.is_coming_soon) {
      return "This category is coming soon. Posting is not available yet.";
    }
    return null;
  }

  function validateDetailsStep() {
    if (!core.title || core.title.trim().length < 5) return "Title must be at least 5 characters.";
    if (!core.description || core.description.trim().length < 20) return "Description must be at least 20 characters.";
    if (!core.price || Number(core.price) <= 0) return "Please enter a valid price.";
    if (!core.contact_phone) return "Contact phone is required.";
    if (!core.rulesAccepted) return "You must accept the posting rules to continue.";

    for (const key of requiredDynamicKeys) {
      if (!String(dynamicValues[key] ?? "").trim()) {
        return `${renderFieldLabel(key)} is required.`;
      }
    }

    const isVehicle = rootSlug === "vehicles";
    if (isVehicle) {
      const year = String(dynamicValues.year ?? dynamicValues.vehicle_year ?? "").trim();
      if (!year) return "Vehicle year is required.";
    }

    if (isDormitory) {
      if (!listingPurpose) return "Listing Purpose is required.";
      if (listingPurpose !== "For Rent") return "Dormitory listings must be For Rent.";
      if (!String(dynamicValues.payment_period ?? "").trim()) return "Payment Period is required for dormitory.";
      if (!String(dynamicValues.gender_allowed ?? "").trim()) return "Gender Allowed is required for dormitory.";
      if (!String(dynamicValues.room_type ?? "").trim()) return "Room Type is required for dormitory.";
    }

    return null;
  }

  function validateLocationStep() {
    if (!selectedProvinceId || !selectedDistrictId) {
      return "Please add a location before publishing your ad.";
    }

    if (locationMethod === "device") {
      if (deviceLatitude === null || deviceLongitude === null) {
        return "Please detect your device location or choose manual location.";
      }
      if (!locationConfirmed) {
        return "We detected your location. Please confirm it before publishing.";
      }
    }

    if (!locationMethod) {
      return "Please add a location before publishing your ad.";
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
      setError(categoryErr || detailErr || photoErr || locationErr || "Please complete required fields.");
      return;
    }

    if (!selectedRoot || !finalNode) {
      setError("Category is required.");
      return;
    }

    try {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        window.location.assign(`/login?redirect=${encodeURIComponent("/post-ad")}&reason=post`);
        return;
      }
    } catch {
      window.location.assign(`/login?redirect=${encodeURIComponent("/post-ad")}&reason=post`);
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
      if (typeof value === "boolean") {
        if (value) form.set(key, "true");
      } else if (String(value).trim()) {
        form.set(key, String(value));
      }
    }

    startTransition(async () => {
      setStatus("Creating listing...");
      const created = await createListingAction(form);
      if (!created.ok || !created.listingId) {
        setError(created.message || "Failed to create listing.");
        setStatus(null);
        return;
      }

      const ordered = [...images].sort((a, b) => (a.isPrimary ? -1 : b.isPrimary ? 1 : 0));
      for (let i = 0; i < ordered.length; i += 1) {
        setStatus(`Uploading image ${i + 1} of ${ordered.length}...`);
        const uploaded = await uploadListingImageAction(created.listingId, ordered[i].file, ordered[i].isPrimary);
        if (!uploaded.ok) {
          setError(`Listing created, but image ${i + 1} failed: ${uploaded.message}`);
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
      setStatus("Listing created. Redirecting...");
      const destination = `/listings/${created.listingId}/manage`;
      router.push(destination);
      router.refresh();
      window.location.assign(destination);
    });
  }

  const rootSpecificFieldKeys = new Set([
    "listing_purpose",
    "rooms",
    "bathrooms",
    "property_size",
    "land_size",
    "floor",
    "total_floors",
    "furnished",
    "parking",
    "water",
    "electricity",
    "road_access",
    "document_type",
    "owner_type",
    "brand",
    "model",
    "year",
    "variant",
    "km",
    "fuel_type",
    "transmission",
    "body_type",
    "engine_capacity",
    "condition",
    "plate_status",
    "customs_status",
    "imported_from",
    "motorcycle_type",
    "engine_cc",
    "rickshaw_type",
    "passenger_capacity",
    "cargo_capacity",
    "storage",
    "ram",
    "battery_capacity",
    "registered_status",
    "sim_lock_bypass",
    "fingerprint_works",
    "face_id_works",
    "camera_works",
    "box_available",
    "charger_included",
    "imei_status",
    "price_type",
    "exchange_accepted",
    "battery_health",
    "original_refurbished",
    "item_type",
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

  const renderDynamicFields = dynamicFields.filter(
    (field) => !rootSpecificFieldKeys.has(field.field_key) && !LOCATION_DYNAMIC_KEYS.has(field.field_key)
  );

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

    if (smartSuggestion.listingType === "wanted") {
      setListingTypeChoice("wanted");
    }

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
            <p className="text-sm font-semibold">You have an unfinished ad. Continue?</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={continueDraft}
                className="rounded-xl bg-[var(--ink-1)] px-4 py-2 text-sm font-semibold text-white"
              >
                Continue draft
              </button>
              <button
                type="button"
                onClick={startNewWithoutDraft}
                className="rounded-xl border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold"
              >
                Start new ad
              </button>
            </div>
          </section>
        ) : null}

        {postMode !== "standard" ? (
          <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
            <p className="text-sm font-semibold">
              Quick post mode: add essentials first, then review before publishing.
            </p>
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
                if (parsed.listingType === "wanted") {
                  setListingTypeChoice("wanted");
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
              Auto-detect details
            </button>

            {smartSuggestion ? (
              <div className="mt-3 rounded-xl border border-[var(--line)] bg-white p-3 text-sm">
                <p className="font-semibold">
                  Suggested category: {suggestedCategoryLabel ?? "Other"}
                </p>
                <p className="mt-1 text-xs text-[var(--ink-2)]">
                  Confidence: {Math.round(smartSuggestion.confidence * 100)}% {smartSuggestion.reasons.length > 0 ? `(${smartSuggestion.reasons.join(", ")})` : ""}
                </p>
                <p className="mt-1 text-xs text-[var(--ink-2)]">
                  Detected listing type: {smartSuggestion.listingType === "wanted" ? "Wanted" : "For Sale"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void applySmartSuggestion()}
                    className="rounded-lg bg-[var(--ink-1)] px-3 py-2 text-xs font-semibold text-white"
                  >
                    Apply suggestion
                  </button>
                  <button
                    type="button"
                    onClick={() => setSmartSuggestion(null)}
                    className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold"
                  >
                    Dismiss
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
                <button
                  type="button"
                  onClick={() => setListingTypeChoice("wanted")}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold ${listingTypeChoice === "wanted" ? "bg-[var(--ink-1)] text-white" : "border border-[var(--line)] bg-white"}`}
                >
                  {t.postAd.wanted}
                </button>
              </div>
            </div>

            <p className="mt-3 rounded-lg bg-[var(--surface-2)] px-3 py-2 text-sm font-semibold break-words">{breadcrumb || t.postAd.categoryNotSelected}</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold sm:col-span-2">Title
                <input value={core.title} onChange={(event) => updateCore("title", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
              </label>
              <label className="text-sm font-semibold sm:col-span-2">Description
                <textarea rows={4} value={core.description} onChange={(event) => updateCore("description", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
              </label>
              <label className="text-sm font-semibold">Price
                <input type="number" min={1} value={core.price} onChange={(event) => updateCore("price", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
              </label>
              <label className="text-sm font-semibold">Currency
                <select value={core.currency} onChange={(event) => updateCore("currency", event.target.value as "AFN" | "USD")} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2">
                  {CURRENCIES.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold">Contact Phone
                <input value={core.contact_phone} onChange={(event) => updateCore("contact_phone", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
              </label>
              <label className="text-sm font-semibold">Contact Name
                <input value={core.contact_name} onChange={(event) => updateCore("contact_name", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
              </label>
              <label className="text-sm font-semibold sm:col-span-2">Contact Preferences
                <input value={core.contact_preferences} onChange={(event) => updateCore("contact_preferences", event.target.value)} placeholder={t.postAd.contactPreferencesPlaceholder} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
              </label>
              <p className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--ink-2)] sm:col-span-2">
                {t.postAd.locationMovedNote}
              </p>
            </div>

            {rootSlug === "real-estate" ? (
              <section className="mt-4 rounded-xl border border-[var(--line)] p-3">
                <h3 className="text-sm font-bold">Real Estate Details</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="text-sm font-semibold">Listing Purpose
                    <select value={String(dynamicValues.listing_purpose ?? "")} onChange={(event) => updateDynamic("listing_purpose", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" disabled={isDormitory}>
                      <option value="">Select</option>
                      <option value="For Sale">For Sale</option>
                      <option value="For Rent">For Rent</option>
                      <option value="Gerawy / Rahn">Gerawy / Rahn</option>
                      <option value="Exchange">Exchange</option>
                      <option value="Wanted">Wanted</option>
                    </select>
                  </label>
                  <label className="text-sm font-semibold">Rooms
                    <input type="number" min={0} value={String(dynamicValues.rooms ?? "")} onChange={(event) => updateDynamic("rooms", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
                  </label>
                  <label className="text-sm font-semibold">Bathrooms
                    <input type="number" min={0} value={String(dynamicValues.bathrooms ?? "")} onChange={(event) => updateDynamic("bathrooms", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
                  </label>
                  <label className="text-sm font-semibold">Property Size
                    <input value={String(dynamicValues.property_size ?? "")} onChange={(event) => updateDynamic("property_size", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
                  </label>
                  <label className="text-sm font-semibold">Land Size (optional)
                    <input value={String(dynamicValues.land_size ?? "")} onChange={(event) => updateDynamic("land_size", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
                  </label>
                  <label className="text-sm font-semibold">Document Type
                    <input value={String(dynamicValues.document_type ?? "")} onChange={(event) => updateDynamic("document_type", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
                  </label>
                  <label className="text-sm font-semibold">Owner / Agent
                    <select value={String(dynamicValues.owner_type ?? "")} onChange={(event) => updateDynamic("owner_type", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2">
                      <option value="">Select</option>
                      <option value="owner">Owner</option>
                      <option value="agent">Agent</option>
                    </select>
                  </label>

                  {showStudentSuitabilityToggle ? (
                    <section className="sm:col-span-2 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
                      <h4 className="text-sm font-bold">Student Housing</h4>
                      <label className="mt-2 block text-sm font-semibold">Is this suitable for students?</label>
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => updateDynamic("suitable_for_students", true)}
                          className={`rounded-lg border px-3 py-2 text-sm font-semibold ${suitableForStudents ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-[var(--line)]"}`}
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => updateDynamic("suitable_for_students", false)}
                          className={`rounded-lg border px-3 py-2 text-sm font-semibold ${!suitableForStudents ? "border-slate-600 bg-slate-50 text-slate-700" : "border-[var(--line)]"}`}
                        >
                          No
                        </button>
                      </div>

                      {suitableForStudents ? (
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <label className="text-sm font-semibold">Gender Suitable
                            <select value={String(dynamicValues.gender_allowed ?? "")} onChange={(event) => updateDynamic("gender_allowed", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2">
                              <option value="">Select</option>
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                              <option value="family">Family</option>
                              <option value="everyone">Everyone</option>
                            </select>
                          </label>
                          <label className="text-sm font-semibold">Distance to University (km)
                            <input type="number" min={0} step="0.1" value={String(dynamicValues.distance_to_university ?? "")} onChange={(event) => updateDynamic("distance_to_university", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
                          </label>
                          <label className="text-sm font-semibold">
                            <span className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-3 py-3">
                              <input type="checkbox" checked={Boolean(dynamicValues.furnished)} onChange={(event) => updateDynamic("furnished", event.target.checked)} className="h-4 w-4" />
                              Furnished
                            </span>
                          </label>
                          <label className="text-sm font-semibold">
                            <span className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-3 py-3">
                              <input type="checkbox" checked={Boolean(dynamicValues.shared_allowed)} onChange={(event) => updateDynamic("shared_allowed", event.target.checked)} className="h-4 w-4" />
                              Shared Allowed
                            </span>
                          </label>
                          <label className="text-sm font-semibold">Number of Students Allowed
                            <input type="number" min={1} value={String(dynamicValues.students_allowed ?? "")} onChange={(event) => updateDynamic("students_allowed", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
                          </label>
                        </div>
                      ) : null}
                    </section>
                  ) : null}

                  {isDormitory ? (
                    <section className="sm:col-span-2 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
                      <h4 className="text-sm font-bold">Dormitory Details</h4>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <label className="text-sm font-semibold">Payment Period
                          <select value={String(dynamicValues.payment_period ?? "")} onChange={(event) => updateDynamic("payment_period", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2">
                            <option value="">Select</option>
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                            <option value="semester">Semester</option>
                            <option value="daily">Daily</option>
                            <option value="other">Other</option>
                          </select>
                        </label>
                        <label className="text-sm font-semibold">Gender Allowed
                          <select value={String(dynamicValues.gender_allowed ?? "")} onChange={(event) => updateDynamic("gender_allowed", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2">
                            <option value="">Select</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="family">Family</option>
                            <option value="everyone">Everyone</option>
                          </select>
                        </label>
                        <label className="text-sm font-semibold">Room Type
                          <select value={String(dynamicValues.room_type ?? "")} onChange={(event) => updateDynamic("room_type", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2">
                            <option value="">Select</option>
                            <option value="Single Room">Single Room</option>
                            <option value="Shared Room">Shared Room</option>
                            <option value="Private Room">Private Room</option>
                            <option value="Bed Space">Bed Space</option>
                            <option value="Other">Other</option>
                          </select>
                        </label>
                        <label className="text-sm font-semibold">Number of Beds
                          <input type="number" min={0} value={String(dynamicValues.number_of_beds ?? "")} onChange={(event) => updateDynamic("number_of_beds", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
                        </label>
                        <label className="text-sm font-semibold">
                          <span className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-3 py-3">
                            <input type="checkbox" checked={Boolean(dynamicValues.meals_included)} onChange={(event) => updateDynamic("meals_included", event.target.checked)} className="h-4 w-4" />
                            Meals Included
                          </span>
                        </label>
                        <label className="text-sm font-semibold">
                          <span className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-3 py-3">
                            <input type="checkbox" checked={Boolean(dynamicValues.water)} onChange={(event) => updateDynamic("water", event.target.checked)} className="h-4 w-4" />
                            Water
                          </span>
                        </label>
                        <label className="text-sm font-semibold">
                          <span className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-3 py-3">
                            <input type="checkbox" checked={Boolean(dynamicValues.electricity)} onChange={(event) => updateDynamic("electricity", event.target.checked)} className="h-4 w-4" />
                            Electricity
                          </span>
                        </label>
                        <label className="text-sm font-semibold">
                          <span className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-3 py-3">
                            <input type="checkbox" checked={Boolean(dynamicValues.internet)} onChange={(event) => updateDynamic("internet", event.target.checked)} className="h-4 w-4" />
                            Internet
                          </span>
                        </label>
                        <label className="text-sm font-semibold">
                          <span className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-3 py-3">
                            <input type="checkbox" checked={Boolean(dynamicValues.heating)} onChange={(event) => updateDynamic("heating", event.target.checked)} className="h-4 w-4" />
                            Heating
                          </span>
                        </label>
                        <label className="text-sm font-semibold">
                          <span className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-3 py-3">
                            <input type="checkbox" checked={Boolean(dynamicValues.air_conditioning)} onChange={(event) => updateDynamic("air_conditioning", event.target.checked)} className="h-4 w-4" />
                            Air Conditioning
                          </span>
                        </label>
                        <label className="text-sm font-semibold">
                          <span className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-3 py-3">
                            <input type="checkbox" checked={Boolean(dynamicValues.security)} onChange={(event) => updateDynamic("security", event.target.checked)} className="h-4 w-4" />
                            Security
                          </span>
                        </label>
                        <label className="text-sm font-semibold">Distance to University (km)
                          <input type="number" min={0} step="0.1" value={String(dynamicValues.distance_to_university ?? "")} onChange={(event) => updateDynamic("distance_to_university", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
                        </label>
                        <label className="text-sm font-semibold sm:col-span-2">Rules (optional)
                          <input value={String(dynamicValues.rules ?? "")} onChange={(event) => updateDynamic("rules", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
                        </label>
                      </div>
                    </section>
                  ) : null}

                  {isStudentCollection ? (
                    <section className="sm:col-span-2 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
                      <h4 className="text-sm font-bold">Student Housing Collection Details</h4>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <label className="text-sm font-semibold">Property Type
                          <select value={String(dynamicValues.student_housing_type ?? "")} onChange={(event) => updateDynamic("student_housing_type", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2">
                            <option value="">Select</option>
                            <option value="house">House</option>
                            <option value="apartment">Apartment</option>
                            <option value="room">Room</option>
                            <option value="dormitory">Dormitory</option>
                          </select>
                        </label>
                        <label className="text-sm font-semibold">Gender Suitable
                          <select value={String(dynamicValues.gender_allowed ?? "")} onChange={(event) => updateDynamic("gender_allowed", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2">
                            <option value="">Select</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="family">Family</option>
                            <option value="everyone">Everyone</option>
                          </select>
                        </label>
                        <label className="text-sm font-semibold">Distance to University (km)
                          <input type="number" min={0} step="0.1" value={String(dynamicValues.distance_to_university ?? "")} onChange={(event) => updateDynamic("distance_to_university", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
                        </label>
                        <label className="text-sm font-semibold">
                          <span className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-3 py-3">
                            <input type="checkbox" checked={Boolean(dynamicValues.furnished)} onChange={(event) => updateDynamic("furnished", event.target.checked)} className="h-4 w-4" />
                            Furnished
                          </span>
                        </label>
                      </div>
                    </section>
                  ) : null}
                </div>
              </section>
            ) : null}

            {rootSlug === "vehicles" ? (
              <section className="mt-4 space-y-4 rounded-xl border border-[var(--line)] p-3">
                <h3 className="text-sm font-bold">Vehicle Details</h3>
                <VehicleSmartSelector categoryNodeId={finalNode?.id ?? 0} onChange={setVehicleSelection} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-sm font-semibold">Brand
                    <input value={String(dynamicValues.brand ?? "")} onChange={(event) => updateDynamic("brand", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
                  </label>
                  <label className="text-sm font-semibold">Model
                    <input value={String(dynamicValues.model ?? "")} onChange={(event) => updateDynamic("model", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
                  </label>
                  <label className="text-sm font-semibold">Year
                    <input type="number" value={String(dynamicValues.year ?? "")} onChange={(event) => updateDynamic("year", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
                  </label>
                  <label className="text-sm font-semibold">KM
                    <input type="number" value={String(dynamicValues.km ?? dynamicValues.mileage ?? "")} onChange={(event) => updateDynamic("km", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
                  </label>
                  <label className="text-sm font-semibold">Fuel Type
                    <input value={String(dynamicValues.fuel_type ?? "")} onChange={(event) => updateDynamic("fuel_type", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
                  </label>
                  <label className="text-sm font-semibold">Transmission
                    <input value={String(dynamicValues.transmission ?? "")} onChange={(event) => updateDynamic("transmission", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
                  </label>
                  <label className="text-sm font-semibold">Condition
                    <input value={String(dynamicValues.condition ?? "")} onChange={(event) => updateDynamic("condition", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
                  </label>
                  <label className="text-sm font-semibold">Plate Status
                    <input value={String(dynamicValues.plate_status ?? "")} onChange={(event) => updateDynamic("plate_status", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
                  </label>
                </div>
                <div>
                  <p className="mb-2 text-sm font-semibold">Damage / Paint Report</p>
                  <VehicleDamageDiagram value={damageParts} onChange={setDamageParts} />
                </div>
              </section>
            ) : null}

            {(rootSlug === "mobile-phones-tablets" || rootSlug === "electronics-computers") ? (
              <section className="mt-4 rounded-xl border border-[var(--line)] p-3">
                <h3 className="text-sm font-bold">Phones & Electronics Details</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="text-sm font-semibold">Brand
                    <input value={String(dynamicValues.brand ?? "")} onChange={(event) => updateDynamic("brand", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
                  </label>
                  <label className="text-sm font-semibold">Model
                    <input value={String(dynamicValues.model ?? "")} onChange={(event) => updateDynamic("model", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
                  </label>
                  <label className="text-sm font-semibold">Storage
                    <input value={String(dynamicValues.storage ?? "")} onChange={(event) => updateDynamicPair("storage", "electronics_storage", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
                  </label>
                  <label className="text-sm font-semibold">RAM (optional)
                    <input value={String(dynamicValues.ram ?? "")} onChange={(event) => updateDynamicPair("ram", "electronics_ram", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
                  </label>
                  <label className="text-sm font-semibold">Condition
                    <input value={String(dynamicValues.condition ?? "")} onChange={(event) => updateDynamicPair("condition", "electronics_condition", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
                  </label>
                  <label className="text-sm font-semibold">Warranty
                    <input value={String(dynamicValues.warranty ?? "")} onChange={(event) => updateDynamicPair("warranty", "electronics_warranty", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
                  </label>
                  <label className="text-sm font-semibold">Battery Health / Capacity
                    <input value={String(dynamicValues.battery_health ?? "")} onChange={(event) => updateDynamicPair("battery_health", "electronics_battery_health", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
                  </label>
                  <label className="text-sm font-semibold">Box / Carton Available
                    <select value={String(dynamicValues.box_available ?? "")} onChange={(event) => updateDynamicPair("box_available", "electronics_box_included", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2">
                      <option value="">Select</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </label>
                  <label className="text-sm font-semibold">Registered Status
                    <input value={String(dynamicValues.registered_status ?? "")} onChange={(event) => updateDynamicPair("registered_status", "electronics_network_registered", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
                  </label>
                  <label className="text-sm font-semibold">SIM Lock / Bypass
                    <input value={String(dynamicValues.sim_lock_bypass ?? "")} onChange={(event) => updateDynamic("sim_lock_bypass", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
                  </label>
                  <label className="text-sm font-semibold">Fingerprint Works
                    <select value={String(dynamicValues.fingerprint_works ?? "")} onChange={(event) => updateDynamic("fingerprint_works", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2">
                      <option value="">Select</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </label>
                  <label className="text-sm font-semibold">Face ID Works
                    <select value={String(dynamicValues.face_id_works ?? "")} onChange={(event) => updateDynamic("face_id_works", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2">
                      <option value="">Select</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </label>
                  <label className="text-sm font-semibold">Camera Works
                    <select value={String(dynamicValues.camera_works ?? "")} onChange={(event) => updateDynamic("camera_works", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2">
                      <option value="">Select</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </label>
                  <label className="text-sm font-semibold">Charger Included
                    <select value={String(dynamicValues.charger_included ?? "")} onChange={(event) => updateDynamicPair("charger_included", "electronics_charger_included", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2">
                      <option value="">Select</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </label>
                  <label className="text-sm font-semibold">IMEI / Registration
                    <input value={String(dynamicValues.imei_status ?? "")} onChange={(event) => updateDynamic("imei_status", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
                  </label>
                  <label className="text-sm font-semibold">Price Type
                    <select value={String(dynamicValues.price_type ?? "")} onChange={(event) => updateDynamic("price_type", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2">
                      <option value="">Select</option>
                      <option value="fixed">Fixed</option>
                      <option value="negotiable">Negotiable</option>
                      <option value="contact">Contact</option>
                    </select>
                  </label>
                  <label className="text-sm font-semibold">Exchange Accepted
                    <select value={String(dynamicValues.exchange_accepted ?? "")} onChange={(event) => updateDynamic("exchange_accepted", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2">
                      <option value="">Select</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </label>
                </div>
              </section>
            ) : null}

            {rootSlug === "second-hand-items" ? (
              <section className="mt-4 rounded-xl border border-[var(--line)] p-3">
                <h3 className="text-sm font-bold">Second Hand Details</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="text-sm font-semibold">Item Type
                    <input value={String(dynamicValues.item_type ?? "")} onChange={(event) => updateDynamic("item_type", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
                  </label>
                  <label className="text-sm font-semibold">Condition
                    <input value={String(dynamicValues.condition ?? "")} onChange={(event) => updateDynamic("condition", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
                  </label>
                  <label className="text-sm font-semibold">Brand (optional)
                    <input value={String(dynamicValues.brand ?? "")} onChange={(event) => updateDynamic("brand", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
                  </label>
                </div>
              </section>
            ) : null}

            {renderDynamicFields.length > 0 ? (
              <section className="mt-4 rounded-xl border border-[var(--line)] p-3">
                <h3 className="text-sm font-bold">Additional Category Fields</h3>
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
                            <option value="">Select</option>
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
                  })}
                </div>
              </section>
            ) : null}

            <label className="mt-4 flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={core.rulesAccepted} onChange={(event) => updateCore("rulesAccepted", event.target.checked)} className="h-4 w-4" />
              I confirm this listing follows Sahibash rules.
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
                <p className="text-sm font-bold">Use Previous Location</p>
                <p className="mt-1 text-xs text-[var(--ink-2)]">Apply your last used province/district</p>
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
