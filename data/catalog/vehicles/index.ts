import { AGRICULTURAL_BRANDS } from "./agricultural";
import { CAR_BRANDS } from "./cars";
import { HEAVY_TRUCK_BRANDS } from "./heavy-trucks";
import { MOTORCYCLE_BRANDS } from "./motorcycles";
import { PICKUP_BRANDS } from "./pickups";
import { VAN_MINIBUS_BRANDS } from "./vans-minibuses";
import {
  OTHER_BRAND_OPTION,
  OTHER_MODEL_OPTION,
  VEHICLE_BRANCH_DEFINITIONS,
  VEHICLE_LOCKED_SPEC_LABELS,
  type VehicleBranchDefinition,
  type VehicleBranchKey,
  type VehicleBrandCatalog,
  type VehicleModelCatalog,
  type VehicleOption,
} from "./vehicleFields";

export * from "./vehicleFields";
export { CAR_BRANDS } from "./cars";
export { MOTORCYCLE_BRANDS } from "./motorcycles";
export { PICKUP_BRANDS } from "./pickups";
export { VAN_MINIBUS_BRANDS } from "./vans-minibuses";
export { HEAVY_TRUCK_BRANDS } from "./heavy-trucks";
export { AGRICULTURAL_BRANDS } from "./agricultural";

const BRANDS_BY_BRANCH: Partial<Record<VehicleBranchKey, VehicleBrandCatalog[]>> = {
  cars: CAR_BRANDS,
  motorcycles: MOTORCYCLE_BRANDS,
  pickup: PICKUP_BRANDS,
  vansMinibuses: VAN_MINIBUS_BRANDS,
  heavyTrucks: HEAVY_TRUCK_BRANDS,
  agricultural: AGRICULTURAL_BRANDS,
};

function aggregateCompatibilityBrands(): VehicleBrandCatalog[] {
  const merged = new Map<string, VehicleBrandCatalog>();

  for (const group of Object.values(BRANDS_BY_BRANCH)) {
    for (const brand of group ?? []) {
      const existing = merged.get(brand.slug);
      if (!existing) {
        merged.set(brand.slug, {
          ...brand,
          models: [...(brand.models ?? [])],
        });
        continue;
      }

      const modelsBySlug = new Map((existing.models ?? []).map((model) => [model.slug, model]));
      for (const model of brand.models ?? []) {
        if (!modelsBySlug.has(model.slug)) {
          modelsBySlug.set(model.slug, model);
        }
      }

      existing.models = Array.from(modelsBySlug.values());
    }
  }

  return Array.from(merged.values()).sort((left, right) => left.name.localeCompare(right.name));
}

const PARTS_COMPATIBILITY_BRANDS = aggregateCompatibilityBrands();

export function getVehicleBranchFromPath(categoryPath?: string | null): VehicleBranchDefinition | null {
  const normalizedPath = String(categoryPath ?? "").toLowerCase();
  if (!normalizedPath) {
    return null;
  }

  for (const definition of VEHICLE_BRANCH_DEFINITIONS) {
    if (definition.pathMatchers.some((matcher) => normalizedPath.includes(matcher))) {
      return definition;
    }
  }

  return normalizedPath.startsWith("vehicles/")
    ? VEHICLE_BRANCH_DEFINITIONS.find((definition) => definition.key === "otherVehicles") ?? null
    : null;
}

export function getVehicleBrandsForBranch(branchKey: VehicleBranchKey): VehicleBrandCatalog[] {
  if (branchKey === "parts") {
    return PARTS_COMPATIBILITY_BRANDS;
  }

  return BRANDS_BY_BRANCH[branchKey] ?? [];
}

export function findVehicleBrand(
  branchKey: VehicleBranchKey,
  brandSlug?: string | null
): VehicleBrandCatalog | null {
  if (!brandSlug) {
    return null;
  }

  return getVehicleBrandsForBranch(branchKey).find((brand) => brand.slug === brandSlug) ?? null;
}

export function getVehicleModelsForBrand(
  branchKey: VehicleBranchKey,
  brandSlug?: string | null
): VehicleModelCatalog[] {
  const brand = findVehicleBrand(branchKey, brandSlug);
  return brand?.models ?? [];
}

export function findVehicleModel(
  branchKey: VehicleBranchKey,
  brandSlug?: string | null,
  modelSlug?: string | null
): VehicleModelCatalog | null {
  if (!modelSlug) {
    return null;
  }

  return getVehicleModelsForBrand(branchKey, brandSlug).find((model) => model.slug === modelSlug) ?? null;
}

export function withOtherBrandOption(brands: VehicleBrandCatalog[], enabled: boolean): VehicleBrandCatalog[] {
  return enabled ? [...brands, { ...OTHER_BRAND_OPTION, models: [{ ...OTHER_MODEL_OPTION }] }] : brands;
}

export function withOtherModelOption(models: VehicleModelCatalog[], enabled: boolean): VehicleModelCatalog[] {
  return enabled ? [...models, { ...OTHER_MODEL_OPTION }] : models;
}

export function getVehicleLockedSpecs(args: {
  branchLabel: string;
  subtypeName?: string | null;
  brandName?: string | null;
  modelName?: string | null;
  variantName?: string | null;
  bodyCategory?: string | null;
}): Array<{ spec_key: string; spec_label: string; spec_value: string; is_locked: true }> {
  const rows = [
    args.branchLabel
      ? { spec_key: "vehicle_type", spec_label: VEHICLE_LOCKED_SPEC_LABELS.vehicle_type, spec_value: args.branchLabel, is_locked: true as const }
      : null,
    args.subtypeName
      ? { spec_key: "vehicle_subtype", spec_label: VEHICLE_LOCKED_SPEC_LABELS.vehicle_subtype, spec_value: args.subtypeName, is_locked: true as const }
      : null,
    args.brandName
      ? { spec_key: "make", spec_label: VEHICLE_LOCKED_SPEC_LABELS.make, spec_value: args.brandName, is_locked: true as const }
      : null,
    args.modelName
      ? { spec_key: "model", spec_label: VEHICLE_LOCKED_SPEC_LABELS.model, spec_value: args.modelName, is_locked: true as const }
      : null,
    args.variantName
      ? { spec_key: "variant", spec_label: VEHICLE_LOCKED_SPEC_LABELS.variant, spec_value: args.variantName, is_locked: true as const }
      : null,
    args.bodyCategory
      ? { spec_key: "body_category", spec_label: VEHICLE_LOCKED_SPEC_LABELS.body_category, spec_value: args.bodyCategory, is_locked: true as const }
      : null,
  ];

  return rows.filter((row): row is NonNullable<typeof row> => Boolean(row));
}

export function normalizeVehicleText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function vehicleSelectionMessageKey(branch: VehicleBranchDefinition) {
  switch (branch.key) {
    case "parts":
      return "parts";
    case "damaged":
      return "damaged";
    default:
      return "generic";
  }
}
