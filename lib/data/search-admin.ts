import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeSearchText } from "@/lib/search/multilingual";

export type SearchAliasAdminRow = {
  id: string;
  canonical_term: string;
  aliases: string[];
  language: string;
  category_scope: string | null;
  is_active: boolean;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
};

type SearchTelemetryRow = {
  id: string;
  query_text: string;
  normalized_query: string;
  selected_language: string;
  result_count: number;
  clicked_listing_id: string | null;
  category_filter: string | null;
  province_filter: string | null;
  district_filter: string | null;
  rewritten_terms: string[];
  created_at: string;
};

function toTopEntries(map: Map<string, number>, limit = 20) {
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([term, count]) => ({ term, count }));
}

function tokenizeQuery(value: string): string[] {
  return normalizeSearchText(value)
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
}

export async function getSearchAliasDictionaryAdminRows() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("search_alias_dictionary")
    .select("id, canonical_term, aliases, language, category_scope, is_active, approved_by, created_at, updated_at")
    .order("updated_at", { ascending: false });

  if (error || !data) {
    return [] as SearchAliasAdminRow[];
  }

  return (data as SearchAliasAdminRow[]).map((row) => ({
    ...row,
    aliases: Array.isArray(row.aliases) ? row.aliases : [],
  }));
}

export async function getSearchTelemetryAdminSnapshot() {
  const supabase = await createSupabaseServerClient();
  const [telemetryRes, aliasesRes] = await Promise.all([
    supabase
      .from("search_telemetry")
      .select("id, query_text, normalized_query, selected_language, result_count, clicked_listing_id, category_filter, province_filter, district_filter, rewritten_terms, created_at")
      .order("created_at", { ascending: false })
      .limit(5000),
    supabase
      .from("search_alias_dictionary")
      .select("canonical_term, aliases, is_active")
      .eq("is_active", true)
      .limit(1000),
  ]);

  const telemetryRows = (telemetryRes.data ?? []) as SearchTelemetryRow[];
  const activeAliases = (aliasesRes.data ?? []) as Array<{
    canonical_term: string;
    aliases: string[] | null;
    is_active: boolean;
  }>;

  const knownTerms = new Set<string>();
  for (const alias of activeAliases) {
    knownTerms.add(normalizeSearchText(alias.canonical_term));
    for (const value of alias.aliases ?? []) {
      knownTerms.add(normalizeSearchText(value));
    }
  }

  const zeroResult = telemetryRows.filter((row) => Number(row.result_count) === 0);
  const withResultsNoClick = telemetryRows.filter(
    (row) => Number(row.result_count) > 0 && !row.clicked_listing_id
  );

  const topSearchedMap = new Map<string, number>();
  const topZeroMap = new Map<string, number>();
  const topRewrittenMap = new Map<string, number>();
  const suggestionMap = new Map<string, number>();

  for (const row of telemetryRows) {
    const normalized = normalizeSearchText(row.normalized_query || row.query_text);
    if (normalized) {
      topSearchedMap.set(normalized, (topSearchedMap.get(normalized) ?? 0) + 1);
    }

    for (const rewritten of row.rewritten_terms ?? []) {
      const term = normalizeSearchText(rewritten);
      if (!term) continue;
      topRewrittenMap.set(term, (topRewrittenMap.get(term) ?? 0) + 1);
    }
  }

  for (const row of zeroResult) {
    const normalized = normalizeSearchText(row.normalized_query || row.query_text);
    if (normalized) {
      topZeroMap.set(normalized, (topZeroMap.get(normalized) ?? 0) + 1);
    }

    for (const token of tokenizeQuery(normalized)) {
      if (knownTerms.has(token)) {
        continue;
      }
      suggestionMap.set(token, (suggestionMap.get(token) ?? 0) + 1);
    }
  }

  return {
    totals: {
      totalSearches: telemetryRows.length,
      zeroResultSearches: zeroResult.length,
      withResultsNoClicks: withResultsNoClick.length,
    },
    topZeroResultQueries: toTopEntries(topZeroMap, 20),
    topSearchedTerms: toTopEntries(topSearchedMap, 20),
    topRewrittenAliases: toTopEntries(topRewrittenMap, 20),
    searchesWithResultsNoClicks: withResultsNoClick.slice(0, 50),
    suggestedAliases: toTopEntries(suggestionMap, 20),
  };
}
