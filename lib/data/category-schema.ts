export type CategorySchemaProfileRecord = {
  id?: number;
  category_slug?: string | null;
  schema_key?: string | null;
  title?: string | null;
  description?: string | null;
  is_enabled?: boolean | null;
  sort_order?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type CategorySchemaProfileDraft = {
  category_slug: string;
  schema_key: string;
  title: string;
  description: string;
  is_enabled: boolean;
  sort_order: number;
};

export function normalizeCategorySchemaProfile(input: Record<string, unknown>): CategorySchemaProfileDraft {
  const categorySlug = typeof input.category_slug === "string" ? input.category_slug.trim().toLowerCase() : "";
  const schemaKey = typeof input.schema_key === "string" ? input.schema_key.trim().toLowerCase() : "";
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const description = typeof input.description === "string" ? input.description.trim() : "";
  const sortOrder = Number(input.sort_order ?? 0);
  const isEnabled = input.is_enabled === true || input.is_enabled === "true" || input.is_enabled === 1 || input.is_enabled === "1";

  return {
    category_slug: categorySlug || "general",
    schema_key: schemaKey || "default",
    title: title || "Untitled schema",
    description: description || "Schema profile",
    is_enabled: isEnabled,
    sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
  };
}

export function normalizeCategorySchemaProfileFromFormData(formData: FormData): CategorySchemaProfileDraft {
  return normalizeCategorySchemaProfile({
    category_slug: formData.get("category_slug"),
    schema_key: formData.get("schema_key"),
    title: formData.get("title"),
    description: formData.get("description"),
    is_enabled: formData.get("is_enabled") === "on",
    sort_order: formData.get("sort_order"),
  });
}

export function resolveCategorySchemaProfiles(input: Array<Record<string, unknown>> = []): CategorySchemaProfileDraft[] {
  return input
    .map((item) => normalizeCategorySchemaProfile({
      category_slug: item.category_slug,
      schema_key: item.schema_key,
      title: item.title,
      description: item.description,
      is_enabled: item.is_enabled,
      sort_order: item.sort_order,
    }))
    .filter((item) => item.is_enabled)
    .sort((left, right) => left.sort_order - right.sort_order);
}
