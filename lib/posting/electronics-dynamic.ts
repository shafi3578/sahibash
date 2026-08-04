import { getLeafById, type Lang } from "@/data/electronics-categories";

export const ELECTRONICS_DYNAMIC_ATTRIBUTES_KEY = "electronics_dynamic_attributes_json";
export const ELECTRONICS_DYNAMIC_LEAF_KEY = "electronics_dynamic_leaf_id";

export type ElectronicsDynamicAttributes = Record<string, unknown>;

type ListingAttributeRow = {
  listing_id: string;
  category_field_id: null;
  attribute_key: string;
  attribute_value_text: string | null;
  attribute_value_number: number | null;
  attribute_value_boolean: boolean | null;
  attribute_value_json: string[] | null;
  unit: string | null;
};

export function resolveElectronicsLeafId(
  categorySlug?: string | null,
  dynamicLeafId?: string | null
): string | null {
  const normalizedLeafId = typeof dynamicLeafId === "string" ? dynamicLeafId.trim() : "";
  if (normalizedLeafId) {
    return getLeafById(normalizedLeafId)?.id ?? normalizedLeafId;
  }

  const normalizedSlug = typeof categorySlug === "string" ? categorySlug.trim() : "";
  if (!normalizedSlug) return null;

  return getLeafById(normalizedSlug)?.id ?? null;
}

export function normalizeElectronicsDynamicAttributes(raw: string | null | undefined): ElectronicsDynamicAttributes {
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as ElectronicsDynamicAttributes;
    }
  } catch {
    // fall back to empty object
  }

  return {};
}

export function getElectronicsDynamicValidationError(
  leafId: string | null,
  values: Record<string, unknown>,
  lang: Lang
): string | null {
  const leaf = leafId ? getLeafById(leafId) : null;
  if (!leaf) return null;

  for (const field of leaf.fields) {
    if (!field.required) continue;

    const value = values[field.key];
    const otherValue = values[`${field.key}_other`];

    if (field.type === "multi-select") {
      const selected = Array.isArray(value) ? value : [];
      if (selected.length === 0) {
        return `${field.labels[lang]} is required`;
      }
      continue;
    }

    if (field.type === "number") {
      const text = String(value ?? "").trim();
      const numeric = Number(text);
      if (!text || !Number.isFinite(numeric)) {
        return `${field.labels[lang]} is required`;
      }
      continue;
    }

    if (field.type === "select" || field.type === "cascading-select") {
      const text = String(value ?? "").trim();
      const otherText = String(otherValue ?? "").trim();
      if (!text) {
        return `${field.labels[lang]} is required`;
      }
      if (field.allowOther && text === "other" && !otherText) {
        return `${field.labels[lang]} is required`;
      }
      continue;
    }

    const text = String(value ?? "").trim();
    if (!text) {
      return `${field.labels[lang]} is required`;
    }
  }

  return null;
}

export function buildElectronicsDynamicAttributeRows(
  listingId: string,
  leafId: string | null,
  values: ElectronicsDynamicAttributes
): ListingAttributeRow[] {
  const rows: ListingAttributeRow[] = [];

  if (leafId) {
    rows.push({
      listing_id: listingId,
      category_field_id: null,
      attribute_key: ELECTRONICS_DYNAMIC_LEAF_KEY,
      attribute_value_text: leafId,
      attribute_value_number: null,
      attribute_value_boolean: null,
      attribute_value_json: null,
      unit: null,
    });
  }

  for (const [key, value] of Object.entries(values)) {
    if (key === ELECTRONICS_DYNAMIC_ATTRIBUTES_KEY) continue;
    if (value === undefined || value === null) continue;
    const textValue = typeof value === "string" ? value.trim() : "";

    if (Array.isArray(value)) {
      rows.push({
        listing_id: listingId,
        category_field_id: null,
        attribute_key: key,
        attribute_value_text: null,
        attribute_value_number: null,
        attribute_value_boolean: null,
        attribute_value_json: value.map((item) => String(item)),
        unit: null,
      });
      continue;
    }

    if (typeof value === "boolean") {
      rows.push({
        listing_id: listingId,
        category_field_id: null,
        attribute_key: key,
        attribute_value_text: null,
        attribute_value_number: null,
        attribute_value_boolean: value,
        attribute_value_json: null,
        unit: null,
      });
      continue;
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      rows.push({
        listing_id: listingId,
        category_field_id: null,
        attribute_key: key,
        attribute_value_text: null,
        attribute_value_number: value,
        attribute_value_boolean: null,
        attribute_value_json: null,
        unit: null,
      });
      continue;
    }

    if (!textValue) {
      continue;
    }

    rows.push({
      listing_id: listingId,
      category_field_id: null,
      attribute_key: key,
      attribute_value_text: textValue,
      attribute_value_number: null,
      attribute_value_boolean: null,
      attribute_value_json: null,
      unit: null,
    });
  }

  return rows;
}
