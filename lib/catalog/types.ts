/**
 * Catalog System Types
 * Defines the structure for brands, models, specs, and auto-fill logic
 */

export type SpecConfidence = 0.5 | 0.75 | 0.9 | 0.95 | 1.0;

export interface StableSpec {
  key: string;
  label: {
    en: string;
    fa: string;
    ps: string;
  };
  value: string | boolean | number | string[];
  confidence: SpecConfidence;
  editable: boolean;
  searchAliases?: string[];
}

export interface VariantOption {
  id: string;
  name: string;
  stableSpecs?: StableSpec[];
}

export interface CatalogModel {
  id: string;
  brandId: string;
  name: string;
  nameAliases?: string[];
  releaseYear?: number;
  type: "smartphone" | "tablet" | "laptop" | "tv" | "car" | "motorcycle" | "property" | string;
  stableSpecs: StableSpec[];
  variantOptions?: VariantOption[] | Record<string, string[]>;
  requiredSellerFields: string[];
  optionalSellerFields: string[];
  buyerDetailFields: string[];
  searchAliases: string[];
  active: boolean;
}

export interface CatalogBrand {
  id: string;
  name: string;
  aliases?: string[];
  categoryId: string;
  logo?: string;
  active: boolean;
}

export interface CatalogCategory {
  id: string;
  name: string;
  type: "phones" | "vehicles" | "laptops" | "realEstate" | "tv" | "accessories";
  rootSlugs: string[];
  subcategories: {
    id: string;
    name: string;
    parentCategoryId: string;
  }[];
}

export interface BrandListResponse {
  success: boolean;
  data: CatalogBrand[];
  error?: string;
}

export interface ModelListResponse {
  success: boolean;
  data: CatalogModel[];
  error?: string;
}

export interface ModelDetailResponse {
  success: boolean;
  data: CatalogModel | null;
  error?: string;
}

export interface AutoFilledField {
  key: string;
  label: string;
  value: string | boolean | number;
  source: "catalog_selection";
  confidence: SpecConfidence;
  editable: boolean;
}

export interface AutoFillResult {
  autoFilledSpecs: AutoFilledField[];
  requiredSellerFields: string[];
  optionalSellerFields: string[];
}
