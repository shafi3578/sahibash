"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeNavigationItem } from "@/lib/data/navigation";

export async function saveNavigationItemAction(formData: FormData) {
  await requirePermission("settings.update");
  const supabase = await createSupabaseServerClient();
  const item = normalizeNavigationItem({
    label: formData.get("label"),
    path: formData.get("path"),
    parent_id: formData.get("parent_id") || 0,
    sort_order: formData.get("sort_order") || 0,
    is_enabled: formData.get("is_enabled") === "on",
  });

  const { error } = await supabase.from("navigation_items").insert({
    label: item.label,
    path: item.path,
    parent_id: item.parent_id,
    sort_order: item.sort_order,
    is_enabled: item.is_enabled,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/administrator/settings");
  revalidatePath("/");
  redirect("/administrator/settings");
}

export async function deleteNavigationItemAction(formData: FormData) {
  await requirePermission("settings.update");
  const supabase = await createSupabaseServerClient();
  const id = Number(formData.get("id") || 0);

  if (!id) {
    throw new Error("Missing navigation item id.");
  }

  const { error } = await supabase.from("navigation_items").delete().eq("id", id);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/administrator/settings");
  revalidatePath("/");
  redirect("/administrator/settings");
}

export async function getNavigationItems() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("navigation_items")
    .select("id, label, path, parent_id, sort_order, is_enabled, created_at, updated_at")
    .order("sort_order", { ascending: true });

  if (error) {
    return [];
  }

  return data ?? [];
}
