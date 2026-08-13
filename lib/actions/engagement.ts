"use server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppLocale } from "@/lib/i18n/translations";
export async function recordListingEngagementAction(listingId: string, eventType: "phone_reveal"|"call"|"whatsapp"|"message"|"share"|"favorite"|"similar_click", locale: AppLocale, source="listing_detail") {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(listingId)) return;
  if (!/^[a-z0-9_-]{1,64}$/i.test(source)) return;
  const supabase=await createSupabaseServerClient();
  await supabase.rpc("record_listing_engagement",{p_listing_id:listingId,p_event_type:eventType,p_locale:locale,p_source:source});
}
