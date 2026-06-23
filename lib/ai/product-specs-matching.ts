import type { SupabaseClient } from "@supabase/supabase-js";

type LabelSignal = {
  label: string;
  score: number;
};

export type ProductSpecsMatch = {
  categoryNodeId: number;
  categoryPath: string;
  brand: string;
  model: string;
  specs: Record<string, unknown>;
  confidence: number;
};

type ProductSpecRow = {
  category_node_id: number;
  brand: string;
  model: string;
  aliases: string[];
  specs: Record<string, unknown>;
  category_nodes:
    | {
        path: string;
      }
    | Array<{
        path: string;
      }>
    | null;
};

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s+-]/g, " ").replace(/\s+/g, " ").trim();
}

function tokenize(value: string) {
  return normalize(value).split(" ").filter(Boolean);
}

function numericTokens(tokens: string[]) {
  return tokens.filter((token) => /\d/.test(token));
}

function scoreAliasMatch(haystack: string, haystackTokens: Set<string>, aliases: string[]) {
  let best = 0;
  for (const alias of aliases) {
    const normalized = normalize(alias);
    if (!normalized) continue;
    if (haystack.includes(normalized)) {
      best = Math.max(best, 1);
      continue;
    }

    const aliasTokens = tokenize(normalized);
    if (aliasTokens.length === 0) continue;

    const tokenHits = aliasTokens.filter((token) => haystackTokens.has(token)).length;
    const score = tokenHits / aliasTokens.length;
    best = Math.max(best, score);
  }
  return best;
}

export async function matchProductSpecsFromSignals(
  supabase: SupabaseClient,
  input: {
    title: string;
    description: string;
    labels: LabelSignal[];
  }
): Promise<ProductSpecsMatch | null> {
  const labelText = input.labels.map((label) => label.label.toLowerCase()).join(" ");
  const haystack = normalize(`${input.title} ${input.description} ${labelText}`);
  const haystackTokens = new Set(tokenize(haystack));

  if (!haystack) return null;

  const { data, error } = await supabase
    .from("product_specs")
    .select("category_node_id, brand, model, aliases, specs, category_nodes(path)")
    .eq("is_active", true)
    .limit(1200);

  if (error || !data || data.length === 0) return null;

  let best: ProductSpecsMatch | null = null;

  for (const row of data as ProductSpecRow[]) {
    const aliases = Array.isArray(row.aliases) ? row.aliases : [];
    const modelAlias = row.model.toLowerCase();
    const brandAlias = row.brand.toLowerCase();
    const candidateTokens = tokenize(`${row.brand} ${row.model}`);
    const candidateNumericTokens = numericTokens(candidateTokens);

    if (candidateNumericTokens.length > 0 && !candidateNumericTokens.every((token) => haystackTokens.has(token))) {
      continue;
    }

    const tokenHits = candidateTokens.filter((token) => haystackTokens.has(token)).length;
    const tokenScore = candidateTokens.length > 0 ? tokenHits / candidateTokens.length : 0;
    const baseScore = Math.max(
      scoreAliasMatch(haystack, haystackTokens, aliases),
      haystack.includes(modelAlias) ? 0.9 : 0,
      haystack.includes(`${brandAlias} ${modelAlias}`) ? 1 : 0,
      haystackTokens.has(brandAlias) && haystackTokens.has(modelAlias.split(" ")[0] ?? "") ? 0.7 : 0,
      tokenScore
    );
    const score = baseScore + candidateTokens.length / 100;

    if (score < 0.6) continue;

    const candidate: ProductSpecsMatch = {
      categoryNodeId: row.category_node_id,
      categoryPath: Array.isArray(row.category_nodes)
        ? (row.category_nodes[0]?.path ?? "")
        : (row.category_nodes?.path ?? ""),
      brand: row.brand,
      model: row.model,
      specs: row.specs ?? {},
      confidence: score,
    };

    if (!best || candidate.confidence > best.confidence) {
      best = candidate;
    }
  }

  return best;
}
