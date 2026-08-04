"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeHomepageSectionDraft } from "@/lib/data/homepage-sections";

export async function saveHomepageSectionAction(formData: FormData) {
  await requirePermission("settings.update");
  const supabase = await createSupabaseServerClient();
  const draft = normalizeHomepageSectionDraft({
    slug: formData.get("slug"),
    section_type: formData.get("section_type"),
    title: formData.get("title"),
    body: formData.get("body"),
    cta_label: formData.get("cta_label"),
    cta_path: formData.get("cta_path"),
    sort_order: formData.get("sort_order"),
    is_enabled: formData.get("is_enabled") === "on",
  });

  const { error } = await supabase.from("homepage_sections").upsert({
    slug: draft.slug,
    section_type: draft.section_type,
    title: draft.title,
    body: draft.body,
    cta_label: draft.cta_label,
    cta_path: draft.cta_path,
    sort_order: draft.sort_order,
    is_enabled: draft.is_enabled,
  }, { onConflict: "slug" });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/administrator/settings");
  revalidatePath("/");
  redirect("/administrator/settings");
}

export async function deleteHomepageSectionAction(formData: FormData) {
  await requirePermission("settings.update");
  const supabase = await createSupabaseServerClient();
  const slug = String(formData.get("slug") || "").trim();

  if (!slug) {
    throw new Error("Missing section slug.");
  }

  const { error } = await supabase.from("homepage_sections").delete().eq("slug", slug);
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/administrator/settings");
  revalidatePath("/");
  redirect("/administrator/settings");
}

export async function getHomepageSections() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("homepage_sections")
    .select("id, slug, section_type, title, body, cta_label, cta_path, sort_order, is_enabled, created_at, updated_at")
    .order("sort_order", { ascending: true })
    .order("updated_at", { ascending: false });

  if (error) {
    return [];
  }

  return data ?? [];
}
