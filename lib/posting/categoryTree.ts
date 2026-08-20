/**
 * Category Tree Utilities
 * Handles loading category nodes at different levels
 */

import type { CategoryNode } from "@/lib/posting/types";

const CATEGORY_TREE: Record<string, CategoryNode> = {};

function registerNode(node: CategoryNode): CategoryNode {
  CATEGORY_TREE[node.id] = node;
  return node;
}

function createNode(node: Omit<CategoryNode, "active" | "sortOrder" | "finalNode"> & Partial<Pick<CategoryNode, "active" | "sortOrder" | "finalNode">>) {
  return registerNode({
    active: true,
    sortOrder: 0,
    finalNode: false,
    ...node,
  });
}

function createFinalNode(
  node: Omit<CategoryNode, "active" | "sortOrder" | "finalNode"> &
    Partial<Pick<CategoryNode, "active" | "sortOrder" | "finalNode">>
) {
  return createNode({
    ...node,
    finalNode: true,
  });
}

const phonesElectronics = createNode({
  id: "phones_electronics",
  slug: "phones-electronics",
  labelKey: "postAdElectronics.phonesElectronics",
  type: "main_category",
  sortOrder: 1,
  finalNode: false,
});

const mobilePhones = createNode({
  id: "mobile_phones",
  parentId: phonesElectronics.id,
  slug: "mobile-phones",
  labelKey: "postAdElectronics.category",
  type: "subcategory",
  sortOrder: 1,
});

createNode({
  id: "tablets",
  parentId: phonesElectronics.id,
  slug: "tablets",
  labelKey: "postAd.select",
  type: "subcategory",
  sortOrder: 2,
});

createNode({
  id: "laptops",
  parentId: phonesElectronics.id,
  slug: "laptops",
  labelKey: "search.brand",
  type: "subcategory",
  sortOrder: 3,
});

createNode({
  id: "electronics_accessories",
  parentId: phonesElectronics.id,
  slug: "accessories",
  labelKey: "postAdElectronics.selectBrand",
  type: "subcategory",
  sortOrder: 4,
});

const appleBrand = createNode({
  id: "apple_brand",
  parentId: mobilePhones.id,
  slug: "apple",
  labelKey: "postAdElectronics.selectBrand",
  type: "brand",
  sortOrder: 1,
  catalogId: "apple_phones",
  name: "Apple",
  aliases: ["iPhone", "iOS"],
});

const samsungBrand = createNode({
  id: "samsung_brand",
  parentId: mobilePhones.id,
  slug: "samsung",
  labelKey: "postAdElectronics.selectModel",
  type: "brand",
  sortOrder: 2,
  catalogId: "samsung_phones",
  name: "Samsung",
  aliases: ["Galaxy"],
});

const xiaomiBrand = createNode({
  id: "xiaomi_brand",
  parentId: mobilePhones.id,
  slug: "xiaomi",
  labelKey: "postAdElectronics.selectModel",
  type: "brand",
  sortOrder: 3,
  catalogId: "xiaomi_phones",
  name: "Xiaomi",
  aliases: ["Redmi", "Poco", "POCO"],
});

const googleBrand = createNode({
  id: "google_brand",
  parentId: mobilePhones.id,
  slug: "google",
  labelKey: "postAdElectronics.selectModel",
  type: "brand",
  sortOrder: 4,
  catalogId: "google_phones",
  name: "Google",
  aliases: ["Pixel"],
});

createNode({
  id: "huawei_brand",
  parentId: mobilePhones.id,
  slug: "huawei",
  labelKey: "postAdElectronics.selectModel",
  type: "brand",
  sortOrder: 5,
  catalogId: "huawei_phones",
  name: "Huawei",
});

createNode({
  id: "oppo_brand",
  parentId: mobilePhones.id,
  slug: "oppo",
  labelKey: "postAdElectronics.selectModel",
  type: "brand",
  sortOrder: 6,
  catalogId: "oppo_phones",
  name: "Oppo",
});

createNode({
  id: "vivo_brand",
  parentId: mobilePhones.id,
  slug: "vivo",
  labelKey: "postAdElectronics.selectModel",
  type: "brand",
  sortOrder: 7,
  catalogId: "vivo_phones",
  name: "Vivo",
});

createNode({
  id: "oneplus_brand",
  parentId: mobilePhones.id,
  slug: "oneplus",
  labelKey: "postAdElectronics.selectModel",
  type: "brand",
  sortOrder: 8,
  catalogId: "oneplus_phones",
  name: "OnePlus",
});

createNode({
  id: "motorola_brand",
  parentId: mobilePhones.id,
  slug: "motorola",
  labelKey: "postAdElectronics.selectModel",
  type: "brand",
  sortOrder: 9,
  catalogId: "motorola_phones",
  name: "Motorola",
});

const iphoneSeries = createNode({
  id: "iphone_series",
  parentId: appleBrand.id,
  slug: "iphone",
  labelKey: "postAdElectronics.selectModel",
  type: "series",
  sortOrder: 1,
  catalogId: "apple_iphone_series",
  name: "iPhone",
  aliases: ["iPhone Series"],
});

const androidModelSchema = "android_seller_details";
const vehicleSchemaId = "vehicle_seller_details";
const realEstateSchemaId = "real_estate_seller_details";

createFinalNode({
  id: "iphone_15_pro_max",
  parentId: iphoneSeries.id,
  slug: "iphone-15-pro-max",
  labelKey: "postAd.itemType",
  type: "model",
  sortOrder: 1,
  schemaId: "iphone_seller_details",
  stableSpecsId: "iphone_15_pro_max_specs",
  name: "iPhone 15 Pro Max",
});

createFinalNode({
  id: "iphone_15_pro",
  parentId: iphoneSeries.id,
  slug: "iphone-15-pro",
  labelKey: "postAd.itemType",
  type: "model",
  sortOrder: 2,
  schemaId: "iphone_seller_details",
  stableSpecsId: "iphone_15_pro_specs",
  name: "iPhone 15 Pro",
});

createFinalNode({
  id: "iphone_15",
  parentId: iphoneSeries.id,
  slug: "iphone-15",
  labelKey: "postAd.itemType",
  type: "model",
  sortOrder: 3,
  schemaId: "iphone_seller_details",
  stableSpecsId: "iphone_15_specs",
  name: "iPhone 15",
});

createFinalNode({
  id: "iphone_14_pro_max",
  parentId: iphoneSeries.id,
  slug: "iphone-14-pro-max",
  labelKey: "postAd.itemType",
  type: "model",
  sortOrder: 4,
  schemaId: "iphone_seller_details",
  stableSpecsId: "iphone_14_pro_max_specs",
  name: "iPhone 14 Pro Max",
});

createFinalNode({
  id: "iphone_14_pro",
  parentId: iphoneSeries.id,
  slug: "iphone-14-pro",
  labelKey: "postAd.itemType",
  type: "model",
  sortOrder: 5,
  schemaId: "iphone_seller_details",
  stableSpecsId: "iphone_14_pro_specs",
  name: "iPhone 14 Pro",
});

createFinalNode({
  id: "iphone_14",
  parentId: iphoneSeries.id,
  slug: "iphone-14",
  labelKey: "postAd.itemType",
  type: "model",
  sortOrder: 6,
  schemaId: "iphone_seller_details",
  stableSpecsId: "iphone_14_specs",
  name: "iPhone 14",
});

createFinalNode({
  id: "iphone_13_pro_max",
  parentId: iphoneSeries.id,
  slug: "iphone-13-pro-max",
  labelKey: "postAd.itemType",
  type: "model",
  sortOrder: 7,
  schemaId: "iphone_seller_details",
  stableSpecsId: "iphone_13_pro_max_specs",
  name: "iPhone 13 Pro Max",
});

createFinalNode({
  id: "iphone_13_pro",
  parentId: iphoneSeries.id,
  slug: "iphone-13-pro",
  labelKey: "postAd.itemType",
  type: "model",
  sortOrder: 8,
  schemaId: "iphone_seller_details",
  stableSpecsId: "iphone_13_pro_specs",
  name: "iPhone 13 Pro",
});

createFinalNode({
  id: "iphone_13",
  parentId: iphoneSeries.id,
  slug: "iphone-13",
  labelKey: "postAd.itemType",
  type: "model",
  sortOrder: 9,
  schemaId: "iphone_seller_details",
  stableSpecsId: "iphone_13_specs",
  name: "iPhone 13",
});

createFinalNode({
  id: "iphone_11_pro_max",
  parentId: iphoneSeries.id,
  slug: "iphone-11-pro-max",
  labelKey: "postAd.itemType",
  type: "model",
  sortOrder: 10,
  schemaId: "iphone_seller_details",
  stableSpecsId: "iphone_11_pro_max_specs",
  name: "iPhone 11 Pro Max",
});

createFinalNode({
  id: "iphone_11",
  parentId: iphoneSeries.id,
  slug: "iphone-11",
  labelKey: "postAd.itemType",
  type: "model",
  sortOrder: 11,
  schemaId: "iphone_seller_details",
  stableSpecsId: "iphone_11_specs",
  name: "iPhone 11",
});

createFinalNode({
  id: "iphone_se_3rd_gen",
  parentId: iphoneSeries.id,
  slug: "iphone-se-3rd-gen",
  labelKey: "postAd.itemType",
  type: "model",
  sortOrder: 12,
  schemaId: "iphone_seller_details",
  stableSpecsId: "iphone_se_3rd_gen_specs",
  name: "iPhone SE (3rd generation)",
  aliases: ["iPhone SE 3", "iPhone SE 2022"],
});

const samsungModels = [
  ["samsung_galaxy_s25", "Galaxy S25"],
  ["samsung_galaxy_s24", "Galaxy S24"],
  ["samsung_galaxy_s23_ultra", "Galaxy S23 Ultra"],
  ["samsung_galaxy_s23", "Galaxy S23"],
  ["samsung_galaxy_s22_ultra", "Galaxy S22 Ultra"],
  ["samsung_galaxy_a55", "Galaxy A55"],
  ["samsung_galaxy_a54", "Galaxy A54"],
  ["samsung_galaxy_a53", "Galaxy A53"],
  ["samsung_galaxy_a25_5g", "Galaxy A25 5G"],
  ["samsung_galaxy_a15_5g", "Galaxy A15 5G"],
] as const;

for (const [id, name] of samsungModels) {
  createFinalNode({
    id,
    parentId: samsungBrand.id,
    slug: id.replace(/_/g, "-"),
    labelKey: "postAd.itemType",
    type: "model",
    sortOrder: 10,
    schemaId: androidModelSchema,
    name,
    aliases: [name.replace(/^Galaxy\s+/i, "")],
  });
}

const xiaomiModels = [
  ["xiaomi_13_ultra", "Xiaomi 13 Ultra"],
  ["xiaomi_13t", "Xiaomi 13T"],
  ["xiaomi_12_pro", "Xiaomi 12 Pro"],
  ["redmi_note_11", "Redmi Note 11"],
  ["poco_x4_pro_5g", "POCO X4 Pro 5G"],
] as const;

for (const [id, name] of xiaomiModels) {
  createFinalNode({
    id,
    parentId: xiaomiBrand.id,
    slug: id.replace(/_/g, "-"),
    labelKey: "postAd.itemType",
    type: "model",
    sortOrder: 10,
    schemaId: androidModelSchema,
    name,
  });
}

const googleModels = [
  ["google_pixel_6a", "Pixel 6a"],
  ["google_pixel_5a_5g", "Pixel 5a 5G"],
  ["google_pixel_4a", "Pixel 4a"],
] as const;

for (const [id, name] of googleModels) {
  createFinalNode({
    id,
    parentId: googleBrand.id,
    slug: id.replace(/_/g, "-"),
    labelKey: "postAd.itemType",
    type: "model",
    sortOrder: 10,
    schemaId: androidModelSchema,
    name,
    aliases: [name],
  });
}

const vehiclesRoot = createNode({
  id: "vehicles",
  slug: "vehicles",
  labelKey: "postAd.vehicleDetails",
  type: "main_category",
  sortOrder: 2,
});

const vehiclesCars = createNode({
  id: "vehicles_cars",
  parentId: vehiclesRoot.id,
  slug: "cars",
  labelKey: "postAd.vehicleDetails",
  type: "subcategory",
  sortOrder: 1,
});

createNode({
  id: "vehicles_motorcycles",
  parentId: vehiclesRoot.id,
  slug: "motorcycles",
  labelKey: "postAd.vehicleDetails",
  type: "subcategory",
  sortOrder: 2,
});

createNode({
  id: "vehicles_parts",
  parentId: vehiclesRoot.id,
  slug: "parts-accessories",
  labelKey: "postAd.vehicleDetails",
  type: "subcategory",
  sortOrder: 3,
});

const vehicleModels = [
  ["toyota_corolla", "Toyota Corolla"],
  ["honda_civic", "Honda Civic"],
  ["suzuki_swift", "Suzuki Swift"],
  ["datsun_go", "Datsun GO"],
  ["hyundai_elantra", "Hyundai Elantra"],
] as const;

for (const [id, name] of vehicleModels) {
  createFinalNode({
    id,
    parentId: vehiclesCars.id,
    slug: id.replace(/_/g, "-"),
    labelKey: "postAd.itemType",
    type: "model",
    sortOrder: 10,
    schemaId: vehicleSchemaId,
    name,
  });
}

const realEstateRoot = createNode({
  id: "real_estate",
  slug: "real-estate",
  labelKey: "postAd.propertyType",
  type: "main_category",
  sortOrder: 3,
});

const realEstateApartments = createNode({
  id: "real_estate_apartments",
  parentId: realEstateRoot.id,
  slug: "apartments",
  labelKey: "postAd.propertyType",
  type: "subcategory",
  sortOrder: 1,
});

const realEstateHouses = createNode({
  id: "real_estate_houses",
  parentId: realEstateRoot.id,
  slug: "houses",
  labelKey: "postAd.propertyType",
  type: "subcategory",
  sortOrder: 2,
});

const realEstateLand = createNode({
  id: "real_estate_land",
  parentId: realEstateRoot.id,
  slug: "land",
  labelKey: "postAd.propertyType",
  type: "subcategory",
  sortOrder: 3,
});

createNode({
  id: "real_estate_commercial",
  parentId: realEstateRoot.id,
  slug: "shops-commercial",
  labelKey: "postAd.propertyType",
  type: "subcategory",
  sortOrder: 4,
});

const realEstateFinalNodes = [
  ["apartment", realEstateApartments.id, "Apartment"],
  ["house", realEstateHouses.id, "House"],
  ["villa", realEstateHouses.id, "Villa"],
  ["land", realEstateLand.id, "Land"],
  ["shop", "real_estate_commercial", "Shop"],
  ["warehouse", "real_estate_commercial", "Warehouse"],
] as const;

for (const [id, parentId, name] of realEstateFinalNodes) {
  createFinalNode({
    id,
    parentId,
    slug: id.replace(/_/g, "-"),
    labelKey: "postAd.itemType",
    type: "property_type",
    sortOrder: 10,
    schemaId: realEstateSchemaId,
    name,
  });
}

/**
 * Export CATEGORY_TREE for external use
 */
export { CATEGORY_TREE };

/**
 * Get root categories (main_category type)
 */
export function getRootCategories(): CategoryNode[] {
  return Object.values(CATEGORY_TREE)
    .filter((node) => node.type === "main_category" && node.active)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Get children of a category node
 */
export function getChildCategories(parentId: string): CategoryNode[] {
  return Object.values(CATEGORY_TREE)
    .filter((node) => node.parentId === parentId && node.active)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Get a specific category node by id
 */
export function getCategoryNode(id: string): CategoryNode | undefined {
  return CATEGORY_TREE[id];
}

/**
 * Get full path from root to a node
 */
export function getCategoryPath(nodeId: string): CategoryNode[] {
  const path: CategoryNode[] = [];
  let currentId: string | undefined = nodeId;

  while (currentId) {
    const node: CategoryNode | undefined = CATEGORY_TREE[currentId];
    if (!node) break;
    path.unshift(node);
    currentId = node.parentId;
  }

  return path;
}

/**
 * Validate that a category path ends at a final node
 */
export function isValidCategoryPath(path: CategoryNode[]): boolean {
  if (path.length === 0) return false;
  const lastNode = path[path.length - 1];
  return lastNode.finalNode === true;
}

/**
 * Find the most specific category that contains given keywords
 * Returns full path to that category
 */
export function findCategoryByKeywords(keywords: string[]): CategoryNode[] | null {
  const searchText = keywords.join(" ").toLowerCase().trim();

  for (const node of Object.values(CATEGORY_TREE)) {
    const haystack = [node.name, node.slug, node.labelKey, ...(node.aliases ?? [])]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (node.finalNode && haystack.includes(searchText)) {
      return getCategoryPath(node.id);
    }
  }

  return null;
}
