/**
 * Unified Posting State Type
 * Single source of truth for all posting form data
 */

export type SellingMethod = "sell" | "rent" | "exchange" | "wanted" | "negotiable";

export type LocationData = {
  provinceId?: number;
  provinceName?: string;
  districtId?: number;
  districtName?: string;
  areaText?: string;
  latitude?: number;
  longitude?: number;
  useDeviceLocation: boolean;
  visibility: "exact" | "approximate" | "province_district";
};

export type CategoryNode = {
  id: string;
  parentId?: string;
  slug: string;
  labelKey: string; // i18n key like "category.phones.apple"
  name?: string; // fallback for display
  aliases?: string[];
  type:
    | "main_category"
    | "subcategory"
    | "brand"
    | "series"
    | "model"
    | "variant"
    | "property_type"
    | "item_type";
  icon?: string;
  active: boolean;
  sortOrder: number;
  finalNode: boolean; // only these can be selected as final category
  schemaId?: string; // links to seller detail schema
  catalogId?: string; // links to catalog data
  stableSpecsId?: string; // links to locked specs
};

export type AISuggestion = {
  categoryPath: CategoryNode[];
  confidence: number;
  reasoning: string;
  usedPhotos: boolean;
  usedTitle: boolean;
  usedDescription: boolean;
  usedLocation: boolean;
};

export type PostingState = {
  // Step 1: Basic Ad
  photos: string[]; // array of uploaded file paths/URLs
  title: string;
  description: string;
  location: LocationData;
  sellingMethod: SellingMethod;

  // Step 2: Category Finding
  aiSuggestion?: AISuggestion; // generated from photos, title, desc, location, method
  selectedCategoryPath: CategoryNode[]; // full path from root to final node
  finalCategoryNodeId: string; // id of the last node in path

  // Step 3: Details + Price
  stableSpecs: Record<string, unknown>; // auto-filled, locked specs from catalog
  sellerDetails: Record<string, unknown>; // user-filled category-specific details
  price: number;
  minimumOffer?: number;
  currency: "AFN" | "USD";
  negotiable: boolean;

  // Flow control
  currentStep: 1 | 2 | 3 | 4;
  completedSteps: number[];
  validationErrors: Record<string, string>;
};

export type PostingFieldSchema = {
  id: string; // unique field identifier (e.g., "storage", "color")
  type: "text" | "number" | "select" | "checkbox" | "date" | "percentage"; // field input type
  labelKey: string; // i18n translation key for field label (e.g., "phones.specs.storage")
  required: boolean; // whether field must be filled
  locked?: boolean; // if true, shows as read-only (for auto-filled specs)
  options?: Array<{ value: string | number; labelKey: string }>; // for select/radio types
  unit?: string; // unit display (e.g., "km" for mileage)
  min?: number; // minimum value for number types
  max?: number; // maximum value for number types
  placeholder?: string; // placeholder text
  helpText?: string; // help text below field
  displayOrder?: number; // sort order in form
};

export type CategorySchema = {
  categoryNodeId: string;
  displayName: string;
  sellerDetailFields: PostingFieldSchema[];
};
