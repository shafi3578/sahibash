import { AFGHAN_PROVINCES } from "@/lib/constants/marketplace";
import { normalizeSearchText } from "@/lib/search/multilingual";

export type SmartDetectedCategorySlug =
  | "vehicles"
  | "mobile-phones-tablets"
  | "electronics-computers"
  | "real-estate"
  | "jobs"
  | "services"
  | "home-furniture-appliances"
  | "farm-animals"
  | "wanted-request-ads"
  | "other";

export type SmartPriceType = "fixed" | "negotiable" | "exchange" | "contact";

export type SmartPostingParseResult = {
  categorySlug: SmartDetectedCategorySlug;
  confidence: number;
  listingType: "for_sale" | "wanted";
  titleSuggestion: string;
  descriptionSuggestion: string;
  brand?: string;
  model?: string;
  storage?: string;
  ram?: string;
  battery?: string;
  condition?: string;
  province?: string;
  district?: string;
  price?: number;
  priceType: SmartPriceType;
  exchangeAccepted: boolean;
  negotiable: boolean;
  reasons: string[];
};

type CategoryRule = {
  slug: SmartDetectedCategorySlug;
  keywords: string[];
};

const CATEGORY_RULES: CategoryRule[] = [
  {
    slug: "mobile-phones-tablets",
    keywords: [
      "iphone", "samsung", "galaxy", "redmi", "xiaomi", "huawei", "mobile", "phone", "tablet",
      "موبایل", "مبایل", "گوشی", "ایفون", "آیفون", "تلیفون", "ټیلیفون", "سامسونگ", "سامسنگ",
    ],
  },
  {
    slug: "vehicles",
    keywords: [
      "toyota", "corolla", "honda", "civic", "vehicle", "car", "motorcycle", "truck", "van",
      "موتر", "موټر", "موترسایکل", "موتور", "کرولا", "فیلدر", "سراچه",
    ],
  },
  {
    slug: "real-estate",
    keywords: [
      "house", "home", "apartment", "land", "office", "shop", "rent", "property", "warehouse",
      "خانه", "کور", "اپارتمان", "آپارتمان", "حویلی", "زمین", "کرایه", "رهن",
    ],
  },
  {
    slug: "electronics-computers",
    keywords: [
      "laptop", "computer", "dell", "hp", "lenovo", "led", "tv", "camera", "router", "monitor",
      "کمپیوتر", "کامپیوتر", "لپتاب", "لېپ ټاپ", "تلویزیون",
    ],
  },
  {
    slug: "home-furniture-appliances",
    keywords: ["sofa", "carpet", "bed", "table", "chair", "furniture", "مبل", "قالین", "تخت", "میز", "چوکی", "فرش"],
  },
  {
    slug: "jobs",
    keywords: ["job", "vacancy", "work", "salary", "وظیفه", "کار", "استخدام", "معاش", "شاگردکار"],
  },
  {
    slug: "services",
    keywords: ["service", "repair", "course", "transport", "ترمیم", "خدمات", "تعمیر", "کورس", "مستری"],
  },
  {
    slug: "farm-animals",
    keywords: ["cow", "goat", "sheep", "chicken", "seed", "fertilizer", "گاو", "گوسفند", "بز", "مرغ", "چرګ"],
  },
  {
    slug: "wanted-request-ads",
    keywords: ["wanted", "need", "looking for", "خریدارم", "ضرورت دارم", "نیاز دارم", "پکار لرم", "ضرورت لرم", "میخواهم"],
  },
];

const PRICE_CONTACT_TERMS = ["contact", "call", "تماس", "به تماس", "زنګ", "اړیکه"];
const NEGOTIABLE_TERMS = ["negotiable", "جور آمد", "جورامد", "قابل جور آمد", "جور", "قابل جور"];
const EXCHANGE_TERMS = ["exchange", "مالچه", "بدل", "تبادله"];
const WANTED_TERMS = ["wanted", "need", "looking for", "خریدارم", "ضرورت دارم", "نیاز دارم", "پکار لرم", "ضرورت لرم", "میخواهم"];

const PHONE_BRANDS = ["Apple", "Samsung", "Xiaomi", "Redmi", "Huawei", "Honor", "Oppo", "Vivo", "Nokia", "Tecno", "Infinix", "OnePlus", "Realme", "Lenovo"];
const VEHICLE_BRANDS = ["Toyota", "Honda", "Nissan", "Hyundai", "Kia", "Suzuki", "Mazda", "Mitsubishi", "Lexus", "Mercedes-Benz", "BMW", "Ford", "Chevrolet", "Isuzu", "Hino"];

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(normalizeSearchText(term)));
}

function detectCategory(text: string): { slug: SmartDetectedCategorySlug; confidence: number; reasons: string[] } {
  const scores = new Map<SmartDetectedCategorySlug, { score: number; reasons: string[] }>();

  for (const rule of CATEGORY_RULES) {
    for (const keyword of rule.keywords) {
      const normalizedKeyword = normalizeSearchText(keyword);
      if (!normalizedKeyword) continue;
      if (text.includes(normalizedKeyword)) {
        const current = scores.get(rule.slug) ?? { score: 0, reasons: [] };
        current.score += normalizedKeyword.includes(" ") ? 2 : 1;
        if (current.reasons.length < 5) {
          current.reasons.push(keyword);
        }
        scores.set(rule.slug, current);
      }
    }
  }

  if (scores.size === 0) {
    return { slug: "other", confidence: 0.3, reasons: ["fallback"] };
  }

  let bestSlug: SmartDetectedCategorySlug = "other";
  let bestScore = -1;
  let bestReasons: string[] = [];
  for (const [slug, info] of scores.entries()) {
    if (info.score > bestScore) {
      bestSlug = slug;
      bestScore = info.score;
      bestReasons = info.reasons;
    }
  }

  const confidence = Math.min(0.92, 0.35 + bestScore * 0.12);
  return { slug: bestSlug, confidence, reasons: bestReasons };
}

function detectBrand(text: string, categorySlug: SmartDetectedCategorySlug) {
  const pool = categorySlug === "vehicles" ? VEHICLE_BRANDS : PHONE_BRANDS;
  return pool.find((brand) => text.includes(normalizeSearchText(brand)));
}

function detectStorage(text: string) {
  const match = text.match(/\b(16|32|64|128|256|512|1024)\s?(gb|tb)\b/i);
  if (!match) return undefined;
  const size = match[1];
  const unit = match[2].toUpperCase();
  if (unit === "TB" && size === "1024") return "1TB";
  return `${size}${unit}`;
}

function detectRam(text: string) {
  const match = text.match(/\b(2|3|4|6|8|12|16)\s?gb\s?(ram)?\b/i);
  return match ? `${match[1]}GB` : undefined;
}

function detectBattery(text: string) {
  const percent = text.match(/(\d{2,3})\s?%/);
  if (percent) return `${percent[1]}%`;
  return undefined;
}

function detectPrice(text: string) {
  const numeric = text.match(/(?:price|قیمت|بیه|نرخ)?\s*([0-9]{2,8})/i);
  if (!numeric) return undefined;
  const parsed = Number(numeric[1]);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function detectProvince(text: string) {
  const normalizedProvinceList = AFGHAN_PROVINCES.map((province) => ({
    province,
    normalized: normalizeSearchText(province),
  }));

  for (const row of normalizedProvinceList) {
    if (row.normalized && text.includes(row.normalized)) {
      return row.province;
    }
  }

  const heuristics: Array<{ terms: string[]; province: string }> = [
    { terms: ["کابل", "kabul"], province: "Kabul" },
    { terms: ["هرات", "herat"], province: "Herat" },
    { terms: ["مزار", "balkh", "بلخ"], province: "Balkh" },
    { terms: ["کندهار", "kandahar"], province: "Kandahar" },
    { terms: ["ننګرهار", "nangarhar", "ننگرهار"], province: "Nangarhar" },
  ];

  for (const item of heuristics) {
    if (includesAny(text, item.terms)) return item.province;
  }

  return undefined;
}

export function parseSmartPostingText(input: {
  title?: string;
  description?: string;
  rawText?: string;
}): SmartPostingParseResult {
  const combined = normalizeSearchText(
    `${input.rawText ?? ""} ${input.title ?? ""} ${input.description ?? ""}`
  );

  const { slug, confidence, reasons } = detectCategory(combined);
  const brand = detectBrand(combined, slug);
  const storage = detectStorage(combined);
  const ram = detectRam(combined);
  const battery = detectBattery(combined);
  const price = detectPrice(combined);
  const province = detectProvince(combined);

  const wanted = includesAny(combined, WANTED_TERMS) || slug === "wanted-request-ads";
  const negotiable = includesAny(combined, NEGOTIABLE_TERMS);
  const exchangeAccepted = includesAny(combined, EXCHANGE_TERMS);
  const contactPrice = includesAny(combined, PRICE_CONTACT_TERMS);

  const priceType: SmartPriceType = exchangeAccepted
    ? "exchange"
    : contactPrice
      ? "contact"
      : negotiable
        ? "negotiable"
        : "fixed";

  return {
    categorySlug: wanted ? "wanted-request-ads" : slug,
    confidence,
    listingType: wanted ? "wanted" : "for_sale",
    titleSuggestion: String(input.title ?? input.rawText ?? "").trim(),
    descriptionSuggestion: String(input.description ?? input.rawText ?? "").trim(),
    brand,
    model: undefined,
    storage,
    ram,
    battery,
    condition: includesAny(combined, ["new", "like new", "used", "repair", "parts", "نو", "مستعمل", "کارکرده"])
      ? "detected"
      : undefined,
    province,
    district: undefined,
    price,
    priceType,
    exchangeAccepted,
    negotiable,
    reasons,
  };
}
