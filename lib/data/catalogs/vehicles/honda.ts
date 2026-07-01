/**
 * Honda Vehicle Catalog
 */

import type { CatalogModel } from "@/lib/catalog/types";

export const MODELS: CatalogModel[] = [
  {
    id: "civic",
    brandId: "honda",
    name: "Civic",
    nameAliases: ["Honda Civic", "Civic Sedan"],
    type: "car",
    stableSpecs: [
      {
        key: "brand",
        label: { en: "Brand", fa: "برند", ps: "برانډ" },
        value: "Honda",
        confidence: 1.0,
        editable: false,
      },
      {
        key: "model",
        label: { en: "Model", fa: "مدل", ps: "ماډل" },
        value: "Civic",
        confidence: 1.0,
        editable: false,
      },
      {
        key: "body_type",
        label: { en: "Body Type", fa: "نوع بدن", ps: "بدن ډول" },
        value: "Sedan",
        confidence: 0.95,
        editable: true,
      },
      {
        key: "fuel_type",
        label: { en: "Fuel Type", fa: "نوع سوخت", ps: "ایندھن ډول" },
        value: "Petrol",
        confidence: 0.9,
        editable: true,
      },
    ],
    requiredSellerFields: ["year", "mileage", "condition", "price", "location"],
    optionalSellerFields: ["fuel_type", "transmission", "engine_size", "accident_status", "customs_clearance", "documents"],
    buyerDetailFields: [
      "brand",
      "model",
      "year",
      "mileage",
      "fuel_type",
      "transmission",
      "body_type",
      "condition",
      "accident_status",
      "price",
      "location",
    ],
    searchAliases: ["Honda Civic", "Civic", "ہونڈا سوک", "honda civic"],
    active: true,
  },
  {
    id: "accord",
    brandId: "honda",
    name: "Accord",
    releaseYear: undefined,
    type: "car",
    stableSpecs: [
      {
        key: "brand",
        label: { en: "Brand", fa: "برند", ps: "برانډ" },
        value: "Honda",
        confidence: 1.0,
        editable: false,
      },
      {
        key: "model",
        label: { en: "Model", fa: "مدل", ps: "ماډل" },
        value: "Accord",
        confidence: 1.0,
        editable: false,
      },
    ],
    requiredSellerFields: ["year", "mileage", "condition", "price", "location"],
    optionalSellerFields: ["fuel_type", "transmission", "engine_size", "accident_status", "documents"],
    buyerDetailFields: ["brand", "model", "year", "mileage", "fuel_type", "condition", "accident_status", "price", "location"],
    searchAliases: ["Honda Accord", "Accord", "ہونڈا اکارڈ"],
    active: true,
  },
];

