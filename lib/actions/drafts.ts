"use server";

import { getCurrentUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ListingDraftPayload = {
  postingType: "sell" | "wanted" | "telegram" | "quick";
  category: Record<string, unknown>;
  details: Record<string, unknown>;
  photos: unknown[];
  location: Record<string, unknown>;
  language: "en" | "fa" | "ps";
  status?: "in_progress" | "published" | "discarded";
};

export async function saveListingDraftAction(payload: ListingDraftPayload): Promise<{
  ok: boolean;
  statusCode?: number;
  message: string;
  draftId?: string;
}> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, statusCode: 401, message: "Unauthorized" };
  }

  const supabase = await createSupabaseServerClient();

  const { data: existing } = await supabase
    .from("listing_drafts")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "in_progress")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const payloadRow = {
    user_id: user.id,
    posting_type: payload.postingType,
    category: payload.category,
    details: payload.details,
    photos: payload.photos,
    location: payload.location,
    language: payload.language,
    status: payload.status ?? "in_progress",
  };

  const { data, error } = existing?.id
    ? await supabase
        .from("listing_drafts")
        .update(payloadRow)
        .eq("id", existing.id)
        .select("id")
        .single()
    : await supabase
        .from("listing_drafts")
        .insert(payloadRow)
        .select("id")
        .single();

  if (error) {
    return { ok: false, message: error.message };
  }

  return {
    ok: true,
    message: "Draft saved",
    draftId: String((data as { id?: string } | null)?.id ?? ""),
  };
}

export async function getMyActiveDraftAction(): Promise<{
  ok: boolean;
  statusCode?: number;
  draft: {
    id: string;
    posting_type: string;
    category: Record<string, unknown>;
    details: Record<string, unknown>;
    photos: unknown[];
    location: Record<string, unknown>;
    language: string;
    status: string;
    updated_at: string;
  } | null;
}> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, statusCode: 401, draft: null };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("listing_drafts")
    .select("id, posting_type, category, details, photos, location, language, status, updated_at")
    .eq("user_id", user.id)
    .eq("status", "in_progress")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return { ok: true, draft: null };
  }

  return {
    ok: true,
    draft: data as {
      id: string;
      posting_type: string;
      category: Record<string, unknown>;
      details: Record<string, unknown>;
      photos: unknown[];
      location: Record<string, unknown>;
      language: string;
      status: string;
      updated_at: string;
    },
  };
}

export async function deleteMyDraftAction(draftId?: string): Promise<{
  ok: boolean;
  statusCode?: number;
  message: string;
}> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, statusCode: 401, message: "Unauthorized" };
  }

  const supabase = await createSupabaseServerClient();
  let query = supabase.from("listing_drafts").delete().eq("user_id", user.id).eq("status", "in_progress");
  if (draftId) {
    query = query.eq("id", draftId);
  }

  const { error } = await query;
  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, message: "Draft deleted" };
}
