import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createHash } from "node:crypto";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

function sanitizeText(value: string | null | undefined) {
  return String(value ?? "").trim();
}

function normalizeNullableFilter(value: string | null | undefined) {
  const next = sanitizeText(value);
  return next.length > 0 ? next : null;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function logSearchTelemetry(args: {
  queryText: string;
  normalizedQuery: string;
  selectedLanguage: string;
  resultCount: number;
  categoryFilter?: string | null;
  provinceFilter?: string | null;
  districtFilter?: string | null;
  rewrittenTerms?: string[];
}) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("record_search_telemetry", {
      p_query_text: sanitizeText(args.queryText),
      p_normalized_query: sanitizeText(args.normalizedQuery),
      p_selected_language: sanitizeText(args.selectedLanguage) || "en",
      p_result_count: Math.max(0, Number(args.resultCount) || 0),
      p_category_filter: normalizeNullableFilter(args.categoryFilter),
      p_province_filter: normalizeNullableFilter(args.provinceFilter),
      p_district_filter: normalizeNullableFilter(args.districtFilter),
      p_rewritten_terms: Array.from(new Set((args.rewrittenTerms ?? []).map((term) => sanitizeText(term)).filter(Boolean))),
    });

    return error ? "" : String(data ?? "");
  } catch {
    return "";
  }
}

export async function recordSearchTelemetryClick(telemetryId: string | null | undefined, listingId: string) {
  const telemetry = sanitizeText(telemetryId);
  const listing = sanitizeText(listingId);
  if (!UUID_PATTERN.test(telemetry) || !UUID_PATTERN.test(listing)) {
    return;
  }

  try {
    const supabase = await createSupabaseServerClient();
    await supabase.rpc("record_search_telemetry_click", {
      p_telemetry_id: telemetry,
      p_listing_id: listing,
    });
  } catch {
    // Non-blocking analytics operation.
  }
}

export async function logAiSearchParseTelemetry(args: {
  rawQuery: string;
  normalizedQuery: string;
  selectedLanguage: string;
  interpretedFilters: Record<string, string>;
  chips: Array<Record<string, string | string[]>>;
  resultCount: number;
  parserSource: "deterministic" | "llm" | "hybrid";
  confidence: number;
  gatewayStatus?: string | null;
  gatewayModel?: string | null;
  latencyMs?: number | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  estimatedCostUsd?: number | null;
  fallbackReason?: string | null;
}) {
  try {
    const sessionClient = await createSupabaseServerClient();
    const { data: userData } = await sessionClient.auth.getUser();
    const normalized = sanitizeText(args.normalizedQuery || args.rawQuery).slice(0, 240);
    if (!normalized) return;

    const supabase = createSupabaseAdmin();
    await supabase.from("ai_search_parse_events").insert({
      actor_user_id: userData.user?.id ?? null,
      locale: sanitizeText(args.selectedLanguage) || "fa",
      raw_query_hash: createHash("sha256").update(normalized).digest("hex"),
      parser_source: args.parserSource,
      confidence: Math.max(0, Math.min(1, Number(args.confidence) || 0)),
      interpreted_filters: args.interpretedFilters,
      chips: args.chips,
      result_count: Math.max(0, Number(args.resultCount) || 0),
      zero_result: Number(args.resultCount) === 0,
      gateway_status: normalizeNullableFilter(args.gatewayStatus),
      gateway_model: normalizeNullableFilter(args.gatewayModel)?.slice(0, 120) ?? null,
      latency_ms: args.latencyMs === null || args.latencyMs === undefined ? null : Math.max(0, Math.round(args.latencyMs)),
      input_tokens: args.inputTokens === null || args.inputTokens === undefined ? null : Math.max(0, Math.round(args.inputTokens)),
      output_tokens: args.outputTokens === null || args.outputTokens === undefined ? null : Math.max(0, Math.round(args.outputTokens)),
      estimated_cost_usd: args.estimatedCostUsd === null || args.estimatedCostUsd === undefined ? null : Math.max(0, args.estimatedCostUsd),
      fallback_reason: normalizeNullableFilter(args.fallbackReason)?.slice(0, 240) ?? null,
    });
  } catch {
    // Non-blocking telemetry. Never break search rendering.
  }
}
