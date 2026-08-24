"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser, requireUser } from "@/lib/auth";
import type { AppLocale } from "@/lib/i18n/translations";
import { buildListingShareOutput, normalizeShareChannel } from "@/lib/liquidity/share";
import { sanitizeWantedFilters } from "@/lib/liquidity/wanted";

function asLocale(value: FormDataEntryValue | null): AppLocale {
  const locale = String(value ?? "fa");
  return locale === "en" || locale === "ps" || locale === "fa" ? locale : "fa";
}

function optionalNumber(value: FormDataEntryValue | null) {
  if (!value) return null;
  const parsed = Number(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}

export async function createWantedRequestAction(formData: FormData) {
  const user = await requireUser();
  const locale = asLocale(formData.get("locale"));
  const params = new URLSearchParams(String(formData.get("params") ?? ""));
  const filters = sanitizeWantedFilters(params);
  const title = String(formData.get("title") ?? filters.q ?? "Wanted request").trim().slice(0, 120);
  const urgency = String(formData.get("urgency") ?? "flexible");
  const channels = formData.getAll("channels").map(String).filter((v) => ["in_app", "email", "whatsapp"].includes(v));
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("wanted_requests").insert({
    user_id: user.id,
    locale,
    title,
    urgency: urgency === "soon" || urgency === "urgent" ? urgency : "flexible",
    query_text: filters.q ?? null,
    category_id: optionalNumber(formData.get("categoryId") ?? filters.categoryId ?? null),
    category_node_id: optionalNumber(formData.get("categoryNodeId") ?? filters.categoryNodeId ?? null),
    category_path: String(formData.get("categoryPath") ?? "").slice(0, 300) || null,
    province: filters.province ?? null,
    district: filters.district ?? null,
    min_price: optionalNumber(formData.get("minPrice") ?? filters.minPrice ?? null),
    max_price: optionalNumber(formData.get("maxPrice") ?? filters.maxPrice ?? null),
    condition: filters.condition ?? null,
    attributes: filters,
    notification_channels: channels.length ? channels : ["in_app"],
  });

  if (error) throw new Error("Unable to create wanted request.");

  await supabase.rpc("record_demand_signal", {
    p_signal_type: "wanted_request",
    p_locale: locale,
    p_query_text: filters.q ?? title,
    p_category_node_id: optionalNumber(formData.get("categoryNodeId") ?? filters.categoryNodeId ?? null),
    p_category_path: String(formData.get("categoryPath") ?? "").slice(0, 300) || null,
    p_province: filters.province ?? null,
    p_district: filters.district ?? null,
    p_attributes: filters,
    p_weight: urgency === "urgent" ? 6 : urgency === "soon" ? 4 : 3,
    p_source: "find_it_for_me",
  });

  revalidatePath("/dashboard/favorite-searches");
}

export async function updateWantedRequestStatusAction(id: string, status: "active" | "paused" | "deleted") {
  const user = await requireUser();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  const supabase = await createSupabaseServerClient();
  await supabase
    .from("wanted_requests")
    .update({
      status,
      notification_paused_at: status === "paused" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id);
  revalidatePath("/dashboard/favorite-searches");
}

export async function recordDemandSignalAction(payload: {
  signalType: "search" | "zero_result_search" | "saved_search" | "favorite" | "detail_view" | "contact_action";
  locale: AppLocale;
  queryText?: string;
  categoryNodeId?: number;
  categoryPath?: string;
  province?: string;
  district?: string;
  attributes?: Record<string, string>;
  weight?: number;
  source?: string;
}) {
  const supabase = await createSupabaseServerClient();
  await supabase.rpc("record_demand_signal", {
    p_signal_type: payload.signalType,
    p_locale: payload.locale,
    p_query_text: payload.queryText ?? null,
    p_category_node_id: payload.categoryNodeId ?? null,
    p_category_path: payload.categoryPath ?? null,
    p_province: payload.province ?? null,
    p_district: payload.district ?? null,
    p_attributes: payload.attributes ?? {},
    p_weight: payload.weight ?? 1,
    p_source: payload.source ?? "web",
  });
}

export async function createShareOutputAction(listingId: string, channel: string, locale: AppLocale) {
  const user = await getCurrentUser();
  const supabase = await createSupabaseServerClient();
  const { data: listing } = await supabase
    .from("listings")
    .select("id,title,price,currency,province,district")
    .eq("id", listingId)
    .maybeSingle();

  if (!listing) return { ok: false };

  const headerStore = await headers();
  const origin = headerStore.get("origin") ?? "https://sahibash.vercel.app";
  const output = buildListingShareOutput(listing, locale, normalizeShareChannel(channel), origin);

  if (user) {
    await supabase.from("listing_share_outputs").insert({
      listing_id: listingId,
      user_id: user.id,
      channel: output.channel,
      locale,
      share_url: output.shareUrl,
      share_text: output.shareText,
      utm_source: output.channel,
    });
  }

  return { ok: true, ...output };
}
