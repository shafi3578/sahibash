import { createSupabaseServerClient } from "@/lib/supabase/server";

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
