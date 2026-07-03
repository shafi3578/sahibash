/**
 * Seller Detail Schema for Real Estate Properties
 * Includes property type, size, rooms, amenities
 */

import type { PostingFieldSchema } from "@/lib/posting/types";

export const REAL_ESTATE_SELLER_SCHEMA: PostingFieldSchema[] = [
  {
    id: "property_type",
    type: "select",
    labelKey: "realEstate.specs.property_type",
    required: true,
    options: [
      { value: "apartment", labelKey: "realEstate.property.apartment" },
      { value: "house", labelKey: "realEstate.property.house" },
      { value: "villa", labelKey: "realEstate.property.villa" },
      { value: "land", labelKey: "realEstate.property.land" },
      { value: "shop", labelKey: "realEstate.property.shop" },
      { value: "office", labelKey: "realEstate.property.office" },
      { value: "warehouse", labelKey: "realEstate.property.warehouse" },
      { value: "garage", labelKey: "realEstate.property.garage" },
    ],
  },
  {
    id: "size",
    type: "number",
    labelKey: "realEstate.specs.size",
    required: true,
    min: 0,
  },
  {
    id: "size_unit",
    type: "select",
    labelKey: "realEstate.specs.size_unit",
    required: true,
    options: [
      { value: "sqm", labelKey: "units.square_meters" },
      { value: "sqft", labelKey: "units.square_feet" },
    ],
  },
  {
    id: "bedrooms",
    type: "number",
    labelKey: "realEstate.specs.bedrooms",
    required: false,
    min: 0,
  },
  {
    id: "bathrooms",
    type: "number",
    labelKey: "realEstate.specs.bathrooms",
    required: false,
    min: 0,
  },
  {
    id: "kitchens",
    type: "number",
    labelKey: "realEstate.specs.kitchens",
    required: false,
    min: 0,
  },
  {
    id: "condition",
    type: "select",
    labelKey: "realEstate.specs.condition",
    required: true,
    options: [
      { value: "new", labelKey: "realEstate.condition.new" },
      { value: "like_new", labelKey: "realEstate.condition.like_new" },
      { value: "good", labelKey: "condition.good" },
      { value: "fair", labelKey: "condition.fair" },
      { value: "needs_renovation", labelKey: "realEstate.condition.needs_renovation" },
    ],
  },
  {
    id: "has_parking",
    type: "checkbox",
    labelKey: "realEstate.features.parking",
    required: false,
  },
  {
    id: "has_garden",
    type: "checkbox",
    labelKey: "realEstate.features.garden",
    required: false,
  },
  {
    id: "has_balcony",
    type: "checkbox",
    labelKey: "realEstate.features.balcony",
    required: false,
  },
  {
    id: "has_elevator",
    type: "checkbox",
    labelKey: "realEstate.features.elevator",
    required: false,
  },
  {
    id: "has_security",
    type: "checkbox",
    labelKey: "realEstate.features.security",
    required: false,
  },
  {
    id: "furnished",
    type: "select",
    labelKey: "realEstate.specs.furnished",
    required: true,
    options: [
      { value: "unfurnished", labelKey: "realEstate.furnished.unfurnished" },
      { value: "semi_furnished", labelKey: "realEstate.furnished.semi_furnished" },
      { value: "furnished", labelKey: "realEstate.furnished.furnished" },
    ],
  },
];
