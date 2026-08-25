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

function extractMaxPrice(normalized: string) {
  const patterns = [
    /(?:under|below|less than|max|maximum|up to|budget|تا|زیر|کمتر از|حداکثر|لاندې|تر)\s+(\d{4,9})/u,
    /(\d{4,9})\s*(?:afn|afs|افغانی|افغانۍ|افغانیو)\s*(?:or less|and below|یا کمتر|یا کم|نه کم)?/u,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) {
      const parsed = Number(match[1]);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
  }

  return null;
}

function extractExactYear(numbers: number[], maxPrice: number | null) {
  const currentYear = new Date().getFullYear();
  return numbers.find((value) => value !== maxPrice && value >= 1950 && value <= currentYear + 1) ?? null;
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
    };
  }
  return {
    query: "Search",
    province: "Province",
    maxPrice: "Under",
    year: "Year",
    brand: "Brand",
    model: "Model",
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

  const exactYear = extractExactYear(understood.numericTokens, maxPrice);
  if (exactYear) {
    params.yearMin = String(exactYear);
    params.yearMax = String(exactYear);
    chips.push({
      key: "year",
      label: labels.year,
      value: String(exactYear),
      removeKeys: ["yearMin", "yearMax", "year_min", "year_max"],
    });
    confidence += 0.08;
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
