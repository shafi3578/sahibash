"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function asText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function asAliases(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return [] as string[];
  }
  return Array.from(
    new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
    )
  );
}

function asBoolean(value: FormDataEntryValue | null) {
  const text = asText(value).toLowerCase();
  return text === "true" || text === "1" || text === "on" || text === "yes";
}

export async function adminCreateSearchAliasAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const canonical = asText(formData.get("canonical_term"));
  if (!canonical) {
    return;
  }

  await supabase.from("search_alias_dictionary").insert({
    canonical_term: canonical,
    aliases: asAliases(formData.get("aliases")),
    language: asText(formData.get("language")) || "multi",
    category_scope: asText(formData.get("category_scope")) || null,
    is_active: asBoolean(formData.get("is_active")),
  });

  revalidatePath("/admin/search");
}

export async function adminUpdateSearchAliasAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const id = asText(formData.get("id"));
  if (!id) {
    return;
  }

  const canonical = asText(formData.get("canonical_term"));
  if (!canonical) {
    return;
  }

  await supabase
    .from("search_alias_dictionary")
    .update({
      canonical_term: canonical,
      aliases: asAliases(formData.get("aliases")),
      language: asText(formData.get("language")) || "multi",
      category_scope: asText(formData.get("category_scope")) || null,
      is_active: asBoolean(formData.get("is_active")),
    })
    .eq("id", id);

  revalidatePath("/admin/search");
}

export async function adminApproveSearchAliasAction(formData: FormData) {
  await requireAdmin();
  const user = await getCurrentUser();
  const supabase = await createSupabaseServerClient();

  const id = asText(formData.get("id"));
  if (!id || !user?.id) {
    return;
  }

  await supabase
    .from("search_alias_dictionary")
    .update({
      approved_by: user.id,
      is_active: true,
    })
    .eq("id", id);

  revalidatePath("/admin/search");
}

export async function adminToggleSearchAliasAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const id = asText(formData.get("id"));
  if (!id) {
    return;
  }

  const nextValue = asBoolean(formData.get("next_active"));
  await supabase
    .from("search_alias_dictionary")
    .update({ is_active: nextValue })
    .eq("id", id);

  revalidatePath("/admin/search");
}

export async function adminDeleteSearchAliasAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const id = asText(formData.get("id"));
  if (!id) {
    return;
  }

  await supabase.from("search_alias_dictionary").delete().eq("id", id);
  revalidatePath("/admin/search");
}
