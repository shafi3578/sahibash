/**
 * Schema Loader
 * Maps category node IDs to their seller detail schemas
 * This enables Step3 to dynamically load the right fields for each category
 */

import type { PostingFieldSchema } from "@/lib/posting/types";
import { IPHONE_SELLER_SCHEMA } from "./iphone";
import { ANDROID_SELLER_SCHEMA } from "./android";
import { VEHICLE_SELLER_SCHEMA } from "./vehicle";
import { REAL_ESTATE_SELLER_SCHEMA } from "./realEstate";

/**
 * Maps category node IDs to their seller detail schemas
 * TODO: These IDs should match the actual categoryTree.ts node IDs
 */
const SCHEMA_MAP: Record<string, PostingFieldSchema[]> = {
  // iPhone and variants
  iphone_13_pro_max: IPHONE_SELLER_SCHEMA,
  iphone_13_pro: IPHONE_SELLER_SCHEMA,
  iphone_13: IPHONE_SELLER_SCHEMA,
  iphone_14_pro_max: IPHONE_SELLER_SCHEMA,
  iphone_14_pro: IPHONE_SELLER_SCHEMA,
  iphone_14: IPHONE_SELLER_SCHEMA,
  iphone_15_pro_max: IPHONE_SELLER_SCHEMA,
  iphone_15_pro: IPHONE_SELLER_SCHEMA,
  iphone_15: IPHONE_SELLER_SCHEMA,

  // Samsung and Android devices
  samsung_galaxy_s23_ultra: ANDROID_SELLER_SCHEMA,
  samsung_galaxy_s23: ANDROID_SELLER_SCHEMA,
  samsung_galaxy_a53: ANDROID_SELLER_SCHEMA,
  xiaomi_13_ultra: ANDROID_SELLER_SCHEMA,
  xiaomi_12_pro: ANDROID_SELLER_SCHEMA,

  // Vehicles
  toyota_corolla: VEHICLE_SELLER_SCHEMA,
  honda_civic: VEHICLE_SELLER_SCHEMA,
  suzuki_swift: VEHICLE_SELLER_SCHEMA,
  datsun_go: VEHICLE_SELLER_SCHEMA,
  hyundai_elantra: VEHICLE_SELLER_SCHEMA,

  // Real Estate
  apartment: REAL_ESTATE_SELLER_SCHEMA,
  house: REAL_ESTATE_SELLER_SCHEMA,
  villa: REAL_ESTATE_SELLER_SCHEMA,
  land: REAL_ESTATE_SELLER_SCHEMA,
  shop: REAL_ESTATE_SELLER_SCHEMA,
  warehouse: REAL_ESTATE_SELLER_SCHEMA,
};

/**
 * Get schema for a specific category by node ID
 * Returns the schema if found, empty array otherwise (no additional seller details needed)
 */
export function getSchemaForCategory(nodeId: string): PostingFieldSchema[] {
  return SCHEMA_MAP[nodeId] || [];
}

/**
 * Export all schemas for testing/validation
 */
export { IPHONE_SELLER_SCHEMA, ANDROID_SELLER_SCHEMA, VEHICLE_SELLER_SCHEMA, REAL_ESTATE_SELLER_SCHEMA };
