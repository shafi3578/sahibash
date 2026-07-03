/**
 * Seller Detail Schema for Android Devices (Samsung, Xiaomi, etc.)
 * Similar to iPhone but includes RAM which iPhones don't typically list
 */

import type { PostingFieldSchema } from "@/lib/posting/types";

export const ANDROID_SELLER_SCHEMA: PostingFieldSchema[] = [
  {
    id: "ram",
    type: "select",
    labelKey: "phones.specs.ram",
    required: true,
    options: [
      { value: "2gb", labelKey: "phones.ram.2gb" },
      { value: "3gb", labelKey: "phones.ram.3gb" },
      { value: "4gb", labelKey: "phones.ram.4gb" },
      { value: "6gb", labelKey: "phones.ram.6gb" },
      { value: "8gb", labelKey: "phones.ram.8gb" },
      { value: "12gb", labelKey: "phones.ram.12gb" },
      { value: "16gb", labelKey: "phones.ram.16gb" },
    ],
  },
  {
    id: "storage",
    type: "select",
    labelKey: "phones.specs.storage",
    required: true,
    options: [
      { value: "32gb", labelKey: "phones.storage.32gb" },
      { value: "64gb", labelKey: "phones.storage.64gb" },
      { value: "128gb", labelKey: "phones.storage.128gb" },
      { value: "256gb", labelKey: "phones.storage.256gb" },
      { value: "512gb", labelKey: "phones.storage.512gb" },
    ],
  },
  {
    id: "color",
    type: "select",
    labelKey: "phones.specs.color",
    required: true,
    options: [
      { value: "black", labelKey: "colors.black" },
      { value: "white", labelKey: "colors.white" },
      { value: "silver", labelKey: "colors.silver" },
      { value: "gold", labelKey: "colors.gold" },
      { value: "blue", labelKey: "colors.blue" },
      { value: "green", labelKey: "colors.green" },
      { value: "red", labelKey: "colors.red" },
    ],
  },
  {
    id: "condition",
    type: "select",
    labelKey: "phones.specs.condition",
    required: true,
    options: [
      { value: "mint", labelKey: "condition.mint" },
      { value: "excellent", labelKey: "condition.excellent" },
      { value: "very_good", labelKey: "condition.very_good" },
      { value: "good", labelKey: "condition.good" },
      { value: "fair", labelKey: "condition.fair" },
    ],
  },
  {
    id: "battery_health",
    type: "number",
    labelKey: "phones.specs.battery_health",
    required: false,
    min: 0,
    max: 100,
  },
  {
    id: "screen_damage",
    type: "select",
    labelKey: "phones.specs.screen_damage",
    required: true,
    options: [
      { value: "no_damage", labelKey: "damage.no_damage" },
      { value: "slight_scratches", labelKey: "damage.slight_scratches" },
      { value: "minor_cracks", labelKey: "damage.minor_cracks" },
      { value: "major_damage", labelKey: "damage.major_damage" },
    ],
  },
  {
    id: "body_damage",
    type: "select",
    labelKey: "phones.specs.body_damage",
    required: true,
    options: [
      { value: "no_damage", labelKey: "damage.no_damage" },
      { value: "slight_scratches", labelKey: "damage.slight_scratches" },
      { value: "minor_dents", labelKey: "damage.minor_dents" },
      { value: "major_damage", labelKey: "damage.major_damage" },
    ],
  },
  {
    id: "includes_box_charger",
    type: "checkbox",
    labelKey: "phones.specs.includes_box_charger",
    required: false,
  },
];
