/**
 * Huawei - Model Catalog
 */

import type { CatalogModel } from "@/lib/catalog/types";

export const MODELS: CatalogModel[] = [
  {
    id: "huawei-p70-pro",
    brandId: "huawei",
    name: "Huawei P70 Pro",
    releaseYear: 2024,
    type: "smartphone",
    stableSpecs: [
      { key: "brand", label: { en: "Brand", fa: "برند", ps: "برانډ" }, value: "Huawei", confidence: 1.0, editable: false },
      { key: "exactModel", label: { en: "Model", fa: "نموذج", ps: "ماډل" }, value: "Huawei P70 Pro", confidence: 1.0, editable: false },
      { key: "os", label: { en: "Operating System", fa: "نظام التشغيل", ps: "آپریٹنګ سسٹم" }, value: "HarmonyOS", confidence: 1.0, editable: false },
      { key: "screenSize", label: { en: "Screen Size", fa: "حجم الشاشة", ps: "د سکرین سائز" }, value: "6.8 inches", confidence: 1.0, editable: false },
    ],
    requiredSellerFields: ["storage", "ram", "condition", "price", "location"],
    optionalSellerFields: ["color", "screenCondition", "bodyCondition", "warranty"],
    buyerDetailFields: ["brand", "exactModel", "storage", "ram", "color", "condition"],
    searchAliases: ["Huawei P70 Pro"],
    variantOptions: {
      storage: ["256GB", "512GB"],
      ram: ["8GB", "12GB"],
      color: ["Black", "White", "Gold"],
    },
    active: true,
  },
];
