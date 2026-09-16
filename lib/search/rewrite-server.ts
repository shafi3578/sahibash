import "server-only";

import { unstable_cache } from "next/cache";
import { createSupabasePublicServerClient } from "@/lib/supabase/public";
import {
  expandWithAdminDictionary,
  type SearchAliasDictionaryRow,
  type SearchRewriteContext,
} from "@/lib/search/rewrite";
import { expandSearchVariants, normalizeSearchText } from "@/lib/search/multilingual";

const getCachedSearchAliasDictionary = unstable_cache(
  async (): Promise<SearchAliasDictionaryRow[]> => {
    const supabase = createSupabasePublicServerClient();
    const { data, error } = await supabase
      .from("search_alias_dictionary")
      .select("canonical_term, aliases, language, category_scope, is_active")
      .eq("is_active", true)
      .in("language", ["multi", "en", "fa", "ps"])
      .limit(1000);

    if (error || !data) return [];
    return data as SearchAliasDictionaryRow[];
  },
  ["sahibash-search-alias-dictionary"],
  { revalidate: 60 }
);

function dedupe(values: string[], limit: number) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).slice(0, limit);
}

export async function resolveCachedSearchRewriteContext(
  queryText?: string | null,
  categoryScope?: string | null
): Promise<SearchRewriteContext> {
  const normalizedQuery = normalizeSearchText(String(queryText ?? ""));
  if (!normalizedQuery) {
    return { normalizedQuery: "", variants: [], rewrittenTerms: [] };
  }

  const baseVariants = dedupe([normalizedQuery, ...expandSearchVariants(normalizedQuery)], 30);
  try {
    const dictionaryRows = await getCachedSearchAliasDictionary();
    const expanded = expandWithAdminDictionary(baseVariants, dictionaryRows, categoryScope);
    return {
      normalizedQuery,
      variants: expanded.variants,
      rewrittenTerms: expanded.rewrittenTerms,
    };
  } catch {
    return { normalizedQuery, variants: baseVariants, rewrittenTerms: baseVariants };
  }
}
