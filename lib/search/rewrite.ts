import { expandSearchVariants, normalizeSearchText } from "@/lib/search/multilingual";
import type { SupabaseClient } from "@supabase/supabase-js";

export type SearchAliasDictionaryRow = {
  canonical_term: string;
  aliases: string[] | null;
  language: string;
  category_scope: string | null;
  is_active: boolean;
};

export type SearchRewriteContext = {
  normalizedQuery: string;
  variants: string[];
  rewrittenTerms: string[];
};

export type SearchRewriteClient = Pick<SupabaseClient<any>, "from">;

function normalizeAliasList(values: string[] | null | undefined): string[] {
  return (values ?? [])
    .map((value) => normalizeSearchText(String(value ?? "")))
    .filter((value) => value.length > 0);
}

function dedupeAndTrim(values: Iterable<string>, limit = 30): string[] {
  return Array.from(new Set(Array.from(values).map((value) => value.trim()).filter(Boolean))).slice(0, limit);
}

function isAliasApplicable(row: SearchAliasDictionaryRow, categoryScope?: string | null): boolean {
  if (!row.is_active) {
    return false;
  }
  if (!row.category_scope) {
    return true;
  }
  if (!categoryScope) {
    return false;
  }
  return categoryScope === row.category_scope || categoryScope.startsWith(`${row.category_scope}/`);
}

export function expandWithAdminDictionary(
  baseVariants: string[],
  dictionaryRows: SearchAliasDictionaryRow[],
  categoryScope?: string | null
): { variants: string[]; rewrittenTerms: string[] } {
  const variants = new Set<string>(baseVariants);
  const rewritten = new Set<string>();

  for (const row of dictionaryRows) {
    if (!isAliasApplicable(row, categoryScope)) {
      continue;
    }

    const canonical = normalizeSearchText(row.canonical_term);
    const aliases = normalizeAliasList(row.aliases);
    const cluster = dedupeAndTrim([canonical, ...aliases], 40);
    if (cluster.length === 0) {
      continue;
    }

    const hit = cluster.some((term) => Array.from(variants).some((variant) => variant.includes(term) || term.includes(variant)));
    if (!hit) {
      continue;
    }

    for (const term of cluster) {
      variants.add(term);
      rewritten.add(term);
    }
  }

  return {
    variants: dedupeAndTrim(variants, 40),
    rewrittenTerms: dedupeAndTrim(rewritten, 40),
  };
}

export async function resolveSearchRewriteContext(args: {
  supabase: SearchRewriteClient;
  queryText?: string | null;
  categoryScope?: string | null;
}): Promise<SearchRewriteContext> {
  const normalizedQuery = normalizeSearchText(String(args.queryText ?? ""));
  if (!normalizedQuery) {
    return {
      normalizedQuery: "",
      variants: [],
      rewrittenTerms: [],
    };
  }

  const baseVariants = dedupeAndTrim([normalizedQuery, ...expandSearchVariants(normalizedQuery)], 30);

  try {
    const { data, error } = await args.supabase
      .from("search_alias_dictionary")
      .select("canonical_term, aliases, language, category_scope, is_active")
      .eq("is_active", true)
      .in("language", ["multi", "en", "fa", "ps"])
      .limit(1000);

    if (error || !data) {
      return {
        normalizedQuery,
        variants: baseVariants,
        rewrittenTerms: baseVariants,
      };
    }

    const { variants, rewrittenTerms } = expandWithAdminDictionary(
      baseVariants,
      data as SearchAliasDictionaryRow[],
      args.categoryScope
    );

    return {
      normalizedQuery,
      variants,
      rewrittenTerms,
    };
  } catch {
    return {
      normalizedQuery,
      variants: baseVariants,
      rewrittenTerms: baseVariants,
    };
  }
}
