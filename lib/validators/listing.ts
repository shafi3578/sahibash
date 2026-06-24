import { z } from "zod";
import { AFGHAN_PROVINCES, CURRENCIES } from "@/lib/constants/marketplace";

const provinceEnum = z.enum(AFGHAN_PROVINCES as unknown as [string, ...string[]]);
const currencyEnum = z.enum(CURRENCIES as unknown as ["AFN", "USD"]);

const optionalText = z.string().trim().max(200).optional().or(z.literal(""));

export const listingSchema = z.object({
  title: z.string().trim().min(5).max(120),
  description: z.string().trim().min(20).max(5000),
  category_id: z.coerce.number().int().positive("Must select a category").optional(),
  category_node_id: z.coerce.number().int().positive("Must select a final category").optional(),
  subcategory_id: z.coerce.number().int().positive("Must select a subcategory").optional(),
  vehicle_variant_id: z.coerce.number().int().positive().optional(),
  price: z.coerce.number().positive("Price must be greater than 0"),
  currency: currencyEnum,
  city: optionalText,
  province: provinceEnum.optional().or(z.literal("")),
  district: optionalText,
  province_id: z.coerce.number().int().positive().optional(),
  district_id: z.coerce.number().int().positive().optional(),
  area_text: optionalText,
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  location_source: z.enum(["manual", "device", "browser", "gps", "map_pin"]).optional(),
  location_accuracy: z.coerce.number().int().nonnegative().optional(),
  location_visibility: z.enum(["exact", "approximate", "hidden"]).optional(),
  is_location_confirmed: z.coerce.boolean().optional(),
  neighborhood: optionalText,
  address_optional: optionalText,
  video_url: z.string().trim().url().optional().or(z.literal("")),
  contact_phone: z.string().trim().min(7).max(20),
  contact_name: z.string().trim().min(2).max(80).optional().or(z.literal("")),
  negotiable: z.coerce.boolean().optional().default(false),
  minimum_offer: z.preprocess(
    (value) => {
      if (value === "" || value === null || value === undefined) return undefined;
      const num = Number(value);
      return Number.isFinite(num) ? num : value;
    },
    z.number().positive("Minimum offer must be > 0").optional()
  ),
  featured: z.coerce.boolean().optional().default(false),
  vehicle_type: z.string().trim().max(80).optional().or(z.literal("")),
  vehicle_subtype: z.string().trim().max(120).optional().or(z.literal("")),
  vehicle_brand: z.string().trim().max(120).optional().or(z.literal("")),
  vehicle_model: z.string().trim().max(120).optional().or(z.literal("")),
  vehicle_year: z.preprocess(
    (value) => {
      if (value === "" || value === null || value === undefined) return undefined;
      const num = Number(value);
      return Number.isFinite(num) ? num : value;
    },
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
