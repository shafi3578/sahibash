export type SearchIntentSignal = {
  categoryPath: string;
  confidence: "high" | "medium" | "low";
  matchedRule: string;
  brand?: string;
  model?: string;
  rentalType?: string;
};

type SpecificIntent = SearchIntentSignal & {
  terms: string[];
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
  "mercedes-benz",
  "bmw",
  "ford",
  "chevrolet",
  "lexus",
  "volkswagen",
  "land rover",
  "jeep",
];

const PHONE_BRANDS = [
  "iphone",
  "samsung",
  "xiaomi",
  "redmi",
  "huawei",
  "honor",
  "oppo",
  "vivo",
  "nokia",
  "infinix",
  "tecno",
  "realme",
  "oneplus",
  "google pixel",
  "pixel",
];

const SPECIFIC_INTENTS: SpecificIntent[] = [
  {
    terms: ["phone repair", "mobile repair", "repair phone"],
    categoryPath: "services/phone-repair",
    confidence: "high",
    matchedRule: "phone-repair-service",
  },
  {
    terms: ["driver job", "driver jobs", "driver vacancy", "driver needed"],
    categoryPath: "jobs/driver-jobs",
    confidence: "high",
    matchedRule: "driver-jobs",
  },
  {
    terms: ["corolla"],
    categoryPath: "vehicles/cars/toyota/corolla",
    confidence: "high",
    matchedRule: "corolla",
    brand: "Toyota",
    model: "Corolla",
  },
  {
    terms: ["fielder"],
    categoryPath: "vehicles/cars/toyota/fielder",
    confidence: "high",
    matchedRule: "fielder",
    brand: "Toyota",
    model: "Fielder",
  },
  {
    terms: ["prado"],
    categoryPath: "vehicles/cars/toyota/land-cruiser-prado",
    confidence: "high",
    matchedRule: "prado",
    brand: "Toyota",
    model: "Land Cruiser Prado",
  },
  {
    terms: ["land cruiser"],
    categoryPath: "vehicles/cars/toyota/land-cruiser",
    confidence: "high",
    matchedRule: "land-cruiser",
    brand: "Toyota",
    model: "Land Cruiser",
  },
  {
    terms: ["4runner", "4 runner"],
    categoryPath: "vehicles/cars/toyota/4runner",
    confidence: "high",
    matchedRule: "4runner",
    brand: "Toyota",
    model: "4Runner",
  },
  {
    terms: ["hilux surf", "surf"],
    categoryPath: "vehicles/cars/toyota/surf-hilux-surf",
    confidence: "high",
    matchedRule: "hilux-surf",
    brand: "Toyota",
    model: "Surf / Hilux Surf",
  },
  {
    terms: ["hilux"],
    categoryPath: "vehicles/cars/toyota/hilux",
    confidence: "high",
    matchedRule: "hilux",
    brand: "Toyota",
    model: "Hilux",
  },
  {
    terms: ["saracha", "seraacha", "toyota saracha"],
    categoryPath: "vehicles/cars/toyota/townace-saracha",
    confidence: "high",
    matchedRule: "saracha",
    brand: "Toyota",
    model: "TownAce / Saracha",
  },
  {
    terms: ["camry"],
    categoryPath: "vehicles/cars/toyota/camry",
    confidence: "high",
    matchedRule: "camry",
    brand: "Toyota",
    model: "Camry",
  },
  {
    terms: ["civic"],
    categoryPath: "vehicles/cars/honda/civic",
    confidence: "high",
    matchedRule: "civic",
    brand: "Honda",
    model: "Civic",
  },
  {
    terms: ["accord"],
    categoryPath: "vehicles/cars/honda/accord",
    confidence: "high",
    matchedRule: "accord",
    brand: "Honda",
    model: "Accord",
  },
  {
    terms: ["sonata"],
    categoryPath: "vehicles/cars/hyundai/sonata",
    confidence: "high",
    matchedRule: "sonata",
    brand: "Hyundai",
    model: "Sonata",
  },
  {
    terms: ["elantra"],
    categoryPath: "vehicles/cars/hyundai/elantra",
    confidence: "high",
    matchedRule: "elantra",
    brand: "Hyundai",
    model: "Elantra",
  },
  {
    terms: ["sportage"],
    categoryPath: "vehicles/cars/kia/sportage",
    confidence: "high",
    matchedRule: "sportage",
    brand: "Kia",
    model: "Sportage",
  },
  {
    terms: ["sunny"],
    categoryPath: "vehicles/cars/nissan/sunny",
    confidence: "high",
    matchedRule: "sunny",
    brand: "Nissan",
    model: "Sunny",
  },
  {
    terms: ["honda 70", "cd70", "cd 70"],
    categoryPath: "vehicles/motorcycles/honda-cd70-honda-70",
    confidence: "high",
    matchedRule: "honda-70",
    brand: "Honda",
    model: "CD70 / Honda 70",
  },
  {
    terms: ["honda 125", "cg125", "cg 125"],
    categoryPath: "vehicles/motorcycles/honda-cg125-honda-125",
    confidence: "high",
    matchedRule: "honda-125",
    brand: "Honda",
    model: "CG125 / Honda 125",
  },
  {
    terms: ["pamir"],
    categoryPath: "vehicles/motorcycles/pamir-motorcycle",
    confidence: "high",
    matchedRule: "pamir-motorcycle",
    brand: "Pamir",
    model: "Pamir Motorcycle",
  },
  {
    terms: ["zaranj"],
    categoryPath: "vehicles/motorcycles/zaranj-motorcycle",
    confidence: "high",
    matchedRule: "zaranj-motorcycle",
    brand: "Zaranj",
    model: "Zaranj Motorcycle",
  },
  {
    terms: ["rickshaw", "tuk tuk", "three wheeler", "three-wheeler", "auto rickshaw"],
    categoryPath: "vehicles/rickshaws-three-wheelers",
    confidence: "high",
    matchedRule: "rickshaw",
  },
  {
    terms: ["toyota"],
    categoryPath: "vehicles/cars/toyota",
    confidence: "medium",
    matchedRule: "toyota-brand",
    brand: "Toyota",
  },
  {
    terms: ["iphone"],
    categoryPath: "mobile-phones-tablets/mobile-phones/apple-iphone",
    confidence: "high",
    matchedRule: "iphone",
    brand: "Apple iPhone",
  },
  {
    terms: ["samsung", "galaxy"],
    categoryPath: "mobile-phones-tablets/mobile-phones/samsung",
    confidence: "high",
    matchedRule: "samsung-phone",
    brand: "Samsung",
  },
  {
    terms: ["xiaomi", "redmi"],
    categoryPath: "mobile-phones-tablets/mobile-phones/xiaomi",
    confidence: "high",
    matchedRule: "xiaomi-phone",
    brand: "Xiaomi / Redmi",
  },
  {
    terms: ["google pixel", " pixel "],
    categoryPath: "mobile-phones-tablets/mobile-phones/google-pixel",
    confidence: "high",
    matchedRule: "google-pixel",
    brand: "Google Pixel",
  },
  {
    terms: ["laptop", "macbook", "dell", "hp", "lenovo", "asus", "acer", "surface"],
    categoryPath: "electronics-computers/laptops",
    confidence: "high",
    matchedRule: "laptops",
  },
  {
    terms: ["solar panel", "solar panels"],
    categoryPath: "electronics-computers/solar-power-equipment/solar-panels",
    confidence: "high",
    matchedRule: "solar-panels",
  },
  {
    terms: ["solar inverter", "inverter"],
    categoryPath: "electronics-computers/solar-power-equipment/solar-inverters",
    confidence: "high",
    matchedRule: "solar-inverters",
  },
  {
    terms: ["generator"],
    categoryPath: "electronics-computers/solar-power-equipment/generators",
    confidence: "high",
    matchedRule: "generators",
  },
  {
    terms: ["ups"],
    categoryPath: "electronics-computers/solar-power-equipment/ups",
    confidence: "high",
    matchedRule: "ups",
  },
  {
    terms: ["bukhari"],
    categoryPath: "home-furniture-appliances/heating-cooling",
    confidence: "high",
    matchedRule: "bukhari",
  },
  {
    terms: ["water pump"],
    categoryPath: "home-furniture-appliances/home-appliances",
    confidence: "medium",
    matchedRule: "water-pump",
  },
  {
    terms: ["villa"],
    categoryPath: "real-estate/houses/villa",
    confidence: "high",
    matchedRule: "villa",
  },
  {
    terms: ["duplex"],
    categoryPath: "real-estate/houses/duplex",
    confidence: "high",
    matchedRule: "duplex",
  },
  {
    terms: ["house", "haweli", "haveli"],
    categoryPath: "real-estate/houses",
    confidence: "high",
    matchedRule: "houses",
  },
  {
    terms: ["shop", "shops"],
    categoryPath: "real-estate/shops-commercial",
    confidence: "high",
    matchedRule: "shops-commercial",
  },
  {
    terms: ["apartment", "flat"],
    categoryPath: "real-estate/apartments",
    confidence: "high",
    matchedRule: "apartments",
  },
  {
    terms: ["dormitory", "dormitories", "student accommodation", "student room", "student house", "university room", "محصل", "دانشجو", "لیلیه", "خوابگاه"],
    categoryPath: "real-estate/room-house-for-students",
    confidence: "high",
    matchedRule: "student-housing",
  },
  {
    terms: ["land"],
    categoryPath: "real-estate/land",
    confidence: "high",
    matchedRule: "land",
  },
  {
    terms: ["rahn", "gerawy", "garawi"],
    categoryPath: "real-estate",
    confidence: "high",
    matchedRule: "gerawy-rahn",
    rentalType: "Gerawy / Rahn",
  },
  {
    terms: ["cow", "cows"],
    categoryPath: "farm-animals/cows",
    confidence: "high",
    matchedRule: "cows",
  },
  {
    terms: ["chicken", "chickens"],
    categoryPath: "farm-animals/chickens",
    confidence: "high",
    matchedRule: "chickens",
  },
];

const VEHICLE_MODEL_ALIASES: Array<{ token: string; brand: string; model: string }> = [
  { token: "corolla", brand: "Toyota", model: "Corolla" },
  { token: "fielder", brand: "Toyota", model: "Fielder" },
  { token: "prado", brand: "Toyota", model: "Land Cruiser Prado" },
  { token: "land cruiser", brand: "Toyota", model: "Land Cruiser" },
  { token: "4runner", brand: "Toyota", model: "4Runner" },
  { token: "saracha", brand: "Toyota", model: "TownAce / Saracha" },
  { token: "seraacha", brand: "Toyota", model: "TownAce / Saracha" },
  { token: "camry", brand: "Toyota", model: "Camry" },
  { token: "civic", brand: "Honda", model: "Civic" },
  { token: "accord", brand: "Honda", model: "Accord" },
  { token: "sonata", brand: "Hyundai", model: "Sonata" },
  { token: "elantra", brand: "Hyundai", model: "Elantra" },
  { token: "sportage", brand: "Kia", model: "Sportage" },
  { token: "sunny", brand: "Nissan", model: "Sunny" },
];

function hasWholeWord(input: string, term: string): boolean {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|\\s|\\b)${escaped}(\\b|\\s|$)`).test(input);
}

function detectSpecificIntent(input: string): SearchIntentSignal | null {
  for (const intent of SPECIFIC_INTENTS) {
    const matched = intent.terms.some((term) => {
      if (term.includes(" ")) {
        return input.includes(term);
      }
      return hasWholeWord(input, term);
    });

    if (matched) {
      const { terms, ...signal } = intent;
      void terms;
      return signal;
    }
  }

  return null;
}

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
    match: (input) => /\bmotorcycle\b|\bbike\b|\bhonda\s*70\b|\bcd\s*70\b|\bcg\s*125\b|\b125\s*cc\b|\bpamir\b|\bzaranj\b/.test(input),
    categoryPath: "vehicles/motorcycles",
  },
  {
    name: "vehicle",
    confidence: "medium",
    match: (input) => /\bcar\b|\bvehicle\b|\btoyota\b|\bhonda\b|\bhyundai\b|\bkia\b|\bnissan\b|\bcorolla\b|\bfielder\b|\bprado\b|\bsaracha\b|\bsonata\b|\bcivic\b|\belantra\b/.test(input),
    categoryPath: "vehicles/cars",
  },
  {
    name: "real-estate",
    confidence: "high",
    match: (input) => /\bapartment\b|\bhouse\b|\bhaweli\b|\bhaveli\b|\bflat\b|\bland\b|\bdormitory\b|\brent\b|\bgerawy\b|\bgarawi\b|\brahn\b|\bvilla\b|\bduplex\b|\bshop\b|student\s+room|student\s+house|university\s+room|محصل|دانشجو|لیلیه|خوابگاه/u.test(input),
    categoryPath: "real-estate",
  },
  {
    name: "phones",
    confidence: "high",
    match: (input) => /\bphone\b|\biphone\b|\bsamsung\b|\bmobile\b|\bgalaxy\b|\bredmi\b|\bxiaomi\b|\bpixel\b/.test(input),
    categoryPath: "mobile-phones-tablets",
  },
  {
    name: "electronics",
    confidence: "medium",
    match: (input) => /\blaptop\b|\bmacbook\b|\bdell\b|\bhp\b|\blenovo\b|\basus\b|\bacer\b|\bsolar\b|\bgenerator\b|\bups\b/.test(input),
    categoryPath: "electronics-computers",
  },
  {
    name: "home",
    confidence: "medium",
    match: (input) => /\bbukhari\b|\bcarpet\b|\brug\b|\bwater\s*pump\b/.test(input),
    categoryPath: "home-furniture-appliances",
  },
  {
    name: "farm-animals",
    confidence: "medium",
    match: (input) => /\bcow\b|\bcows\b|\bchicken\b|\bchickens\b|\bsheep\b|\bgoat\b/.test(input),
    categoryPath: "farm-animals",
  },
  {
    name: "jobs",
    confidence: "medium",
    match: (input) => /\bjob\b|\bjobs\b|\bdriver\b|\binternship\b|\bteaching\b/.test(input),
    categoryPath: "jobs",
  },
  {
    name: "services",
    confidence: "medium",
    match: (input) => /\brepair\b|\bservice\b|\bservices\b|\btransport\b|\btutoring\b/.test(input),
    categoryPath: "services",
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
  if (/\bfor rent\b|\bmonthly\s+rent\b|\bper month\b|\brent\b/.test(input)) return "For Rent";
  if (/\bgerawy\b|\bgarawi\b|\brahn\b/.test(input)) return "Gerawy / Rahn";
  if (/\bexchange\b/.test(input)) return "Exchange";
  if (/\bwanted\b/.test(input)) return "Wanted";
  return undefined;
}

export function detectSearchIntent(query?: string | null): SearchIntentSignal | null {
  const raw = (query ?? "").trim().toLowerCase();
  if (!raw) {
    return null;
  }

  const specificIntent = detectSpecificIntent(raw);
  if (specificIntent) {
    return specificIntent;
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
