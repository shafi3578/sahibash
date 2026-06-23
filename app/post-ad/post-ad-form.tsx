"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { createListingAction, uploadListingImageAction } from "@/lib/actions/listings";
import { AFGHAN_PROVINCES, CITIES, CURRENCIES } from "@/lib/constants/marketplace";
import type { Category, CategoryField, CategoryNode } from "@/types/database";
import { VehicleSmartSelector, type VehicleSelection } from "@/components/vehicles/VehicleSmartSelector";
import { VehicleDamageDiagram, defaultDamageParts, type DamagePart } from "@/components/vehicles/VehicleDamageDiagram";
import { VehicleFeaturesChecklist } from "@/components/vehicles/VehicleFeaturesChecklist";

type Props = { categories: Category[] };

type StagedImage = { file: File; previewUrl: string; isPrimary: boolean };

type AiSuggestion = {
  rootSlug: "real-estate" | "vehicles" | "mobile-phones-tablets" | "electronics-computers" | "home-furniture-appliances" | "clothing-personal-items" | "jobs" | "services" | "business-industry" | "farm-animals" | "education" | "sports-hobbies" | "other";
  pathSlugs: string[];
  label: string;
  reason: string;
  confidence: number;
};

type SuggestedProduct = {
  categoryNodeId: number;
  categoryPath: string;
  brand: string;
  model: string;
};

type ProductSpecChoice = {
  category_node_id: number;
  brand: string;
  model: string;
  specs: Record<string, unknown>;
};

type AiResponse = {
  suggestion: AiSuggestion | null;
  suggestedProduct: SuggestedProduct | null;
  suggestedSpecs: Record<string, unknown> | null;
  labels: Array<{ label: string; score: number }>;
  lowConfidence: boolean;
  message: string | null;
};

type Step = 1 | 2 | 3 | 4 | 5 | 6;

const MIN_VEHICLE_YEAR = 1950;
const MAX_VEHICLE_YEAR = new Date().getFullYear() + 1;

type CoreForm = {
  title: string;
  description: string;
  province: string;
  city: string;
  district: string;
  address_optional: string;
  contact_phone: string;
  contact_name: string;
  rulesAccepted: boolean;
  delivery_preference: string;
  meeting_preference: string;
  owner_agent: string;
  available_for_viewing: boolean;
  seller_type: string;
  exchange_available: boolean;
  price: string;
  currency: "AFN" | "USD";
  negotiable: boolean;
  minimum_offer: string;
};

const CORE_KEYS = new Set([
  "title",
  "description",
  "price",
  "currency",
  "province",
  "city",
  "district",
  "address_optional",
  "contact_name",
  "contact_phone",
  "negotiable",
  "minimum_offer",
  "delivery_preference",
  "meeting_preference",
]);

const VEHICLE_MANAGED_FIELD_KEYS = new Set([
  "year",
  "mileage",
  "color",
  "vehicle_status",
  "warranty",
  "salvage_record",
  "plate_status",
  "seller_type",
  "exchange_available",
  "neighborhood",
  "video_url",
]);

function fieldOptions(optionsJson: Record<string, unknown> | string[] | null) {
  if (!optionsJson) return [];
  if (Array.isArray(optionsJson)) return optionsJson.map((v) => String(v));
  return Object.values(optionsJson).map((v) => String(v));
}

function fieldGroupLabel(groupKey?: string | null) {
  switch (groupKey) {
    case "property_details":
      return "Property Details";
    case "category_specific":
      return "Category Specific";
    case "interior_features":
      return "Interior Features";
    case "exterior_features":
      return "Exterior Features";
    case "location_nearby":
      return "Location & Nearby Places";
    case "transportation":
      return "Transportation";
    case "view":
      return "View";
    case "utilities":
      return "Utilities";
    default:
      return "Other";
  }
}

function seriesFromProductSpec(spec: ProductSpecChoice) {
  return typeof spec.specs.series === "string" ? spec.specs.series : "";
}

function extractLockedSpecs(specs: Record<string, unknown>) {
  const locked: Record<string, string | number | boolean> = {};

  for (const [key, value] of Object.entries(specs)) {
    if (key.endsWith("_options")) continue;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      locked[key] = value;
    }
  }

  return locked;
}

function labelForLockedSpec(key: string) {
  const labels: Record<string, string> = {
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

  return labels[key] ?? key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function PostAdForm({ categories }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  const [step, setStep] = useState<Step>(1);
  const [stepError, setStepError] = useState<string | null>(null);

  const [images, setImages] = useState<StagedImage[]>([]);
  const [selectedRoot, setSelectedRoot] = useState<Category | null>(null);
  const [pathNodes, setPathNodes] = useState<CategoryNode[]>([]);
  const [currentOptions, setCurrentOptions] = useState<CategoryNode[]>([]);
  const [finalNode, setFinalNode] = useState<CategoryNode | null>(null);
  const [dynamicFields, setDynamicFields] = useState<CategoryField[]>([]);
  const [loadingTree, setLoadingTree] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSpecOptions, setProductSpecOptions] = useState<ProductSpecChoice[]>([]);
  const [selectedSeries, setSelectedSeries] = useState("");
  const [selectedProductModel, setSelectedProductModel] = useState("");
  const [lockedSpecs, setLockedSpecs] = useState<Record<string, string | number | boolean>>({});

  // Vehicle-specific state
  const [vehicleSelection, setVehicleSelection] = useState<VehicleSelection>({ brand: null, series: null, model: null, generation: null, variant: null, specs: [] });
  const [damageParts, setDamageParts] = useState<DamagePart[]>(defaultDamageParts());
  const [selectedVehicleFeatureIds, setSelectedVehicleFeatureIds] = useState<number[]>([]);

  const [aiResult, setAiResult] = useState<AiResponse | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [core, setCore] = useState<CoreForm>({
    title: "",
    description: "",
    province: "",
    city: "",
    district: "",
    address_optional: "",
    contact_phone: "",
    contact_name: "",
    rulesAccepted: false,
    delivery_preference: "",
    meeting_preference: "",
    owner_agent: "",
    available_for_viewing: false,
    seller_type: "",
    exchange_available: false,
    price: "",
    currency: "AFN",
    negotiable: false,
    minimum_offer: "",
  });

  const [dynamicValues, setDynamicValues] = useState<Record<string, string | boolean>>({});

  const breadcrumb = useMemo(() => pathNodes.map((n) => n.name).join(" > "), [pathNodes]);
  const rootSlug = selectedRoot?.slug ?? "";
  const manualVehicleMode = rootSlug === "vehicles" && Boolean(dynamicValues.vehicle_is_manual);
  const resolvedVehicleYear = Number(String(dynamicValues.vehicle_year ?? dynamicValues.year ?? ""));
  const classicVehicleMode = Number.isFinite(resolvedVehicleYear) && resolvedVehicleYear < 2000;

  const seriesOptions = useMemo(() => {
    return Array.from(new Set(productSpecOptions.map(seriesFromProductSpec).filter(Boolean)));
  }, [productSpecOptions]);

  const filteredProductSpecOptions = useMemo(() => {
    if (!selectedSeries) return productSpecOptions;
    return productSpecOptions.filter((spec) => seriesFromProductSpec(spec) === selectedSeries);
  }, [productSpecOptions, selectedSeries]);

  const selectedProductSpec = useMemo(() => {
    if (!selectedProductModel) {
      return filteredProductSpecOptions.length === 1 ? filteredProductSpecOptions[0] : null;
    }

    return filteredProductSpecOptions.find((spec) => spec.model === selectedProductModel) ?? null;
  }, [filteredProductSpecOptions, selectedProductModel]);

  const visibleFields = useMemo(() => {
    return dynamicFields
      .filter((field) => !CORE_KEYS.has(field.field_key))
      .filter((field) => !(rootSlug === "vehicles" && VEHICLE_MANAGED_FIELD_KEYS.has(field.field_key)))
      .filter((field) => {
        const vehicleLockedSpecKeys = new Set(
          vehicleSelection.specs.filter((spec) => spec.is_locked).map((spec) => spec.spec_key)
        );
        return !(field.field_key in lockedSpecs) && !vehicleLockedSpecKeys.has(field.field_key);
      })
      .filter((field) => {
        const rules = field.visibility_rules;
        if (!rules || Array.isArray(rules)) return true;

        const rentalTypeRules = rules.rental_types;
        if (Array.isArray(rentalTypeRules) && rentalTypeRules.length > 0) {
          const selected = String(dynamicValues.rental_type ?? "");
          return selected.length > 0 && rentalTypeRules.some((value) => String(value) === selected);
        }

        return true;
      });
  }, [dynamicFields, dynamicValues.rental_type, lockedSpecs, rootSlug, vehicleSelection.specs]);

  const fieldsByGroup = useMemo(() => {
    const groups: Record<string, CategoryField[]> = {};
    for (const field of visibleFields) {
      const group = field.group_key ?? "other";
      if (!groups[group]) groups[group] = [];
      groups[group].push(field);
    }
    return groups;
  }, [visibleFields]);

  const previewSummary = useMemo(
    () => ({
      photos: images.length,
      category: breadcrumb || "Not selected",
      title: core.title || "-",
      description: core.description ? `${core.description.slice(0, 180)}${core.description.length > 180 ? "..." : ""}` : "-",
      location: core.province ? `${core.province}${core.city ? `, ${core.city}` : ""}` : "-",
      contact: core.contact_phone || "-",
      price: core.price ? `${core.price} ${core.currency}` : "-",
    }),
    [images.length, breadcrumb, core]
  );

  const selectedRentalType = String(dynamicValues.rental_type ?? "");
  const isRealEstate = rootSlug === "real-estate";
  const isGerawyType = selectedRentalType === "Gerawy / Rahn" || selectedRentalType === "Gerawy + Monthly Rent";

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
      .limit(1)
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

    if (!orderedBySort.error) {
      setDynamicFields((orderedBySort.data as CategoryField[]) ?? []);
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

  function resetSmartProductState() {
    setProductSpecOptions([]);
    setSelectedSeries("");
    setSelectedProductModel("");
    setLockedSpecs({});
  }

  function applyProductSpecSelection(spec: ProductSpecChoice | null) {
    if (!spec) {
      setSelectedProductModel("");
      setLockedSpecs({});
      return;
    }

    setSelectedProductModel(spec.model);
    const series = seriesFromProductSpec(spec);
    if (series) {
      setSelectedSeries(series);
    }
    setLockedSpecs(extractLockedSpecs(spec.specs));
  }

  async function fetchProductSpecs(categoryNodeId: number) {
    setLoadingProducts(true);
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase
      .from("product_specs")
      .select("category_node_id, brand, model, specs")
      .eq("category_node_id", categoryNodeId)
      .eq("is_active", true)
      .order("brand", { ascending: true })
      .order("model", { ascending: true });

    const options = (data as ProductSpecChoice[]) ?? [];
    setProductSpecOptions(options);

    if (options.length === 0) {
      resetSmartProductState();
      setLoadingProducts(false);
      return;
    }

    const suggested = aiResult?.suggestedProduct
      ? options.find((option) => option.brand === aiResult.suggestedProduct?.brand && option.model === aiResult.suggestedProduct?.model)
      : null;

    if (suggested) {
      applyProductSpecSelection(suggested);
    } else if (options.length === 1) {
      applyProductSpecSelection(options[0]);
    } else {
      setSelectedSeries("");
      setSelectedProductModel("");
      setLockedSpecs({});
    }

    setLoadingProducts(false);
  }

  function fieldOptionsForRender(field: CategoryField) {
    if (field.field_key === "storage" && selectedProductSpec) {
      const values = selectedProductSpec.specs.storage_options;
      if (Array.isArray(values)) {
        return values.map((value) => String(value));
      }
    }

    if (field.field_key === "ram" && selectedProductSpec) {
      const values = selectedProductSpec.specs.ram_options;
      if (Array.isArray(values)) {
        return values.map((value) => String(value));
      }
    }

    return fieldOptions(field.options_json);
  }

  async function chooseRoot(category: Category) {
    setLoadingTree(true);
    setSelectedRoot(category);
    setFinalNode(null);
    setDynamicFields([]);
    setDynamicValues({});
    setSelectedVehicleFeatureIds([]);
    setVehicleSelection({ brand: null, series: null, model: null, generation: null, variant: null, specs: [] });
    setDamageParts(defaultDamageParts());
    resetSmartProductState();

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
      await Promise.all([fetchFields(root.id), fetchProductSpecs(root.id)]);
    }

    setLoadingTree(false);
  }

  async function chooseNode(node: CategoryNode) {
    setLoadingTree(true);
    const nextPath = [...pathNodes, node];
    const children = await fetchChildren(node.id);

    setPathNodes(nextPath);
    setCurrentOptions(children);

    if (children.length === 0) {
      setFinalNode(node);
      setDynamicValues({});
      setSelectedVehicleFeatureIds([]);
      setVehicleSelection({ brand: null, series: null, model: null, generation: null, variant: null, specs: [] });
      setDamageParts(defaultDamageParts());
      await Promise.all([fetchFields(node.id), fetchProductSpecs(node.id)]);
    } else {
      setFinalNode(null);
      setDynamicFields([]);
      setSelectedVehicleFeatureIds([]);
      setVehicleSelection({ brand: null, series: null, model: null, generation: null, variant: null, specs: [] });
      setDamageParts(defaultDamageParts());
      resetSmartProductState();
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
      setDynamicValues({});
      setSelectedVehicleFeatureIds([]);
      setVehicleSelection({ brand: null, series: null, model: null, generation: null, variant: null, specs: [] });
      setDamageParts(defaultDamageParts());
      resetSmartProductState();
      return;
    }

    const next = pathNodes.slice(0, -1);
    const parent = next[next.length - 1];
    setPathNodes(next);
    setFinalNode(null);
    setDynamicFields([]);
    setDynamicValues({});
    setSelectedVehicleFeatureIds([]);
    setVehicleSelection({ brand: null, series: null, model: null, generation: null, variant: null, specs: [] });
    setDamageParts(defaultDamageParts());
    resetSmartProductState();

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

  function onPickFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    const next = files.map((file, index) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      isPrimary: images.length === 0 && index === 0,
    }));
    setImages((prev) => [...prev, ...next].slice(0, 10));

    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function setPrimary(index: number) {
    setImages((prev) => prev.map((img, i) => ({ ...img, isPrimary: i === index })));
  }

  function removeImage(index: number) {
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length > 0 && !next.some((img) => img.isPrimary)) next[0] = { ...next[0], isPrimary: true };
      return next;
    });
  }

  const runAiDetection = useCallback(async () => {
    const primary = images.find((image) => image.isPrimary) ?? images[0];
    if (!primary && !core.title && !core.description) {
      setStepError("Add a photo or write title/description before AI detection.");
      return;
    }

    setIsDetecting(true);
    setStepError(null);

    try {
      const body = new FormData();
      if (primary) body.append("image", primary.file);
      body.append("title", core.title);
      body.append("description", core.description);

      const response = await fetch("/api/ai/category-suggestion", {
        method: "POST",
        body,
      });

      const payload = (await response.json()) as AiResponse;
      setAiResult(payload);

      if (payload.suggestedSpecs) {
        const prefill: Record<string, string | boolean> = {};
        for (const [key, value] of Object.entries(payload.suggestedSpecs)) {
          if (typeof value === "string" || typeof value === "boolean") {
            prefill[key] = value;
          }
        }
        setDynamicValues((prev) => ({ ...prefill, ...prev }));
      }
    } catch {
      setAiResult(null);
    } finally {
      setIsDetecting(false);
    }
  }, [images, core.title, core.description]);

  useEffect(() => {
    if (step !== 2 || isDetecting || aiResult) return;

    const primary = images.find((image) => image.isPrimary) ?? images[0];
    if (!primary && !core.title && !core.description) return;

    const timer = setTimeout(() => {
      void runAiDetection();
    }, 0);

    return () => clearTimeout(timer);
  }, [step, isDetecting, aiResult, images, core.title, core.description, runAiDetection]);

  async function applyAiCategorySuggestion() {
    if (!aiResult?.suggestion) return;
    const suggestion = aiResult.suggestion;

    const root = categories.find((category) => category.slug === suggestion.rootSlug);
    if (!root) return;

    await chooseRoot(root);
    const rootNode = await fetchRootNode(root.id);
    if (!rootNode) return;

    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase
      .from("category_nodes")
      .select("*")
      .eq("category_id", root.id)
      .eq("is_active", true)
      .in("slug", suggestion.pathSlugs);

    const bySlug = new Map(((data as CategoryNode[]) ?? []).map((node) => [node.slug, node]));
    let current: CategoryNode | null = rootNode;
    const resolved = current ? [current] : [];

    for (let i = 1; i < suggestion.pathSlugs.length; i += 1) {
      const candidate = bySlug.get(suggestion.pathSlugs[i]);
      if (!candidate) break;
      if (current && candidate.parent_id !== current.id) break;
      resolved.push(candidate);
      current = candidate;
    }

    if (resolved.length > 1) {
      setPathNodes(resolved);
      const maybeFinal = resolved[resolved.length - 1];
      const children = await fetchChildren(maybeFinal.id);
      setCurrentOptions(children);
      if (children.length === 0) {
        setFinalNode(maybeFinal);
        await Promise.all([fetchFields(maybeFinal.id), fetchProductSpecs(maybeFinal.id)]);
      }
    }
  }

  function validateStep(currentStep: Step) {
    if (currentStep === 1) {
      if (images.length === 0) return "Please upload at least one photo.";
      if (core.title.trim().length < 5) return "Title must be at least 5 characters.";
      if (core.description.trim().length < 20) return "Description must be at least 20 characters.";
      if (!core.province) return "Required field: province.";
      if (!core.city) return "Required field: city.";
      if (!core.contact_phone) return "Required field: contact phone.";
      if (!core.rulesAccepted) return "You must accept the posting rules to continue.";
      return null;
    }

    if (currentStep === 2) {
      if (!finalNode) return "Select a final category to continue.";
      return null;
    }

    if (currentStep === 3) {
      // Vehicle: require variant selected
      if (rootSlug === "vehicles" && finalNode) {
        const isManualVehicle = Boolean(dynamicValues.vehicle_is_manual);
        const yearValue = String(isManualVehicle ? dynamicValues.vehicle_year ?? "" : dynamicValues.year ?? "").trim();

        if (!isManualVehicle && !vehicleSelection.variant) {
          return "Select a vehicle variant to continue.";
        }

        if (!yearValue) return "Required field: Year.";
        const numericYear = Number(yearValue);
        if (!Number.isFinite(numericYear) || numericYear < MIN_VEHICLE_YEAR || numericYear > MAX_VEHICLE_YEAR) {
          return `Year must be between ${MIN_VEHICLE_YEAR} and ${MAX_VEHICLE_YEAR}.`;
        }

        if (!String(dynamicValues.mileage ?? "").trim()) return "Required field: KM.";
        if (!String(dynamicValues.vehicle_status ?? "").trim()) return "Required field: Vehicle Status.";
        if (isManualVehicle && !String(dynamicValues.vehicle_type ?? "").trim()) {
          return "Required field: Vehicle Type (manual mode).";
        }
      }
      if (productSpecOptions.length > 0 && !selectedProductSpec) return "Select a model to continue.";
      const missingRequired = visibleFields.find(
        (field) => field.is_required && !String(dynamicValues[field.field_key] ?? "").trim()
      );
      if (missingRequired) return `Required field: ${missingRequired.field_label}.`;
      return null;
    }

    if (currentStep === 5) {
      if (!core.price || Number(core.price) <= 0) return "Required field: valid price.";
      return null;
    }

    return null;
  }

  function goNext() {
    setStepError(null);
    const validationError = validateStep(step);
    if (validationError) {
      setStepError(validationError);
      return;
    }

    if (step < 6) {
      setStep((prev) => (prev + 1) as Step);
    }
  }

  function goPrev() {
    setStepError(null);
    if (step > 1) setStep((prev) => (prev - 1) as Step);
  }

  async function onPublish() {
    setError(null);
    setStepError(null);

    const step1Error = validateStep(1);
    const step2Error = validateStep(2);
    const step3Error = validateStep(3);
    const step5Error = validateStep(5);
    if (step1Error || step2Error || step3Error || step5Error) {
      setError(step1Error || step2Error || step3Error || step5Error || "Please complete required fields.");
      return;
    }

    if (!selectedRoot || !finalNode) {
      setError("Category is required.");
      return;
    }

    const form = new FormData();
    form.set("title", core.title);
    form.set("description", core.description);
    form.set("category_id", String(selectedRoot.id));
    form.set("category_node_id", String(finalNode.id));
    form.set("subcategory_id", String(finalNode.id));
    form.set("price", core.price);
    form.set("currency", core.currency);
    form.set("city", core.city);
    form.set("province", core.province);
    form.set("district", core.district);
    form.set("address_optional", core.address_optional);
    form.set("contact_phone", core.contact_phone);
    form.set("contact_name", core.contact_name);
    form.set("delivery_preference", core.delivery_preference);
    form.set("meeting_preference", core.meeting_preference);
    form.set("negotiable", core.negotiable ? "true" : "false");
    if (core.minimum_offer) form.set("minimum_offer", core.minimum_offer);

    for (const [key, value] of Object.entries(dynamicValues)) {
      if (typeof value === "boolean") {
        if (value) form.set(key, "true");
      } else if (String(value).trim()) {
        form.set(key, String(value));
      }
    }

    if (selectedProductSpec) {
      form.set("selected_product_brand", selectedProductSpec.brand);
      const selectedSeriesLabel = seriesFromProductSpec(selectedProductSpec);
      if (selectedSeriesLabel) form.set("selected_product_series", selectedSeriesLabel);
      form.set("selected_product_model", selectedProductSpec.model);
    }

    if (Object.keys(lockedSpecs).length > 0) {
      form.set("locked_specs_json", JSON.stringify(lockedSpecs));
    }

    if (rootSlug === "vehicles") {
      const vehicleYear = String(dynamicValues.vehicle_year ?? dynamicValues.year ?? "").trim();
      const manualSpecs = {
        motorcycle_class: String(dynamicValues.manual__motorcycle_class ?? "").trim(),
        engine_cc: String(dynamicValues.manual__engine_cc ?? "").trim(),
        rickshaw_fuel_type: String(dynamicValues.manual__rickshaw_fuel_type ?? "").trim(),
        passenger_capacity: String(dynamicValues.manual__passenger_capacity ?? "").trim(),
        cargo_capacity: String(dynamicValues.manual__cargo_capacity ?? "").trim(),
        gear_type: String(dynamicValues.manual__gear_type ?? "").trim(),
        frame_type: String(dynamicValues.manual__frame_type ?? "").trim(),
        brake_type: String(dynamicValues.manual__brake_type ?? "").trim(),
        original_engine: Boolean(dynamicValues.manual__original_engine),
        engine_swapped: Boolean(dynamicValues.manual__engine_swapped),
        restored: Boolean(dynamicValues.manual__restored),
        needs_restoration: Boolean(dynamicValues.manual__needs_restoration),
        imported: Boolean(dynamicValues.manual__imported),
        documents_available: Boolean(dynamicValues.manual__documents_available),
        custom_modification: Boolean(dynamicValues.manual__custom_modification),
      };

      form.set("vehicle_type", String(dynamicValues.vehicle_type ?? ""));
      form.set("vehicle_subtype", String(dynamicValues.vehicle_subtype ?? ""));
      form.set("vehicle_brand", String(dynamicValues.vehicle_brand ?? ""));
      form.set("vehicle_model", String(dynamicValues.vehicle_model ?? ""));
      form.set("vehicle_year", vehicleYear);
      form.set("vehicle_is_manual", manualVehicleMode ? "true" : "false");
      form.set("vehicle_is_classic", classicVehicleMode ? "true" : "false");
      form.set("vehicle_is_custom", Boolean(dynamicValues.vehicle_is_custom) ? "true" : "false");
      form.set("vehicle_manual_specs_json", JSON.stringify(manualSpecs));
    }

    // Vehicle smart posting payload
    if (rootSlug === "vehicles" && vehicleSelection.variant) {
      form.set("vehicle_variant_id", String(vehicleSelection.variant.id));
      form.set("year", String(dynamicValues.year ?? ""));
      form.set("mileage", String(dynamicValues.mileage ?? ""));
      form.set("color", String(dynamicValues.color ?? ""));
      form.set("vehicle_status", String(dynamicValues.vehicle_status ?? ""));
      form.set("warranty", String(dynamicValues.warranty ?? ""));
      form.set("salvage_record", String(dynamicValues.salvage_record ?? ""));
      form.set("plate_status", String(dynamicValues.plate_status ?? ""));
      form.set("neighborhood", String(dynamicValues.neighborhood ?? ""));
      form.set("video_url", String(dynamicValues.video_url ?? ""));
      form.set("vehicle_features_json", JSON.stringify(selectedVehicleFeatureIds));
      const vehicleLockedSpecs: Record<string, string> = {};
      for (const spec of vehicleSelection.specs) {
        if (spec.is_locked) vehicleLockedSpecs[spec.spec_key] = spec.spec_value;
      }
      if (Object.keys(vehicleLockedSpecs).length > 0) {
        form.set("locked_specs_json", JSON.stringify(vehicleLockedSpecs));
      }
      // Damage report
      const nonOriginal = damageParts.filter((p) => p.condition !== "original");
      form.set("damage_all_original", nonOriginal.length === 0 ? "true" : "false");
      form.set("damage_parts_json", JSON.stringify(damageParts));
    }

    if (rootSlug === "vehicles" && !vehicleSelection.variant) {
      form.set("year", String(dynamicValues.year ?? dynamicValues.vehicle_year ?? ""));
      form.set("vehicle_features_json", JSON.stringify(selectedVehicleFeatureIds));
      const nonOriginal = damageParts.filter((p) => p.condition !== "original");
      form.set("damage_all_original", nonOriginal.length === 0 ? "true" : "false");
      form.set("damage_parts_json", JSON.stringify(damageParts));
    }

    // Additional step-4 specific fields
    if (core.owner_agent) form.set("owner_agent", core.owner_agent);
    if (core.available_for_viewing) form.set("available_for_viewing", "true");
    if (core.seller_type) form.set("seller_type", core.seller_type);
    if (core.exchange_available) form.set("exchange_available", "true");

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

      setStatus("Listing created. Redirecting...");
      const destination = `/listings/${created.listingId}/manage`;
      router.push(destination);
      router.refresh();
      window.location.assign(destination);
    });
  }

  return (
    <div className="relative pb-28">
      <div className="sticky top-0 z-10 rounded-2xl bg-sky-700 px-4 py-3 text-white">
        <p className="text-xs font-semibold uppercase tracking-wide">Post Ad</p>
        <p className="text-sm">Step {step} of 6</p>
      </div>

      <div className="mt-4 space-y-4">
        {step === 1 ? (
          <section className="rounded-2xl border border-[var(--line)] bg-white p-4">
            <h2 className="font-display text-lg font-bold">Step 1: Listing Info</h2>
            <p className="mt-1 text-sm text-[var(--ink-2)]">Upload photos, write listing info, and accept rules.</p>

            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={onPickFiles} />
            {images.length === 0 ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 w-full rounded-2xl border-2 border-dashed border-[var(--line)] py-10 text-sm font-semibold"
              >
                Add photos (max 10)
              </button>
            ) : (
              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  {images.map((img, index) => (
                    <div key={`${img.previewUrl}-${index}`} className="relative aspect-square overflow-hidden rounded-xl border border-[var(--line)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.previewUrl} alt={`Upload ${index + 1}`} className="h-full w-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/50 p-1 text-[10px] font-semibold text-white">
                        <button type="button" onClick={() => setPrimary(index)}>Primary</button>
                        <button type="button" onClick={() => removeImage(index)}>Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-xl border border-[var(--line)] px-3 py-2 text-sm font-semibold">
                  Add more
                </button>
              </div>
            )}

            <div className="mt-4 space-y-3">
              <label className="block text-sm font-semibold">
                Title
                <input
                  value={core.title}
                  onChange={(event) => updateCore("title", event.target.value)}
                  className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
                />
              </label>
              <label className="block text-sm font-semibold">
                Description
                <textarea
                  rows={4}
                  value={core.description}
                  onChange={(event) => updateCore("description", event.target.value)}
                  className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-semibold">
                  Province
                  <select value={core.province} onChange={(event) => updateCore("province", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2">
                    <option value="">Select province</option>
                    {AFGHAN_PROVINCES.map((province) => (
                      <option key={province} value={province}>{province}</option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-semibold">
                  City
                  <select value={core.city} onChange={(event) => updateCore("city", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2">
                    <option value="">Select city</option>
                    {CITIES.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="block text-sm font-semibold">
                District
                <input value={core.district} onChange={(event) => updateCore("district", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
              </label>
              <label className="block text-sm font-semibold">
                Contact Phone
                <input value={core.contact_phone} onChange={(event) => updateCore("contact_phone", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
              </label>
              <label className="block text-sm font-semibold">
                Contact Name
                <input value={core.contact_name} onChange={(event) => updateCore("contact_name", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={core.rulesAccepted} onChange={(event) => updateCore("rulesAccepted", event.target.checked)} className="h-4 w-4" />
                I confirm this listing follows Sahibash rules.
              </label>
            </div>
          </section>
        ) : null}

        {step === 2 ? (
          <section className="rounded-2xl border border-[var(--line)] bg-white p-4">
            <h2 className="font-display text-lg font-bold">Step 2: Category Selection</h2>
            <p className="mt-1 text-sm text-[var(--ink-2)]">AI suggestions appear first. You can always choose manually.</p>

            <button
              type="button"
              onClick={runAiDetection}
              disabled={isDetecting}
              className="mt-3 rounded-xl border border-[var(--line)] px-3 py-2 text-sm font-semibold"
            >
              {isDetecting ? "Analyzing..." : aiResult ? "Re-analyze" : "Analyze photo + title + description"}
            </button>

            {aiResult?.suggestion ? (
              <div className="mt-3 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
                <p className="text-sm font-semibold">Suggested from your photo and description</p>
                <p className="mt-1 text-sm">{aiResult.suggestion.label}</p>
                <p className="mt-1 text-xs text-[var(--ink-2)]">{aiResult.suggestion.reason}</p>
                <button type="button" onClick={applyAiCategorySuggestion} className="mt-2 rounded-xl bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white">
                  Use suggestion
                </button>
              </div>
            ) : null}

            {aiResult?.lowConfidence ? (
              <p className="mt-2 text-xs font-semibold text-amber-700">{aiResult.message ?? "We could not detect clearly. Please choose category manually."}</p>
            ) : null}

            {breadcrumb ? <p className="mt-3 rounded-lg bg-[var(--surface-2)] px-3 py-2 text-sm font-semibold break-words">{breadcrumb}</p> : null}
            {selectedRoot ? (
              <button type="button" onClick={goBackCategoryLevel} className="mt-2 rounded-xl border border-[var(--line)] px-3 py-2 text-sm font-semibold">Back</button>
            ) : null}

            {!selectedRoot ? (
              <div className="mt-3 divide-y divide-[var(--line)] overflow-hidden rounded-xl border border-[var(--line)]">
                {categories.map((category) => (
                  <button key={category.id} type="button" onClick={() => chooseRoot(category)} className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold">
                    <span>{category.name}</span>
                    <span aria-hidden>›</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-3 divide-y divide-[var(--line)] overflow-hidden rounded-xl border border-[var(--line)]">
                {loadingTree ? <div className="px-4 py-3 text-sm text-[var(--ink-2)]">Loading...</div> : null}
                {!loadingTree && currentOptions.length === 0 && finalNode ? (
                  <div className="px-4 py-3 text-sm font-semibold text-green-700">Final category selected: {finalNode.name}</div>
                ) : null}
                {!loadingTree
                  ? currentOptions.map((node) => (
                      <button key={node.id} type="button" onClick={() => chooseNode(node)} className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold">
                        <span className="break-words">{node.name}</span>
                        <span aria-hidden>›</span>
                      </button>
                    ))
                  : null}
              </div>
            )}
          </section>
        ) : null}

        {step === 3 ? (
          <section className="rounded-2xl border border-[var(--line)] bg-white p-4">
            <h2 className="font-display text-lg font-bold">Step 3: {rootSlug === "vehicles" ? "Vehicle Details" : "Category-Specific Fields"}</h2>
            <p className="mt-1 text-sm text-[var(--ink-2)]">
              {rootSlug === "vehicles"
                ? "Select brand, model, and variant. Specifications are auto-filled."
                : "Fields are loaded from your final category. AI-filled values are editable."}
            </p>

            {!finalNode ? (
              <p className="mt-3 text-sm text-red-600">Select a final category first.</p>
            ) : rootSlug === "vehicles" ? (
              /* ── Vehicle smart posting flow ─────────────────────────────── */
              <div className="mt-3 space-y-4">
                <section className="rounded-xl border border-[var(--line)] p-3">
                  <h3 className="text-sm font-bold">Afghanistan Vehicle Mode</h3>
                  <p className="mt-1 text-xs text-[var(--ink-2)]">
                    Cannot find your vehicle? Use manual entry. Old (1950-1990s), rebuilt, handmade, imported, and unknown vehicles are always allowed.
                  </p>
                  <label className="mt-3 inline-flex items-center gap-2 text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={Boolean(dynamicValues.vehicle_is_manual)}
                      onChange={(event) => updateDynamic("vehicle_is_manual", event.target.checked)}
                      className="h-4 w-4"
                    />
                    Use Manual Vehicle Entry (never block my listing)
                  </label>

                  {manualVehicleMode ? (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <label className="text-sm font-semibold">
                        Vehicle Type
                        <select
                          value={String(dynamicValues.vehicle_type ?? "")}
                          onChange={(event) => updateDynamic("vehicle_type", event.target.value)}
                          className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
                        >
                          <option value="">Select</option>
                          <option value="passenger_vehicles">Passenger Vehicles</option>
                          <option value="motorcycles">Motorcycles</option>
                          <option value="rickshaw_three_wheelers">Rickshaw / Three-Wheelers</option>
                          <option value="bicycles">Bicycles</option>
                          <option value="commercial_vehicles">Commercial Vehicles</option>
                          <option value="agricultural_rural_vehicles">Agricultural & Rural Vehicles</option>
                          <option value="other_custom">Other / Custom Vehicles</option>
                        </select>
                      </label>
                      <label className="text-sm font-semibold">
                        Vehicle Subtype
                        <input
                          type="text"
                          placeholder="e.g. Honda 70, Auto Rickshaw, Old Soviet Car"
                          value={String(dynamicValues.vehicle_subtype ?? "")}
                          onChange={(event) => updateDynamic("vehicle_subtype", event.target.value)}
                          className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
                        />
                      </label>
                      <label className="text-sm font-semibold">
                        Brand (manual)
                        <input
                          type="text"
                          placeholder="e.g. Toyota, Honda, Unknown"
                          value={String(dynamicValues.vehicle_brand ?? "")}
                          onChange={(event) => updateDynamic("vehicle_brand", event.target.value)}
                          className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
                        />
                      </label>
                      <label className="text-sm font-semibold">
                        Model (manual)
                        <input
                          type="text"
                          placeholder="e.g. Corolla, 70, Unknown Model"
                          value={String(dynamicValues.vehicle_model ?? "")}
                          onChange={(event) => updateDynamic("vehicle_model", event.target.value)}
                          className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
                        />
                      </label>
                      <label className="text-sm font-semibold">
                        Vehicle Year
                        <input
                          type="number"
                          min={MIN_VEHICLE_YEAR}
                          max={MAX_VEHICLE_YEAR}
                          placeholder="e.g. 1995"
                          value={String(dynamicValues.vehicle_year ?? dynamicValues.year ?? "")}
                          onChange={(event) => {
                            updateDynamic("vehicle_year", event.target.value);
                            updateDynamic("year", event.target.value);
                          }}
                          className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
                        />
                      </label>
                      <label className="text-sm font-semibold">
                        <span className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-3">
                          <input
                            type="checkbox"
                            checked={Boolean(dynamicValues.vehicle_is_custom)}
                            onChange={(event) => updateDynamic("vehicle_is_custom", event.target.checked)}
                            className="h-4 w-4"
                          />
                          Custom / Modified vehicle
                        </span>
                      </label>

                      {String(dynamicValues.vehicle_type ?? "") === "motorcycles" ? (
                        <>
                          <label className="text-sm font-semibold">
                            Motorcycle Class
                            <select
                              value={String(dynamicValues.manual__motorcycle_class ?? "")}
                              onChange={(event) => updateDynamic("manual__motorcycle_class", event.target.value)}
                              className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
                            >
                              <option value="">Select</option>
                              <option value="honda_70">Honda 70</option>
                              <option value="100_250cc">100cc-250cc</option>
                              <option value="chinese">Chinese Motorcycle</option>
                              <option value="indian">Indian Motorcycle</option>
                              <option value="electric">Electric Bike</option>
                              <option value="dirt_bike">Dirt Bike</option>
                              <option value="unknown">Unknown</option>
                            </select>
                          </label>
                          <label className="text-sm font-semibold">
                            Engine CC (manual)
                            <input
                              type="text"
                              placeholder="e.g. 70cc / 125cc"
                              value={String(dynamicValues.manual__engine_cc ?? "")}
                              onChange={(event) => updateDynamic("manual__engine_cc", event.target.value)}
                              className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
                            />
                          </label>
                        </>
                      ) : null}

                      {String(dynamicValues.vehicle_type ?? "") === "rickshaw_three_wheelers" ? (
                        <>
                          <label className="text-sm font-semibold">
                            Fuel Type
                            <input
                              type="text"
                              placeholder="Petrol / CNG / Electric"
                              value={String(dynamicValues.manual__rickshaw_fuel_type ?? "")}
                              onChange={(event) => updateDynamic("manual__rickshaw_fuel_type", event.target.value)}
                              className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
                            />
                          </label>
                          <label className="text-sm font-semibold">
                            Passenger Capacity
                            <input
                              type="text"
                              placeholder="e.g. 3-4"
                              value={String(dynamicValues.manual__passenger_capacity ?? "")}
                              onChange={(event) => updateDynamic("manual__passenger_capacity", event.target.value)}
                              className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
                            />
                          </label>
                          <label className="text-sm font-semibold">
                            Cargo Capacity
                            <input
                              type="text"
                              placeholder="e.g. 500kg"
                              value={String(dynamicValues.manual__cargo_capacity ?? "")}
                              onChange={(event) => updateDynamic("manual__cargo_capacity", event.target.value)}
                              className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
                            />
                          </label>
                        </>
                      ) : null}

                      {String(dynamicValues.vehicle_type ?? "") === "bicycles" ? (
                        <>
                          <label className="text-sm font-semibold">
                            Gear Type
                            <input
                              type="text"
                              placeholder="Single / Multi-speed"
                              value={String(dynamicValues.manual__gear_type ?? "")}
                              onChange={(event) => updateDynamic("manual__gear_type", event.target.value)}
                              className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
                            />
                          </label>
                          <label className="text-sm font-semibold">
                            Frame Type
                            <input
                              type="text"
                              placeholder="Steel / Aluminum"
                              value={String(dynamicValues.manual__frame_type ?? "")}
                              onChange={(event) => updateDynamic("manual__frame_type", event.target.value)}
                              className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
                            />
                          </label>
                          <label className="text-sm font-semibold">
                            Brake Type
                            <input
                              type="text"
                              placeholder="Disc / Rim"
                              value={String(dynamicValues.manual__brake_type ?? "")}
                              onChange={(event) => updateDynamic("manual__brake_type", event.target.value)}
                              className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
                            />
                          </label>
                        </>
                      ) : null}
                    </div>
                  ) : null}

                  {classicVehicleMode ? (
                    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                      <p className="text-xs font-semibold text-amber-900">Classic / Old Vehicle Mode (Year &lt; 2000)</p>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        {[
                          ["manual__original_engine", "Original engine"],
                          ["manual__engine_swapped", "Engine swapped"],
                          ["manual__restored", "Restored"],
                          ["manual__needs_restoration", "Needs restoration"],
                          ["manual__imported", "Imported"],
                          ["manual__documents_available", "Documents available"],
                          ["manual__custom_modification", "Custom modification"],
                        ].map(([key, label]) => (
                          <label key={key} className="text-sm font-semibold">
                            <span className="flex items-center gap-2 rounded-lg bg-white px-3 py-2">
                              <input
                                type="checkbox"
                                checked={Boolean(dynamicValues[key])}
                                onChange={(event) => updateDynamic(key, event.target.checked)}
                                className="h-4 w-4"
                              />
                              {label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </section>

                <VehicleSmartSelector
                  categoryNodeId={finalNode.id}
                  aiSuggestedBrand={aiResult?.suggestedProduct?.brand ?? null}
                  aiSuggestedModel={aiResult?.suggestedProduct?.model ?? null}
                  onChange={setVehicleSelection}
                />

                {vehicleSelection.variant || manualVehicleMode ? (
                  <>
                    {/* Editable vehicle fields */}
                    <section className="rounded-xl border border-[var(--line)] p-3">
                      <h3 className="text-sm font-bold">Your Vehicle Details</h3>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <label className="text-sm font-semibold">
                          Year
                          <input
                            type="number"
                            min={MIN_VEHICLE_YEAR}
                            max={MAX_VEHICLE_YEAR}
                            placeholder="e.g. 2020"
                            value={String(dynamicValues.year ?? "")}
                            onChange={(e) => updateDynamic("year", e.target.value)}
                            className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
                          />
                        </label>
                        <label className="text-sm font-semibold">
                          KM / Mileage
                          <input
                            type="number"
                            min={0}
                            placeholder="e.g. 45000"
                            value={String(dynamicValues.mileage ?? "")}
                            onChange={(e) => updateDynamic("mileage", e.target.value)}
                            className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
                          />
                        </label>
                        <label className="text-sm font-semibold">
                          Color
                          <input
                            type="text"
                            placeholder="e.g. White"
                            value={String(dynamicValues.color ?? "")}
                            onChange={(e) => updateDynamic("color", e.target.value)}
                            className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
                          />
                        </label>
                        <label className="text-sm font-semibold">
                          Vehicle Status
                          <select
                            value={String(dynamicValues.vehicle_status ?? "")}
                            onChange={(e) => updateDynamic("vehicle_status", e.target.value)}
                            className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
                          >
                            <option value="">Select</option>
                            <option>New</option>
                            <option>Like New</option>
                            <option>Used</option>
                            <option>Damaged</option>
                          </select>
                        </label>
                        <label className="text-sm font-semibold">
                          Warranty
                          <select
                            value={String(dynamicValues.warranty ?? "")}
                            onChange={(e) => updateDynamic("warranty", e.target.value)}
                            className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
                          >
                            <option value="">Select</option>
                            <option>Yes</option>
                            <option>No</option>
                          </select>
                        </label>
                        <label className="text-sm font-semibold">
                          Salvage Record
                          <select
                            value={String(dynamicValues.salvage_record ?? "")}
                            onChange={(e) => updateDynamic("salvage_record", e.target.value)}
                            className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
                          >
                            <option value="">Select</option>
                            <option>No</option>
                            <option>Yes</option>
                          </select>
                        </label>
                        <label className="text-sm font-semibold">
                          Plate Status
                          <input
                            type="text"
                            placeholder="e.g. Kabul plate"
                            value={String(dynamicValues.plate_status ?? "")}
                            onChange={(e) => updateDynamic("plate_status", e.target.value)}
                            className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
                          />
                        </label>
                        <label className="text-sm font-semibold">
                          Neighborhood (optional)
                          <input
                            type="text"
                            placeholder="e.g. Karte Seh"
                            value={String(dynamicValues.neighborhood ?? "")}
                            onChange={(e) => updateDynamic("neighborhood", e.target.value)}
                            className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
                          />
                        </label>
                        <label className="text-sm font-semibold">
                          Video URL (optional)
                          <input
                            type="url"
                            placeholder="https://..."
                            value={String(dynamicValues.video_url ?? "")}
                            onChange={(e) => updateDynamic("video_url", e.target.value)}
                            className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
                          />
                        </label>
                      </div>
                    </section>

                    {/* Paint & damage diagram */}
                    <section className="rounded-xl border border-[var(--line)] p-3">
                      <h3 className="text-sm font-bold">Painted or Replaced Parts</h3>
                      <p className="mb-3 mt-1 text-xs text-[var(--ink-2)]">Tap each part on the diagram to indicate its condition.</p>
                      <VehicleDamageDiagram value={damageParts} onChange={setDamageParts} />
                    </section>

                    {Object.entries(fieldsByGroup).map(([groupKey, groupFields]) => (
                      <section key={groupKey} className="rounded-xl border border-[var(--line)] p-3">
                        <h3 className="text-sm font-bold">{fieldGroupLabel(groupKey)}</h3>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          {groupFields.map((field) => {
                            const value = dynamicValues[field.field_key];
                            const isMissing = field.is_required && !String(value ?? "").trim();

                            if (field.field_type === "boolean") {
                              return (
                                <label key={field.id} className="text-sm font-semibold">
                                  <span className="flex items-center gap-2">
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
                              const options = fieldOptionsForRender(field);
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
                                  {isMissing ? <p className="mt-1 text-xs font-semibold text-red-600">Required field</p> : null}
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
                                {isMissing ? <p className="mt-1 text-xs font-semibold text-red-600">Required field</p> : null}
                              </label>
                            );
                          })}
                        </div>
                      </section>
                    ))}
                  </>
                ) : null}
                {!vehicleSelection.variant && !manualVehicleMode ? (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                    Select a known variant, or enable manual vehicle entry above. Posting unknown/custom vehicles is always allowed.
                  </p>
                ) : null}
              </div>
            ) : (
              /* ── Non-vehicle dynamic fields ─────────────────────────────── */
              <div className="mt-3 space-y-4">
                {loadingProducts ? <p className="text-sm text-[var(--ink-2)]">Loading model specifications...</p> : null}

                {productSpecOptions.length > 0 ? (
                  <section className="rounded-xl border border-[var(--line)] p-3">
                    <h3 className="text-sm font-bold">Known Product Specifications</h3>
                    <p className="mt-1 text-sm text-[var(--ink-2)]">Known specs are auto-filled and locked so users only answer changeable details.</p>

                    {seriesOptions.length > 1 ? (
                      <label className="mt-3 block text-sm font-semibold">
                        Series
                        <select
                          value={selectedSeries}
                          onChange={(event) => {
                            const nextSeries = event.target.value;
                            setSelectedSeries(nextSeries);
                            const nextOptions = productSpecOptions.filter((spec) => !nextSeries || seriesFromProductSpec(spec) === nextSeries);
                            if (nextOptions.length === 1) {
                              applyProductSpecSelection(nextOptions[0]);
                            } else {
                              setSelectedProductModel("");
                              setLockedSpecs({});
                            }
                          }}
                          className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
                        >
                          <option value="">Select series</option>
                          {seriesOptions.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </label>
                    ) : null}

                    {filteredProductSpecOptions.length > 1 ? (
                      <label className="mt-3 block text-sm font-semibold">
                        Model
                        <select
                          value={selectedProductModel}
                          onChange={(event) => {
                            const next = filteredProductSpecOptions.find((spec) => spec.model === event.target.value) ?? null;
                            applyProductSpecSelection(next);
                          }}
                          className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
                        >
                          <option value="">Select model</option>
                          {filteredProductSpecOptions.map((option) => (
                            <option key={`${option.brand}-${option.model}`} value={option.model}>{option.model}</option>
                          ))}
                        </select>
                      </label>
                    ) : null}

                    {selectedProductSpec ? (
                      <div className="mt-3 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-2)]">Locked Specs</p>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          {Object.entries(lockedSpecs).map(([key, value]) => (
                            <div key={key} className="rounded-lg bg-white px-3 py-2 text-sm">
                              <p className="text-[var(--ink-2)]">{labelForLockedSpec(key)}</p>
                              <p className="font-semibold text-[var(--ink-1)]">{String(value)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-amber-700">Select a model to auto-fill locked specifications.</p>
                    )}
                  </section>
                ) : null}

                {Object.entries(fieldsByGroup).map(([groupKey, groupFields]) => (
                  <section key={groupKey} className="rounded-xl border border-[var(--line)] p-3">
                    <h3 className="text-sm font-bold">{fieldGroupLabel(groupKey)}</h3>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {groupFields.map((field) => {
                        const value = dynamicValues[field.field_key];
                        const isMissing = field.is_required && !String(value ?? "").trim();

                        if (field.field_type === "boolean") {
                          return (
                            <label key={field.id} className="text-sm font-semibold">
                              <span className="flex items-center gap-2">
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
                          const options = fieldOptionsForRender(field);
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
                              {isMissing ? <p className="mt-1 text-xs font-semibold text-red-600">Required field</p> : null}
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
                            {isMissing ? <p className="mt-1 text-xs font-semibold text-red-600">Required field</p> : null}
                          </label>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </section>
        ) : null}

        {step === 4 ? (
          <section className="rounded-2xl border border-[var(--line)] bg-white p-4">
            <h2 className="font-display text-lg font-bold">Step 4: {rootSlug === "vehicles" ? "Seller & Features" : "Context Preferences"}</h2>

            {(rootSlug === "mobile-phones-tablets" || rootSlug === "electronics-computers" || rootSlug === "home-furniture-appliances" || rootSlug === "clothing-personal-items") ? (
              <div className="mt-3 grid gap-3">
                <label className="text-sm font-semibold">Delivery Preference
                  <select value={core.delivery_preference} onChange={(event) => updateCore("delivery_preference", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2">
                    <option value="">Select</option>
                    <option value="meet_and_deliver">I can meet and deliver</option>
                    <option value="delivery_available">Delivery available</option>
                    <option value="pickup_only">Buyer can pick up</option>
                  </select>
                </label>
                <label className="text-sm font-semibold">Meeting Preference
                  <input value={core.meeting_preference} onChange={(event) => updateCore("meeting_preference", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
                </label>
              </div>
            ) : null}

            {rootSlug === "real-estate" ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-semibold">Owner / Agent
                  <select value={String(dynamicValues.owner_type ?? "")} onChange={(event) => updateDynamic("owner_type", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2">
                    <option value="">Select</option>
                    <option value="owner">Owner</option>
                    <option value="agent">Agent</option>
                    <option value="manager">Manager</option>
                    <option value="developer">Developer</option>
                  </select>
                </label>
                <label className="text-sm font-semibold">
                  <span className="flex items-center gap-2">
                    <input type="checkbox" checked={core.available_for_viewing} onChange={(event) => updateCore("available_for_viewing", event.target.checked)} className="h-4 w-4" />
                    Available for viewing
                  </span>
                </label>
                <label className="text-sm font-semibold sm:col-span-2">Address
                  <input value={core.address_optional} onChange={(event) => updateCore("address_optional", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
                </label>
              </div>
            ) : null}

            {rootSlug === "vehicles" ? (
              <div className="mt-3 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-sm font-semibold">Seller Type
                    <select value={core.seller_type} onChange={(event) => updateCore("seller_type", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2">
                      <option value="">Select</option>
                      <option value="owner">Owner</option>
                      <option value="dealer">Dealer</option>
                    </select>
                  </label>
                  <label className="text-sm font-semibold">
                    <span className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-3">
                      <input type="checkbox" checked={core.exchange_available} onChange={(event) => updateCore("exchange_available", event.target.checked)} className="h-4 w-4" />
                      Exchange available
                    </span>
                  </label>
                </div>

                <section className="rounded-xl border border-[var(--line)] p-3">
                  <h3 className="text-sm font-bold">Feature Checklist</h3>
                  <div className="mt-3">
                    <VehicleFeaturesChecklist value={selectedVehicleFeatureIds} onChange={setSelectedVehicleFeatureIds} />
                  </div>
                </section>
              </div>
            ) : null}
          </section>
        ) : null}

        {step === 5 ? (
          <section className="rounded-2xl border border-[var(--line)] bg-white p-4">
            <h2 className="font-display text-lg font-bold">Step 5: Price / Payment</h2>
            {isRealEstate ? (
              <p className="mt-1 text-sm text-[var(--ink-2)]">
                Rental type: {selectedRentalType || "Not selected"}
              </p>
            ) : null}
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold">{isGerawyType ? "Primary Amount" : "Price"}
                <input type="number" min={1} value={core.price} onChange={(event) => updateCore("price", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
                {!core.price ? <p className="mt-1 text-xs font-semibold text-red-600">Required field</p> : null}
              </label>
              <label className="text-sm font-semibold">Currency
                <select value={core.currency} onChange={(event) => updateCore("currency", event.target.value as "AFN" | "USD")} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2">
                  {CURRENCIES.map((currency) => (
                    <option key={currency} value={currency}>{currency}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-semibold">
                <span className="flex items-center gap-2">
                  <input type="checkbox" checked={core.negotiable} onChange={(event) => updateCore("negotiable", event.target.checked)} className="h-4 w-4" />
                  Negotiable
                </span>
              </label>
              <label className="text-sm font-semibold">Minimum Offer (optional)
                <input type="number" min={1} value={core.minimum_offer} onChange={(event) => updateCore("minimum_offer", event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
              </label>
            </div>
          </section>
        ) : null}

        {step === 6 ? (
          <section className="rounded-2xl border border-[var(--line)] bg-white p-4">
            <h2 className="font-display text-lg font-bold">Step 6: Preview and Publish</h2>
            <div className="mt-3 grid gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3 text-sm">
              <p><span className="font-semibold">Photos:</span> {previewSummary.photos}</p>
              <p><span className="font-semibold">Category:</span> {previewSummary.category}</p>
              <p><span className="font-semibold">Title:</span> {previewSummary.title}</p>
              <p><span className="font-semibold">Description:</span> {previewSummary.description}</p>
              <p><span className="font-semibold">Location:</span> {previewSummary.location}</p>
              <p><span className="font-semibold">Contact:</span> {previewSummary.contact}</p>
              <p><span className="font-semibold">Price:</span> {previewSummary.price}</p>
            </div>
          </section>
        ) : null}

        {stepError ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{stepError}</p> : null}
        {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p> : null}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--line)] bg-white px-4 py-3">
        <div className="mx-auto flex w-full max-w-5xl gap-2">
          {step > 1 ? (
            <button type="button" onClick={goPrev} className="rounded-xl border border-[var(--line)] px-4 py-3 text-sm font-semibold">
              Back
            </button>
          ) : null}

          {step < 6 ? (
            <button type="button" onClick={goNext} className="flex-1 rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-bold text-white">
              Continue
            </button>
          ) : (
            <button type="button" onClick={onPublish} disabled={isPending} className="flex-1 rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-bold text-white disabled:opacity-60">
              {isPending ? status ?? "Publishing..." : "Publish"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
