/**
 * Catalog utility functions for brand/model lookups and auto-fill logic
 */

import type { CatalogBrand, CatalogModel, AutoFillResult, StableSpec } from "./types";

/**
 * Dynamically load a catalog for a category
 * Prevents loading all catalogs upfront
 */
export async function loadCatalogBrands(
  category: "phones" | "vehicles" | "laptops" | "realEstate" | "tv" | "accessories",
  subcategory?: string
): Promise<CatalogBrand[]> {
  try {
    const response = await fetch(
      `/api/catalog/brands?category=${category}${subcategory ? `&subcategory=${subcategory}` : ""}`
    );
    if (!response.ok) throw new Error("Failed to load brands");
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error loading catalog brands:", error);
    return [];
  }
}

/**
 * Load models for a specific brand
 */
export async function loadCatalogModels(
  category: "phones" | "vehicles" | "laptops" | "realEstate" | "tv" | "accessories",
  brandId: string
): Promise<CatalogModel[]> {
  try {
    const response = await fetch(`/api/catalog/models?category=${category}&brandId=${brandId}`);
    if (!response.ok) throw new Error("Failed to load models");
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error loading catalog models:", error);
    return [];
  }
}

/**
 * Get detailed spec info for a specific model
 */
export async function getModelSpecs(
  category: "phones" | "vehicles" | "laptops" | "realEstate" | "tv" | "accessories",
  modelId: string
): Promise<CatalogModel | null> {
  try {
    const response = await fetch(`/api/catalog/models/${modelId}?category=${category}`);
    if (!response.ok) throw new Error("Failed to load model details");
    const data = await response.json();
    return data.data || null;
  } catch (error) {
    console.error("Error loading model specs:", error);
    return null;
  }
}

/**
 * Generate auto-fill result from selected model
 */
export function generateAutoFill(model: CatalogModel): AutoFillResult {
  return {
    autoFilledSpecs: model.stableSpecs.map((spec) => ({
      key: spec.key,
      label: spec.label.en,
      value: Array.isArray(spec.value) ? spec.value[0] : spec.value,
      source: "catalog_selection" as const,
      confidence: spec.confidence,
      editable: spec.editable,
    })),
    requiredSellerFields: model.requiredSellerFields,
    optionalSellerFields: model.optionalSellerFields,
  };
}

/**
 * Format spec value for display
 */
export function formatSpecValue(value: string | boolean | number | string[]): string {
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  return String(value);
}
