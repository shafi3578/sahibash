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

const TEXT_LIMITS = {
  query: 120, categoryPath: 240, province: 120, district: 120,
  vehicleBrand: 80, vehicleModel: 120, phoneModel: 120, rentalType: 80, condition: 80,
} as const;
const ENUM_VALUES = {
  currency: ["AFN", "USD"],
  listingType: ["for_sale", "wanted"],
  sort: ["newest", "relevant", "price_low", "price_high"],
} as const;
function numericLimits() {
  return {
    minPrice: [0, 1_000_000_000_000], maxPrice: [0, 1_000_000_000_000],
    yearMin: [1900, new Date().getFullYear() + 2], yearMax: [1900, new Date().getFullYear() + 2],
    minRooms: [0, 1000], minLandSize: [0, 100_000_000], maxLandSize: [0, 100_000_000],
    confidence: [0, 1],
  } as const;
}
const ALLOWED_KEYS = new Set([...Object.keys(TEXT_LIMITS), ...Object.keys(ENUM_VALUES), ...Object.keys(numericLimits())]);

// One contract drives both the model instructions and the local strict validator.
// It is prompt context, not a claim of model-specific JSON Schema support.
export function buildAiSearchIntentContract() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["confidence"],
    properties: {
      ...Object.fromEntries(Object.entries(TEXT_LIMITS).map(([key, maxLength]) => [key, {
        type: ["string", "null"], minLength: 1, maxLength,
      }])),
      ...Object.fromEntries(Object.entries(ENUM_VALUES).map(([key, values]) => [key, {
        type: ["string", "null"], enum: [...values, null],
      }])),
      ...Object.fromEntries(Object.entries(numericLimits()).map(([key, [minimum, maximum]]) => [key, {
        type: key === "confidence" ? "number" : ["number", "null"], minimum, maximum,
      }])),
    },
  };
}

export function buildAiSearchIntentInstructions() {
  return [
    "Interpret an Afghanistan marketplace search. Return one JSON object only, without markdown or explanations.",
    "Use exactly this contract (no additional keys):", JSON.stringify(buildAiSearchIntentContract()),
    "confidence is required. All other fields are optional: omit unknown fields or use null; never guess.",
    "Strings must be trimmed and nonempty within the stated lengths. Numbers must be JSON numbers, never quoted strings.",
    "For each supplied min/max pair, minPrice <= maxPrice, yearMin <= yearMax, and minLandSize <= maxLandSize.",
    "Use numeric AFN amounts. 1 lakh/لک/لاکه/لکه = 100000. 1 jerib/جریب/جریبه = 2000 square metres. 1 biswa/بسوه/بیسوه = 100 square metres.",
    "categoryPath is a slash-separated taxonomy hint, never SQL. Use remaining product words in query.",
    "For 'or newer' set only yearMin; for 'or older' set only yearMax.",
  ].join(" ");
}

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

  const limits = numericLimits();
  const confidence = optionalNumber(record, "confidence", ...limits.confidence);
  if (confidence === undefined) throw new Error("confidence is required");

  const parsed: AiSearchStructuredIntent = {
    query: optionalText(record, "query", TEXT_LIMITS.query),
    categoryPath: optionalText(record, "categoryPath", TEXT_LIMITS.categoryPath),
    province: optionalText(record, "province", TEXT_LIMITS.province),
    district: optionalText(record, "district", TEXT_LIMITS.district),
    minPrice: optionalNumber(record, "minPrice", ...limits.minPrice),
    maxPrice: optionalNumber(record, "maxPrice", ...limits.maxPrice),
    currency: optionalEnum(record, "currency", ENUM_VALUES.currency),
    yearMin: optionalNumber(record, "yearMin", ...limits.yearMin),
    yearMax: optionalNumber(record, "yearMax", ...limits.yearMax),
    minRooms: optionalNumber(record, "minRooms", ...limits.minRooms),
    minLandSize: optionalNumber(record, "minLandSize", ...limits.minLandSize),
    maxLandSize: optionalNumber(record, "maxLandSize", ...limits.maxLandSize),
    vehicleBrand: optionalText(record, "vehicleBrand", TEXT_LIMITS.vehicleBrand),
    vehicleModel: optionalText(record, "vehicleModel", TEXT_LIMITS.vehicleModel),
    phoneModel: optionalText(record, "phoneModel", TEXT_LIMITS.phoneModel),
    rentalType: optionalText(record, "rentalType", TEXT_LIMITS.rentalType),
    condition: optionalText(record, "condition", TEXT_LIMITS.condition),
    listingType: optionalEnum(record, "listingType", ENUM_VALUES.listingType),
    sort: optionalEnum(record, "sort", ENUM_VALUES.sort),
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
