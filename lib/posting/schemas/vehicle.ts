/**
 * Seller Detail Schema for Vehicles (Cars, Motorcycles, etc.)
 * Includes mileage, condition, features, and accident history
 */

import type { PostingFieldSchema } from "@/lib/posting/types";

export const VEHICLE_SELLER_SCHEMA: PostingFieldSchema[] = [
  {
    id: "year",
    type: "number",
    labelKey: "vehicles.specs.year",
    required: true,
    min: 1950,
    max: new Date().getFullYear(),
  },
  {
    id: "mileage",
    type: "number",
    labelKey: "vehicles.specs.mileage",
    required: true,
    min: 0,
  },
  {
    id: "mileage_unit",
    type: "select",
    labelKey: "vehicles.specs.mileage_unit",
    required: true,
    options: [
      { value: "km", labelKey: "units.kilometers" },
      { value: "miles", labelKey: "units.miles" },
    ],
  },
  {
    id: "transmission",
    type: "select",
    labelKey: "vehicles.specs.transmission",
    required: true,
    options: [
      { value: "manual", labelKey: "vehicles.transmission.manual" },
      { value: "automatic", labelKey: "vehicles.transmission.automatic" },
      { value: "cvt", labelKey: "vehicles.transmission.cvt" },
    ],
  },
  {
    id: "fuel_type",
    type: "select",
    labelKey: "vehicles.specs.fuel_type",
    required: true,
    options: [
      { value: "petrol", labelKey: "vehicles.fuel.petrol" },
      { value: "diesel", labelKey: "vehicles.fuel.diesel" },
      { value: "hybrid", labelKey: "vehicles.fuel.hybrid" },
      { value: "electric", labelKey: "vehicles.fuel.electric" },
      { value: "lpg", labelKey: "vehicles.fuel.lpg" },
    ],
  },
  {
    id: "condition",
    type: "select",
    labelKey: "vehicles.specs.condition",
    required: true,
    options: [
      { value: "excellent", labelKey: "condition.excellent" },
      { value: "very_good", labelKey: "condition.very_good" },
      { value: "good", labelKey: "condition.good" },
      { value: "fair", labelKey: "condition.fair" },
      { value: "needs_repair", labelKey: "condition.needs_repair" },
    ],
  },
  {
    id: "accident_history",
    type: "select",
    labelKey: "vehicles.specs.accident_history",
    required: true,
    options: [
      { value: "no_accidents", labelKey: "vehicles.accident.no_accidents" },
      { value: "minor_accidents", labelKey: "vehicles.accident.minor_accidents" },
      { value: "major_accidents", labelKey: "vehicles.accident.major_accidents" },
      { value: "unknown", labelKey: "vehicles.accident.unknown" },
    ],
  },
  {
    id: "color",
    type: "select",
    labelKey: "vehicles.specs.color",
    required: true,
    options: [
      { value: "black", labelKey: "colors.black" },
      { value: "white", labelKey: "colors.white" },
      { value: "silver", labelKey: "colors.silver" },
      { value: "gray", labelKey: "colors.gray" },
      { value: "blue", labelKey: "colors.blue" },
      { value: "red", labelKey: "colors.red" },
      { value: "brown", labelKey: "colors.brown" },
      { value: "beige", labelKey: "colors.beige" },
    ],
  },
  {
    id: "interior_color",
    type: "select",
    labelKey: "vehicles.specs.interior_color",
    required: false,
    options: [
      { value: "black", labelKey: "colors.black" },
      { value: "gray", labelKey: "colors.gray" },
      { value: "beige", labelKey: "colors.beige" },
      { value: "brown", labelKey: "colors.brown" },
    ],
  },
  {
    id: "has_air_conditioning",
    type: "checkbox",
    labelKey: "vehicles.features.air_conditioning",
    required: false,
  },
  {
    id: "has_power_steering",
    type: "checkbox",
    labelKey: "vehicles.features.power_steering",
    required: false,
  },
  {
    id: "has_airbags",
    type: "checkbox",
    labelKey: "vehicles.features.airbags",
    required: false,
  },
  {
    id: "has_abs",
    type: "checkbox",
    labelKey: "vehicles.features.abs",
    required: false,
  },
];
