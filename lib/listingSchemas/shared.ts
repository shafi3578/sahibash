import type { AppLocale } from "@/lib/i18n/translations";
import type { ListingAttribute, ListingWithRelations } from "@/types/database";

export type SchemaLocale = AppLocale;

export type LocalizedText = Record<SchemaLocale, string>;

export type SchemaFieldResult = {
  key: string;
  label: string;
  value: string | string[];
  sectionKey: string;
  autoFilled?: boolean;
  order?: number;
};

export type SchemaFieldContext = {
  listing: ListingWithRelations;
  attributes: Map<string, string>;
  locale: SchemaLocale;
  path: string;
  rootSlug: string;
};

export type SchemaFieldDefinition = {
  key: string;
  label: LocalizedText;
  sectionKey: string;
  order: number;
  highlight?: boolean;
  consumes?: string[];
  showIf?: (context: SchemaFieldContext) => boolean;
  resolve: (context: SchemaFieldContext) => SchemaFieldResult | null;
};

export type SchemaSectionDefinition = {
  key: string;
  title: LocalizedText;
  order: number;
  description?: LocalizedText;
  fieldKeys: string[];
  hideIfEmpty?: boolean;
};

export type ListingSchemaDefinition = {
  key: string;
  rootSlugs: string[];
  match: (listing: ListingWithRelations) => boolean;
  fields: SchemaFieldDefinition[];
  sections: SchemaSectionDefinition[];
  postingFields: string[];
  requiredFields: string[];
  optionalFields: string[];
  filterFields: string[];
  autoFillRules: Array<{ when: LocalizedText; suggest: LocalizedText[] }>;
  safetyTips: Record<SchemaLocale, string[]>;
  translationKeys: Record<string, string>;
};

export type ListingSchemaView = {
  schema: ListingSchemaDefinition | null;
  sections: Array<{
    key: string;
    title: string;
    description?: string;
    rows: SchemaFieldResult[];
  }>;
  quickFacts: SchemaFieldResult[];
  autoFilled: SchemaFieldResult[];
  consumedAttributeKeys: Set<string>;
  safetyTips: string[];
};

export function localized(en: string, fa: string, ps: string): LocalizedText {
  return { en, fa, ps };
}

export function isMeaningfulValue(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized.length > 0 && normalized !== "-" && normalized !== "null" && normalized !== "undefined";
  }

  if (Array.isArray(value)) {
    return value.some((item) => isMeaningfulValue(item));
  }

  return true;
}

export function firstMeaningfulText(...values: Array<string | number | boolean | null | undefined>): string | null {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
    if (typeof value === "boolean") {
      return value ? "true" : "false";
    }
    if (typeof value === "string") {
      const normalized = value.trim();
      if (isMeaningfulValue(normalized)) {
        return normalized;
      }
    }
  }

  return null;
}

export function normalizeAttributeKey(key: string): string {
  return key.startsWith("locked__") ? key.slice("locked__".length) : key;
}

export function getListingRootSlug(listing: ListingWithRelations): string {
  return String(listing.category?.slug ?? listing.category_node?.path?.split("/")[0] ?? "").trim();
}

export function getListingPath(listing: ListingWithRelations): string {
  return String(listing.category_node?.path ?? getListingRootSlug(listing)).trim();
}

export function attributeMapFromListing(listing: ListingWithRelations): Map<string, string> {
  const attributes = (listing.listing_attributes ?? []) as ListingAttribute[];
  const map = new Map<string, string>();

  for (const attr of attributes) {
    const textValue =
      typeof attr.attribute_value_text === "string" && attr.attribute_value_text.trim().length > 0
        ? attr.attribute_value_text.trim()
        : typeof attr.attribute_value_number === "number"
          ? String(attr.attribute_value_number)
          : typeof attr.attribute_value_boolean === "boolean"
            ? attr.attribute_value_boolean
              ? "true"
              : "false"
            : null;

    if (textValue && isMeaningfulValue(textValue)) {
      map.set(attr.attribute_key, textValue);
      map.set(normalizeAttributeKey(attr.attribute_key), textValue);
    }
  }

  return map;
}

export function yesNo(locale: SchemaLocale, value: boolean): string {
  if (locale === "fa") return value ? "بلی" : "خیر";
  if (locale === "ps") return value ? "هو" : "نه";
  return value ? "Yes" : "No";
}

export function formatNumber(value: number | string, locale: SchemaLocale = "en"): string {
  const numberValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numberValue)) {
    return String(value);
  }
  const localeCode = locale === "fa" ? "fa-AF" : locale === "ps" ? "ps-AF" : "en-US";
  return new Intl.NumberFormat(localeCode).format(numberValue);
}

export function formatList(values: Array<string | number | null | undefined>): string[] {
  return values
    .map((value) => (typeof value === "number" ? String(value) : String(value ?? "").trim()))
    .filter((value) => isMeaningfulValue(value));
}

export function readListingValue(listing: ListingWithRelations, key: string): string | null {
  const value = (listing as Record<string, unknown>)[key];
  if (typeof value === "string") {
    return isMeaningfulValue(value) ? value.trim() : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  return null;
}

export function readAttributeValue(attributes: Map<string, string>, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = attributes.get(key) ?? attributes.get(normalizeAttributeKey(key));
    if (typeof value === "string" && isMeaningfulValue(value)) {
      return value.trim();
    }
  }
  return null;
}

export function resolveSchemaFieldContext(
  listing: ListingWithRelations,
  locale: SchemaLocale
): SchemaFieldContext {
  return {
    listing,
    attributes: attributeMapFromListing(listing),
    locale,
    path: getListingPath(listing),
    rootSlug: getListingRootSlug(listing),
  };
}

function localizeBooleanLike(value: string | string[], locale: SchemaLocale): string | string[] {
  if (Array.isArray(value)) {
    return value.map((item) => {
      const normalized = String(item).trim().toLowerCase();
      if (normalized === "true") {
        return yesNo(locale, true);
      }
      if (normalized === "false") {
        return yesNo(locale, false);
      }
      return item;
    });
  }

  const normalized = String(value).trim().toLowerCase();
  if (normalized === "true") {
    return yesNo(locale, true);
  }
  if (normalized === "false") {
    return yesNo(locale, false);
  }
  return value;
}

export function getSchemaForListing(
  listing: ListingWithRelations,
  schemas: ListingSchemaDefinition[]
): ListingSchemaDefinition | null {
  return schemas.find((schema) => schema.match(listing)) ?? null;
}

export function buildListingSchemaView(
  listing: ListingWithRelations,
  locale: SchemaLocale,
  schemas: ListingSchemaDefinition[]
): ListingSchemaView {
  const schema = getSchemaForListing(listing, schemas);
  const context = resolveSchemaFieldContext(listing, locale);

  if (!schema) {
    return {
      schema: null,
      sections: [],
      quickFacts: [],
      autoFilled: [],
      consumedAttributeKeys: new Set<string>(),
      safetyTips: [],
    };
  }

  const fieldOrder = new Map(schema.fields.map((field) => [field.key, field.order]));
  const resolvedFields = schema.fields
    .filter((field) => (field.showIf ? field.showIf(context) : true))
    .map((field) => {
      const resolved = field.resolve(context);
      if (!resolved || !isMeaningfulValue(resolved.value)) {
        return null;
      }
      return {
        ...resolved,
        value: localizeBooleanLike(resolved.value, locale),
        order: field.order,
      } as SchemaFieldResult;
    })
    .filter((field): field is SchemaFieldResult => Boolean(field));

  const resolvedBySection = new Map<string, SchemaFieldResult[]>();
  for (const field of resolvedFields) {
    if (!resolvedBySection.has(field.sectionKey)) {
      resolvedBySection.set(field.sectionKey, []);
    }
    resolvedBySection.get(field.sectionKey)!.push(field);
  }

  const orderedSections = schema.sections
    .map((section) => ({
      key: section.key,
      title: section.title[locale],
      description: section.description?.[locale],
      rows: (resolvedBySection.get(section.key) ?? []).sort((a, b) => {
        const orderA = typeof a.order === "number" ? a.order : fieldOrder.get(a.key) ?? Number.MAX_SAFE_INTEGER;
        const orderB = typeof b.order === "number" ? b.order : fieldOrder.get(b.key) ?? Number.MAX_SAFE_INTEGER;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return a.label.localeCompare(b.label);
      }),
      hideIfEmpty: section.hideIfEmpty ?? false,
    }))
    .filter((section) => !(section.hideIfEmpty && section.rows.length === 0))
    .filter((section) => section.rows.length > 0 || !section.hideIfEmpty);

  if (orderedSections.length === 0 && schema.sections.length > 0) {
    const primarySection = schema.sections[0];
    orderedSections.push({
      key: primarySection.key,
      title: primarySection.title[locale],
      description: primarySection.description?.[locale],
      rows: [],
      hideIfEmpty: false,
    });
  }

  const quickFacts = resolvedFields.filter((field) => schema.fields.find((definition) => definition.key === field.key)?.highlight);
  const autoFilled = resolvedFields.filter((field) => field.autoFilled);
  const consumedAttributeKeys = new Set<string>();

  for (const field of schema.fields) {
    for (const key of field.consumes ?? []) {
      consumedAttributeKeys.add(normalizeAttributeKey(key));
    }
    consumedAttributeKeys.add(normalizeAttributeKey(field.key));
  }

  return {
    schema,
    sections: orderedSections,
    quickFacts: quickFacts.length > 0 ? quickFacts : resolvedFields.slice(0, 6),
    autoFilled,
    consumedAttributeKeys,
    safetyTips: schema.safetyTips[locale],
  };
}
