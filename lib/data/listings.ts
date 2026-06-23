import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ACTIVE_HOME_CATEGORY_SLUGS } from "@/lib/categories/categoryTree";
import type { Category } from "@/types/database";

export const getCategoriesWithStats = cache(
  async (): Promise<
    (Category & {
      count: number;
    })[]
  > => {
    try {
      const supabase = await createSupabaseServerClient();

      const { data: categories } = await supabase
        .from("categories")
        .select("*")
        .in("slug", [...ACTIVE_HOME_CATEGORY_SLUGS])
        .order("display_order", { ascending: true });

      if (!categories) return [];

      // Get count for each category
      const withCounts = await Promise.all(
        categories.map(async (cat) => {
          const { count } = await supabase
            .from("listings")
            .select("id", { count: "exact", head: true })
            .eq("category_id", cat.id)
            .eq("status", "approved");

          return {
            ...cat,
            count: count ?? 0,
          };
        })
      );

      return withCounts;
    } catch {
      return [];
    }
  }
);
