export type SearchIntentSignal = {
  categoryPath: string;
  confidence: "high" | "medium" | "low";
  matchedRule: string;
  brand?: string;
  model?: string;
  rentalType?: string;
};

const VEHICLE_BRANDS = [
  "toyota",
  "honda",
  "hyundai",
  "kia",
  "nissan",
  "suzuki",
  "mazda",
  "mitsubishi",
  "mercedes",
  "bmw",
  "audi",
  "ford",
  "chevrolet",
  "lexus",
];

const PHONE_BRANDS = ["iphone", "samsung", "xiaomi", "oppo", "vivo", "infinix", "tecno", "realme"];

const VEHICLE_MODEL_ALIASES: Array<{ token: string; brand: string; model: string }> = [
  { token: "corolla", brand: "Toyota", model: "Corolla" },
  { token: "fielder", brand: "Toyota", model: "Fielder" },
  { token: "prado", brand: "Toyota", model: "Land Cruiser Prado" },
  { token: "land cruiser", brand: "Toyota", model: "Land Cruiser" },
  { token: "saracha", brand: "Toyota", model: "TownAce / Saracha" },
  { token: "seraacha", brand: "Toyota", model: "TownAce / Saracha" },
  { token: "camry", brand: "Toyota", model: "Camry" },
  { token: "civic", brand: "Honda", model: "Civic" },
  { token: "sonata", brand: "Hyundai", model: "Sonata" },
  { token: "elantra", brand: "Hyundai", model: "Elantra" },
  { token: "sportage", brand: "Kia", model: "Sportage" },
  { token: "sunny", brand: "Nissan", model: "Sunny" },
];

const RULES: Array<{
  name: string;
  confidence: "high" | "medium" | "low";
  match: (input: string) => boolean;
  categoryPath: string;
}> = [
  {
    name: "rickshaw",
    confidence: "high",
    match: (input) => /\brickshaw\b|\btuk\s*tuk\b|\bthree[\s-]?wheeler\b|\bauto[\s-]?rickshaw\b/.test(input),
    categoryPath: "vehicles/rickshaws-three-wheelers",
  },
  {
    name: "motorcycle",
    confidence: "high",
    match: (input) => /\bmotorcycle\b|\bbike\b|\bhonda\s*70\b|\bcd\s*70\b|\bcg\s*125\b|\b125\s*cc\b/.test(input),
    categoryPath: "vehicles/motorcycles",
  },
  {
    name: "vehicle",
    confidence: "medium",
    match: (input) => /\bcar\b|\bvehicle\b|\btoyota\b|\bcorolla\b|\bfielder\b|\bprado\b|\bsaracha\b|\bsonata\b|\bcivic\b|\belantra\b/.test(input),
    categoryPath: "vehicles/cars",
  },
  {
    name: "real-estate",
    confidence: "high",
    match: (input) => /\bapartment\b|\bhouse\b|\bhaweli\b|\bflat\b|\bland\b|\bdormitory\b|\brent\b|\bgerawy\b|\brahn\b/.test(input),
    categoryPath: "real-estate",
  },
  {
    name: "phones",
    confidence: "high",
    match: (input) => /\bphone\b|\biphone\b|\bsamsung\b|\bmobile\b|\bgalaxy\b/.test(input),
    categoryPath: "mobile-phones-tablets",
  },
];

function extractBrandModel(input: string): { brand?: string; model?: string } {
  for (const alias of VEHICLE_MODEL_ALIASES) {
    if (input.includes(alias.token)) {
      return { brand: alias.brand, model: alias.model };
    }
  }

  for (const brand of VEHICLE_BRANDS) {
    if (input.includes(brand)) {
      const after = input.split(brand)[1]?.trim();
      const model = after ? after.split(/\s+/).slice(0, 2).join(" ").trim() : undefined;
      return { brand: brand[0].toUpperCase() + brand.slice(1), model: model || undefined };
    }
  }

  for (const brand of PHONE_BRANDS) {
    if (input.includes(brand)) {
      const after = input.split(brand)[1]?.trim();
      const model = after ? `${brand} ${after.split(/\s+/).slice(0, 2).join(" ")}`.trim() : brand;
      return { brand: brand[0].toUpperCase() + brand.slice(1), model };
    }
  }

  return {};
}

function extractRentalType(input: string): string | undefined {
  if (/\bfor sale\b/.test(input)) return "For Sale";
  if (/\bmonthly\s+rent\b|\bper month\b/.test(input)) return "Monthly Rent";
  if (/\byearly\s+rent\b|\bper year\b/.test(input)) return "Yearly Rent";
  if (/\bgerawy\b|\brahn\b/.test(input)) return "Gerawy / Rahn";
  if (/\bdormitory\b/.test(input)) return "Dormitory";
  if (/\bland\s+lease\b/.test(input)) return "Land Lease";
  return undefined;
}

export function detectSearchIntent(query?: string | null): SearchIntentSignal | null {
  const raw = (query ?? "").trim().toLowerCase();
  if (!raw) {
    return null;
  }

  const rule = RULES.find((candidate) => candidate.match(raw));
  if (!rule) {
    return null;
  }

  const { brand, model } = extractBrandModel(raw);
  const rentalType = rule.categoryPath.startsWith("real-estate") ? extractRentalType(raw) : undefined;

  return {
    categoryPath: rule.categoryPath,
    confidence: rule.confidence,
    matchedRule: rule.name,
    brand,
    model,
    rentalType,
  };
}
