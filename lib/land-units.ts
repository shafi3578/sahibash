export type AfghanLandAreaUnit = "sqm" | "jerib" | "biswa";

const UNIT_TO_SQM: Record<AfghanLandAreaUnit, number> = {
  sqm: 1,
  jerib: 2000,
  biswa: 100,
};

const UNIT_ALIASES: Record<string, AfghanLandAreaUnit> = {
  sqm: "sqm",
  "m2": "sqm",
  "m²": "sqm",
  meter: "sqm",
  meters: "sqm",
  "square-meter": "sqm",
  "square-meters": "sqm",
  jerib: "jerib",
  jarib: "jerib",
  جریب: "jerib",
  biswa: "biswa",
  بسوه: "biswa",
  بسوا: "biswa",
};

export function normalizeAfghanLandAreaUnit(value: unknown): AfghanLandAreaUnit | null {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/\s+/g, "-");

  return UNIT_ALIASES[normalized] ?? null;
}

export function convertAfghanLandAreaToSquareMeters(value: unknown, unit: unknown): number | null {
  const amount = typeof value === "number" ? value : Number(String(value ?? "").replace(/[٬,\s]/g, ""));
  const normalizedUnit = normalizeAfghanLandAreaUnit(unit);

  if (!Number.isFinite(amount) || amount <= 0 || !normalizedUnit) {
    return null;
  }

  return amount * UNIT_TO_SQM[normalizedUnit];
}

export function formatAfghanLandAreaUnit(unit: AfghanLandAreaUnit, locale: "en" | "fa" | "ps" = "en") {
  if (unit === "sqm") return locale === "en" ? "m²" : "متر مربع";
  if (unit === "jerib") return locale === "ps" ? "جریب" : "جریب";
  return locale === "ps" ? "بسوه" : "بسوه";
}
