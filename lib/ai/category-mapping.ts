type LabelSignal = {
  label: string;
  score: number;
};

type SpecsMatch = {
  categoryNodeId: number;
  categoryPath: string;
  brand: string;
  model: string;
  specs: Record<string, unknown>;
  confidence: number;
};

export type CategorySuggestion = {
  rootSlug: "real-estate" | "vehicles" | "mobile-phones-tablets" | "second-hand-items" | "electronics-computers" | "home-furniture-appliances" | "clothing-personal-items" | "jobs" | "services" | "business-industry" | "farm-animals" | "education" | "sports-hobbies" | "other";
  pathSlugs: string[];
  label: string;
  reason: string;
  confidence: number;
};

type MappingInput = {
  title: string;
  description: string;
  labels: LabelSignal[];
  specsMatch: SpecsMatch | null;
};

const BRAND_SLUG_BY_NAME: Record<string, string> = {
  apple: "apple",
  samsung: "samsung",
  xiaomi: "xiaomi",
  huawei: "huawei",
  honor: "honor",
  nokia: "nokia",
  tecno: "tecno",
  infinix: "infinix",
  oppo: "oppo",
  vivo: "vivo",
  realme: "realme",
  lg: "lg",
  sony: "sony",
  motorola: "motorola",
  oneplus: "oneplus",
  itel: "itel",
};

const CAR_BRANDS: Array<{ terms: string[]; slug: string; name: string }> = [
  { terms: ["toyota"], slug: "toyota", name: "Toyota" },
  { terms: ["mercedes", "mercedes-benz"], slug: "mercedes-benz", name: "Mercedes-Benz" },
  { terms: ["bmw"], slug: "bmw", name: "BMW" },
  { terms: ["hyundai"], slug: "hyundai", name: "Hyundai" },
  { terms: ["kia"], slug: "kia", name: "Kia" },
  { terms: ["honda"], slug: "honda", name: "Honda" },
  { terms: ["ford"], slug: "ford", name: "Ford" },
  { terms: ["nissan"], slug: "nissan", name: "Nissan" },
];

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function containsAny(haystack: string, terms: string[]) {
  return terms.some((term) => haystack.includes(term));
}

function buildText(input: MappingInput) {
  const labelsText = input.labels.map((label) => label.label.toLowerCase()).join(" ");
  return normalize(`${input.title} ${input.description} ${labelsText}`);
}

function suggestion(path: string, label: string, reason: string, confidence = 0.78): CategorySuggestion {
  const pathSlugs = path.split("/");
  return {
    rootSlug: pathSlugs[0] as CategorySuggestion["rootSlug"],
    pathSlugs,
    label,
    reason,
    confidence,
  };
}

export function mapSignalsToCategory(input: MappingInput): CategorySuggestion | null {
  const text = buildText(input);

  if (input.specsMatch) {
    const pathSlugs = input.specsMatch.categoryPath.split("/").filter(Boolean);
    const rootSlug = pathSlugs[0] as CategorySuggestion["rootSlug"] | undefined;
    const fallbackBrandSlug = BRAND_SLUG_BY_NAME[input.specsMatch.brand.toLowerCase()] ?? "other";
    const fallbackModelSlug = input.specsMatch.categoryPath.split("/").pop() ?? "other";

    return {
      rootSlug: rootSlug && ["real-estate", "vehicles", "mobile-phones-tablets", "second-hand-items", "electronics-computers", "home-furniture-appliances", "clothing-personal-items", "jobs", "services", "business-industry", "farm-animals", "education", "sports-hobbies", "other"].includes(rootSlug)
        ? rootSlug
        : "mobile-phones-tablets",
      pathSlugs: pathSlugs.length > 0 ? pathSlugs : ["mobile-phones-tablets", "mobile-phones", fallbackBrandSlug, fallbackModelSlug],
      label: `${input.specsMatch.categoryPath.split("/").map((segment) => segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())).join(" > ")}`,
      reason: `Detected known model from title/description: ${input.specsMatch.model}`,
      confidence: Math.max(0.65, input.specsMatch.confidence),
    };
  }

  if (containsAny(text, ["land cruiser prado", "prado", "پرادو"])) {
    return suggestion("vehicles/cars/toyota/land-cruiser-prado", "Vehicles > Cars > Toyota > Land Cruiser Prado", "Detected Toyota Prado signals.", 0.9);
  }

  if (containsAny(text, ["land cruiser", "landcruiser", "لندکروزر", "لند کروزر"])) {
    return suggestion("vehicles/cars/toyota/land-cruiser", "Vehicles > Cars > Toyota > Land Cruiser", "Detected Toyota Land Cruiser signals.", 0.9);
  }

  if (containsAny(text, ["corolla", "کرولا", "کروولا"])) {
    return suggestion("vehicles/cars/toyota/corolla", "Vehicles > Cars > Toyota > Corolla", "Detected Toyota Corolla signals.", 0.9);
  }

  if (containsAny(text, ["honda civic", "civic", "هوندا سیویک"])) {
    return suggestion("vehicles/cars/honda/civic", "Vehicles > Cars > Honda > Civic", "Detected Honda Civic signals.", 0.88);
  }

  if (containsAny(text, ["hyundai elantra", "elantra", "النترا"])) {
    return suggestion("vehicles/cars/hyundai/elantra", "Vehicles > Cars > Hyundai > Elantra", "Detected Hyundai Elantra signals.", 0.88);
  }

  if (containsAny(text, ["nissan patrol", "patrol", "نیسان پترول", "پترول"])) {
    return suggestion("vehicles/cars/nissan/patrol", "Vehicles > Cars > Nissan > Patrol", "Detected Nissan Patrol signals.", 0.88);
  }

  if (containsAny(text, ["suzuki swift", "swift hatchback"])) {
    return suggestion("vehicles/cars/suzuki", "Vehicles > Cars > Suzuki", "Detected Suzuki Swift signals.", 0.84);
  }

  if (containsAny(text, ["honda cg 125", "honda cg125", "cg 125", "cg125", "هوندا ۱۲۵", "هوندا 125"])) {
    return suggestion("vehicles/motorcycles/honda-cg125-honda-125", "Vehicles > Motorcycles > Honda CG125 / Honda 125", "Detected Honda CG125 motorcycle signals.", 0.9);
  }

  if (containsAny(text, ["electric rickshaw", "electric three wheeler", "برقی رکشا"])) {
    return suggestion("vehicles/rickshaws-three-wheelers/electric-rickshaw", "Vehicles > Rickshaws & Three Wheelers > Electric Rickshaw", "Detected electric rickshaw signals.", 0.88);
  }

  if (containsAny(text, ["mountain bike", "mountain bicycle", "بایسکل کوهی"])) {
    return suggestion("vehicles/bicycles/mountain-bike", "Vehicles > Bicycles > Mountain Bike", "Detected mountain bicycle signals.", 0.88);
  }

  if (containsAny(text, ["solar panel", "photovoltaic", "پنل سولر"])) {
    return suggestion("second-hand-items/electronics-computers/solar-power-equipment/solar-panels", "Second-hand Items > Electronics & Computers > Solar Power Equipment > Solar Panels", "Detected second-hand solar panel signals.", 0.86);
  }

  if (containsAny(text, ["laptop", "computer notebook", "لپ تاپ", "لپ‌تاپ"])) {
    return suggestion("second-hand-items/electronics-computers/laptops", "Second-hand Items > Electronics & Computers > Laptops", "Detected second-hand laptop signals.", 0.86);
  }

  if (containsAny(text, ["refrigerator", "fridge", "یخچال"])) {
    return suggestion("second-hand-items/home-appliances/refrigerator", "Second-hand Items > Home Appliances > Refrigerator", "Detected second-hand refrigerator signals.", 0.86);
  }

  if (containsAny(text, ["carpet", "rug", "قالین", "فرش"])) {
    return suggestion("second-hand-items/home-furniture-appliances/carpets-rugs", "Second-hand Items > Home, Furniture & Appliances > Carpets & Rugs", "Detected second-hand carpet or rug signals.", 0.84);
  }

  if (containsAny(text, ["men's winter jacket", "mens winter jacket", "male clothing", "لباس مردانه"])) {
    return suggestion("second-hand-items/clothing-personal-items/mens-clothing", "Second-hand Items > Clothing & Personal Items > Men's Clothing", "Detected second-hand men's clothing signals.", 0.84);
  }

  if (containsAny(text, ["school books", "textbook", "text book", "کتاب‌های درسی", "کتاب های درسی"])) {
    return suggestion("second-hand-items/books", "Second-hand Items > Books", "Detected second-hand school book signals.", 0.84);
  }

  if (containsAny(text, ["furnished apartment", "apartment furnished", "آپارتمان مبله", "اپارتمان مبله"])) {
    return suggestion("real-estate/apartments/furnished-apartment", "Real Estate > Apartments > Furnished Apartment", "Detected furnished apartment signals.", 0.88);
  }

  if (containsAny(text, ["villa", "ویلا", "ویلای"])) {
    return suggestion("real-estate/houses/villa", "Real Estate > Houses > Villa", "Detected villa signals.", 0.86);
  }

  if (containsAny(text, ["agricultural land", "farmland", "کرنیزه ځمکه", "زمین زراعتی"])) {
    return suggestion("real-estate/land/for-sale/agricultural-land", "Real Estate > Land > For Sale > Agricultural Land", "Detected agricultural land signals.", 0.86);
  }

  if (containsAny(text, ["warehouse", "storage warehouse", "گدام"])) {
    return suggestion("real-estate/warehouses", "Real Estate > Warehouses", "Detected warehouse signals.", 0.84);
  }

  if (containsAny(text, ["commercial shop", "دکان تجارتی", "دوکان تجارتي"])) {
    return suggestion("real-estate/shops-commercial", "Real Estate > Shops & Commercial", "Detected commercial shop signals.", 0.84);
  }

  if (containsAny(text, ["apartment", "aprtmnt", "آپارتمان", "اپارتمان"])) {
    return suggestion("real-estate/apartments/apartment", "Real Estate > Apartments > Apartment", "Detected apartment signals.", 0.82);
  }

  if (containsAny(text, ["ipad", "tablet", "تبلت"])) {
    return suggestion("mobile-phones-tablets/tablets", "Mobile Phones & Tablets > Tablets", "Detected tablet signals.", 0.86);
  }

  if (containsAny(text, ["smart watch", "smartwatch", "ساعت هوشمند", "هوښیار ساعت"])) {
    return suggestion("mobile-phones-tablets/smart-watches", "Mobile Phones & Tablets > Smart Watches", "Detected smart watch signals.", 0.86);
  }

  if (containsAny(text, ["google pixel", "گوگل پیکسل"])) {
    return suggestion("mobile-phones-tablets/mobile-phones/google-pixel", "Mobile Phones & Tablets > Mobile Phones > Google Pixel", "Detected Google Pixel signals.", 0.86);
  }

  if (containsAny(text, ["iphone", "apple phone", "apple iphone"])) {
    return {
      rootSlug: "mobile-phones-tablets",
      pathSlugs: ["mobile-phones-tablets", "mobile-phones", "apple-iphone"],
      label: "Mobile Phones & Tablets > Mobile Phones > Apple iPhone",
      reason: "Detected iPhone/Apple phone signals.",
      confidence: 0.72,
    };
  }

  if (containsAny(text, ["samsung galaxy", "galaxy s", "galaxy a", "galaxy note"])) {
    return {
      rootSlug: "mobile-phones-tablets",
      pathSlugs: ["mobile-phones-tablets", "mobile-phones", "samsung"],
      label: "Mobile Phones & Tablets > Mobile Phones > Samsung",
      reason: "Detected Samsung Galaxy signals.",
      confidence: 0.72,
    };
  }

  if (containsAny(text, ["xiaomi", "redmi", "poco"])) {
    return {
      rootSlug: "mobile-phones-tablets",
      pathSlugs: ["mobile-phones-tablets", "mobile-phones", "xiaomi"],
      label: "Mobile Phones & Tablets > Mobile Phones > Xiaomi",
      reason: "Detected Xiaomi/Redmi/Poco signals.",
      confidence: 0.7,
    };
  }

  if (containsAny(text, ["huawei"])) {
    return {
      rootSlug: "mobile-phones-tablets",
      pathSlugs: ["mobile-phones-tablets", "mobile-phones", "huawei"],
      label: "Mobile Phones & Tablets > Mobile Phones > Huawei",
      reason: "Detected Huawei signals.",
      confidence: 0.7,
    };
  }

  if (containsAny(text, ["honor"])) {
    return {
      rootSlug: "mobile-phones-tablets",
      pathSlugs: ["mobile-phones-tablets", "mobile-phones", "honor"],
      label: "Mobile Phones & Tablets > Mobile Phones > Honor",
      reason: "Detected Honor signals.",
      confidence: 0.7,
    };
  }

  if (containsAny(text, ["apartment", "house", "villa", "room"])) {
    return {
      rootSlug: "real-estate",
      pathSlugs: ["real-estate", "residential"],
      label: "Real Estate > Residential",
      reason: "Detected apartment/house/villa/room terms.",
      confidence: 0.68,
    };
  }

  if (containsAny(text, ["shop", "office", "warehouse"])) {
    return {
      rootSlug: "real-estate",
      pathSlugs: ["real-estate", "commercial"],
      label: "Real Estate > Commercial",
      reason: "Detected shop/office/warehouse terms.",
      confidence: 0.68,
    };
  }

  if (containsAny(text, ["land", "farm", "garden"])) {
    return {
      rootSlug: "real-estate",
      pathSlugs: ["real-estate", "land"],
      label: "Real Estate > Land",
      reason: "Detected land/farm/garden terms.",
      confidence: 0.68,
    };
  }

  if (containsAny(text, ["sofa", "bed", "chair", "table"])) {
    return {
      rootSlug: "home-furniture-appliances",
      pathSlugs: ["home-furniture-appliances", "furniture"],
      label: "Home, Furniture & Appliances > Furniture",
      reason: "Detected furniture terms.",
      confidence: 0.66,
    };
  }

  if (containsAny(text, ["refrigerator", "fridge", "washing machine", "oven", "microwave"])) {
    return {
      rootSlug: "home-furniture-appliances",
      pathSlugs: ["home-furniture-appliances", "home-appliances"],
      label: "Home, Furniture & Appliances > Home Appliances",
      reason: "Detected appliance terms.",
      confidence: 0.66,
    };
  }

  if (containsAny(text, ["car", "sedan", "suv", "corolla", "vehicle", "automobile"])) {
    const brand = CAR_BRANDS.find((entry) => containsAny(text, entry.terms));
    if (brand) {
      return {
        rootSlug: "vehicles",
        pathSlugs: ["vehicles", "cars", brand.slug],
        label: `Vehicles > Cars > ${brand.name}`,
        reason: `Detected car signals with brand: ${brand.name}.`,
        confidence: 0.7,
      };
    }

    return {
      rootSlug: "vehicles",
      pathSlugs: ["vehicles", "cars"],
      label: "Vehicles > Cars",
      reason: "Detected vehicle terms.",
      confidence: 0.64,
    };
  }

  return null;
}
