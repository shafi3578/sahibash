import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type CountRow = {
  node_id: number;
  direct_count: number;
  subtree_count: number;
};

export const getCategoryCounts = cache(async (parentNodeId: number | null) => {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("get_category_tree_counts", {
    parent_node_id: parentNodeId,
  });

  if (error || !data) {
    return new Map<number, number>();
  }

  const map = new Map<number, number>();
  for (const row of data as CountRow[]) {
    map.set(row.node_id, Number(row.subtree_count ?? 0));
  }

  return map;
});

export async function getCategoryListingCount(categoryNodeId: number) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_category_listing_count", {
    category_node_id: categoryNodeId,
  });

  if (error) return 0;
  return Number(data ?? 0);
}
