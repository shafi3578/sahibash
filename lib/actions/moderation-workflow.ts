"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeModerationEntry } from "@/lib/data/moderation-workflow";

export async function saveModerationEntryAction(formData: FormData) {
  await requirePermission("listings.moderate");
  const supabase = await createSupabaseServerClient();
  const entry = normalizeModerationEntry({
    entity_type: formData.get("entity_type"),
    entity_id: formData.get("entity_id"),
    status: formData.get("status"),
    summary: formData.get("summary"),
  });

  const { error } = await supabase.from("moderation_workflow_entries").insert({
    entity_type: entry.entity_type,
    entity_id: entry.entity_id,
    status: entry.status,
    summary: entry.summary,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/listings");
  redirect("/admin/listings");
}

export async function getModerationEntries() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("moderation_workflow_entries")
    .select("id, entity_type, entity_id, status, summary, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  return data ?? [];
}
