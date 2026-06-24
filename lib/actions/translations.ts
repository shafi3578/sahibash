"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listingLanguageLabel, type ListingLanguageCode } from "@/lib/listings/translation-service";

export async function reportListingTranslationIssueAction(formData: FormData) {
  const user = await requireUser();
  const listingId = String(formData.get("listingId") ?? "").trim();
  const languageCode = String(formData.get("languageCode") ?? "").trim();
  const details = String(formData.get("details") ?? "").trim();

  if (!listingId || !languageCode) {
    return;
  }

  const reason = `Translation issue (${listingLanguageLabel(languageCode as ListingLanguageCode)}): ${details || "Needs review"}`;
  const supabase = await createSupabaseServerClient();

  await supabase.from("reports").insert({
    listing_id: listingId,
    reporter_user_id: user.id,
    reason,
    details: details || null,
    status: "open",
  });

  await supabase
    .from("listing_translations")
    .update({ translation_status: "needs_review" })
    .eq("listing_id", listingId)
    .eq("language_code", languageCode);

  revalidatePath(`/listings/${listingId}`);
}

export async function adminUpdateListingTranslationAction(formData: FormData) {
  await requireAdmin();

  const listingId = String(formData.get("listingId") ?? "").trim();
  const languageCode = String(formData.get("languageCode") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const translationStatus = String(formData.get("translationStatus") ?? "completed").trim();
  const quality = String(formData.get("translationQuality") ?? "manual").trim();

  if (!listingId || !languageCode || !title || !description) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  await supabase.from("listing_translations").upsert(
    {
      listing_id: listingId,
      language_code: languageCode,
      title,
      description,
      translation_status: translationStatus,
      translated_by: "human",
      translation_quality: quality,
      is_stale: false,
    },
    { onConflict: "listing_id,language_code" }
  );

  revalidatePath("/admin/listings");
  revalidatePath(`/listings/${listingId}`);
}

export async function adminFlagListingTranslationAction(formData: FormData) {
  await requireAdmin();

  const listingId = String(formData.get("listingId") ?? "").trim();
  const languageCode = String(formData.get("languageCode") ?? "").trim();
  const status = String(formData.get("status") ?? "needs_review").trim();

  if (!listingId || !languageCode) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  await supabase
    .from("listing_translations")
    .update({ translation_status: status })
    .eq("listing_id", listingId)
    .eq("language_code", languageCode);

  revalidatePath("/admin/listings");
  revalidatePath(`/listings/${listingId}`);
}
