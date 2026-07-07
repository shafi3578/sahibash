"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getVehicleBranchFromPath,
  getVehicleBrandsForBranch,
  getVehicleLockedSpecs,
  getVehicleModelsForBrand,
  normalizeVehicleText,
  withOtherBrandOption,
  withOtherModelOption,
  type VehicleBranchKey,
  type VehicleModelCatalog,
  type VehicleOption,
} from "@/data/catalog/vehicles";

export type VehicleSpec = { spec_key: string; spec_label: string; spec_value: string; is_locked: boolean };

export type VehicleSelection = {
  branchKey: VehicleBranchKey | null;
  branchLabel: string | null;
  subtype: VehicleOption | null;
  brand: VehicleOption | null;
  model: VehicleModelCatalog | null;
  variant: VehicleOption | null;
  otherBrand: string;
  otherModel: string;
  specs: VehicleSpec[];
};

type Props = {
  categoryPath?: string | null;
  aiSuggestedBrand?: string | null;
  aiSuggestedModel?: string | null;
  onChange: (selection: VehicleSelection) => void;
};

export const EMPTY_VEHICLE_SELECTION: VehicleSelection = {
  branchKey: null,
  branchLabel: null,
  subtype: null,
  brand: null,
  model: null,
  variant: null,
  otherBrand: "",
  otherModel: "",
  specs: [],
};

function isOtherSlug(value?: string | null) {
  return value === "other-brand" || value === "other-model";
}

export function VehicleSmartSelector({ categoryPath, aiSuggestedBrand, aiSuggestedModel, onChange }: Props) {
  const branch = useMemo(() => getVehicleBranchFromPath(categoryPath), [categoryPath]);
  const [selectedSubtype, setSelectedSubtype] = useState<VehicleOption | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<VehicleOption | null>(null);
  const [selectedModel, setSelectedModel] = useState<VehicleModelCatalog | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<VehicleOption | null>(null);
  const [otherBrand, setOtherBrand] = useState("");
  const [otherModel, setOtherModel] = useState("");

  useEffect(() => {
    setSelectedSubtype(null);
    setSelectedBrand(null);
    setSelectedModel(null);
    setSelectedVariant(null);
    setOtherBrand("");
    setOtherModel("");
  }, [categoryPath]);

  const brands = useMemo(() => {
    if (!branch) {
      return [];
    }
    return withOtherBrandOption(getVehicleBrandsForBranch(branch.key), Boolean(branch.supportsOtherBrand));
  }, [branch]);

  const models = useMemo(() => {
    if (!branch || !selectedBrand) {
      return [];
    }
    return withOtherModelOption(
      getVehicleModelsForBrand(branch.key, selectedBrand.slug),
      Boolean(branch.supportsOtherModel)
    );
  }, [branch, selectedBrand]);

  const variants = useMemo(() => {
    if (!selectedModel?.variants) {
      return [];
    }
    return selectedModel.variants;
  }, [selectedModel]);

  useEffect(() => {
    if (!branch || !aiSuggestedBrand) {
      return;
    }

    const normalized = aiSuggestedBrand.toLowerCase().trim();
    const match = brands.find((brand) =>
      brand.name.toLowerCase() === normalized
      || brand.slug === normalized.replace(/\s+/g, "-")
      || (brand.aliases ?? []).some((alias) => alias.toLowerCase() === normalized)
    );

    if (match) {
      setSelectedBrand(match);
    }
  }, [aiSuggestedBrand, branch, brands]);

  useEffect(() => {
    if (!aiSuggestedModel || models.length === 0) {
      return;
    }

    const normalized = aiSuggestedModel.toLowerCase().trim();
    const match = models.find((model) =>
      model.name.toLowerCase() === normalized
      || model.slug === normalized.replace(/\s+/g, "-")
      || (model.aliases ?? []).some((alias) => alias.toLowerCase() === normalized)
      || model.name.toLowerCase().includes(normalized)
      || normalized.includes(model.name.toLowerCase())
    );

    if (match) {
      setSelectedModel(match);
    }
  }, [aiSuggestedModel, models]);

  const resolvedBrandName = useMemo(() => {
    if (selectedBrand && !isOtherSlug(selectedBrand.slug)) {
      return selectedBrand.name;
    }
    return normalizeVehicleText(otherBrand);
  }, [otherBrand, selectedBrand]);

  const resolvedModelName = useMemo(() => {
    if (selectedModel && !isOtherSlug(selectedModel.slug)) {
      return selectedModel.name;
    }
    return normalizeVehicleText(otherModel);
  }, [otherModel, selectedModel]);

  const lockedSpecs = useMemo(() => {
    if (!branch) {
      return [];
    }

    return getVehicleLockedSpecs({
      branchLabel: branch.label,
      subtypeName: selectedSubtype?.name ?? null,
      brandName: resolvedBrandName || null,
      modelName: resolvedModelName || null,
      variantName: selectedVariant?.name ?? null,
      bodyCategory:
        branch.key === "cars"
        || branch.key === "pickup"
        || branch.key === "vansMinibuses"
        || branch.key === "heavyTrucks"
          ? branch.label
          : null,
    });
  }, [branch, resolvedBrandName, resolvedModelName, selectedSubtype, selectedVariant]);

  useEffect(() => {
    onChange({
      branchKey: branch?.key ?? null,
      branchLabel: branch?.label ?? null,
      subtype: selectedSubtype,
      brand: selectedBrand,
      model: selectedModel,
      variant: selectedVariant,
      otherBrand,
      otherModel,
      specs: lockedSpecs,
    });
  }, [branch, lockedSpecs, onChange, otherBrand, otherModel, selectedBrand, selectedModel, selectedSubtype, selectedVariant]);

  if (!branch) {
    return null;
  }

  const breadcrumbParts = [
    branch.label,
    selectedSubtype?.name,
    resolvedBrandName || undefined,
    resolvedModelName || undefined,
    selectedVariant?.name,
  ].filter(Boolean) as string[];

  const showSubtypeChooser = branch.subtypeMode !== "none" && !selectedSubtype && (branch.subtypeOptions?.length ?? 0) > 0;
  const showBrandChooser = !showSubtypeChooser && branch.brandMode !== "none" && brands.length > 0 && !selectedBrand && !resolvedBrandName;
  const showManualBrandInput = !showSubtypeChooser && branch.brandMode !== "none" && brands.length === 0;
  const showModelChooser = !showSubtypeChooser && !showBrandChooser && branch.modelMode !== "none" && Boolean(selectedBrand) && models.length > 0 && !selectedModel && !resolvedModelName;
  const showManualModelInput = !showSubtypeChooser && !showBrandChooser && branch.modelMode !== "none" && ((Boolean(selectedBrand) && models.length === 0) || isOtherSlug(selectedBrand?.slug));
  const showVariantChooser = !showSubtypeChooser && !showBrandChooser && !showModelChooser && variants.length > 0 && !selectedVariant;

  function reset() {
    setSelectedSubtype(null);
    setSelectedBrand(null);
    setSelectedModel(null);
    setSelectedVariant(null);
    setOtherBrand("");
    setOtherModel("");
  }

  return (
    <div className="space-y-3">
      {breadcrumbParts.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-sm">
          {breadcrumbParts.map((part, index) => (
            <span key={`${part}-${index}`} className="flex items-center gap-1">
              {index > 0 ? <span className="text-[var(--ink-2)]">›</span> : null}
              <span className="font-semibold">{part}</span>
            </span>
          ))}
          <button type="button" onClick={reset} className="ml-auto rounded-lg border border-[var(--line)] bg-white px-2 py-0.5 text-xs text-[var(--ink-2)]">
            Change
          </button>
        </div>
      ) : null}

      {showSubtypeChooser ? (
        <div>
          <p className="mb-2 text-sm font-bold">{branch.subtypeLabel ?? "Select Type"}</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {(branch.subtypeOptions ?? []).map((option) => (
              <button
                key={option.slug}
                type="button"
                onClick={() => setSelectedSubtype(option)}
                className="rounded-xl border border-[var(--line)] bg-white px-3 py-3 text-left text-sm font-semibold"
              >
                {option.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {showBrandChooser ? (
        <div>
          <p className="mb-2 text-sm font-bold">{branch.brandMode === "optional" ? "Brand (Optional)" : "Select Brand"}</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {brands.map((brand) => (
              <button
                key={brand.slug}
                type="button"
                onClick={() => {
                  setSelectedBrand(brand);
                  setSelectedModel(null);
                  setSelectedVariant(null);
                  setOtherBrand(brand.slug === "other-brand" ? otherBrand : "");
                  setOtherModel("");
                }}
                className="rounded-xl border border-[var(--line)] bg-white px-3 py-3 text-left text-sm font-semibold"
              >
                {brand.name}
              </button>
            ))}
          </div>
          {branch.brandMode === "optional" ? (
            <button
              type="button"
              onClick={() => {
                setSelectedBrand({ slug: "", name: "" });
                setSelectedModel(null);
                setSelectedVariant(null);
              }}
              className="mt-2 text-xs font-semibold text-[var(--ink-2)]"
            >
              Skip brand
            </button>
          ) : null}
        </div>
      ) : null}

      {showManualBrandInput ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            {branch.brandMode === "required" ? "Other Brand" : "Brand (Optional)"}
            <input
              value={otherBrand}
              onChange={(event) => setOtherBrand(event.target.value)}
              className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
              placeholder="Enter brand"
            />
          </label>
          {branch.modelMode !== "none" ? (
            <label className="text-sm font-semibold">
              {branch.modelMode === "required" ? "Other Model" : "Model (Optional)"}
              <input
                value={otherModel}
                onChange={(event) => setOtherModel(event.target.value)}
                className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
                placeholder="Enter model"
              />
            </label>
          ) : null}
        </div>
      ) : null}

      {showModelChooser ? (
        <div>
          <p className="mb-2 text-sm font-bold">{branch.modelMode === "optional" ? "Model (Optional)" : "Select Model"}</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {models.map((model) => (
              <button
                key={model.slug}
                type="button"
                onClick={() => {
                  setSelectedModel(model);
                  setSelectedVariant(null);
                  setOtherModel(model.slug === "other-model" ? otherModel : "");
                }}
                className="rounded-xl border border-[var(--line)] bg-white px-3 py-3 text-left text-sm font-semibold"
              >
                {model.name}
              </button>
            ))}
          </div>
          {branch.modelMode === "optional" ? (
            <button
              type="button"
              onClick={() => {
                setSelectedModel({ slug: "", name: "" });
                setSelectedVariant(null);
              }}
              className="mt-2 text-xs font-semibold text-[var(--ink-2)]"
            >
              Skip model
            </button>
          ) : null}
        </div>
      ) : null}

      {showManualModelInput ? (
        <label className="block text-sm font-semibold">
          {branch.modelMode === "required" ? "Other Model" : "Model (Optional)"}
          <input
            value={otherModel}
            onChange={(event) => setOtherModel(event.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2"
            placeholder="Enter model"
          />
        </label>
      ) : null}

      {showVariantChooser ? (
        <div>
          <p className="mb-2 text-sm font-bold">Variant / Generation (Optional)</p>
          <div className="grid grid-cols-1 gap-2">
            {variants.map((variant) => (
              <button
                key={variant.slug}
                type="button"
                onClick={() => setSelectedVariant(variant)}
                className="rounded-xl border border-[var(--line)] bg-white px-3 py-3 text-left text-sm font-semibold"
              >
                {variant.name}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setSelectedVariant({ slug: "", name: "" })}
            className="mt-2 text-xs font-semibold text-[var(--ink-2)]"
          >
            Skip variant
          </button>
        </div>
      ) : null}

      {lockedSpecs.length > 0 ? (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink-2)]">Locked Selection Summary</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {lockedSpecs.map((spec) => (
              <div key={spec.spec_key} className="rounded-lg bg-white px-3 py-2 text-sm">
                <p className="text-[var(--ink-2)]">{spec.spec_label}</p>
                <p className="font-semibold">{spec.spec_value}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-[var(--ink-2)]">Only the category path, brand, model, and obvious body/category details are locked. Year, fuel, transmission, mileage, condition, documents, price, and similar item-specific fields stay seller-editable.</p>
        </div>
      ) : null}
    </div>
  );
}