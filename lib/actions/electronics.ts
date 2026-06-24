"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function adminCreateElectronicsBrandAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const categoryId = Number(formData.get("category_id") ?? 0);
  const name = String(formData.get("name") ?? "").trim();
  const sortOrder = Number(formData.get("sort_order") ?? 999);
  const isPopular = String(formData.get("is_popular") ?? "") === "on";

  if (!categoryId || !name) return;

  await supabase.from("electronics_brands").upsert(
    {
      category_id: categoryId,
      name,
      slug: slugify(name),
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 999,
      is_popular: isPopular,
      is_active: true,
    },
    { onConflict: "category_id,slug" }
  );

  revalidatePath("/admin/electronics");
}

export async function adminCreateElectronicsModelAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const brandId = Number(formData.get("brand_id") ?? 0);
  const categoryId = Number(formData.get("category_id") ?? 0);
  const name = String(formData.get("name") ?? "").trim();
  const releaseYearRaw = Number(formData.get("release_year") ?? 0);
  const isPopular = String(formData.get("is_popular") ?? "") === "on";

  if (!brandId || !categoryId || !name) return;

  await supabase.from("electronics_models").upsert(
    {
      brand_id: brandId,
      category_id: categoryId,
      name,
      slug: slugify(name),
      release_year: Number.isFinite(releaseYearRaw) && releaseYearRaw > 0 ? releaseYearRaw : null,
      is_popular: isPopular,
      is_active: true,
    },
    { onConflict: "brand_id,slug" }
  );

  revalidatePath("/admin/electronics");
}

export async function adminUpsertElectronicsSpecAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const modelId = Number(formData.get("model_id") ?? 0);
  const specKey = String(formData.get("spec_key") ?? "").trim();
  const specLabel = String(formData.get("spec_label") ?? "").trim();
  const specValue = String(formData.get("spec_value") ?? "").trim();
  const specGroup = String(formData.get("spec_group") ?? "").trim() || null;
  const isFilterable = String(formData.get("is_filterable") ?? "") === "on";

  if (!modelId || !specKey || !specLabel || !specValue) return;

  await supabase.from("electronics_model_specs").upsert(
    {
      model_id: modelId,
      spec_key: specKey,
      spec_label: specLabel,
      spec_value: specValue,
      spec_group: specGroup,
      is_public: true,
      is_filterable: isFilterable,
    },
    { onConflict: "model_id,spec_key" }
  );

  revalidatePath("/admin/electronics");
}

export async function adminUpsertElectronicsOptionAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const modelId = Number(formData.get("model_id") ?? 0);
  const optionType = String(formData.get("option_type") ?? "").trim();
  const optionValue = String(formData.get("option_value") ?? "").trim();
  const sortOrder = Number(formData.get("sort_order") ?? 0);

  if (!modelId || !optionType || !optionValue) return;

  await supabase.from("electronics_model_options").upsert(
    {
      model_id: modelId,
      option_type: optionType,
      option_value: optionValue,
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
    },
    { onConflict: "model_id,option_type,option_value" }
  );

  revalidatePath("/admin/electronics");
}

export async function adminToggleElectronicsModelActiveAction(modelId: number, isActive: boolean) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  await supabase
    .from("electronics_models")
    .update({ is_active: isActive })
    .eq("id", modelId);

  revalidatePath("/admin/electronics");
}

export async function adminUpdateElectronicsBrandOrderAction(brandId: number, sortOrder: number) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  await supabase
    .from("electronics_brands")
    .update({ sort_order: sortOrder })
    .eq("id", brandId);

  revalidatePath("/admin/electronics");
}

export async function adminToggleElectronicsCategoryAction(categoryId: number, isActive: boolean) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  await supabase
    .from("electronics_categories")
    .update({ is_active: isActive })
    .eq("id", categoryId);

  revalidatePath("/admin/electronics");
}
