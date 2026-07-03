/**
 * Motorola - Model Catalog
 */

import type { CatalogModel } from "@/lib/catalog/types";

export const MODELS: CatalogModel[] = [
  {
    id: "motorola-edge-50-pro",
    brandId: "motorola",
    name: "Motorola Edge 50 Pro",
    releaseYear: 2024,
    type: "smartphone",
    stableSpecs: [
      { key: "brand", label: { en: "Brand", fa: "برند", ps: "برانډ" }, value: "Motorola", confidence: 1.0, editable: false },
      { key: "exactModel", label: { en: "Model", fa: "نموذج", ps: "ماډل" }, value: "Motorola Edge 50 Pro", confidence: 1.0, editable: false },
      { key: "os", label: { en: "Operating System", fa: "نظام التشغيل", ps: "آپریٹنګ سسٹم" }, value: "Android", confidence: 1.0, editable: false },
      { key: "screenSize", label: { en: "Screen Size", fa: "حجم الشاشة", ps: "د سکرین سائز" }, value: "6.7 inches", confidence: 1.0, editable: false },
    ],
    requiredSellerFields: ["storage", "ram", "condition", "price", "location"],
    optionalSellerFields: ["color", "screenCondition", "bodyCondition", "warranty"],
    buyerDetailFields: ["brand", "exactModel", "storage", "ram", "color", "condition"],
    searchAliases: ["Motorola Edge 50 Pro"],
    variantOptions: {
      storage: ["256GB", "512GB"],
      ram: ["8GB", "12GB"],
      color: ["Black", "White", "Blue"],
    },
    active: true,
  },
];
