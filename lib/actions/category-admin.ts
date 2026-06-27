"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function text(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function bool(value: FormDataEntryValue | null) {
  const normalized = text(value).toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "on" || normalized === "yes";
}

export async function adminCreateCategoryAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const name = text(formData.get("name"));
  const slug = text(formData.get("slug")).toLowerCase();
  if (!name || !slug) return;

  await supabase.from("categories").insert({
    name,
    slug,
    description: text(formData.get("description")) || null,
    display_order: Number(text(formData.get("display_order")) || "999"),
    is_active: bool(formData.get("is_active")),
  });

  revalidatePath("/admin/categories");
}

export async function adminUpdateCategoryAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const id = Number(text(formData.get("id")));
  if (!Number.isFinite(id)) return;

  await supabase
    .from("categories")
    .update({
      name: text(formData.get("name")),
      slug: text(formData.get("slug")).toLowerCase(),
      description: text(formData.get("description")) || null,
      display_order: Number(text(formData.get("display_order")) || "999"),
      is_active: bool(formData.get("is_active")),
    })
    .eq("id", id);

  revalidatePath("/admin/categories");
}

export async function adminDeleteCategoryAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const id = Number(text(formData.get("id")));
  if (!Number.isFinite(id)) return;

  await supabase.from("categories").delete().eq("id", id);
  revalidatePath("/admin/categories");
}

export async function adminUpsertCategoryAliasAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const categoryId = Number(text(formData.get("category_id")));
  const alias = text(formData.get("alias"));
  const language = text(formData.get("language")) || "en";
  if (!Number.isFinite(categoryId) || !alias) return;

  const insertResult = await supabase
    .from("category_aliases")
    .insert({
      category_id: categoryId,
      alias,
      language,
    });

  if (insertResult.error && !insertResult.error.message.toLowerCase().includes("duplicate")) {
    return;
  }

  revalidatePath("/admin/categories");
}
