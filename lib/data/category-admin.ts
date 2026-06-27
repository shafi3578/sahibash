import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getCategoryAdminSnapshot() {
  const supabase = await createSupabaseServerClient();

  const [categoriesRes, aliasesRes, fieldsRes, telemetryRes] = await Promise.all([
    supabase.from("categories").select("id, name, slug, description, display_order, is_active").order("display_order", { ascending: true }),
    supabase.from("category_aliases").select("id, category_id, alias, language").order("id", { ascending: false }).limit(300),
    supabase.from("category_fields").select("id, category_node_id, field_key, field_label, is_required, is_active").order("id", { ascending: false }).limit(500),
    supabase.from("search_telemetry").select("normalized_query, result_count, rewritten_terms").order("created_at", { ascending: false }).limit(1000),
  ]);

  const categories = (categoriesRes.data ?? []) as Array<{
    id: number;
    name: string;
    slug: string;
    description: string | null;
    display_order: number;
    is_active: boolean;
  }>;

  const aliases = (aliasesRes.data ?? []) as Array<{
    id: string;
    category_id: number;
    alias: string;
    language: string;
  }>;

  const fields = (fieldsRes.data ?? []) as Array<{
    id: number;
    category_node_id: number;
    field_key: string;
    field_label: string;
    is_required: boolean;
    is_active: boolean;
  }>;

  const telemetry = (telemetryRes.data ?? []) as Array<{
    normalized_query: string;
    result_count: number;
    rewritten_terms: string[];
  }>;

  const zeroResultMap = new Map<string, number>();
  for (const row of telemetry) {
    if (Number(row.result_count) !== 0) continue;
    const key = String(row.normalized_query ?? "").trim();
    if (!key) continue;
    zeroResultMap.set(key, (zeroResultMap.get(key) ?? 0) + 1);
  }

  const topZeroResults = Array.from(zeroResultMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([query, count]) => ({ query, count }));

  return {
    categories,
    aliases,
    fields,
    topZeroResults,
  };
}
