"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function createReportAction(formData: FormData) {
  const user = await requireUser();
  const listingId = String(formData.get("listingId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  if (!listingId || reason.length < 5) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("reports").insert({
    listing_id: listingId,
    user_id: user.id,
    reason,
  });

  if (error) {
    return;
  }

  revalidatePath(`/listings/${listingId}`);
}
