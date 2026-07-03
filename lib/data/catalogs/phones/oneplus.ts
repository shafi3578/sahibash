/**
 * OnePlus - Model Catalog
 * OnePlus flagship and mid-range models
 */

import type { CatalogModel } from "@/lib/catalog/types";

const COLORS = ["Obsidian Black", "Silk White", "Stellar Blue", "Green", "Red", "Orange"];

export const MODELS: CatalogModel[] = [
  {
    id: "oneplus-13-pro",
    brandId: "oneplus",
    name: "OnePlus 13 Pro",
    releaseYear: 2024,
    type: "smartphone",
    stableSpecs: [
      { key: "brand", label: { en: "Brand", fa: "برند", ps: "برانډ" }, value: "OnePlus", confidence: 1.0, editable: false },
      { key: "exactModel", label: { en: "Model", fa: "نموذج", ps: "ماډل" }, value: "OnePlus 13 Pro", confidence: 1.0, editable: false },
      { key: "os", label: { en: "Operating System", fa: "نظام التشغيل", ps: "آپریٹنګ سسٹم" }, value: "Android", confidence: 1.0, editable: false },
      { key: "screenSize", label: { en: "Screen Size", fa: "حجم الشاشة", ps: "د سکرین سائز" }, value: "6.82 inches", confidence: 1.0, editable: false },
    ],
    requiredSellerFields: ["storage", "ram", "condition", "price", "location"],
    optionalSellerFields: ["color", "screenCondition", "bodyCondition", "warranty", "purchasePlace"],
    buyerDetailFields: ["brand", "exactModel", "storage", "ram", "color", "condition"],
    searchAliases: ["OnePlus 13 Pro"],
    variantOptions: {
      storage: ["256GB", "512GB"],
      ram: ["12GB", "16GB"],
      color: COLORS,
    },
    active: true,
  },
  {
    id: "oneplus-13",
    brandId: "oneplus",
    name: "OnePlus 13",
    releaseYear: 2024,
    type: "smartphone",
    stableSpecs: [
      { key: "brand", label: { en: "Brand", fa: "برند", ps: "برانډ" }, value: "OnePlus", confidence: 1.0, editable: false },
      { key: "exactModel", label: { en: "Model", fa: "نموذج", ps: "ماډل" }, value: "OnePlus 13", confidence: 1.0, editable: false },
      { key: "os", label: { en: "Operating System", fa: "نظام التشغيل", ps: "آپریٹنګ سسٹم" }, value: "Android", confidence: 1.0, editable: false },
      { key: "screenSize", label: { en: "Screen Size", fa: "حجم الشاشة", ps: "د سکرین سائز" }, value: "6.7 inches", confidence: 1.0, editable: false },
    ],
    requiredSellerFields: ["storage", "ram", "condition", "price", "location"],
    optionalSellerFields: ["color", "screenCondition", "bodyCondition", "warranty", "purchasePlace"],
    buyerDetailFields: ["brand", "exactModel", "storage", "ram", "color", "condition"],
    searchAliases: ["OnePlus 13"],
    variantOptions: {
      storage: ["256GB", "512GB"],
      ram: ["12GB"],
      color: COLORS,
    },
    active: true,
  },
];
