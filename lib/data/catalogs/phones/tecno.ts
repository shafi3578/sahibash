import type { CatalogModel } from "@/lib/catalog/types";

export const MODELS: CatalogModel[] = [
  {
    id: "tecno-spark-20-pro",
    brandId: "tecno",
    name: "TECNO Spark 20 Pro",
    releaseYear: 2024,
    type: "smartphone",
    stableSpecs: [
      { key: "brand", label: { en: "Brand", fa: "برند", ps: "برانډ" }, value: "TECNO", confidence: 1.0, editable: false },
      { key: "exactModel", label: { en: "Model", fa: "نموذج", ps: "ماډل" }, value: "TECNO Spark 20 Pro", confidence: 1.0, editable: false },
      { key: "os", label: { en: "Operating System", fa: "نظام التشغيل", ps: "آپریٹنګ سسٹم" }, value: "Android", confidence: 1.0, editable: false },
      { key: "screenSize", label: { en: "Screen Size", fa: "حجم الشاشة", ps: "د سکرین سائز" }, value: "6.52 inches", confidence: 1.0, editable: false },
    ],
    requiredSellerFields: ["storage", "ram", "condition", "price", "location"],
    optionalSellerFields: ["color", "screenCondition", "bodyCondition", "warranty"],
    buyerDetailFields: ["brand", "exactModel", "storage", "ram", "color", "condition"],
    searchAliases: ["TECNO Spark 20 Pro"],
    variantOptions: {
      storage: ["128GB"],
      ram: ["6GB", "8GB"],
      color: ["Black", "Green"],
    },
    active: true,
  },
];
