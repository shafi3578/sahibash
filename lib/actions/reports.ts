"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function createReportAction(formData: FormData) {
  const user = await requireUser();
  const listingId = String(formData.get("listingId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  const details = String(formData.get("details") ?? "").trim();
  const composedReason = details ? `${reason}: ${details}` : reason;

  if (!listingId || reason.length < 3) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("reports").insert({
    listing_id: listingId,
    user_id: user.id,
    reason: composedReason,
  });

  if (error) {
    return;
  }

  revalidatePath(`/listings/${listingId}`);
}
