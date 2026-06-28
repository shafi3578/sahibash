import { z } from "zod";
import { CURRENCIES } from "@/lib/constants/marketplace";

const currencyEnum = z.enum(CURRENCIES as unknown as ["AFN", "USD"]);

const optionalText = z.string().trim().max(200).optional().or(z.literal(""));

function normalizeLocalizedDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 1632))
    .replace(/[٬,\s\u00A0\u202F]/g, "")
    .replace(/٫/g, ".");
}

function parseLocalizedNumber(value: unknown): unknown {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value !== "string") {
    return value;
  }

  const normalized = normalizeLocalizedDigits(value.trim());
  if (!normalized) {
    return undefined;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : value;
}

const localizedNumber = (schema: z.ZodNumber = z.number()) => z.preprocess(parseLocalizedNumber, schema);
const localizedInt = (schema: z.ZodNumber = z.number().int()) => z.preprocess(parseLocalizedNumber, schema.int());

export const listingSchema = z.object({
  title: z.string().trim().min(5).max(120),
  description: z.string().trim().min(20).max(5000),
  category_id: localizedInt(z.number().int().positive("Must select a category")).optional(),
  category_node_id: localizedInt(z.number().int().positive("Must select a final category")).optional(),
  subcategory_id: localizedInt(z.number().int().positive("Must select a subcategory")).optional(),
  vehicle_variant_id: localizedInt(z.number().int().positive()).optional(),
  price: localizedNumber(z.number().positive("Price must be greater than 0")),
  currency: currencyEnum,
  city: optionalText,
  province: z.string().trim().max(120).optional().or(z.literal("")),
  district: optionalText,
  province_id: localizedInt(z.number().int().positive()).optional(),
  district_id: localizedInt(z.number().int().positive()).optional(),
  area_text: optionalText,
  latitude: localizedNumber().optional(),
  longitude: localizedNumber().optional(),
  location_source: z.enum(["manual", "device", "browser", "gps", "map_pin"]).optional(),
  location_accuracy: localizedInt(z.number().int().nonnegative()).optional(),
  location_visibility: z.enum(["exact", "approximate", "hidden", "province_district"]).optional(),
  is_location_confirmed: z.coerce.boolean().optional(),
  listing_type: z.enum(["for_sale", "wanted"]).optional(),
  neighborhood: optionalText,
  address_optional: optionalText,
  video_url: z.string().trim().url().optional().or(z.literal("")),
  contact_phone: z.string().trim().min(7).max(20),
  contact_name: z.string().trim().min(2).max(80).optional().or(z.literal("")),
  negotiable: z.coerce.boolean().optional().default(false),
  minimum_offer: z.preprocess(parseLocalizedNumber, z.number().positive("Minimum offer must be > 0").optional()),
  featured: z.coerce.boolean().optional().default(false),
  vehicle_type: z.string().trim().max(80).optional().or(z.literal("")),
  vehicle_subtype: z.string().trim().max(120).optional().or(z.literal("")),
  vehicle_brand: z.string().trim().max(120).optional().or(z.literal("")),
  vehicle_model: z.string().trim().max(120).optional().or(z.literal("")),
  vehicle_year: z.preprocess(
    parseLocalizedNumber,
    z.number().int().min(1950).max(new Date().getFullYear() + 1).optional()
  ),
  vehicle_is_manual: z.coerce.boolean().optional().default(false),
  vehicle_is_classic: z.coerce.boolean().optional().default(false),
  vehicle_is_custom: z.coerce.boolean().optional().default(false),
  vehicle_manual_specs_json: z.string().trim().optional().or(z.literal("")),
});

// Dynamic attributes based on category
export const listingAttributeSchema = z.record(
  z.string(),
  z.union([z.string(), z.coerce.number(), z.coerce.boolean(), z.null()])
);

export function getSelectedCategoryNodeId(input: {
  category_node_id?: number | null;
  subcategory_id?: number | null;
}) {
  return input.category_node_id ?? input.subcategory_id ?? null;
}

export type ListingInput = z.infer<typeof listingSchema>;
export type ListingAttributeInput = z.infer<typeof listingAttributeSchema>;
