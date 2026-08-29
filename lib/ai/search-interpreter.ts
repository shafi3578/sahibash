import "server-only";

import { getAiFeatureFlags } from "@/lib/ai/feature-flags";
import { requestGatewaySearchIntent, type AiSearchGatewayStatus } from "@/lib/ai/search-gateway";
import { parseSahibashAiSearch, type AiSearchChip, type SahibashAiSearchParse } from "@/lib/ai/search-parser";
import { getCategoryNodeByPath } from "@/lib/data/queries";
import type { AppLocale } from "@/lib/i18n/translations";
import { getPublicDistricts, getPublicProvinces } from "@/lib/location/reference-data";
import { matchAfghanistanLocationRows } from "@/lib/location/reverse-match";
import { consumeRateLimit } from "@/lib/security/rate-limit";

export type AiSearchInterpretation = Omit<SahibashAiSearchParse, "parserSource"> & {
  parserSource: "deterministic" | "llm" | "hybrid";
  gatewayStatus: AiSearchGatewayStatus | "disabled" | "rate_limited";
  gatewayModel: string | null;
  latencyMs: number | null;
  inputTokens: number | null;
  outputTokens: number | null;
  estimatedCostUsd: number | null;
  fallbackReason: string | null;
};

function displayNumber(value: number, locale: AppLocale) {
  return new Intl.NumberFormat(locale === "en" ? "en" : locale === "ps" ? "ps-AF" : "fa-AF").format(value);
}

function chipCopy(locale: AppLocale) {
  if (locale === "fa") return { minimum: "حداقل", maximum: "حداکثر", rooms: "اتاق", land: "مساحت", sort: "ترتیب", district: "ولسوالی" };
  if (locale === "ps") return { minimum: "لږ تر لږه", maximum: "تر ډېره", rooms: "خونې", land: "مساحت", sort: "ترتیب", district: "ولسوالي" };
  return { minimum: "Minimum", maximum: "Maximum", rooms: "Rooms", land: "Land", sort: "Sort", district: "District" };
}

function addChip(chips: AiSearchChip[], chip: AiSearchChip) {
  if (!chips.some((item) => item.key === chip.key)) chips.push(chip);
}

export async function interpretAiSearch(input: {
  query: string;
  locale: AppLocale;
  userId?: string | null;
}): Promise<AiSearchInterpretation | null> {
  const rawQuery = String(input.query ?? "").trim().slice(0, 240);
  const deterministic = parseSahibashAiSearch(rawQuery, input.locale);
  if (!deterministic) return null;

  const flags = await getAiFeatureFlags();
  if (!flags.aiSearchEnabled) {
    return { ...deterministic, gatewayStatus: "disabled", gatewayModel: null, latencyMs: null, inputTokens: null, outputTokens: null, estimatedCostUsd: null, fallbackReason: "feature_disabled" };
  }

  const rateLimit = await consumeRateLimit({ scope: "ai.search", userId: input.userId, maxRequests: 20, windowSeconds: 600 });
  if (!rateLimit.allowed) {
    return { ...deterministic, gatewayStatus: "rate_limited", gatewayModel: null, latencyMs: null, inputTokens: null, outputTokens: null, estimatedCostUsd: null, fallbackReason: "rate_limited" };
  }

  const gateway = await requestGatewaySearchIntent({ query: rawQuery, locale: input.locale, userId: input.userId });
  if (!gateway.intent) {
    return {
      ...deterministic,
      gatewayStatus: gateway.status,
      gatewayModel: gateway.model,
      latencyMs: gateway.latencyMs,
      inputTokens: gateway.inputTokens,
      outputTokens: gateway.outputTokens,
      estimatedCostUsd: gateway.estimatedCostUsd,
      fallbackReason: gateway.status,
    };
  }

  if (gateway.intent.confidence < 0.45) {
    return {
      ...deterministic,
      gatewayStatus: gateway.status,
      gatewayModel: gateway.model,
      latencyMs: gateway.latencyMs,
      inputTokens: gateway.inputTokens,
      outputTokens: gateway.outputTokens,
      estimatedCostUsd: gateway.estimatedCostUsd,
      fallbackReason: "low_confidence",
    };
  }

  const params = { ...deterministic.params };
  const chips = [...deterministic.chips];
  const labels = chipCopy(input.locale);
  const intent = gateway.intent;

  if (intent.query) params.q = intent.query;
  const numericMappings = [
    ["minPrice", intent.minPrice], ["maxPrice", intent.maxPrice],
    ["yearMin", intent.yearMin], ["yearMax", intent.yearMax],
    ["minRooms", intent.minRooms], ["minLandSize", intent.minLandSize], ["maxLandSize", intent.maxLandSize],
  ] as const;
  for (const [key, value] of numericMappings) {
    if (typeof value === "number") params[key] = String(value);
  }
  if (intent.currency) params.currency = intent.currency;
  if (intent.vehicleBrand) params.vehicleBrand = intent.vehicleBrand;
  if (intent.vehicleModel) params.vehicleModel = intent.vehicleModel;
  if (intent.phoneModel) params.phoneModel = intent.phoneModel;
  if (intent.rentalType) params.rentalType = intent.rentalType;
  if (intent.condition) params.condition = intent.condition;
  if (intent.listingType) params.listingType = intent.listingType;
  if (intent.sort) params.sort = intent.sort;

  if (intent.minPrice !== undefined) addChip(chips, { key: "minPrice", label: labels.minimum, value: `${displayNumber(intent.minPrice, input.locale)} ${intent.currency ?? "AFN"}`, removeKeys: ["minPrice", "min_price"] });
  if (intent.maxPrice !== undefined) addChip(chips, { key: "maxPrice", label: labels.maximum, value: `${displayNumber(intent.maxPrice, input.locale)} ${intent.currency ?? "AFN"}`, removeKeys: ["maxPrice", "max_price"] });
  if (intent.minRooms !== undefined) addChip(chips, { key: "minRooms", label: labels.rooms, value: `${intent.minRooms}+`, removeKeys: ["minRooms", "rooms_min"] });
  const landValue = intent.minLandSize ?? intent.maxLandSize;
  if (landValue !== undefined) addChip(chips, { key: "landSize", label: labels.land, value: `${displayNumber(landValue, input.locale)} m²`, removeKeys: ["minLandSize", "maxLandSize", "min_land_size", "max_land_size"] });
  if (intent.sort) addChip(chips, { key: "sort", label: labels.sort, value: intent.sort.replaceAll("_", " "), removeKeys: ["sort"] });

  let categoryPath = deterministic.categoryPath;
  if (intent.categoryPath) {
    const category = await getCategoryNodeByPath(intent.categoryPath);
    if (category?.is_active) categoryPath = category.path;
  }

  if (intent.province) {
    const provinces = await getPublicProvinces();
    const provinceMatch = matchAfghanistanLocationRows({
      provinces,
      districts: [],
      provinceNames: [intent.province],
      districtNames: [],
    }).province;
    if (provinceMatch) {
      params.province = String(provinceMatch.name_en ?? provinceMatch.name ?? "");
      if (intent.district) {
        const districts = await getPublicDistricts(provinceMatch.id);
        const districtMatch = matchAfghanistanLocationRows({
          provinces: [provinceMatch],
          districts,
          provinceNames: [intent.province],
          districtNames: [intent.district],
        }).district;
        if (districtMatch) {
          params.district = String(districtMatch.name_en ?? districtMatch.name ?? "");
          addChip(chips, { key: "district", label: labels.district, value: params.district, removeKeys: ["district"] });
        }
      }
    }
  }

  return {
    ...deterministic,
    params,
    chips,
    categoryPath,
    confidence: Math.max(deterministic.confidence, intent.confidence),
    parserSource: "hybrid",
    gatewayStatus: gateway.status,
    gatewayModel: gateway.model,
    latencyMs: gateway.latencyMs,
    inputTokens: gateway.inputTokens,
    outputTokens: gateway.outputTokens,
    estimatedCostUsd: gateway.estimatedCostUsd,
    fallbackReason: intent.categoryPath && categoryPath !== intent.categoryPath ? "invalid_taxonomy_path" : null,
  };
}
