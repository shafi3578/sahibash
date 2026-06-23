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
  rootSlug: "real-estate" | "vehicles" | "mobile-phones-tablets" | "electronics-computers" | "home-furniture-appliances" | "clothing-personal-items" | "jobs" | "services" | "business-industry" | "farm-animals" | "education" | "sports-hobbies" | "other";
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

export function mapSignalsToCategory(input: MappingInput): CategorySuggestion | null {
  const text = buildText(input);

  if (input.specsMatch) {
    const pathSlugs = input.specsMatch.categoryPath.split("/").filter(Boolean);
    const rootSlug = pathSlugs[0] as CategorySuggestion["rootSlug"] | undefined;
    const fallbackBrandSlug = BRAND_SLUG_BY_NAME[input.specsMatch.brand.toLowerCase()] ?? "other";
    const fallbackModelSlug = input.specsMatch.categoryPath.split("/").pop() ?? "other";

    return {
      rootSlug: rootSlug && ["real-estate", "vehicles", "mobile-phones-tablets", "electronics-computers", "home-furniture-appliances", "clothing-personal-items", "jobs", "services", "business-industry", "farm-animals", "education", "sports-hobbies", "other"].includes(rootSlug)
        ? rootSlug
        : "mobile-phones-tablets",
      pathSlugs: pathSlugs.length > 0 ? pathSlugs : ["mobile-phones-tablets", "mobile-phones", fallbackBrandSlug, fallbackModelSlug],
      label: `${input.specsMatch.categoryPath.split("/").map((segment) => segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())).join(" > ")}`,
      reason: `Detected known model from title/description: ${input.specsMatch.model}`,
      confidence: Math.max(0.65, input.specsMatch.confidence),
    };
  }

  if (containsAny(text, ["iphone", "apple phone", "apple iphone", "smartphone", "mobile phone"])) {
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
