"use server";

import { revalidatePath } from "next/cache";
import { requirePermission, getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { recordAuditEvent } from "@/lib/audit";
import { revalidatePublicTaxonomyCache } from "@/lib/cache/public-cache";

function text(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function bool(value: FormDataEntryValue | null) {
  const normalized = text(value).toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "on" || normalized === "yes";
}

export async function adminCreateCategoryAction(formData: FormData) {
  await requirePermission("categories.create");
  const supabase = await createSupabaseServerClient();
  const adminUser = await getCurrentUser();

  const name = text(formData.get("name"));
  const slug = text(formData.get("slug")).toLowerCase();
  if (!name || !slug) return;

  const { data, error } = await supabase.from("categories").insert({
    name,
    slug,
    description: text(formData.get("description")) || null,
    display_order: Number(text(formData.get("display_order")) || "999"),
    is_active: bool(formData.get("is_active")),
  }).select("id").single();

  if (error) return;

  if (adminUser) {
    await recordAuditEvent({
      adminUserId: adminUser.id,
      action: "CATEGORY_CREATED",
      entityType: "category",
      entityId: String(data?.id ?? ""),
      safeChanges: { name, slug, description: text(formData.get("description")) || null },
    });
  }

  revalidatePublicTaxonomyCache();
  revalidatePath("/admin/categories");
}

export async function adminUpdateCategoryAction(formData: FormData) {
  await requirePermission("categories.update");
  const supabase = await createSupabaseServerClient();
  const adminUser = await getCurrentUser();

  const id = Number(text(formData.get("id")));
  if (!Number.isFinite(id)) return;

  const payload = {
    name: text(formData.get("name")),
    slug: text(formData.get("slug")).toLowerCase(),
    description: text(formData.get("description")) || null,
    display_order: Number(text(formData.get("display_order")) || "999"),
    is_active: bool(formData.get("is_active")),
  };

  const { error } = await supabase
    .from("categories")
    .update(payload)
    .eq("id", id);

  if (error) return;

  if (adminUser) {
    await recordAuditEvent({
      adminUserId: adminUser.id,
      action: "CATEGORY_UPDATED",
      entityType: "category",
      entityId: String(id),
      safeChanges: payload,
    });
  }

  revalidatePublicTaxonomyCache();
  revalidatePath("/admin/categories");
}

export async function adminDeleteCategoryAction(formData: FormData) {
  await requirePermission("categories.archive");
  const supabase = await createSupabaseServerClient();
  const adminUser = await getCurrentUser();

  const id = Number(text(formData.get("id")));
  if (!Number.isFinite(id)) return;

  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) return;

  if (adminUser) {
    await recordAuditEvent({
      adminUserId: adminUser.id,
      action: "CATEGORY_ARCHIVED",
      entityType: "category",
      entityId: String(id),
    });
  }

  revalidatePublicTaxonomyCache();
  revalidatePath("/admin/categories");
}

export async function adminUpsertCategoryAliasAction(formData: FormData) {
  await requirePermission("categories.update");
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

  revalidatePublicTaxonomyCache();
  revalidatePath("/admin/categories");
}
