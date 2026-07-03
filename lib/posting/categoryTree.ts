/**
 * Category Tree Utilities
 * Handles loading category nodes at different levels
 */

import type { CategoryNode } from "@/lib/posting/types";

// This would normally come from database
// For now, we define the structure here as placeholder
const CATEGORY_TREE: Record<string, CategoryNode> = {
  // Main categories
  phones_electronics: {
    id: "phones_electronics",
    slug: "phones-electronics",
    labelKey: "postAdElectronics.phonesElectronics",
    type: "main_category",
    active: true,
    sortOrder: 1,
    finalNode: false,
  },
  vehicles: {
    id: "vehicles",
    slug: "vehicles",
    labelKey: "postAd.vehicleDetails",
    type: "main_category",
    active: true,
    sortOrder: 2,
    finalNode: false,
  },
  real_estate: {
    id: "real_estate",
    slug: "real-estate",
    labelKey: "postAd.propertyType",
    type: "main_category",
    active: true,
    sortOrder: 3,
    finalNode: false,
  },

  // Phones & Electronics subcategories
  mobile_phones: {
    id: "mobile_phones",
    parentId: "phones_electronics",
    slug: "mobile-phones",
    labelKey: "postAdElectronics.category",
    type: "subcategory",
    active: true,
    sortOrder: 1,
    finalNode: false,
  },
  laptops: {
    id: "laptops",
    parentId: "phones_electronics",
    slug: "laptops",
    labelKey: "search.brand",
    type: "subcategory",
    active: true,
    sortOrder: 2,
    finalNode: false,
  },
  tablets: {
    id: "tablets",
    parentId: "phones_electronics",
    slug: "tablets",
    labelKey: "postAd.select",
    type: "subcategory",
    active: true,
    sortOrder: 3,
    finalNode: false,
  },

  // Phone Brands
  apple_brand: {
    id: "apple_brand",
    parentId: "mobile_phones",
    slug: "apple",
    labelKey: "postAdElectronics.selectBrand",
    type: "brand",
    active: true,
    sortOrder: 1,
    finalNode: false,
    catalogId: "apple_phones",
  },
  samsung_brand: {
    id: "samsung_brand",
    parentId: "mobile_phones",
    slug: "samsung",
    labelKey: "postAdElectronics.selectModel",
    type: "brand",
    active: true,
    sortOrder: 2,
    finalNode: false,
    catalogId: "samsung_phones",
  },

  // Apple Phone Series
  iphone_series: {
    id: "iphone_series",
    parentId: "apple_brand",
    slug: "iphone",
    labelKey: "postAdElectronics.selectModel",
    type: "series",
    active: true,
    sortOrder: 1,
    finalNode: false,
    catalogId: "apple_iphone_series",
  },

  // iPhone Models (these are final nodes)
  iphone_13_pro_max: {
    id: "iphone_13_pro_max",
    parentId: "iphone_series",
    slug: "iphone-13-pro-max",
    labelKey: "postAd.itemType",
    type: "model",
    active: true,
    sortOrder: 1,
    finalNode: true,
    schemaId: "iphone_seller_details",
    stableSpecsId: "iphone_13_pro_max_specs",
  },
};

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
  // TODO: Implement semantic search
  // For now, simple keyword matching
  const searchText = keywords.join(" ").toLowerCase();

  for (const node of Object.values(CATEGORY_TREE)) {
    if (node.finalNode && node.labelKey.toLowerCase().includes(searchText)) {
      return getCategoryPath(node.id);
    }
  }

  return null;
}
