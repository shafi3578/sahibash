import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PostingCategoryView = {
  id: number;
  name: string;
  slug: string;
  display_order: number;
  is_active: boolean;
  description: string | null;
  icon: string | null;
  name_en: string | null;
  name_fa: string | null;
  name_ps: string | null;
};

export const getPostingMainCategories = cache(async () => {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("category_nodes")
      .select("id, name, slug, display_order, is_active, description, icon, name_en, name_fa, name_ps")
      .eq("level", 1)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error || !data) return [] as PostingCategoryView[];
    return data as PostingCategoryView[];
  } catch {
    return [] as PostingCategoryView[];
  }
});

export async function getCategoryNodeBySlugPath(path: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("category_nodes")
    .select("id, category_id, name, slug, path")
    .eq("path", path)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as { id: number; category_id: number; name: string; slug: string; path: string };
}
