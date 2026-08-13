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

export async function moderateListingAction(formData:FormData){
 await requirePermission("listings.moderate"); const listingId=String(formData.get("listing_id")??""); const status=String(formData.get("status")??""); const reason=String(formData.get("reason_code")??"").trim();
 if(!/^[0-9a-f-]{36}$/i.test(listingId)||!["approved","rejected","pending","sold","expired"].includes(status)||!reason) throw new Error("Invalid moderation request");
 const supabase=await createSupabaseServerClient(); const {error}=await supabase.rpc("moderate_listing",{p_listing_id:listingId,p_to_status:status,p_reason_code:reason,p_internal_note:String(formData.get("internal_note")??"").slice(0,2000),p_seller_explanation:String(formData.get("seller_explanation")??"").slice(0,2000)}); if(error) throw new Error(error.message);
 revalidatePath("/admin/listings"); revalidatePath(`/listings/${listingId}`); redirect("/admin/listings");
}
