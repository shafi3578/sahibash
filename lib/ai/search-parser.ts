import { getProvinceLabel } from "@/lib/constants/marketplace";
import type { AppLocale } from "@/lib/i18n/translations";
import { detectSearchIntent } from "@/lib/search/intent";
import { normalizeSearchText } from "@/lib/search/multilingual";
import { understandSearchQuery } from "@/lib/search/query-understanding";

export type AiSearchChip = {
  key: string;
  label: string;
  value: string;
  removeKeys: string[];
};

export type SahibashAiSearchParse = {
  rawQuery: string;
  normalizedQuery: string;
  params: Record<string, string>;
  chips: AiSearchChip[];
  categoryPath: string | null;
  confidence: number;
  parserSource: "deterministic";
};

function titleCase(value: string) {
  return value
    .split(/\s+/)
    .map((part) => (part ? `${part[0].toUpperCase()}${part.slice(1).toLowerCase()}` : part))
    .join(" ");
}

function normalizeModelName(model?: string) {
  if (!model) return "";
  const clean = model.replace(/^toyota\s+/i, "").trim();
  if (/corola|corolla|کرولا|کورولا/i.test(clean)) return "Corolla";
  if (/prius|پریوس/i.test(clean)) return "Prius";
  if (/hilux|هایلکس|هیلکس/i.test(clean)) return "Hilux";
  return clean;
}

function multiplierForUnit(unit: string | undefined) {
  if (!unit) return 1;
  if (/^(?:k|thousand|هزار|زر|زره)$/u.test(unit)) return 1_000;
  if (/^(?:lakh|lac|لک|لاکه|لکه)$/u.test(unit)) return 100_000;
  return 1;
}

function parseAmount(value: string, unit?: string) {
  const parsed = Number(value.replaceAll(",", ""));
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed * multiplierForUnit(unit));
}

function extractMaxPrice(normalized: string) {
  const patterns = [
    /(?:under|below|less than|max|maximum|up to|budget|تا|زیر|کمتر از|حداکثر|لاندې|تر)\s+(\d+(?:\.\d+)?)\s*(k|thousand|هزار|زر|زره|lakh|lac|لک|لاکه|لکه)?/u,
    /(\d+(?:\.\d+)?)\s*(k|thousand|هزار|زر|زره|lakh|lac|لک|لاکه|لکه)?\s*(?:afn|afs|افغانی|افغانۍ|افغانیو)\s*(?:or less|and below|یا کمتر|یا کم|نه کم)?/u,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) {
      const parsed = parseAmount(match[1], match[2]);
      if (parsed) return parsed;
    }
  }

  if (/(?:پنځه|پنج)\s*(?:lakh|lac|لک|لاکه|لکه)/u.test(normalized)) return 500_000;

  return null;
}

function extractYearBounds(normalized: string, numbers: number[], maxPrice: number | null) {
  const currentYear = new Date().getFullYear();
  const year = numbers.find((value) => value !== maxPrice && value >= 1950 && value <= currentYear + 1) ?? null;
  if (!year) return { min: null, max: null };
  const yearText = String(year);
  const newer = new RegExp(`${yearText}\\s*(?:or newer|or later|and newer|به بعد|یا جدیدتر|به بالا|او وروسته|یا نویتر)`, "u").test(normalized);
  const older = new RegExp(`${yearText}\\s*(?:or older|or earlier|and older|یا قدیمی تر|به پایین|او پخوانی|یا زوړ)`, "u").test(normalized);
  if (newer) return { min: year, max: null };
  if (older) return { min: null, max: year };
  return { min: year, max: year };
}

function extractRooms(normalized: string) {
  const match = normalized.match(/(\d{1,2})\s*(?:bed(?:room)?s?|rooms?|اتاق|اطاق|خونه|خونې)/u);
  return match?.[1] ? Number(match[1]) : null;
}

function extractLandSize(normalized: string) {
  const match = normalized.match(/(\d+(?:\.\d+)?)\s*(jerib|جریب|جریبه|biswa|بسوه|بیسوه|m2|sqm|متر مربع)/u);
  if (!match?.[1] || !match[2]) return null;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const multiplier = /^(?:jerib|جریب|جریبه)$/u.test(match[2])
    ? 2_000
    : /^(?:biswa|بسوه|بیسوه)$/u.test(match[2]) ? 100 : 1;
  return { squareMetres: Math.round(amount * multiplier), original: `${match[1]} ${match[2]}` };
}

function chipLabels(locale: AppLocale) {
  if (locale === "ps") {
    return {
      query: "لټون",
      province: "ولایت",
      maxPrice: "تر دې بیې کم",
      year: "کال",
      brand: "برانډ",
      model: "موډل",
      rooms: "خونې",
      land: "مساحت",
      sort: "ترتیب",
    };
  }
  if (locale === "fa") {
    return {
      query: "جستجو",
      province: "ولایت",
      maxPrice: "زیر این قیمت",
      year: "سال",
      brand: "برند",
      model: "مدل",
      rooms: "اتاق",
      land: "مساحت",
      sort: "ترتیب",
    };
  }
  return {
    query: "Search",
    province: "Province",
    maxPrice: "Under",
    year: "Year",
    brand: "Brand",
    model: "Model",
    rooms: "Rooms",
    land: "Land",
    sort: "Sort",
  };
}

export function parseSahibashAiSearch(query: string, locale: AppLocale): SahibashAiSearchParse | null {
  const rawQuery = String(query ?? "").trim().slice(0, 240);
  if (rawQuery.length < 2) return null;

  const normalizedQuery = normalizeSearchText(rawQuery);
  if (!normalizedQuery) return null;

  const understood = understandSearchQuery(rawQuery);
  const intent = detectSearchIntent(rawQuery);
  const firstProduct = understood.productHints[0];
  const labels = chipLabels(locale);
  const params: Record<string, string> = {};
  const chips: AiSearchChip[] = [];
  let confidence = 0.45;

  const productName = firstProduct?.canonical ?? intent?.model ?? intent?.brand ?? "";
  const model = normalizeModelName(intent?.model ?? productName);
  const isToyotaCorolla = /toyota corolla|corolla|corola|کرولا|کورولا/i.test(productName || rawQuery);
  if (isToyotaCorolla) {
    params.q = "Corolla";
    params.vehicleBrand = "Toyota";
    params.vehicleModel = "Corolla";
    chips.push({ key: "model", label: labels.model, value: "Corolla", removeKeys: ["q", "vehicleBrand", "vehicleModel"] });
    confidence += 0.25;
  } else if (model) {
    params.q = model;
    if (intent?.brand) params.vehicleBrand = intent.brand;
    if (model) params.vehicleModel = model;
    chips.push({ key: "query", label: labels.query, value: model, removeKeys: ["q", "vehicleBrand", "vehicleModel"] });
    confidence += 0.18;
  } else if (intent?.brand) {
    params.q = intent.brand;
    params.vehicleBrand = intent.brand;
    chips.push({ key: "brand", label: labels.brand, value: intent.brand, removeKeys: ["q", "vehicleBrand"] });
    confidence += 0.14;
  } else {
    const cleaned = normalizedQuery
      .replace(/(?:under|below|less than|max|maximum|up to|budget|تا|زیر|کمتر از|حداکثر|لاندې|تر)\s+\d{4,9}/gu, "")
      .trim();
    params.q = cleaned || rawQuery;
    chips.push({ key: "query", label: labels.query, value: params.q, removeKeys: ["q"] });
  }

  const province = understood.location?.province ?? null;
  if (province) {
    params.province = province;
    chips.push({
      key: "province",
      label: labels.province,
      value: getProvinceLabel(province, locale),
      removeKeys: ["province"],
    });
    confidence += 0.18;
  }

  const maxPrice = extractMaxPrice(normalizedQuery);
  if (maxPrice) {
    params.maxPrice = String(maxPrice);
    params.currency = "AFN";
    chips.push({
      key: "maxPrice",
      label: labels.maxPrice,
      value: `${new Intl.NumberFormat(locale === "en" ? "en" : locale === "ps" ? "ps-AF" : "fa-AF").format(maxPrice)} AFN`,
      removeKeys: ["maxPrice", "max_price", "currency"],
    });
    confidence += 0.12;
  }

  const yearBounds = extractYearBounds(normalizedQuery, understood.numericTokens, maxPrice);
  if (yearBounds.min || yearBounds.max) {
    if (yearBounds.min) params.yearMin = String(yearBounds.min);
    if (yearBounds.max) params.yearMax = String(yearBounds.max);
    chips.push({
      key: "year",
      label: labels.year,
      value: yearBounds.min && !yearBounds.max
        ? `${yearBounds.min}+`
        : yearBounds.max && !yearBounds.min ? `≤ ${yearBounds.max}` : String(yearBounds.min),
      removeKeys: ["yearMin", "yearMax", "year_min", "year_max"],
    });
    confidence += 0.08;
  }

  const rooms = extractRooms(normalizedQuery);
  if (rooms) {
    params.minRooms = String(rooms);
    chips.push({ key: "rooms", label: labels.rooms, value: `${rooms}+`, removeKeys: ["minRooms", "rooms_min"] });
    confidence += 0.06;
  }

  const landSize = extractLandSize(normalizedQuery);
  if (landSize) {
    params.minLandSize = String(landSize.squareMetres);
    params.maxLandSize = String(landSize.squareMetres);
    chips.push({ key: "land", label: labels.land, value: landSize.original, removeKeys: ["minLandSize", "maxLandSize", "min_land_size", "max_land_size"] });
    confidence += 0.08;
  }

  if (/(?:cheapest|lowest price|cheap first|ارزان ترین|ارزانترین|کمترین قیمت|تر ټولو ارزانه)/u.test(normalizedQuery)) {
    params.sort = "price_low";
    chips.push({ key: "sort", label: labels.sort, value: "price low", removeKeys: ["sort"] });
  }

  if (/(?:wanted|looking for|خریدارم|ضرورت دارم|نیاز دارم|غواړم|اړتیا لرم)/u.test(normalizedQuery)) {
    params.listingType = "wanted";
  } else if (/(?:for sale|فروشی|برای فروش|د خرڅلاو)/u.test(normalizedQuery)) {
    params.listingType = "for_sale";
  }

  const categoryPath = intent?.categoryPath
    ?? (firstProduct?.categoryScope === "vehicles" ? "vehicles/cars" : firstProduct?.categoryScope ?? null);

  if (!params.q && rawQuery) {
    params.q = titleCase(rawQuery);
  }

  return {
    rawQuery,
    normalizedQuery,
    params,
    chips,
    categoryPath,
    confidence: Math.min(0.99, Number(confidence.toFixed(2))),
    parserSource: "deterministic",
  };
}
