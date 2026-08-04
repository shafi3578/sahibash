"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSuperAdministrator } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeCategorySchemaProfileFromFormData } from "@/lib/data/category-schema";

export async function saveCategorySchemaProfileAction(formData: FormData) {
  await requireSuperAdministrator();
  const supabase = await createSupabaseServerClient();
  const draft = normalizeCategorySchemaProfileFromFormData(formData);

  const { error } = await supabase.from("category_schema_profiles").upsert({
    category_slug: draft.category_slug,
    schema_key: draft.schema_key,
    title: draft.title,
    description: draft.description,
    is_enabled: draft.is_enabled,
    sort_order: draft.sort_order,
  }, { onConflict: "category_slug,schema_key" });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function deleteCategorySchemaProfileAction(formData: FormData) {
  await requireSuperAdministrator();
  const supabase = await createSupabaseServerClient();

  const categorySlug = String(formData.get("category_slug") || "").trim();
  const schemaKey = String(formData.get("schema_key") || "").trim();

  if (!categorySlug || !schemaKey) {
    throw new Error("Missing profile identifier.");
  }

  const { error } = await supabase.from("category_schema_profiles").delete().eq("category_slug", categorySlug).eq("schema_key", schemaKey);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function getCategorySchemaProfiles() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("category_schema_profiles")
    .select("category_slug, schema_key, title, description, is_enabled, sort_order, updated_at")
    .order("sort_order", { ascending: true });

  if (error) {
    return [];
  }

  return data ?? [];
}
