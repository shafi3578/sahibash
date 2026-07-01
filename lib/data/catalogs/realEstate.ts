/**
 * Real Estate Property Type Templates
 * Used to auto-fill property-specific fields without brand/model selection
 */

import type { StableSpec } from "@/lib/catalog/types";

export interface PropertyTemplate {
  id: string;
  name: string;
  type: "house" | "apartment" | "land" | "shop" | "office" | "warehouse" | "room";
  requiredFields: string[];
  optionalFields: string[];
  stableSpecs: StableSpec[];
}

export const PROPERTY_TEMPLATES: Record<string, PropertyTemplate> = {
  house_sale: {
    id: "house_sale",
    name: "House for Sale",
    type: "house",
    requiredFields: ["land_size", "building_size", "rooms", "bathrooms", "document_status", "price", "location"],
    optionalFields: ["floors", "parking", "yard", "water", "electricity", "gas", "boundary_wall", "description"],
    stableSpecs: [
      {
        key: "property_type",
        label: { en: "Property Type", fa: "نوع ملک", ps: "ملک ډول" },
        value: "House",
        confidence: 1.0,
        editable: false,
      },
      {
        key: "transaction_type",
        label: { en: "Transaction Type", fa: "نوع معامله", ps: "معاملې ډول" },
        value: "Sale",
        confidence: 1.0,
        editable: false,
      },
    ],
  },

  house_rent: {
    id: "house_rent",
    name: "House for Rent",
    type: "house",
    requiredFields: ["land_size", "building_size", "rooms", "bathrooms", "monthly_rent", "deposit", "location"],
    optionalFields: ["floors", "furnished", "family_only", "water", "electricity", "parking", "description"],
    stableSpecs: [
      {
        key: "property_type",
        label: { en: "Property Type", fa: "نوع ملک", ps: "ملک ډول" },
        value: "House",
        confidence: 1.0,
        editable: false,
      },
      {
        key: "transaction_type",
        label: { en: "Transaction Type", fa: "نوع معامله", ps: "معاملې ډول" },
        value: "Rent",
        confidence: 1.0,
        editable: false,
      },
    ],
  },

  apartment_sale: {
    id: "apartment_sale",
    name: "Apartment for Sale",
    type: "apartment",
    requiredFields: ["building_size", "rooms", "bathrooms", "floor_number", "document_status", "price", "location"],
    optionalFields: ["elevator", "parking", "water", "electricity", "furnished", "description"],
    stableSpecs: [
      {
        key: "property_type",
        label: { en: "Property Type", fa: "نوع ملک", ps: "ملک ډول" },
        value: "Apartment",
        confidence: 1.0,
        editable: false,
      },
      {
        key: "transaction_type",
        label: { en: "Transaction Type", fa: "نوع معامله", ps: "معاملې ډول" },
        value: "Sale",
        confidence: 1.0,
        editable: false,
      },
    ],
  },

  apartment_rent: {
    id: "apartment_rent",
    name: "Apartment for Rent",
    type: "apartment",
    requiredFields: ["building_size", "rooms", "bathrooms", "floor_number", "monthly_rent", "deposit", "location"],
    optionalFields: ["elevator", "parking", "water", "electricity", "furnished", "family_only", "description"],
    stableSpecs: [
      {
        key: "property_type",
        label: { en: "Property Type", fa: "نوع ملک", ps: "ملک ډول" },
        value: "Apartment",
        confidence: 1.0,
        editable: false,
      },
      {
        key: "transaction_type",
        label: { en: "Transaction Type", fa: "نوع معامله", ps: "معاملې ډول" },
        value: "Rent",
        confidence: 1.0,
        editable: false,
      },
    ],
  },

  land: {
    id: "land",
    name: "Land",
    type: "land",
    requiredFields: ["land_size", "land_type", "document_status", "price", "location"],
    optionalFields: ["road_access", "water_access", "electricity_access", "suitable_use", "description"],
    stableSpecs: [
      {
        key: "property_type",
        label: { en: "Property Type", fa: "نوع ملک", ps: "ملک ډول" },
        value: "Land",
        confidence: 1.0,
        editable: false,
      },
    ],
  },

  shop_sale: {
    id: "shop_sale",
    name: "Shop for Sale",
    type: "shop",
    requiredFields: ["building_size", "location", "price"],
    optionalFields: ["parking", "water", "electricity", "road_access", "description"],
    stableSpecs: [
      {
        key: "property_type",
        label: { en: "Property Type", fa: "نوع ملک", ps: "ملک ډول" },
        value: "Shop",
        confidence: 1.0,
        editable: false,
      },
      {
        key: "transaction_type",
        label: { en: "Transaction Type", fa: "نوع معامله", ps: "معاملې ډول" },
        value: "Sale",
        confidence: 1.0,
        editable: false,
      },
    ],
  },

  shop_rent: {
    id: "shop_rent",
    name: "Shop for Rent",
    type: "shop",
    requiredFields: ["building_size", "monthly_rent", "deposit", "location"],
    optionalFields: ["parking", "water", "electricity", "road_access", "description"],
    stableSpecs: [
      {
        key: "property_type",
        label: { en: "Property Type", fa: "نوع ملک", ps: "ملک ډول" },
        value: "Shop",
        confidence: 1.0,
        editable: false,
      },
      {
        key: "transaction_type",
        label: { en: "Transaction Type", fa: "نوع معامله", ps: "معاملې ډول" },
        value: "Rent",
        confidence: 1.0,
        editable: false,
      },
    ],
  },

  warehouse: {
    id: "warehouse",
    name: "Warehouse",
    type: "warehouse",
    requiredFields: ["building_size", "location", "price"],
    optionalFields: [
      "ceiling_height",
      "truck_access",
      "loading_access",
      "water",
      "electricity",
      "security",
      "road_access",
      "description",
    ],
    stableSpecs: [
      {
        key: "property_type",
        label: { en: "Property Type", fa: "نوع ملک", ps: "ملک ډول" },
        value: "Warehouse",
        confidence: 1.0,
        editable: false,
      },
    ],
  },

  office: {
    id: "office",
    name: "Office",
    type: "office",
    requiredFields: ["building_size", "location", "price"],
    optionalFields: [
      "rooms",
      "parking",
      "water",
      "electricity",
      "elevator",
      "furnished",
      "security",
      "road_access",
      "description",
    ],
    stableSpecs: [
      {
        key: "property_type",
        label: { en: "Property Type", fa: "نوع ملک", ps: "ملک ډول" },
        value: "Office",
        confidence: 1.0,
        editable: false,
      },
    ],
  },
};

/**
 * Get property template by ID
 */
export function getPropertyTemplate(templateId: string): PropertyTemplate | null {
  return PROPERTY_TEMPLATES[templateId] || null;
}

/**
 * Get template ID from category path
 */
export function getTemplateIdFromPath(path: string): string | null {
  const segments = path.toLowerCase().split("/");

  if (segments.includes("house")) {
    return segments.includes("rent") ? "house_rent" : "house_sale";
  }
  if (segments.includes("apartment")) {
    return segments.includes("rent") ? "apartment_rent" : "apartment_sale";
  }
  if (segments.includes("land")) {
    return "land";
  }
  if (segments.includes("shop") || segments.includes("commercial")) {
    return segments.includes("rent") ? "shop_rent" : "shop_sale";
  }
  if (segments.includes("warehouse")) {
    return "warehouse";
  }
  if (segments.includes("office")) {
    return "office";
  }

  return null;
}
