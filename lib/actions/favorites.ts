"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createAccountNotification } from "@/lib/notifications/create";

const FAVORITE_NOTIFICATION_COPY = {
  en: { title: "Listing favorited", body: "Someone saved one of your listings." },
  fa: { title: "اعلان پسندیده شد", body: "یک نفر یکی از اعلان‌های شما را ذخیره کرد." },
  ps: { title: "اعلان خوښ شو", body: "یو کس ستاسو یو اعلان خوندي کړ." },
} as const;

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
    const { error } = await supabase.from("favorites").insert({
      user_id: user.id,
      listing_id: listingId,
    });
    if (!error) {
      const { data: listing } = await supabase
        .from("listings")
        .select("user_id")
        .eq("id", listingId)
        .maybeSingle();
      if (listing?.user_id && listing.user_id !== user.id) {
        await createAccountNotification({
          userId: listing.user_id,
          type: "system",
          copy: FAVORITE_NOTIFICATION_COPY,
          payload: { listing_id: listingId, favorited_by_user_id: user.id },
        });
      }
    }
  }

  revalidatePath("/favorites");
  revalidatePath("/dashboard/favorites");
  revalidatePath(`/listings/${listingId}`);
}
