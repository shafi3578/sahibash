import type { CatalogModel } from "@/lib/catalog/types";

export const MODELS: CatalogModel[] = [
  {
    id: "infinix-note-30-pro",
    brandId: "infinix",
    name: "Infinix Note 30 Pro",
    releaseYear: 2023,
    type: "smartphone",
    stableSpecs: [
      { key: "brand", label: { en: "Brand", fa: "برند", ps: "برانډ" }, value: "Infinix", confidence: 1.0, editable: false },
      { key: "exactModel", label: { en: "Model", fa: "نموذج", ps: "ماډل" }, value: "Infinix Note 30 Pro", confidence: 1.0, editable: false },
      { key: "os", label: { en: "Operating System", fa: "نظام التشغيل", ps: "آپریٹنګ سسٹم" }, value: "Android", confidence: 1.0, editable: false },
      { key: "screenSize", label: { en: "Screen Size", fa: "حجم الشاشة", ps: "د سکرین سائز" }, value: "6.78 inches", confidence: 1.0, editable: false },
    ],
    requiredSellerFields: ["storage", "ram", "condition", "price", "location"],
    optionalSellerFields: ["color", "screenCondition", "bodyCondition", "warranty"],
    buyerDetailFields: ["brand", "exactModel", "storage", "ram", "color", "condition"],
    searchAliases: ["Infinix Note 30 Pro"],
    variantOptions: {
      storage: ["256GB"],
      ram: ["8GB", "12GB"],
      color: ["Black", "Blue", "Silver"],
    },
    active: true,
  },
];
