/**
 * Schema Loader
 * Maps category node IDs to their seller detail schemas
 * This enables Step3 to dynamically load the right fields for each category
 */

import type { PostingFieldSchema } from "@/lib/posting/types";
import { getCategoryNode } from "../categoryTree";
import { IPHONE_SELLER_SCHEMA } from "./iphone";
import { ANDROID_SELLER_SCHEMA } from "./android";
import { VEHICLE_SELLER_SCHEMA } from "./vehicle";
import { REAL_ESTATE_SELLER_SCHEMA } from "./realEstate";

/**
 * Maps schema IDs to their seller detail schemas.
 * Category nodes point at these IDs through `schemaId`.
 */
const SCHEMA_BY_ID: Record<string, PostingFieldSchema[]> = {
  iphone_seller_details: IPHONE_SELLER_SCHEMA,
  android_seller_details: ANDROID_SELLER_SCHEMA,
  vehicle_seller_details: VEHICLE_SELLER_SCHEMA,
  real_estate_seller_details: REAL_ESTATE_SELLER_SCHEMA,
};

/**
 * Legacy node IDs that still need to resolve while older flows are being phased out.
 */
const LEGACY_SCHEMA_BY_NODE_ID: Record<string, string> = {
  iphone_13_pro_max: "iphone_seller_details",
  iphone_13_pro: "iphone_seller_details",
  iphone_13: "iphone_seller_details",
  iphone_14_pro_max: "iphone_seller_details",
  iphone_14_pro: "iphone_seller_details",
  iphone_14: "iphone_seller_details",
  iphone_15_pro_max: "iphone_seller_details",
  iphone_15_pro: "iphone_seller_details",
  iphone_15: "iphone_seller_details",
  samsung_galaxy_s23_ultra: "android_seller_details",
  samsung_galaxy_s23: "android_seller_details",
  samsung_galaxy_s22_ultra: "android_seller_details",
  samsung_galaxy_s25: "android_seller_details",
  samsung_galaxy_s24: "android_seller_details",
  samsung_galaxy_a55: "android_seller_details",
  samsung_galaxy_a54: "android_seller_details",
  samsung_galaxy_a53: "android_seller_details",
  samsung_galaxy_a25_5g: "android_seller_details",
  samsung_galaxy_a15_5g: "android_seller_details",
  xiaomi_13_ultra: "android_seller_details",
  xiaomi_13t: "android_seller_details",
  xiaomi_12_pro: "android_seller_details",
  redmi_note_11: "android_seller_details",
  poco_x4_pro_5g: "android_seller_details",
  google_pixel_6a: "android_seller_details",
  google_pixel_5a_5g: "android_seller_details",
  google_pixel_4a: "android_seller_details",
  toyota_corolla: "vehicle_seller_details",
  honda_civic: "vehicle_seller_details",
  suzuki_swift: "vehicle_seller_details",
  datsun_go: "vehicle_seller_details",
  hyundai_elantra: "vehicle_seller_details",
  apartment: "real_estate_seller_details",
  house: "real_estate_seller_details",
  villa: "real_estate_seller_details",
  land: "real_estate_seller_details",
  shop: "real_estate_seller_details",
  warehouse: "real_estate_seller_details",
};

/**
 * Get schema for a specific category by node ID
 * Returns the schema if found, empty array otherwise (no additional seller details needed)
 */
export function getSchemaForCategory(nodeId: string): PostingFieldSchema[] {
  const directSchema = SCHEMA_BY_ID[nodeId];
  if (directSchema) {
    return directSchema;
  }

  const node = getCategoryNode(nodeId);
  if (node?.schemaId && SCHEMA_BY_ID[node.schemaId]) {
    return SCHEMA_BY_ID[node.schemaId];
  }

  const legacySchemaId = LEGACY_SCHEMA_BY_NODE_ID[nodeId];
  if (legacySchemaId && SCHEMA_BY_ID[legacySchemaId]) {
    return SCHEMA_BY_ID[legacySchemaId];
  }

  return [];
}

function inferSchemaIdFromPath(path: string, rootSlug?: string): string | null {
  const normalizedPath = path.toLowerCase();
  const normalizedRoot = rootSlug?.toLowerCase().trim() ?? "";

  if (normalizedRoot === "vehicles" || normalizedPath.includes("/vehicles") || normalizedPath === "vehicles") {
    return "vehicle_seller_details";
  }

  if (normalizedRoot === "real-estate" || normalizedPath.includes("/real-estate") || normalizedPath === "real-estate") {
    return "real_estate_seller_details";
  }

  if (
    normalizedRoot === "mobile-phones-tablets" ||
    normalizedRoot === "phones-electronics" ||
    normalizedPath.includes("iphone") ||
    normalizedPath.includes("apple")
  ) {
    return "iphone_seller_details";
  }

  if (
    normalizedPath.includes("samsung") ||
    normalizedPath.includes("xiaomi") ||
    normalizedPath.includes("redmi") ||
    normalizedPath.includes("poco") ||
    normalizedPath.includes("google") ||
    normalizedPath.includes("pixel") ||
    normalizedPath.includes("huawei") ||
    normalizedPath.includes("oppo") ||
    normalizedPath.includes("vivo") ||
    normalizedPath.includes("oneplus") ||
    normalizedPath.includes("motorola")
  ) {
    return "android_seller_details";
  }

  return null;
}

export function getSchemaForCategoryPath(path: string, rootSlug?: string): PostingFieldSchema[] {
  const schemaId = inferSchemaIdFromPath(path, rootSlug);
  return schemaId ? SCHEMA_BY_ID[schemaId] ?? [] : [];
}

/**
 * Export all schemas for testing/validation
 */
export { IPHONE_SELLER_SCHEMA, ANDROID_SELLER_SCHEMA, VEHICLE_SELLER_SCHEMA, REAL_ESTATE_SELLER_SCHEMA };
