"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function toggleFavoriteAction(listingId: string) {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data: existing } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("listing_id", listingId)
    .maybeSingle();

  if (existing?.id) {
    await supabase.from("favorites").delete().eq("id", existing.id);
  } else {
    await supabase.from("favorites").insert({
      user_id: user.id,
      listing_id: listingId,
    });
  }

  revalidatePath("/favorites");
  revalidatePath("/dashboard/favorites");
  revalidatePath(`/listings/${listingId}`);
}
