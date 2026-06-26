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
    const { data } = await supabase
      .from("search_telemetry")
      .insert({
        query_text: sanitizeText(args.queryText),
        normalized_query: sanitizeText(args.normalizedQuery),
        selected_language: sanitizeText(args.selectedLanguage) || "en",
        result_count: Math.max(0, Number(args.resultCount) || 0),
        category_filter: normalizeNullableFilter(args.categoryFilter),
        province_filter: normalizeNullableFilter(args.provinceFilter),
        district_filter: normalizeNullableFilter(args.districtFilter),
        rewritten_terms: Array.from(new Set((args.rewrittenTerms ?? []).map((term) => sanitizeText(term)).filter(Boolean))),
      })
      .select("id")
      .maybeSingle();

    return String((data as { id?: string } | null)?.id ?? "");
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
    await supabase
      .from("search_telemetry")
      .update({ clicked_listing_id: listing })
      .eq("id", telemetry)
      .is("clicked_listing_id", null);
  } catch {
    // Non-blocking analytics operation.
  }
}
