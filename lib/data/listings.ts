import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  ACTIVE_HOME_CATEGORY_SLUGS,
  COMING_SOON_HOME_CATEGORY_SLUGS,
  LAUNCH_ACTIVE_CATEGORY_SLUGS,
} from "@/lib/categories/categoryTree";
import type { Category } from "@/types/database";

const PUBLIC_TEST_TEXT_PATTERNS = [
  "%test listing%",
  "%demo listing%",
  "%dummy listing%",
  "%this is a test%",
  "%for testing%",
  "%sample ad%",
];

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
        .in("slug", [...ACTIVE_HOME_CATEGORY_SLUGS, ...COMING_SOON_HOME_CATEGORY_SLUGS])
        .order("display_order", { ascending: true });

      if (!categories) return [];

      const normalized = (categories as Category[]).map((category) => ({
        ...category,
        is_coming_soon:
          typeof (category as Category & { is_coming_soon?: boolean }).is_coming_soon === "boolean"
            ? Boolean((category as Category & { is_coming_soon?: boolean }).is_coming_soon)
            : !LAUNCH_ACTIVE_CATEGORY_SLUGS.includes(category.slug as (typeof LAUNCH_ACTIVE_CATEGORY_SLUGS)[number]),
        launch_date:
          (category as Category & { launch_date?: string | null }).launch_date ?? null,
      })) as Array<Category & { is_coming_soon: boolean; launch_date: string | null }>;

      // Get count for each category
      const withCounts = await Promise.all(
        normalized.map(async (cat) => {
          let countQuery = supabase
            .from("listings")
            .select("id", { count: "exact", head: true })
            .eq("category_id", cat.id)
            .eq("status", "approved");

          for (const pattern of PUBLIC_TEST_TEXT_PATTERNS) {
            countQuery = countQuery.not("title", "ilike", pattern).not("description", "ilike", pattern);
          }

          const { count } = await countQuery;

          return {
            ...cat,
            count: count ?? 0,
          };
        })
      );

      return withCounts.sort((a, b) => a.display_order - b.display_order);
    } catch {
      return [];
    }
  }
);
