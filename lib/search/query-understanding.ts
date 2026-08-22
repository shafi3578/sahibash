import { normalizeSearchText, tokenizeNormalizedSearch } from "@/lib/search/multilingual";

type ProvinceAlias = {
  canonical: string;
  aliases: string[];
};

type ProductAlias = {
  canonical: string;
  categoryScope: string;
  aliases: string[];
};

const AFGHAN_PROVINCES: ProvinceAlias[] = [
  { canonical: "Badakhshan", aliases: ["badakhshan", "بدخشان"] },
  { canonical: "Badghis", aliases: ["badghis", "بادغیس", "بادغيس"] },
  { canonical: "Baghlan", aliases: ["baghlan", "بغلان"] },
  { canonical: "Balkh", aliases: ["balkh", "مزار", "mazar", "m azar", "بلخ", "مزار شریف", "mजार"] },
  { canonical: "Bamyan", aliases: ["bamyan", "bamiyan", "بامیان", "باميان"] },
  { canonical: "Daykundi", aliases: ["daykundi", "daikundi", "دایکندی", "دایکندي"] },
  { canonical: "Farah", aliases: ["farah", "فراه"] },
  { canonical: "Faryab", aliases: ["faryab", "فاریاب", "فارياب"] },
  { canonical: "Ghazni", aliases: ["ghazni", "غزنی", "غزني"] },
  { canonical: "Ghor", aliases: ["ghor", "غور"] },
  { canonical: "Helmand", aliases: ["helmand", "هلمند"] },
  { canonical: "Herat", aliases: ["herat", "هرات"] },
  { canonical: "Jowzjan", aliases: ["jowzjan", "jawzjan", "جوزجان"] },
  { canonical: "Kabul", aliases: ["kabul", "kaboul", "کابل"] },
  { canonical: "Kandahar", aliases: ["kandahar", "قندهار", "کندهار"] },
  { canonical: "Kapisa", aliases: ["kapisa", "کاپیسا", "کاپيسا"] },
  { canonical: "Khost", aliases: ["khost", "خوست"] },
  { canonical: "Kunar", aliases: ["kunar", "کنر", "کونړ"] },
  { canonical: "Kunduz", aliases: ["kunduz", "کندز", "قندوز"] },
  { canonical: "Laghman", aliases: ["laghman", "لغمان"] },
  { canonical: "Logar", aliases: ["logar", "لوگر", "لوګر"] },
  { canonical: "Nangarhar", aliases: ["nangarhar", "jalalabad", "جلال آباد", "ننگرهار", "ننګرهار"] },
  { canonical: "Nimroz", aliases: ["nimroz", "نیمروز", "نيمروز"] },
  { canonical: "Nuristan", aliases: ["nuristan", "نورستان"] },
  { canonical: "Paktia", aliases: ["paktia", "پکتیا", "پکتيا"] },
  { canonical: "Paktika", aliases: ["paktika", "پکتیکا", "پکتيکا"] },
  { canonical: "Panjshir", aliases: ["panjshir", "پنجشیر", "پنجشير"] },
  { canonical: "Parwan", aliases: ["parwan", "پروان"] },
  { canonical: "Samangan", aliases: ["samangan", "سمنگان"] },
  { canonical: "Sar-e Pol", aliases: ["sar e pol", "saripul", "sarepul", "سرپل"] },
  { canonical: "Takhar", aliases: ["takhar", "تخار"] },
  { canonical: "Urozgan", aliases: ["urozgan", "uruzgan", "ارزگان", "روزگان"] },
  { canonical: "Wardak", aliases: ["wardak", "maidan wardak", "میدان وردک", "ميدان وردګ"] },
  { canonical: "Zabul", aliases: ["zabul", "زابل"] },
];

const STORAGE_NUMBERS = new Set([16, 32, 64, 128, 256, 512, 1024, 2048]);

const CRITICAL_PRODUCT_HINTS: ProductAlias[] = [
  { canonical: "Toyota Fielder", categoryScope: "vehicles", aliases: ["fielder", "fildr", "filder", "فیلدر", "فیلډر", "فلدر"] },
  { canonical: "Toyota Corolla", categoryScope: "vehicles", aliases: ["corolla", "corola", "کرولا", "کورولا", "تویوتا کرولا"] },
  { canonical: "Toyota Hilux", categoryScope: "vehicles", aliases: ["hilux", "hilex", "هایلکس", "هیلکس"] },
  { canonical: "iPhone", categoryScope: "mobile-phones-tablets", aliases: ["iphone", "i phone", "آیفون", "ایفون"] },
  { canonical: "Samsung Galaxy", categoryScope: "mobile-phones-tablets", aliases: ["samsung", "samson", "galaxy", "سامسونگ", "سامسنګ", "گلکسی"] },
];

function normalizeProvinceAliases() {
  return AFGHAN_PROVINCES.map((province) => ({
    canonical: province.canonical,
    aliases: Array.from(new Set([province.canonical, ...province.aliases].map(normalizeSearchText).filter(Boolean))),
  }));
}

const NORMALIZED_PROVINCES = normalizeProvinceAliases();
const NORMALIZED_PRODUCTS = CRITICAL_PRODUCT_HINTS.map((product) => ({
  ...product,
  aliases: Array.from(new Set([product.canonical, ...product.aliases].map(normalizeSearchText).filter(Boolean))),
}));

export type UnderstoodSearchQuery = {
  normalizedQuery: string;
  tokens: string[];
  year: number | null;
  storageGb: number | null;
  location: { province: string; matchedTerm: string } | null;
  productHints: Array<{ canonical: string; categoryScope: string; matchedTerm: string }>;
  numericTokens: number[];
};

export function understandSearchQuery(query: string): UnderstoodSearchQuery {
  const normalizedQuery = normalizeSearchText(query);
  const tokens = tokenizeNormalizedSearch(normalizedQuery);
  const numericTokens = tokens
    .map((token) => (/^\d+$/.test(token) ? Number.parseInt(token, 10) : Number.NaN))
    .filter((value) => Number.isFinite(value));

  const currentYear = new Date().getFullYear();
  const year = numericTokens.find((value) => value >= 1950 && value <= currentYear + 1) ?? null;
  const storageGb = numericTokens.find((value) => STORAGE_NUMBERS.has(value)) ?? null;

  let location: UnderstoodSearchQuery["location"] = null;
  for (const province of NORMALIZED_PROVINCES) {
    const matchedTerm = province.aliases.find((alias) => {
      if (!alias) return false;
      return normalizedQuery === alias || normalizedQuery.includes(alias) || tokens.includes(alias);
    });
    if (matchedTerm) {
      location = { province: province.canonical, matchedTerm };
      break;
    }
  }

  const productHints = NORMALIZED_PRODUCTS.flatMap((product) => {
    const matchedTerm = product.aliases.find((alias) => {
      if (!alias) return false;
      return normalizedQuery === alias || normalizedQuery.includes(alias) || tokens.includes(alias);
    });
    return matchedTerm ? [{ canonical: product.canonical, categoryScope: product.categoryScope, matchedTerm }] : [];
  });

  return {
    normalizedQuery,
    tokens,
    year,
    storageGb,
    location,
    productHints,
    numericTokens,
  };
}
