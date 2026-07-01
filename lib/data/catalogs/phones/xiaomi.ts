/**
 * Xiaomi Phone Catalog
 */

import type { CatalogModel } from "@/lib/catalog/types";

export const MODELS: CatalogModel[] = [
  {
    id: "xiaomi-14-ultra",
    brandId: "xiaomi",
    name: "Xiaomi 14 Ultra",
    nameAliases: ["Xiaomi 14 Ultra", "Mi 14 Ultra"],
    releaseYear: 2024,
    type: "smartphone",
    stableSpecs: [
      {
        key: "brand",
        label: { en: "Brand", fa: "برند", ps: "برانډ" },
        value: "Xiaomi",
        confidence: 1.0,
        editable: false,
      },
      {
        key: "os",
        label: { en: "Operating System", fa: "سیستم عامل", ps: "آپریٹنګ سسٹم" },
        value: "Android",
        confidence: 1.0,
        editable: false,
      },
      {
        key: "device_type",
        label: { en: "Device Type", fa: "نوع دستگاه", ps: "ډیوایس ډول" },
        value: "Smartphone",
        confidence: 1.0,
        editable: false,
      },
      {
        key: "charger_type",
        label: { en: "Charger Type", fa: "نوع شارژر", ps: "چارجر ډول" },
        value: "USB-C",
        confidence: 1.0,
        editable: false,
      },
      {
        key: "5g",
        label: { en: "5G Support", fa: "پشتیبانی ۵G", ps: "۵G ملاتړ" },
        value: true,
        confidence: 1.0,
        editable: false,
      },
      {
        key: "storage_options",
        label: { en: "Storage Options", fa: "گزینه‌های ذخیره‌سازی", ps: "ذخیره کولو اختیارات" },
        value: ["512GB", "1TB"],
        confidence: 0.9,
        editable: false,
      },
    ],
    requiredSellerFields: ["condition", "price", "location"],
    optionalSellerFields: ["storage", "color", "battery_health", "box_carton", "charger_included", "repair_history", "warranty"],
    buyerDetailFields: [
      "brand",
      "model",
      "storage",
      "color",
      "condition",
      "battery_health",
      "screen_condition",
      "body_condition",
      "box_carton",
      "charger_included",
      "repair_history",
      "price",
      "location",
    ],
    searchAliases: ["Xiaomi 14 Ultra", "xiaomi 14 ultra", "شیائومی 14", "سیاومی"],
    active: true,
  },
  {
    id: "xiaomi-13",
    brandId: "xiaomi",
    name: "Xiaomi 13",
    releaseYear: 2023,
    type: "smartphone",
    stableSpecs: [
      {
        key: "brand",
        label: { en: "Brand", fa: "برند", ps: "برانډ" },
        value: "Xiaomi",
        confidence: 1.0,
        editable: false,
      },
      {
        key: "os",
        label: { en: "Operating System", fa: "سیستم عامل", ps: "آپریٹنګ سسٹم" },
        value: "Android",
        confidence: 1.0,
        editable: false,
      },
      {
        key: "5g",
        label: { en: "5G Support", fa: "پشتیبانی ۵G", ps: "۵G ملاتړ" },
        value: true,
        confidence: 1.0,
        editable: false,
      },
    ],
    requiredSellerFields: ["condition", "price", "location"],
    optionalSellerFields: ["storage", "color", "battery_health", "box_carton", "charger_included", "repair_history"],
    buyerDetailFields: ["brand", "model", "condition", "battery_health", "box_carton", "charger_included", "price", "location"],
    searchAliases: ["Xiaomi 13", "xiaomi 13"],
    active: true,
  },
];

