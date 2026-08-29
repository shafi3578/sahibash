export type AiSearchStructuredIntent = {
  query?: string;
  categoryPath?: string;
  province?: string;
  district?: string;
  minPrice?: number;
  maxPrice?: number;
  currency?: "AFN" | "USD";
  yearMin?: number;
  yearMax?: number;
  minRooms?: number;
  minLandSize?: number;
  maxLandSize?: number;
  vehicleBrand?: string;
  vehicleModel?: string;
  phoneModel?: string;
  rentalType?: string;
  condition?: string;
  listingType?: "for_sale" | "wanted";
  sort?: "newest" | "relevant" | "price_low" | "price_high";
  confidence: number;
};

const ALLOWED_KEYS = new Set([
  "query", "categoryPath", "province", "district", "minPrice", "maxPrice", "currency",
  "yearMin", "yearMax", "minRooms", "minLandSize", "maxLandSize", "vehicleBrand",
  "vehicleModel", "phoneModel", "rentalType", "condition", "listingType", "sort", "confidence",
]);

function optionalText(record: Record<string, unknown>, key: string, maxLength: number) {
  const value = record[key];
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") throw new Error(`${key} must be a string`);
  const clean = value.trim();
  if (!clean || clean.length > maxLength) throw new Error(`${key} is invalid`);
  return clean;
}

function optionalNumber(record: Record<string, unknown>, key: string, min: number, max: number) {
  const value = record[key];
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) {
    throw new Error(`${key} is invalid`);
  }
  return value;
}

function optionalEnum<const T extends readonly string[]>(record: Record<string, unknown>, key: string, values: T) {
  const value = record[key];
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string" || !values.includes(value)) throw new Error(`${key} is invalid`);
  return value as T[number];
}

export function parseAiSearchStructuredIntent(input: unknown): AiSearchStructuredIntent {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("AI search response must be an object");
  }

  const record = input as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (!ALLOWED_KEYS.has(key)) throw new Error(`Unsupported AI search field: ${key}`);
  }

  const confidence = optionalNumber(record, "confidence", 0, 1);
  if (confidence === undefined) throw new Error("confidence is required");

  const currentYear = new Date().getFullYear();
  const parsed: AiSearchStructuredIntent = {
    query: optionalText(record, "query", 120),
    categoryPath: optionalText(record, "categoryPath", 240),
    province: optionalText(record, "province", 120),
    district: optionalText(record, "district", 120),
    minPrice: optionalNumber(record, "minPrice", 0, 1_000_000_000_000),
    maxPrice: optionalNumber(record, "maxPrice", 0, 1_000_000_000_000),
    currency: optionalEnum(record, "currency", ["AFN", "USD"] as const),
    yearMin: optionalNumber(record, "yearMin", 1900, currentYear + 2),
    yearMax: optionalNumber(record, "yearMax", 1900, currentYear + 2),
    minRooms: optionalNumber(record, "minRooms", 0, 1000),
    minLandSize: optionalNumber(record, "minLandSize", 0, 100_000_000),
    maxLandSize: optionalNumber(record, "maxLandSize", 0, 100_000_000),
    vehicleBrand: optionalText(record, "vehicleBrand", 80),
    vehicleModel: optionalText(record, "vehicleModel", 120),
    phoneModel: optionalText(record, "phoneModel", 120),
    rentalType: optionalText(record, "rentalType", 80),
    condition: optionalText(record, "condition", 80),
    listingType: optionalEnum(record, "listingType", ["for_sale", "wanted"] as const),
    sort: optionalEnum(record, "sort", ["newest", "relevant", "price_low", "price_high"] as const),
    confidence,
  };

  if (parsed.minPrice !== undefined && parsed.maxPrice !== undefined && parsed.minPrice > parsed.maxPrice) {
    throw new Error("Price range is inverted");
  }
  if (parsed.yearMin !== undefined && parsed.yearMax !== undefined && parsed.yearMin > parsed.yearMax) {
    throw new Error("Year range is inverted");
  }
  if (parsed.minLandSize !== undefined && parsed.maxLandSize !== undefined && parsed.minLandSize > parsed.maxLandSize) {
    throw new Error("Land-size range is inverted");
  }

  return Object.fromEntries(Object.entries(parsed).filter(([, value]) => value !== undefined)) as AiSearchStructuredIntent;
}
