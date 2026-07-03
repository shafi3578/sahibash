/**
 * Google Pixel - Complete Model Catalog
 * All Pixel series from Pixel 4 to Pixel 9
 */

import type { CatalogModel } from "@/lib/catalog/types";

const PIXEL_COLORS = ["Obsidian", "Porcelain", "Bay", "Snow", "Sage", "Chalk", "Hazel", "Peony", "Stormy Black", "Cloudy White", "Coral", "Orange", "Purple"];
const ANDROID_STORAGE = ["32GB", "64GB", "128GB", "256GB", "512GB"];
const ANDROID_RAM = ["6GB", "8GB", "12GB"];

export const MODELS: CatalogModel[] = [
  // Pixel 9 Series (2024)
  {
    id: "pixel-9-pro-xl",
    brandId: "google",
    name: "Pixel 9 Pro XL",
    releaseYear: 2024,
    type: "smartphone",
    stableSpecs: [
      { key: "brand", label: { en: "Brand", fa: "برند", ps: "برانډ" }, value: "Google", confidence: 1.0, editable: false },
      { key: "exactModel", label: { en: "Model", fa: "نموذج", ps: "ماډل" }, value: "Pixel 9 Pro XL", confidence: 1.0, editable: false },
      { key: "os", label: { en: "Operating System", fa: "نظام التشغيل", ps: "آپریٹنګ سسٹم" }, value: "Android", confidence: 1.0, editable: false },
      { key: "screenSize", label: { en: "Screen Size", fa: "حجم الشاشة", ps: "د سکرین سائز" }, value: "6.8 inches", confidence: 1.0, editable: false },
    ],
    requiredSellerFields: ["storage", "ram", "condition", "price", "location"],
    optionalSellerFields: ["color", "screenCondition", "bodyCondition", "repairHistory", "warranty", "purchasePlace", "boxIncluded", "chargerIncluded"],
    buyerDetailFields: ["brand", "exactModel", "storage", "ram", "color", "condition"],
    searchAliases: ["Pixel 9 Pro XL"],
    variantOptions: {
      storage: ["256GB", "512GB"],
      ram: ["16GB"],
      color: PIXEL_COLORS,
    },
    active: true,
  },
  {
    id: "pixel-9-pro",
    brandId: "google",
    name: "Pixel 9 Pro",
    releaseYear: 2024,
    type: "smartphone",
    stableSpecs: [
      { key: "brand", label: { en: "Brand", fa: "برند", ps: "برانډ" }, value: "Google", confidence: 1.0, editable: false },
      { key: "exactModel", label: { en: "Model", fa: "نموذج", ps: "ماډل" }, value: "Pixel 9 Pro", confidence: 1.0, editable: false },
      { key: "os", label: { en: "Operating System", fa: "نظام التشغيل", ps: "آپریٹنګ سسٹم" }, value: "Android", confidence: 1.0, editable: false },
      { key: "screenSize", label: { en: "Screen Size", fa: "حجم الشاشة", ps: "د سکرین سائز" }, value: "6.3 inches", confidence: 1.0, editable: false },
    ],
    requiredSellerFields: ["storage", "ram", "condition", "price", "location"],
    optionalSellerFields: ["color", "screenCondition", "bodyCondition", "repairHistory", "warranty", "purchasePlace", "boxIncluded", "chargerIncluded"],
    buyerDetailFields: ["brand", "exactModel", "storage", "ram", "color", "condition"],
    searchAliases: ["Pixel 9 Pro"],
    variantOptions: {
      storage: ["256GB", "512GB"],
      ram: ["16GB"],
      color: PIXEL_COLORS,
    },
    active: true,
  },
  {
    id: "pixel-9",
    brandId: "google",
    name: "Pixel 9",
    releaseYear: 2024,
    type: "smartphone",
    stableSpecs: [
      { key: "brand", label: { en: "Brand", fa: "برند", ps: "برانډ" }, value: "Google", confidence: 1.0, editable: false },
      { key: "exactModel", label: { en: "Model", fa: "نموذج", ps: "ماډل" }, value: "Pixel 9", confidence: 1.0, editable: false },
      { key: "os", label: { en: "Operating System", fa: "نظام التشغيل", ps: "آپریٹنګ سسٹم" }, value: "Android", confidence: 1.0, editable: false },
      { key: "screenSize", label: { en: "Screen Size", fa: "حجم الشاشة", ps: "د سکرین سائز" }, value: "6.3 inches", confidence: 1.0, editable: false },
    ],
    requiredSellerFields: ["storage", "ram", "condition", "price", "location"],
    optionalSellerFields: ["color", "screenCondition", "bodyCondition", "repairHistory", "warranty", "purchasePlace", "boxIncluded", "chargerIncluded"],
    buyerDetailFields: ["brand", "exactModel", "storage", "ram", "color", "condition"],
    searchAliases: ["Pixel 9"],
    variantOptions: {
      storage: ["128GB", "256GB"],
      ram: ["8GB"],
      color: PIXEL_COLORS,
    },
    active: true,
  },

  // Pixel 8 Series (2023)
  {
    id: "pixel-8-pro",
    brandId: "google",
    name: "Pixel 8 Pro",
    releaseYear: 2023,
    type: "smartphone",
    stableSpecs: [
      { key: "brand", label: { en: "Brand", fa: "برند", ps: "برانډ" }, value: "Google", confidence: 1.0, editable: false },
      { key: "exactModel", label: { en: "Model", fa: "نموذج", ps: "ماډل" }, value: "Pixel 8 Pro", confidence: 1.0, editable: false },
      { key: "os", label: { en: "Operating System", fa: "نظام التشغيل", ps: "آپریٹنګ سسٹم" }, value: "Android", confidence: 1.0, editable: false },
      { key: "screenSize", label: { en: "Screen Size", fa: "حجم الشاشة", ps: "د سکرین سائز" }, value: "6.7 inches", confidence: 1.0, editable: false },
    ],
    requiredSellerFields: ["storage", "ram", "condition", "price", "location"],
    optionalSellerFields: ["color", "screenCondition", "bodyCondition", "repairHistory", "warranty", "purchasePlace", "boxIncluded", "chargerIncluded"],
    buyerDetailFields: ["brand", "exactModel", "storage", "ram", "color", "condition"],
    searchAliases: ["Pixel 8 Pro"],
    variantOptions: {
      storage: ["128GB", "256GB", "512GB"],
      ram: ["12GB"],
      color: PIXEL_COLORS,
    },
    active: true,
  },
  {
    id: "pixel-8",
    brandId: "google",
    name: "Pixel 8",
    releaseYear: 2023,
    type: "smartphone",
    stableSpecs: [
      { key: "brand", label: { en: "Brand", fa: "برند", ps: "برانډ" }, value: "Google", confidence: 1.0, editable: false },
      { key: "exactModel", label: { en: "Model", fa: "نموذج", ps: "ماډل" }, value: "Pixel 8", confidence: 1.0, editable: false },
      { key: "os", label: { en: "Operating System", fa: "نظام التشغيل", ps: "آپریٹنګ سسٹم" }, value: "Android", confidence: 1.0, editable: false },
      { key: "screenSize", label: { en: "Screen Size", fa: "حجم الشاشة", ps: "د سکرین سائز" }, value: "6.2 inches", confidence: 1.0, editable: false },
    ],
    requiredSellerFields: ["storage", "ram", "condition", "price", "location"],
    optionalSellerFields: ["color", "screenCondition", "bodyCondition", "repairHistory", "warranty", "purchasePlace", "boxIncluded", "chargerIncluded"],
    buyerDetailFields: ["brand", "exactModel", "storage", "ram", "color", "condition"],
    searchAliases: ["Pixel 8"],
    variantOptions: {
      storage: ["128GB", "256GB"],
      ram: ["8GB"],
      color: PIXEL_COLORS,
    },
    active: true,
  },

  // Pixel 7 Series (2022)
  {
    id: "pixel-7-pro",
    brandId: "google",
    name: "Pixel 7 Pro",
    releaseYear: 2022,
    type: "smartphone",
    stableSpecs: [
      { key: "brand", label: { en: "Brand", fa: "برند", ps: "برانډ" }, value: "Google", confidence: 1.0, editable: false },
      { key: "exactModel", label: { en: "Model", fa: "نموذج", ps: "ماډل" }, value: "Pixel 7 Pro", confidence: 1.0, editable: false },
      { key: "os", label: { en: "Operating System", fa: "نظام التشغيل", ps: "آپریٹنګ سسٹم" }, value: "Android", confidence: 1.0, editable: false },
      { key: "screenSize", label: { en: "Screen Size", fa: "حجم الشاشة", ps: "د سکرین سائز" }, value: "6.7 inches", confidence: 1.0, editable: false },
    ],
    requiredSellerFields: ["storage", "ram", "condition", "price", "location"],
    optionalSellerFields: ["color", "screenCondition", "bodyCondition", "repairHistory", "warranty", "purchasePlace", "boxIncluded", "chargerIncluded"],
    buyerDetailFields: ["brand", "exactModel", "storage", "ram", "color", "condition"],
    searchAliases: ["Pixel 7 Pro"],
    variantOptions: {
      storage: ["128GB", "256GB"],
      ram: ["8GB", "12GB"],
      color: PIXEL_COLORS,
    },
    active: true,
  },
  {
    id: "pixel-7",
    brandId: "google",
    name: "Pixel 7",
    releaseYear: 2022,
    type: "smartphone",
    stableSpecs: [
      { key: "brand", label: { en: "Brand", fa: "برند", ps: "برانډ" }, value: "Google", confidence: 1.0, editable: false },
      { key: "exactModel", label: { en: "Model", fa: "نموذج", ps: "ماډل" }, value: "Pixel 7", confidence: 1.0, editable: false },
      { key: "os", label: { en: "Operating System", fa: "نظام التشغيل", ps: "آپریٹنګ سسٹم" }, value: "Android", confidence: 1.0, editable: false },
      { key: "screenSize", label: { en: "Screen Size", fa: "حجم الشاشة", ps: "د سکرین سائز" }, value: "6.3 inches", confidence: 1.0, editable: false },
    ],
    requiredSellerFields: ["storage", "ram", "condition", "price", "location"],
    optionalSellerFields: ["color", "screenCondition", "bodyCondition", "repairHistory", "warranty", "purchasePlace", "boxIncluded", "chargerIncluded"],
    buyerDetailFields: ["brand", "exactModel", "storage", "ram", "color", "condition"],
    searchAliases: ["Pixel 7"],
    variantOptions: {
      storage: ["128GB"],
      ram: ["8GB"],
      color: PIXEL_COLORS,
    },
    active: true,
  },

  // Pixel 6 Series (2021)
  {
    id: "pixel-6-pro",
    brandId: "google",
    name: "Pixel 6 Pro",
    releaseYear: 2021,
    type: "smartphone",
    stableSpecs: [
      { key: "brand", label: { en: "Brand", fa: "برند", ps: "برانډ" }, value: "Google", confidence: 1.0, editable: false },
      { key: "exactModel", label: { en: "Model", fa: "نموذج", ps: "ماډل" }, value: "Pixel 6 Pro", confidence: 1.0, editable: false },
      { key: "os", label: { en: "Operating System", fa: "نظام التشغيل", ps: "آپریٹنګ سسٹم" }, value: "Android", confidence: 1.0, editable: false },
      { key: "screenSize", label: { en: "Screen Size", fa: "حجم الشاشة", ps: "د سکرین سائز" }, value: "6.7 inches", confidence: 1.0, editable: false },
    ],
    requiredSellerFields: ["storage", "ram", "condition", "price", "location"],
    optionalSellerFields: ["color", "screenCondition", "bodyCondition", "repairHistory", "warranty", "purchasePlace", "boxIncluded", "chargerIncluded"],
    buyerDetailFields: ["brand", "exactModel", "storage", "ram", "color", "condition"],
    searchAliases: ["Pixel 6 Pro"],
    variantOptions: {
      storage: ["128GB"],
      ram: ["12GB"],
      color: PIXEL_COLORS,
    },
    active: true,
  },
  {
    id: "pixel-6",
    brandId: "google",
    name: "Pixel 6",
    releaseYear: 2021,
    type: "smartphone",
    stableSpecs: [
      { key: "brand", label: { en: "Brand", fa: "برند", ps: "برانډ" }, value: "Google", confidence: 1.0, editable: false },
      { key: "exactModel", label: { en: "Model", fa: "نموذج", ps: "ماډل" }, value: "Pixel 6", confidence: 1.0, editable: false },
      { key: "os", label: { en: "Operating System", fa: "نظام التشغيل", ps: "آپریٹنګ سسٹم" }, value: "Android", confidence: 1.0, editable: false },
      { key: "screenSize", label: { en: "Screen Size", fa: "حجم الشاشة", ps: "د سکرین سائز" }, value: "6.4 inches", confidence: 1.0, editable: false },
    ],
    requiredSellerFields: ["storage", "ram", "condition", "price", "location"],
    optionalSellerFields: ["color", "screenCondition", "bodyCondition", "repairHistory", "warranty", "purchasePlace", "boxIncluded", "chargerIncluded"],
    buyerDetailFields: ["brand", "exactModel", "storage", "ram", "color", "condition"],
    searchAliases: ["Pixel 6"],
    variantOptions: {
      storage: ["128GB"],
      ram: ["8GB"],
      color: PIXEL_COLORS,
    },
    active: true,
  },
];
