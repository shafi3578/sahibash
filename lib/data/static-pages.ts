import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AppLocaleKey = "en" | "fa" | "ps";

export type StaticPageRecord = {
  id: number;
  page_key: string;
  slug_en: string;
  slug_fa: string;
  slug_ps: string;
  title_en: string;
  title_fa: string;
  title_ps: string;
  body_en: string;
  body_fa: string;
  body_ps: string;
  seo_title_en: string | null;
  seo_title_fa: string | null;
  seo_title_ps: string | null;
  seo_description_en: string | null;
  seo_description_fa: string | null;
  seo_description_ps: string | null;
  is_published: boolean;
  published_at: string | null;
  archived_at: string | null;
  updated_at: string | null;
  created_at: string | null;
};

export type StaticPageVersionRecord = {
  id: number;
  static_page_id: number;
  version_number: number;
  change_summary: string | null;
  page_snapshot: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  published_at: string;
};

function localeField(locale: AppLocaleKey, field: string) {
  return `${field}_${locale}` as keyof StaticPageRecord;
}

function localizedString(page: Partial<StaticPageRecord> & Record<string, unknown>, locale: AppLocaleKey, field: "title" | "body" | "slug" | "seo_title" | "seo_description") {
  const value = page[localeField(locale, field) as string];
  if (typeof value === "string" && value.trim()) {
    return value;
  }
  const fallback = page[localeField("en", field) as string];
  return typeof fallback === "string" ? fallback : "";
}

export function normalizeStaticPageDraft(input: Record<string, unknown>) {
  const pageKey = typeof input.page_key === "string" ? input.page_key.trim() : "";
  const slugEn = typeof input.slug_en === "string" ? input.slug_en.trim() : "";
  const slugFa = typeof input.slug_fa === "string" ? input.slug_fa.trim() : "";
  const slugPs = typeof input.slug_ps === "string" ? input.slug_ps.trim() : "";

  const localizedValue = (name: string, locale: AppLocaleKey) => {
    const value = input[`${name}_${locale}`];
    return typeof value === "string" ? value.trim() : "";
  };
  const buildLocalized = (name: string) => ({
    en: localizedValue(name, "en"),
    fa: localizedValue(name, "fa"),
    ps: localizedValue(name, "ps"),
  });

  return {
    page_key: pageKey,
    slug_en: slugEn,
    slug_fa: slugFa,
    slug_ps: slugPs,
    title: buildLocalized("title"),
    body: buildLocalized("body"),
    seo_title: buildLocalized("seo_title"),
    seo_description: buildLocalized("seo_description"),
  };
}

export function resolvePublishedStaticPage(page: Partial<StaticPageRecord> & Record<string, unknown>, locale: AppLocaleKey) {
  return {
    id: Number(page.id),
    page_key: String(page.page_key ?? ""),
    slug: localizedString(page, locale, "slug"),
    title: localizedString(page, locale, "title"),
    body: localizedString(page, locale, "body"),
    seo_title: localizedString(page, locale, "seo_title") || null,
    seo_description: localizedString(page, locale, "seo_description") || null,
    locale,
  };
}

export async function getStaticPageAdminSnapshot(selectedPageKey?: string) {
  const supabase = await createSupabaseServerClient();
  const { data: pages, error: pagesError } = await supabase
    .from("static_pages")
    .select("id, page_key, slug_en, slug_fa, slug_ps, title_en, title_fa, title_ps, body_en, body_fa, body_ps, seo_title_en, seo_title_fa, seo_title_ps, seo_description_en, seo_description_fa, seo_description_ps, is_published, published_at, archived_at, updated_at, created_at")
    .order("updated_at", { ascending: false });

  const currentPages = (pages ?? []) as StaticPageRecord[];
  const selected = currentPages.find((page) => page.page_key === selectedPageKey) ?? currentPages[0] ?? null;

  let versions: StaticPageVersionRecord[] = [];
  if (selected) {
    const { data: versionRows } = await supabase
      .from("static_page_versions")
      .select("id, static_page_id, version_number, change_summary, page_snapshot, created_by, created_at, published_at")
      .eq("static_page_id", selected.id)
      .order("version_number", { ascending: false });

    versions = ((versionRows ?? []) as Array<StaticPageVersionRecord & { page_snapshot: Record<string, unknown> }>).map((row) => ({
      ...row,
      page_snapshot: row.page_snapshot ?? {},
    }));
  }

  return {
    pages: currentPages,
    selected,
    versions,
    pagesError: pagesError ? pagesError.message : null,
  };
}

export async function getPublishedStaticPageBySlug(locale: AppLocaleKey, slug: string) {
  const supabase = await createSupabaseServerClient();
  const slugField = localeField(locale, "slug");
  const { data: page } = await supabase
    .from("static_pages")
    .select("id, page_key, slug_en, slug_fa, slug_ps, title_en, title_fa, title_ps, body_en, body_fa, body_ps, seo_title_en, seo_title_fa, seo_title_ps, seo_description_en, seo_description_fa, seo_description_ps, is_published, published_at, archived_at, updated_at, created_at")
    .eq(slugField as string, slug)
    .eq("is_published", true)
    .is("archived_at", null)
    .maybeSingle();

  if (!page) {
    return null;
  }

  const { data: version } = await supabase
    .from("static_page_versions")
    .select("id, static_page_id, version_number, change_summary, page_snapshot, created_by, created_at, published_at")
    .eq("static_page_id", page.id)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const snapshot = (version?.page_snapshot as Record<string, unknown> | undefined) ?? (page as Record<string, unknown>);
  return resolvePublishedStaticPage(snapshot, locale);
}
