import type { AppLocale } from "@/lib/i18n/translations";
import type { ConfiguredListingField, ListingSchemaConfig } from "@/lib/listing-schema-config";

export type PublishedPostingOption = {
  value: string;
  label: string;
};

export type PublishedPostingField = {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "select" | "checkbox";
  options?: PublishedPostingOption[];
  required?: boolean;
  unit?: string;
  sectionKey: string;
  order: number;
  usesPublishedLabel: true;
};

function localizedLabel(labels: { en: string; fa: string; ps: string }, locale: AppLocale) {
  return labels[locale] || labels.en;
}

function isAppleIphonePath(path: string) {
  const normalized = path.toLowerCase();
  return normalized.includes("/mobile-phones/apple-iphone")
    || normalized.includes("/mobile-phones/apple/iphone-")
    || normalized.endsWith("/mobile-phones/apple");
}

export function isPublishedFieldApplicable(categoryPath: string, fieldKey: string) {
  if (fieldKey === "ram_gb" && isAppleIphonePath(categoryPath)) return false;
  return true;
}

function toPublishedPostingField(field: ConfiguredListingField, locale: AppLocale): PublishedPostingField {
  return {
    key: field.key,
    label: localizedLabel(field.labels, locale),
    type: field.type === "boolean" ? "checkbox" : field.type,
    options: field.options.length > 0
      ? field.options.map((option) => ({ value: option.value, label: localizedLabel(option.labels, locale) }))
      : undefined,
    required: field.required,
    unit: field.unit ?? undefined,
    sectionKey: field.sectionKey,
    order: field.order,
    usesPublishedLabel: true,
  };
}

function areaUnitField(locale: AppLocale, source: PublishedPostingField): PublishedPostingField {
  const labels = {
    en: "Area unit",
    fa: "واحد مساحت",
    ps: "د مساحت واحد",
  } as const;
  const options = [
    { value: "sqm", labels: { en: "Square metre", fa: "متر مربع", ps: "متر مربع" } },
    { value: "biswa", labels: { en: "Biswa", fa: "بسوه", ps: "بسوه" } },
    { value: "jerib", labels: { en: "Jerib", fa: "جریب", ps: "جریب" } },
  ];
  return {
    key: "areaUnit",
    label: labels[locale],
    type: "select",
    options: options.map((option) => ({ value: option.value, label: option.labels[locale] })),
    required: source.required,
    sectionKey: source.sectionKey,
    order: source.order + 1,
    usesPublishedLabel: true,
  };
}

export function getPublishedPostingFields(
  config: ListingSchemaConfig | null | undefined,
  locale: AppLocale,
  categoryPath: string,
) {
  if (!config) return [];

  return config.fields
    .filter((field) => field.active && field.posting && isPublishedFieldApplicable(categoryPath, field.key))
    .sort((a, b) => a.order - b.order)
    .flatMap((field) => {
      const mapped = toPublishedPostingField(field, locale);
      if (field.key !== "area_sqm") return [mapped];
      return [
        { ...mapped, key: "areaSize", unit: undefined },
        areaUnitField(locale, mapped),
      ];
    });
}

export function hasPublishedDetailValue(value: string | boolean | undefined) {
  if (typeof value === "boolean") return true;
  return String(value ?? "").trim().length > 0;
}
