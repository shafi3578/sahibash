import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ElectronicsCategory = {
  id: number;
  name: string;
  parent_id: number | null;
  slug: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  category_node_id: number | null;
};

export type ElectronicsBrand = {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  logo_url: string | null;
  sort_order: number;
  is_popular: boolean;
  is_active: boolean;
};

export type ElectronicsModel = {
  id: number;
  brand_id: number;
  category_id: number;
  name: string;
  slug: string;
  release_year: number | null;
  image_url: string | null;
  is_popular: boolean;
  is_active: boolean;
};

export type ElectronicsModelSpec = {
  id: number;
  model_id: number;
  spec_key: string;
  spec_label: string;
  spec_value: string;
  spec_group: string | null;
  is_public: boolean;
  is_filterable: boolean;
};

export type ElectronicsModelOption = {
  id: number;
  model_id: number;
  option_type: string;
  option_value: string;
  sort_order: number;
};

export type ElectronicsPostingConfig = {
  id: number;
  electronics_category_id: number | null;
  requires_images: boolean;
  min_images: number;
  max_images: number;
  recommended_images: string | null;
  allow_manual_model: boolean;
  allow_video: boolean;
  is_active: boolean;
};

export const getElectronicsRootAndSubcategories = cache(async () => {
  const supabase = await createSupabaseServerClient();

  const { data: root } = await supabase
    .from("electronics_categories")
    .select("*")
    .eq("slug", "phones-electronics")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (!root) {
    return { root: null as ElectronicsCategory | null, subcategories: [] as ElectronicsCategory[] };
  }

  const { data: subcategories } = await supabase
    .from("electronics_categories")
    .select("*")
    .eq("parent_id", (root as ElectronicsCategory).id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return {
    root: root as ElectronicsCategory,
    subcategories: (subcategories as ElectronicsCategory[]) ?? [],
  };
});

export const getElectronicsSubcategories = cache(async () => {
  const data = await getElectronicsRootAndSubcategories();
  return data.subcategories;
});

export const getElectronicsBrandsByCategoryId = cache(async (categoryId: number) => {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("electronics_brands")
    .select("*")
    .eq("category_id", categoryId)
    .eq("is_active", true)
    .order("is_popular", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  return (data as ElectronicsBrand[]) ?? [];
});

export const getElectronicsModelsByBrandId = cache(async (brandId: number) => {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("electronics_models")
    .select("*")
    .eq("brand_id", brandId)
    .eq("is_active", true)
    .order("is_popular", { ascending: false })
    .order("release_year", { ascending: false })
    .order("name", { ascending: true });

  return (data as ElectronicsModel[]) ?? [];
});

export const getElectronicsModelSpecs = cache(async (modelId: number) => {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("electronics_model_specs")
    .select("*")
    .eq("model_id", modelId)
    .order("spec_group", { ascending: true })
    .order("spec_label", { ascending: true });

  return (data as ElectronicsModelSpec[]) ?? [];
});

export const getElectronicsModelOptions = cache(async (modelId: number) => {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("electronics_model_options")
    .select("*")
    .eq("model_id", modelId)
    .order("option_type", { ascending: true })
    .order("sort_order", { ascending: true });

  return (data as ElectronicsModelOption[]) ?? [];
});

export const getElectronicsPostingConfig = cache(async (electronicsCategoryId: number) => {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("posting_category_config")
    .select("*")
    .eq("electronics_category_id", electronicsCategoryId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (!data) {
    return null;
  }

  return data as ElectronicsPostingConfig;
});

export const getAdminElectronicsCatalog = cache(async () => {
  const supabase = await createSupabaseServerClient();

  const [categoriesRes, brandsRes, modelsRes] = await Promise.all([
    supabase.from("electronics_categories").select("*").order("sort_order", { ascending: true }),
    supabase.from("electronics_brands").select("*").order("sort_order", { ascending: true }),
    supabase.from("electronics_models").select("*").order("is_popular", { ascending: false }).order("name", { ascending: true }),
  ]);

  return {
    categories: (categoriesRes.data as ElectronicsCategory[]) ?? [],
    brands: (brandsRes.data as ElectronicsBrand[]) ?? [],
    models: (modelsRes.data as ElectronicsModel[]) ?? [],
  };
});

export const getElectronicsAdminSnapshot = getAdminElectronicsCatalog;
