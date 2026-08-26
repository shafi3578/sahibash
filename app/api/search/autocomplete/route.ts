import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { localizePath } from "@/lib/i18n/routing";
import type { AppLocale } from "@/lib/i18n/translations";
import { normalizeSearchText } from "@/lib/search/multilingual";
import { understandSearchQuery } from "@/lib/search/query-understanding";
import { createSupabasePublicServerClient } from "@/lib/supabase/public";
import { getPublicProvinces } from "@/lib/location/reference-data";
import { PUBLIC_CACHE_TAGS } from "@/lib/cache/public-cache";

type SuggestionType = "alias" | "category" | "location" | "listing" | "intent";

type Suggestion = {
  type: SuggestionType;
  label: string;
  subtitle?: string;
  href: string;
  value: string;
};
type SearchAliasRow = {
  canonical_term: string;
  aliases: string[] | null;
  category_scope: string | null;
};

const SUPPORTED_LOCALES = new Set(["en", "fa", "ps"]);
const AUTOCOMPLETE_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
  "CDN-Cache-Control": "public, s-maxage=300, stale-while-revalidate=1800",
};

function resolveLocale(value: string | null): AppLocale {
  return SUPPORTED_LOCALES.has(value ?? "") ? (value as AppLocale) : "en";
}

function cleanLikeTerm(value: string) {
  return normalizeSearchText(value).replace(/[(),%]/g, " ").replace(/\s+/g, " ").trim();
}

function uniqueSuggestions(suggestions: Suggestion[], limit = 12) {
  const seen = new Set<string>();
  const out: Suggestion[] = [];
  for (const suggestion of suggestions) {
    const key = `${suggestion.type}:${normalizeSearchText(suggestion.label)}:${suggestion.href}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(suggestion);
    if (out.length >= limit) break;
  }
  return out;
}

function localizedName(row: Record<string, unknown>, locale: AppLocale) {
  return String(row[`name_${locale}`] ?? row.name_en ?? row.name ?? row.slug ?? "").trim();
}

const getAutocompleteReference = unstable_cache(
  async () => {
    const supabase = createSupabasePublicServerClient();
    const [categoriesRes, nodesRes, provinces] = await Promise.all([
      supabase.from("categories").select("id, name, slug, display_order").eq("is_active", true).order("display_order", { ascending: true }).limit(20),
      supabase.from("category_nodes").select("id, name, slug, path, level, display_order").eq("is_active", true).order("display_order", { ascending: true }).limit(120),
      getPublicProvinces(),
    ]);

    return {
      categories: (categoriesRes.data ?? []) as Array<Record<string, unknown>>,
      nodes: (nodesRes.data ?? []) as Array<Record<string, unknown>>,
      provinces: provinces as unknown as Array<Record<string, unknown>>,
    };
  },
  ["search-autocomplete-reference"],
  {
    revalidate: 3600,
    tags: [
      PUBLIC_CACHE_TAGS.categoryTaxonomy,
      PUBLIC_CACHE_TAGS.locationReference,
      PUBLIC_CACHE_TAGS.searchReference,
    ],
  }
);

const getAutocompleteAliases = unstable_cache(
  async (locale: AppLocale): Promise<SearchAliasRow[]> => {
    const supabase = createSupabasePublicServerClient();
    const { data, error } = await supabase
      .from("search_alias_dictionary")
      .select("canonical_term, aliases, language, category_scope")
      .eq("is_active", true)
      .in("language", ["multi", locale])
      .limit(1000);

    if (error) return [];
    return (data ?? []) as SearchAliasRow[];
  },
  ["search-autocomplete-aliases"],
  { revalidate: 3600, tags: [PUBLIC_CACHE_TAGS.searchReference] }
);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const locale = resolveLocale(url.searchParams.get("locale"));
  const rawQuery = url.searchParams.get("q") ?? "";
  const normalized = normalizeSearchText(rawQuery);
  const href = (path: string) => localizePath(path, locale);
  const understood = understandSearchQuery(rawQuery);
  const suggestions: Suggestion[] = [];

  try {
    const { categories, nodes, provinces } = await getAutocompleteReference();

    if (normalized.length <= 1) {
      for (const category of categories.slice(0, 4)) {
        const label = String(category.name ?? category.slug ?? "");
        suggestions.push({
          type: "category",
          label,
          subtitle: locale === "en" ? "Category" : locale === "fa" ? "دسته‌بندی" : "کټګوري",
          href: href(`/categories/${category.slug}`),
          value: label,
        });
      }
      return NextResponse.json(
        { query: rawQuery, normalized, suggestions: uniqueSuggestions(suggestions, 8) },
        { headers: AUTOCOMPLETE_CACHE_HEADERS }
      );
    }

    for (const product of understood.productHints) {
      suggestions.push({
        type: "alias",
        label: product.canonical,
        subtitle: product.categoryScope,
        href: `${href("/search")}?q=${encodeURIComponent(product.canonical)}`,
        value: product.canonical,
      });
    }

    const likeTerm = cleanLikeTerm(rawQuery).split(" ").find((term) => term.length >= 4);
    const aliasPromise = getAutocompleteAliases(locale);
    const listingPromise = likeTerm
      ? createSupabasePublicServerClient()
          .from("listings")
          .select("id, title, price, currency, province, district, vehicle_brand, vehicle_model")
          .eq("status", "approved")
          .or(`title.ilike.%${likeTerm}%,vehicle_brand.ilike.%${likeTerm}%,vehicle_model.ilike.%${likeTerm}%,province.ilike.%${likeTerm}%,district.ilike.%${likeTerm}%`)
          .order("created_at", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [] });

    const [aliasRes, listingRes] = await Promise.all([aliasPromise, listingPromise]);

    for (const row of aliasRes) {
      const terms = [row.canonical_term, ...(row.aliases ?? [])];
      const normalizedTerms = terms.map((term) => normalizeSearchText(term)).filter(Boolean);
      if (!normalizedTerms.some((term) => term.includes(normalized) || normalized.includes(term))) {
        continue;
      }
      suggestions.push({
        type: "alias",
        label: row.canonical_term,
        subtitle: row.category_scope ?? (locale === "en" ? "Suggested search" : locale === "fa" ? "جستجوی پیشنهادی" : "وړاندیز شوی لټون"),
        href: `${href("/search")}?q=${encodeURIComponent(row.canonical_term)}`,
        value: row.canonical_term,
      });
    }

    for (const category of categories) {
      const label = String(category.name ?? category.slug ?? "");
      if (!normalizeSearchText(label).includes(normalized)) continue;
      suggestions.push({
        type: "category",
        label,
        subtitle: locale === "en" ? "Category" : locale === "fa" ? "دسته‌بندی" : "کټګوري",
        href: href(`/categories/${category.slug}`),
        value: label,
      });
    }

    for (const node of nodes) {
      const label = String(node.name ?? node.slug ?? "");
      if (!normalizeSearchText(`${label} ${node.path ?? ""}`).includes(normalized)) continue;
      suggestions.push({
        type: "category",
        label,
        subtitle: String(node.path ?? ""),
        href: href(`/categories/${String(node.path ?? node.slug).split("/")[0]}`),
        value: label,
      });
    }

    for (const province of provinces) {
      const label = localizedName(province, locale);
      const aliases = Array.isArray(province.aliases) ? province.aliases.join(" ") : "";
      if (!normalizeSearchText(`${label} ${province.slug ?? ""} ${aliases}`).includes(normalized)) continue;
      suggestions.push({
        type: "location",
        label,
        subtitle: locale === "en" ? "Province" : locale === "fa" ? "ولایت" : "ولایت",
        href: `${href("/search")}?province=${encodeURIComponent(String(province.name_en ?? province.name ?? label))}`,
        value: label,
      });
    }

    if (understood.year) {
      suggestions.push({
        type: "intent",
        label: String(understood.year),
        subtitle: locale === "en" ? "Detected year" : locale === "fa" ? "سال تشخیص‌شده" : "پېژندل شوی کال",
        href: `${href("/search")}?q=${encodeURIComponent(rawQuery)}`,
        value: String(understood.year),
      });
    }

    if (likeTerm) {
      for (const listing of (listingRes.data ?? []) as Array<Record<string, unknown>>) {
        const label = String(listing.title ?? "");
        suggestions.push({
          type: "listing",
          label,
          subtitle: [listing.province, listing.district].filter(Boolean).join(" · "),
          href: href(`/listings/${listing.id}`),
          value: label,
        });
      }
    }

    return NextResponse.json(
      { query: rawQuery, normalized, suggestions: uniqueSuggestions(suggestions) },
      { headers: AUTOCOMPLETE_CACHE_HEADERS }
    );
  } catch {
    return NextResponse.json({ query: rawQuery, normalized, suggestions: [] });
  }
}
