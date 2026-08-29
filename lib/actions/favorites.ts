"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createAccountNotification } from "@/lib/notifications/create";
import { getCurrentLocale } from "@/lib/i18n/server";
import { localizePath } from "@/lib/i18n/routing";

const FAVORITE_NOTIFICATION_COPY = {
  en: { title: "Listing favorited", body: "Someone saved one of your listings." },
  fa: { title: "اعلان پسندیده شد", body: "یک نفر یکی از اعلان‌های شما را ذخیره کرد." },
  ps: { title: "اعلان خوښ شو", body: "یو کس ستاسو یو اعلان خوندي کړ." },
} as const;

export async function toggleFavoriteAction(listingId: string) {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  const locale = await getCurrentLocale();

  const { data: existing, error: lookupError } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("listing_id", listingId)
    .maybeSingle();

  if (lookupError) return { ok: false as const, favorited: false };

  let favorited = false;

  if (existing?.id) {
    const { error } = await supabase.from("favorites").delete().eq("id", existing.id);
    if (error) return { ok: false as const, favorited: true };
  } else {
    const { error } = await supabase.from("favorites").insert({
      user_id: user.id,
      listing_id: listingId,
    });
    if (error) return { ok: false as const, favorited: false };
    favorited = true;
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

  revalidatePath("/favorites");
  revalidatePath("/dashboard/favorites");
  revalidatePath(`/listings/${listingId}`);
  revalidatePath(localizePath(`/listings/${listingId}`, locale));
  return { ok: true as const, favorited };
}
