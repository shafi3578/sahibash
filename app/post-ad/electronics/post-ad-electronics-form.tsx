"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createListingAction, uploadListingImageAction } from "@/lib/actions/listings";
import { CURRENCIES, AFGHAN_PROVINCES } from "@/lib/constants/marketplace";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { TRANSLATIONS } from "@/lib/i18n/translations";

type ElectronicsCategory = {
  id: number;
  name: string;
  slug: string;
  category_node_id: number | null;
};

type ElectronicsBrand = {
  id: number;
  name: string;
  slug: string;
  is_popular: boolean;
};

type ElectronicsModel = {
  id: number;
  name: string;
  slug: string;
  release_year: number | null;
  is_popular: boolean;
};

type ElectronicsSpec = {
  id: number;
  spec_key: string;
  spec_label: string;
  spec_value: string;
  spec_group: string | null;
};

type ElectronicsOption = {
  id: number;
  option_type: string;
  option_value: string;
};

type PostingConfig = {
  requires_images: boolean;
  min_images: number;
  max_images: number;
  recommended_images: string | null;
  allow_manual_model: boolean;
};

type StagedImage = { file: File; previewUrl: string; isPrimary: boolean };

type ProvinceOption = { id: number; name: string };
type DistrictOption = { id: number; name: string; province_id: number };
type LocationMethod = "device" | "manual" | null;

type Props = {
  subcategories: ElectronicsCategory[];
  t: (typeof TRANSLATIONS)["en"];
};

type Step = "category" | "brandModel" | "details" | "photos" | "location" | "preview";

const CONDITION_OPTIONS = ["New", "Like New", "Excellent", "Good", "Fair", "Damaged", "For Parts"];
const WARRANTY_OPTIONS = ["No Warranty", "Shop Warranty", "Official Warranty", "International Warranty"];
const REPAIR_HISTORY_OPTIONS = [
  "No Repair",
  "Screen Replaced",
  "Battery Replaced",
  "Back Glass Replaced",
  "Camera Repaired",
  "Board Repaired",
  "Unknown",
];
const NETWORK_REGISTERED_OPTIONS = ["Registered", "Not Registered", "Unknown"];

function optionsByType(options: ElectronicsOption[], type: string) {
  return options
    .filter((option) => option.option_type === type)
    .map((option) => option.option_value);
}

export default function ElectronicsPostAdForm({ subcategories, t }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  const [step, setStep] = useState<Step>("category");
  const [stepError, setStepError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<ElectronicsCategory | null>(null);
  const [brands, setBrands] = useState<ElectronicsBrand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<ElectronicsBrand | null>(null);
  const [models, setModels] = useState<ElectronicsModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<ElectronicsModel | null>(null);
  const [manualModel, setManualModel] = useState(false);
  const [manualBrandName, setManualBrandName] = useState("");
  const [manualModelName, setManualModelName] = useState("");

  const [knownSpecs, setKnownSpecs] = useState<ElectronicsSpec[]>([]);
  const [modelOptions, setModelOptions] = useState<ElectronicsOption[]>([]);
  const [postingConfig, setPostingConfig] = useState<PostingConfig>({
    requires_images: true,
    min_images: 1,
    max_images: 8,
    recommended_images: "3-8",
    allow_manual_model: true,
  });

  const [images, setImages] = useState<StagedImage[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState<"AFN" | "USD">("AFN");
  const [storage, setStorage] = useState("");
  const [ram, setRam] = useState("");
  const [color, setColor] = useState("");
  const [batteryHealth, setBatteryHealth] = useState("");
  const [condition, setCondition] = useState("");
  const [warranty, setWarranty] = useState("");
  const [boxIncluded, setBoxIncluded] = useState(false);
  const [chargerIncluded, setChargerIncluded] = useState(false);
  const [repairHistory, setRepairHistory] = useState("");
  const [networkRegistered, setNetworkRegistered] = useState("");

  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [provinceOptions, setProvinceOptions] = useState<ProvinceOption[]>([]);
  const [districtOptions, setDistrictOptions] = useState<DistrictOption[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(null);
  const [locationMethod, setLocationMethod] = useState<LocationMethod>(null);
  const [locationVisibility, setLocationVisibility] = useState<"exact" | "approximate" | "province_district">("province_district");
  const [deviceLatitude, setDeviceLatitude] = useState<number | null>(null);
  const [deviceLongitude, setDeviceLongitude] = useState<number | null>(null);
  const [deviceAccuracy, setDeviceAccuracy] = useState<number | null>(null);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationHint, setLocationHint] = useState<string | null>(null);
  const [area, setArea] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactName, setContactName] = useState("");

  const breadcrumb = useMemo(() => {
    const categoryName = selectedCategory?.name ?? t.postAdElectronics.phonesElectronics;
    const brandName = manualModel ? (manualBrandName || "Manual Brand") : (selectedBrand?.name ?? "Brand");
    const modelName = manualModel ? (manualModelName || "Manual Model") : (selectedModel?.name ?? "Model");
    return `${t.postAdElectronics.phonesElectronics} -> ${categoryName} -> ${brandName} -> ${modelName}`;
  }, [selectedCategory?.name, selectedBrand?.name, selectedModel?.name, manualModel, manualBrandName, manualModelName, t.postAdElectronics.phonesElectronics]);

  const storageOptions = useMemo(() => optionsByType(modelOptions, "storage"), [modelOptions]);
  const colorOptions = useMemo(() => optionsByType(modelOptions, "color"), [modelOptions]);
  const showPhotoStep = postingConfig.requires_images || images.length > 0;

  async function loadBrands(categoryId: number) {
    const response = await fetch(`/api/electronics/brands?categoryId=${categoryId}`, { method: "GET" });
    const payload = (await response.json()) as { brands: ElectronicsBrand[] };
    setBrands(payload.brands ?? []);
  }

  async function loadModels(brandId: number) {
    const response = await fetch(`/api/electronics/models?brandId=${brandId}`, { method: "GET" });
    const payload = (await response.json()) as { models: ElectronicsModel[] };
    setModels(payload.models ?? []);
  }

  async function loadModelMeta(modelId: number, categoryId: number) {
    const response = await fetch(`/api/electronics/model-meta?modelId=${modelId}&categoryId=${categoryId}`, { method: "GET" });
    const payload = (await response.json()) as {
      specs: ElectronicsSpec[];
      options: ElectronicsOption[];
      config: PostingConfig | null;
    };

    setKnownSpecs(payload.specs ?? []);
    setModelOptions(payload.options ?? []);

    if (payload.config) {
      setPostingConfig(payload.config);
    }
  }

  async function loadCategoryConfig(categoryId: number) {
    const response = await fetch(`/api/electronics/category-config?categoryId=${categoryId}`, { method: "GET" });
    const payload = (await response.json()) as { config: PostingConfig | null };
    if (payload.config) {
      setPostingConfig(payload.config);
    }
  }

  async function onSelectCategory(category: ElectronicsCategory) {
    setSelectedCategory(category);
    setSelectedBrand(null);
    setSelectedModel(null);
    setManualModel(false);
    setManualBrandName("");
    setManualModelName("");
    setKnownSpecs([]);
    setModelOptions([]);
    setStepError(null);
    setError(null);

    await Promise.all([loadBrands(category.id), loadCategoryConfig(category.id)]);
    setStep("brandModel");
  }

  async function onSelectBrand(brand: ElectronicsBrand) {
    setSelectedBrand(brand);
    setSelectedModel(null);
    setKnownSpecs([]);
    setModelOptions([]);
    setStepError(null);
    setError(null);
    await loadModels(brand.id);
  }

  async function onSelectModel(model: ElectronicsModel) {
    if (!selectedCategory) return;
    setSelectedModel(model);
    setStepError(null);
    setError(null);
    await loadModelMeta(model.id, selectedCategory.id);
  }

  function pickFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    const next = files.map((file, index) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      isPrimary: images.length === 0 && index === 0,
    }));

    setImages((prev) => [...prev, ...next].slice(0, postingConfig.max_images));
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

  const orderedSteps: Step[] = showPhotoStep
    ? ["category", "brandModel", "details", "photos", "location", "preview"]
    : ["category", "brandModel", "details", "location", "preview"];

  function normalizeLocationName(value: string) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .replace("daikundi", "daykundi")
      .replace("jawzjan", "jowzjan")
      .replace("sar e pol", "sar-e pol")
      .replace("maidan wardak", "wardak");
  }

  async function loadDistricts(provinceId: number) {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase
      .from("districts")
      .select("id, name, province_id")
      .eq("province_id", provinceId)
      .eq("is_active", true)
      .order("name", { ascending: true });

    const rows = (data ?? []) as DistrictOption[];
    setDistrictOptions(rows);
    return rows;
  }

  async function attemptReverseGeocode(latitude: number, longitude: number) {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(String(latitude))}&lon=${encodeURIComponent(String(longitude))}&accept-language=en`;
      const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      if (!response.ok) return;

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
          setProvince(matchedProvince.name);
          const loadedDistricts = await loadDistricts(matchedProvince.id);

          if (districtHint) {
            const matchedDistrict = loadedDistricts.find(
              (option) => normalizeLocationName(option.name) === normalizeLocationName(districtHint)
            );
            if (matchedDistrict) {
              setSelectedDistrictId(matchedDistrict.id);
              setDistrict(matchedDistrict.name);
            }
          }
        }
      }
    } catch {
      // Best-effort lookup only.
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
  }, []);

  function gotoNext() {
    setStepError(null);

    if (step === "category") {
      if (!selectedCategory) {
        setStepError("Select a subcategory to continue.");
        return;
      }
      setStep("brandModel");
      return;
    }

    if (step === "brandModel") {
      if (!selectedBrand && !manualModel) {
        setStepError("Select a brand to continue.");
        return;
      }
      if (!selectedModel && !manualModel) {
        setStepError("Select a model or use manual model entry.");
        return;
      }
      if (manualModel) {
        if (!manualBrandName.trim()) {
          setStepError("Enter manual brand name.");
          return;
        }
        if (!manualModelName.trim()) {
          setStepError("Enter manual model name.");
          return;
        }
      }
      setStep("details");
      return;
    }

    if (step === "details") {
      if (!title.trim() || title.trim().length < 5) {
        setStepError("Title must be at least 5 characters.");
        return;
      }
      if (!description.trim() || description.trim().length < 20) {
        setStepError("Description must be at least 20 characters.");
        return;
      }
      if (!condition) {
        setStepError("Condition is required.");
        return;
      }
      if (!price || Number(price) <= 0) {
        setStepError("Enter valid price.");
        return;
      }
      if (selectedCategory?.slug === "mobile-phones" && !storage.trim()) {
        setStepError("Storage is required for mobile phones.");
        return;
      }
      setStep(showPhotoStep ? "photos" : "location");
      return;
    }

    if (step === "photos") {
      if (postingConfig.requires_images && images.length < postingConfig.min_images) {
        setStepError(`Please add at least ${postingConfig.min_images} photo(s).`);
        return;
      }
      setStep("location");
      return;
    }

    if (step === "location") {
      if (!selectedProvinceId || !selectedDistrictId) {
        setStepError("Please add a location before publishing your ad.");
        return;
      }

      if (!locationMethod) {
        setStepError("Please add a location before publishing your ad.");
        return;
      }

      if (locationMethod === "device") {
        if (deviceLatitude === null || deviceLongitude === null) {
          setStepError("Please detect your device location or choose manual location.");
          return;
        }
        if (!locationConfirmed) {
          setStepError("We detected your location. Please confirm it before publishing.");
          return;
        }
      }

      if (!contactPhone.trim() || contactPhone.trim().length < 7) {
        setStepError("Contact phone is required (minimum 7 digits).");
        return;
      }
      setStep("preview");
    }
  }

  function gotoPrev() {
    setStepError(null);
    const index = orderedSteps.indexOf(step);
    if (index > 0) {
      setStep(orderedSteps[index - 1]);
    }
  }

  async function onPublish() {
    setError(null);
    setStepError(null);

    if (!selectedCategory) {
      setError("Electronics subcategory is required.");
      return;
    }

    const postingNodeId = selectedCategory.category_node_id;
    if (!postingNodeId) {
      setError("Selected electronics subcategory is not linked to posting categories yet.");
      return;
    }

    const form = new FormData();
    form.set("title", title || `${selectedCategory.name} - ${manualModel ? manualModelName : selectedModel?.name ?? "Listing"}`);
    form.set("description", description || "Electronics listing with complete details and condition.");
    form.set("category_node_id", String(postingNodeId));
    form.set("subcategory_id", String(postingNodeId));

    form.set("price", price);
    form.set("currency", currency);
    form.set("province", province);
    form.set("district", district);
    form.set("province_id", String(selectedProvinceId ?? ""));
    form.set("district_id", String(selectedDistrictId ?? ""));
    form.set("area_text", area);
    form.set("address_optional", area);
    if (deviceLatitude !== null) form.set("latitude", String(deviceLatitude));
    if (deviceLongitude !== null) form.set("longitude", String(deviceLongitude));
    if (deviceAccuracy !== null) form.set("location_accuracy", String(deviceAccuracy));
    form.set("location_source", locationMethod === "device" ? "device" : "manual");
    form.set("location_visibility", locationVisibility);
    form.set("is_location_confirmed", locationMethod === "device" ? (locationConfirmed ? "true" : "false") : "true");
    form.set("contact_phone", contactPhone.trim());
    form.set("contact_name", contactName.trim());

    form.set("electronics_category_id", String(selectedCategory.id));
    if (!manualModel && selectedBrand) form.set("electronics_brand_id", String(selectedBrand.id));
    if (!manualModel && selectedModel) form.set("electronics_model_id", String(selectedModel.id));
    if (manualModel) {
      form.set("manual_brand", manualBrandName);
      form.set("manual_model", manualModelName);
    }

    form.set("electronics_condition", condition);
    form.set("electronics_storage", storage);
    form.set("electronics_ram", ram);
    form.set("electronics_color", color);
    form.set("electronics_battery_health", batteryHealth);
    form.set("electronics_warranty", warranty);
    form.set("electronics_box_included", boxIncluded ? "true" : "false");
    form.set("electronics_charger_included", chargerIncluded ? "true" : "false");
    form.set("electronics_repair_history", repairHistory);
    form.set("electronics_network_registered", networkRegistered);
    form.set("electronics_area", area);
    form.set("electronics_description", description);

    form.set("condition", condition);
    if (storage.trim()) form.set("storage", storage);
    if (ram.trim()) form.set("ram", ram);
    if (batteryHealth.trim()) form.set("battery_health", batteryHealth);
    if (networkRegistered.trim()) form.set("network_registered", networkRegistered);

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
        <p className="text-xs font-semibold uppercase tracking-wide">{t.postAdElectronics.phonesElectronics}</p>
        <p className="text-sm">{step === "category" ? t.postAdElectronics.category : step === "brandModel" ? t.postAdElectronics.brandModel : step === "details" ? t.postAdElectronics.details : step === "photos" ? t.postAdElectronics.photos : step === "location" ? t.postAdElectronics.location : t.postAdElectronics.preview}</p>
        <p className="mt-1 text-xs text-sky-100 break-words">{breadcrumb}</p>
      </div>

      <div className="mt-4 space-y-4">
        {step === "category" ? (
          <section className="rounded-2xl border border-[var(--line)] bg-white p-4">
            <h2 className="font-display text-lg font-bold">{t.postAdElectronics.category}</h2>
            <p className="mt-1 text-sm text-[var(--ink-2)]">{t.postAdElectronics.chooseSubcategory}</p>
            <div className="mt-3 divide-y divide-[var(--line)] overflow-hidden rounded-xl border border-[var(--line)]">
              {subcategories.map((category) => (
                <button key={category.id} type="button" onClick={() => void onSelectCategory(category)} className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold">
                  <span>{category.name}</span>
                  <span aria-hidden>&gt;</span>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {step === "brandModel" ? (
          <section className="rounded-2xl border border-[var(--line)] bg-white p-4">
            <h2 className="font-display text-lg font-bold">{t.postAdElectronics.brandModel}</h2>
            <p className="mt-1 text-sm text-[var(--ink-2)]">{t.postAdElectronics.popularBrandsHint}</p>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold">Brand
                <select value={selectedBrand?.id ? String(selectedBrand.id) : ""} onChange={(event) => {
                  const next = brands.find((brand) => brand.id === Number(event.target.value)) ?? null;
                  if (next) {
                    void onSelectBrand(next);
                  }
                }} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2">
                  <option value="">{t.postAdElectronics.selectBrand}</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>{brand.name}</option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-semibold">Model
                <select value={selectedModel?.id ? String(selectedModel.id) : ""} onChange={(event) => {
                  const next = models.find((model) => model.id === Number(event.target.value)) ?? null;
                  if (next) {
                    void onSelectModel(next);
                  }
                }} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2">
                  <option value="">{t.postAdElectronics.selectModel}</option>
                  {models.map((model) => (
                    <option key={model.id} value={model.id}>{model.name}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-3 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={manualModel} onChange={(event) => setManualModel(event.target.checked)} className="h-4 w-4" />
                {t.postAdElectronics.cantFindModel}
              </label>

              {manualModel ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="text-sm font-semibold">Manual Brand
                    <input value={manualBrandName} onChange={(event) => setManualBrandName(event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
                  </label>
                  <label className="text-sm font-semibold">Manual Model
                    <input value={manualModelName} onChange={(event) => setManualModelName(event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
                  </label>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {step === "details" ? (
          <section className="rounded-2xl border border-[var(--line)] bg-white p-4">
            <h2 className="font-display text-lg font-bold">{t.postAdElectronics.details}</h2>

            {knownSpecs.length > 0 ? (
              <details className="mt-3 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
                <summary className="cursor-pointer text-sm font-semibold">{t.postAdElectronics.knownSpecs}</summary>
                <div className="mt-2 grid gap-2 sm:grid-cols-2 text-sm">
                  {knownSpecs.map((spec) => (
                    <p key={spec.id}><span className="font-semibold">{spec.spec_label}:</span> {spec.spec_value}</p>
                  ))}
                </div>
              </details>
            ) : null}

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold">Title
                <input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
              </label>
              <label className="text-sm font-semibold">Condition
                <select value={condition} onChange={(event) => setCondition(event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2">
                  <option value="">Select</option>
                  {CONDITION_OPTIONS.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold">Price
                <input type="number" min={1} value={price} onChange={(event) => setPrice(event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
              </label>
              <label className="text-sm font-semibold">Currency
                <select value={currency} onChange={(event) => setCurrency(event.target.value as "AFN" | "USD")} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2">
                  {CURRENCIES.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold">Storage
                <select value={storage} onChange={(event) => setStorage(event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2">
                  <option value="">Select</option>
                  {(storageOptions.length > 0 ? storageOptions : ["64GB", "128GB", "256GB", "512GB", "1TB", "Other"]).map((value) => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-semibold">RAM (optional)
                <input value={ram} onChange={(event) => setRam(event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
              </label>
              <label className="text-sm font-semibold">Color
                <select value={color} onChange={(event) => setColor(event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2">
                  <option value="">Select</option>
                  {(colorOptions.length > 0 ? colorOptions : ["Black", "White", "Blue", "Red", "Green", "Silver", "Gold", "Other"]).map((value) => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-semibold">Battery Health (optional)
                <input value={batteryHealth} onChange={(event) => setBatteryHealth(event.target.value)} placeholder="e.g. 92%" className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
              </label>
              <label className="text-sm font-semibold">Warranty
                <select value={warranty} onChange={(event) => setWarranty(event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2">
                  <option value="">Select</option>
                  {WARRANTY_OPTIONS.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold">Repair History
                <select value={repairHistory} onChange={(event) => setRepairHistory(event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2">
                  <option value="">Select</option>
                  {REPAIR_HISTORY_OPTIONS.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold">Network Registered
                <select value={networkRegistered} onChange={(event) => setNetworkRegistered(event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2">
                  <option value="">Select</option>
                  {NETWORK_REGISTERED_OPTIONS.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold sm:col-span-2">
                <span className="flex items-center gap-2">
                  <input type="checkbox" checked={boxIncluded} onChange={(event) => setBoxIncluded(event.target.checked)} className="h-4 w-4" />
                  Box Included
                </span>
              </label>
              <label className="text-sm font-semibold sm:col-span-2">
                <span className="flex items-center gap-2">
                  <input type="checkbox" checked={chargerIncluded} onChange={(event) => setChargerIncluded(event.target.checked)} className="h-4 w-4" />
                  Charger Included
                </span>
              </label>
              <label className="text-sm font-semibold sm:col-span-2">Description
                <textarea rows={4} value={description} onChange={(event) => setDescription(event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
              </label>
            </div>
          </section>
        ) : null}

        {step === "photos" ? (
          <section className="rounded-2xl border border-[var(--line)] bg-white p-4">
            <h2 className="font-display text-lg font-bold">{t.postAdElectronics.photos}</h2>
            <p className="mt-1 text-sm text-[var(--ink-2)]">
              {postingConfig.requires_images ? `Photos required. Minimum ${postingConfig.min_images}.` : "Photos optional."}
              {postingConfig.recommended_images ? ` Recommended: ${postingConfig.recommended_images}` : ""}
            </p>

            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={pickFiles} />
            {images.length === 0 ? (
              <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-3 w-full rounded-2xl border-2 border-dashed border-[var(--line)] py-10 text-sm font-semibold">
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
                        <button type="button" onClick={() => setPrimary(index)}>Primary</button>
                        <button type="button" onClick={() => removeImage(index)}>Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
                {images.length < postingConfig.max_images ? (
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-xl border border-[var(--line)] px-3 py-2 text-sm font-semibold">
                    {t.postAd.addMore}
                  </button>
                ) : null}
              </div>
            )}
          </section>
        ) : null}

        {step === "location" ? (
          <section className="rounded-2xl border border-[var(--line)] bg-white p-4">
            <h2 className="font-display text-lg font-bold">{t.postAd.whereLocated}</h2>
            <p className="mt-1 text-sm text-[var(--ink-2)]">{t.postAd.chooseLocationMethod}</p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
            </div>

            {isDetectingLocation ? (
              <p className="mt-3 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-sm">{t.postAd.detectingLocation}</p>
            ) : null}

            {locationHint ? (
              <p className="mt-3 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-sm">{locationHint}</p>
            ) : null}

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold">Province
                <select
                  value={selectedProvinceId ? String(selectedProvinceId) : ""}
                  onChange={async (event) => {
                    const next = event.target.value ? Number(event.target.value) : null;
                    setSelectedProvinceId(next);
                    setLocationConfirmed(locationMethod === "manual");
                    setSelectedDistrictId(null);
                    setDistrict("");
                    if (next) {
                      const selected = provinceOptions.find((item) => item.id === next);
                      setProvince(selected?.name ?? "");
                      await loadDistricts(next);
                    } else {
                      setProvince("");
                      setDistrictOptions([]);
                    }
                  }}
                  className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
                >
                  <option value="">Select province</option>
                  {provinceOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold">District
                <select
                  value={selectedDistrictId ? String(selectedDistrictId) : ""}
                  onChange={(event) => {
                    const next = event.target.value ? Number(event.target.value) : null;
                    setSelectedDistrictId(next);
                    const selected = districtOptions.find((item) => item.id === next);
                    setDistrict(selected?.name ?? "");
                    setLocationConfirmed(locationMethod === "manual");
                  }}
                  className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
                  disabled={!selectedProvinceId}
                >
                  <option value="">Select district</option>
                  {districtOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold sm:col-span-2">Area (optional)
                <input value={area} onChange={(event) => setArea(event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
              </label>
              <label className="text-sm font-semibold sm:col-span-2">Location Visibility
                <select value={locationVisibility} onChange={(event) => setLocationVisibility(event.target.value as "exact" | "approximate" | "province_district")} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2">
                  <option value="province_district">{t.postAd.hideExactShowProvinceDistrict}</option>
                  <option value="approximate">{t.postAd.showApproximateLocation}</option>
                  <option value="exact">{t.postAd.showExactLocation}</option>
                </select>
              </label>
              {locationMethod === "device" && deviceLatitude !== null && deviceLongitude !== null ? (
                <div className="sm:col-span-2 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3 text-sm">
                  <p className="font-semibold">Detected Location</p>
                  <p className="mt-1">Province: {province || "Not matched"}</p>
                  <p>District: {district || "Not matched"}</p>
                  <p>Accuracy: {deviceAccuracy !== null ? `${deviceAccuracy} m` : "Unknown"}</p>
                  <button type="button" onClick={handleConfirmDetectedLocation} className="mt-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white">
                    {t.postAd.confirmLocation}
                  </button>
                </div>
              ) : null}
              <label className="text-sm font-semibold">Contact Phone
                <input value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
              </label>
              <label className="text-sm font-semibold">Contact Name (optional)
                <input value={contactName} onChange={(event) => setContactName(event.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
              </label>
            </div>
          </section>
        ) : null}

        {step === "preview" ? (
          <section className="rounded-2xl border border-[var(--line)] bg-white p-4">
            <h2 className="font-display text-lg font-bold">{t.postAd.preview}</h2>
            <div className="mt-3 grid gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3 text-sm">
              <p><span className="font-semibold">{t.postAdElectronics.path}:</span> {breadcrumb}</p>
              <p><span className="font-semibold">{t.postAd.price}:</span> {price ? `${price} ${currency}` : "-"}</p>
              <p><span className="font-semibold">{t.postAd.condition}:</span> {condition || "-"}</p>
              <p><span className="font-semibold">{t.postAd.storage}:</span> {storage || "-"}</p>
              <p><span className="font-semibold">{t.postAdElectronics.locationLabel}:</span> {province || "-"}{district ? `, ${district}` : ""}</p>
              <p><span className="font-semibold">{t.postAd.photosLabel}:</span> {images.length}</p>
            </div>
          </section>
        ) : null}

        {stepError ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{stepError}</p> : null}
        {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p> : null}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--line)] bg-white px-4 py-3">
        <div className="mx-auto flex w-full max-w-5xl gap-2">
          {step !== "category" ? (
            <button type="button" onClick={gotoPrev} className="rounded-xl border border-[var(--line)] px-4 py-3 text-sm font-semibold">
              {t.postAd.back}
            </button>
          ) : null}

          {step !== "preview" ? (
            <button type="button" onClick={gotoNext} className="flex-1 rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-bold text-white">
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
