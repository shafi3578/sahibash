import type { AppLocale } from "@/lib/i18n/translations";

export type SchemaLabels = { en: string; fa: string; ps: string };
export type SchemaOption = { value: string; labels: SchemaLabels };
export type ConfiguredListingField = {
  key: string;
  type: "text" | "number" | "boolean" | "select" | "date";
  labels: SchemaLabels;
  options: SchemaOption[];
  unit: string | null;
  sectionKey: string;
  order: number;
  required: boolean;
  posting: boolean;
  filter: boolean;
  card: boolean;
  detail: boolean;
  active: boolean;
};
export type ConfiguredListingSection = {
  key: string;
  titles: SchemaLabels;
  order: number;
  visible: boolean;
};
export type ListingSchemaConfig = {
  schemaVersion: 1;
  fields: ConfiguredListingField[];
  sections: ConfiguredListingSection[];
};

export type ListingSchemaVersion = {
  id: string;
  category_node_id: number;
  version: number;
  status: "published" | "archived";
  config: ListingSchemaConfig;
  created_by: string;
  created_at: string;
  published_at: string;
  archived_at: string | null;
};

const FIELD_TYPES = new Set(["text", "number", "boolean", "select", "date"]);
const cleanText = (value: unknown, max = 160) => String(value ?? "").trim().slice(0, max);
const cleanKey = (value: unknown) => cleanText(value, 80).toLowerCase().replace(/[^a-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "");
const cleanOrder = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 10000 ? parsed : fallback;
};

function labels(value: unknown, fallback: string): SchemaLabels {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return {
    en: cleanText(input.en || fallback) || fallback,
    fa: cleanText(input.fa || input.en || fallback) || fallback,
    ps: cleanText(input.ps || input.en || fallback) || fallback,
  };
}

export function normalizeListingSchemaConfig(value: unknown): ListingSchemaConfig {
  if (!value || typeof value !== "object") throw new Error("Schema configuration must be an object.");
  const input = value as Record<string, unknown>;
  if (!Array.isArray(input.fields) || !Array.isArray(input.sections)) throw new Error("Schema fields and sections must be arrays.");
  if (input.fields.length > 250 || input.sections.length > 50) throw new Error("Schema is too large.");

  const seenFields = new Set<string>();
  const fields = input.fields.map((raw, index) => {
    const item = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
    const key = cleanKey(item.key);
    if (!key || seenFields.has(key)) throw new Error(`Field ${index + 1} has a missing or duplicate key.`);
    seenFields.add(key);
    const type = cleanText(item.type, 20);
    if (!FIELD_TYPES.has(type)) throw new Error(`Field ${key} has an unsupported type.`);
    const fieldLabels = labels(item.labels, key.replace(/_/g, " "));
    const optionValues = new Set<string>();
    const options = (Array.isArray(item.options) ? item.options : []).map((rawOption) => {
      const option = rawOption && typeof rawOption === "object" ? rawOption as Record<string, unknown> : {};
      const optionValue = cleanText(option.value, 120);
      if (!optionValue || optionValues.has(optionValue)) throw new Error(`Field ${key} has an empty or duplicate option.`);
      optionValues.add(optionValue);
      return { value: optionValue, labels: labels(option.labels, optionValue) };
    });
    return {
      key,
      type: type as ConfiguredListingField["type"],
      labels: fieldLabels,
      options,
      unit: cleanText(item.unit, 40) || null,
      sectionKey: cleanKey(item.sectionKey) || "details",
      order: cleanOrder(item.order, index),
      required: item.required === true,
      posting: item.posting !== false,
      filter: item.filter === true,
      card: item.card === true,
      detail: item.detail !== false,
      active: item.active !== false,
    };
  });

  const seenSections = new Set<string>();
  const sections = input.sections.map((raw, index) => {
    const item = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
    const key = cleanKey(item.key);
    if (!key || seenSections.has(key)) throw new Error(`Section ${index + 1} has a missing or duplicate key.`);
    seenSections.add(key);
    return { key, titles: labels(item.titles, key.replace(/_/g, " ")), order: cleanOrder(item.order, index), visible: item.visible !== false };
  });

  return { schemaVersion: 1, fields: fields.sort((a, b) => a.order - b.order), sections: sections.sort((a, b) => a.order - b.order) };
}

export function labelForLocale(value: SchemaLabels, locale: AppLocale) {
  return value[locale] || value.en;
}
