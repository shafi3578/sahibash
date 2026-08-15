export type HomepageSectionRecord = {
  id?: number;
  slug?: string | null;
  section_type?: string | null;
  title?: string | null;
  body?: string | null;
  cta_label?: string | null;
  cta_path?: string | null;
  sort_order?: number | null;
  is_enabled?: boolean | null;
  version?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type HomepageSectionDraft = {
  slug: string;
  section_type: string;
  title: string;
  body: string;
  cta_label: string | null;
  cta_path: string | null;
  sort_order: number;
  is_enabled: boolean;
};

export function normalizeHomepageSectionDraft(input: Record<string, unknown>): HomepageSectionDraft {
  const slug = typeof input.slug === "string" ? input.slug.trim().toLowerCase() : "section";
  const sectionType = typeof input.section_type === "string" ? input.section_type.trim().toLowerCase() : "hero";
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const body = typeof input.body === "string" ? input.body.trim() : "";
  const ctaLabel = typeof input.cta_label === "string" ? input.cta_label.trim() : "";
  const ctaPath = typeof input.cta_path === "string" ? input.cta_path.trim() : "";
  const sortOrder = Number(input.sort_order ?? 0);
  const isEnabled = input.is_enabled === true || input.is_enabled === "true" || input.is_enabled === 1 || input.is_enabled === "1";

  return {
    slug: slug || "section",
    section_type: sectionType || "hero",
    title: title || "Untitled section",
    body: body || "No content yet",
    cta_label: ctaLabel || null,
    cta_path: ctaPath || null,
    sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
    is_enabled: isEnabled,
  };
}

export function resolveHomepageSections(input: Array<Record<string, unknown>> = []): HomepageSectionDraft[] {
  return input
    .map((item) => {
      const normalized = normalizeHomepageSectionDraft({
        slug: item.slug,
        section_type: item.section_type,
        title: item.title,
        body: item.body,
        cta_label: item.cta_label,
        cta_path: item.cta_path,
        sort_order: item.sort_order,
        is_enabled: item.is_enabled,
      });

      return normalized.is_enabled ? normalized : null;
    })
    .filter((item): item is HomepageSectionDraft => Boolean(item))
    .sort((left, right) => left.sort_order - right.sort_order);
}
