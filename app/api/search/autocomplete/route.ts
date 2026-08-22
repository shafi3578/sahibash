import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { localizePath } from "@/lib/i18n/routing";
import type { AppLocale } from "@/lib/i18n/translations";
import { normalizeSearchText } from "@/lib/search/multilingual";
import { understandSearchQuery } from "@/lib/search/query-understanding";

type SuggestionType = "alias" | "category" | "location" | "listing" | "intent";

type Suggestion = {
  type: SuggestionType;
  label: string;
  subtitle?: string;
  href: string;
  value: string;
};

const SUPPORTED_LOCALES = new Set(["en", "fa", "ps"]);

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

export async function GET(request: Request) {
  const url = new URL(request.url);
  const locale = resolveLocale(url.searchParams.get("locale"));
  const rawQuery = url.searchParams.get("q") ?? "";
  const normalized = normalizeSearchText(rawQuery);
  const href = (path: string) => localizePath(path, locale);
  const understood = understandSearchQuery(rawQuery);
  const suggestions: Suggestion[] = [];

  try {
    const supabase = await createSupabaseServerClient();

    const [categoriesRes, nodesRes, provincesRes] = await Promise.all([
      supabase.from("categories").select("id, name, slug, display_order").eq("is_active", true).order("display_order", { ascending: true }).limit(20),
      supabase.from("category_nodes").select("id, name, slug, path, level, display_order").eq("is_active", true).order("display_order", { ascending: true }).limit(120),
      supabase.from("provinces").select("id, name, name_en, name_fa, name_ps, slug, aliases, sort_order").eq("is_active", true).order("sort_order", { ascending: true }).limit(40),
    ]);

    const categories = (categoriesRes.data ?? []) as Array<Record<string, unknown>>;
    const nodes = (nodesRes.data ?? []) as Array<Record<string, unknown>>;
    const provinces = (provincesRes.data ?? []) as Array<Record<string, unknown>>;

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
      return NextResponse.json({ query: rawQuery, normalized, suggestions: uniqueSuggestions(suggestions, 8) });
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

    const aliasRes = await supabase
      .from("search_alias_dictionary")
      .select("canonical_term, aliases, language, category_scope")
      .eq("is_active", true)
      .in("language", ["multi", locale])
      .limit(1000);

    for (const row of (aliasRes.data ?? []) as Array<{ canonical_term: string; aliases: string[] | null; category_scope: string | null }>) {
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

    const likeTerm = cleanLikeTerm(rawQuery).split(" ").find((term) => term.length >= 3);
    if (likeTerm) {
      const listingRes = await supabase
        .from("listings")
        .select("id, title, price, currency, province, district, vehicle_brand, vehicle_model")
        .eq("status", "approved")
        .or(`title.ilike.%${likeTerm}%,vehicle_brand.ilike.%${likeTerm}%,vehicle_model.ilike.%${likeTerm}%,province.ilike.%${likeTerm}%,district.ilike.%${likeTerm}%`)
        .order("created_at", { ascending: false })
        .limit(5);

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

    return NextResponse.json({ query: rawQuery, normalized, suggestions: uniqueSuggestions(suggestions) });
  } catch {
    return NextResponse.json({ query: rawQuery, normalized, suggestions: [] });
  }
}
