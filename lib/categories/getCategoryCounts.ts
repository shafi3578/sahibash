import { cache } from "react";
import { unstable_cache } from "next/cache";
import { PUBLIC_CACHE_TAGS } from "@/lib/cache/public-cache";
import { withDataTiming } from "@/lib/observability/performance";
import { createSupabasePublicServerClient } from "@/lib/supabase/public";

type CountRow = {
  node_id: number;
  direct_count: number;
  subtree_count: number;
};

const getCachedCategoryCountRows = unstable_cache(
  async (parentNodeId: number | null): Promise<CountRow[]> => {
    const supabase = createSupabasePublicServerClient();

    return withDataTiming(
      "category_tree_counts",
      async () => {
        const { data, error } = await supabase.rpc("get_category_tree_counts", {
          parent_node_id: parentNodeId,
        });

        if (error || !data) {
          return [];
        }

        return (data as CountRow[]).map((row) => ({
          node_id: Number(row.node_id),
          direct_count: Number(row.direct_count ?? 0),
          subtree_count: Number(row.subtree_count ?? 0),
        }));
      },
      {
        cache: "shared",
        parent_node_id: parentNodeId ?? "root",
      }
    );
  },
  ["sahibash-category-counts"],
  {
    revalidate: 120,
    tags: [PUBLIC_CACHE_TAGS.categoryCounts],
  }
);

export const getCategoryCounts = cache(async (parentNodeId: number | null) => {
  const rows = await getCachedCategoryCountRows(parentNodeId);

  const map = new Map<number, number>();
  for (const row of rows) {
    map.set(row.node_id, Number(row.subtree_count ?? 0));
  }

  return map;
});

export async function getCategoryListingCount(categoryNodeId: number) {
  const counts = await getCategoryCounts(null);
  return counts.get(categoryNodeId) ?? 0;
}
