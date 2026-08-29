import "server-only";

import { createSupabaseAdmin } from "@/lib/supabase/admin";

export const AI_FEATURE_FLAG_KEYS = [
  "ai_search_enabled",
  "ai_posting_category_suggestions_enabled",
  "ai_posting_image_detection_enabled",
] as const;

export type AiFeatureFlagKey = (typeof AI_FEATURE_FLAG_KEYS)[number];

export type AiFeatureFlags = {
  aiSearchEnabled: boolean;
  postingCategorySuggestionsEnabled: boolean;
  postingImageDetectionEnabled: boolean;
};

export type AiFeatureFlagAdminRow = {
  key: AiFeatureFlagKey;
  description: string;
  enabled: boolean;
  updatedAt: string | null;
  updatedBy: string | null;
};

export type AiSearchDailyMetrics = {
  requests: number;
  successRate: number;
  fallbackRate: number;
  zeroResultRate: number;
  averageLatencyMs: number;
  estimatedCostUsd: number;
};

const FAIL_CLOSED_FLAGS: AiFeatureFlags = {
  aiSearchEnabled: false,
  postingCategorySuggestionsEnabled: false,
  postingImageDetectionEnabled: false,
};

export function isAiFeatureFlagKey(value: string): value is AiFeatureFlagKey {
  return (AI_FEATURE_FLAG_KEYS as readonly string[]).includes(value);
}

export async function getAiFeatureFlags(): Promise<AiFeatureFlags> {
  try {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("feature_flags")
      .select("key,enabled")
      .in("key", [...AI_FEATURE_FLAG_KEYS]);

    if (error) return FAIL_CLOSED_FLAGS;
    const enabledByKey = new Map((data ?? []).map((row) => [String(row.key), row.enabled === true]));

    return {
      aiSearchEnabled: enabledByKey.get("ai_search_enabled") === true,
      postingCategorySuggestionsEnabled: enabledByKey.get("ai_posting_category_suggestions_enabled") === true,
      postingImageDetectionEnabled:
        enabledByKey.get("ai_posting_category_suggestions_enabled") === true
        && enabledByKey.get("ai_posting_image_detection_enabled") === true,
    };
  } catch {
    return FAIL_CLOSED_FLAGS;
  }
}

export async function getAiFeatureFlagAdminRows(): Promise<AiFeatureFlagAdminRow[]> {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("feature_flags")
    .select("key,description,enabled,updated_at,updated_by")
    .in("key", [...AI_FEATURE_FLAG_KEYS])
    .order("key", { ascending: true });

  if (error) throw new Error("Unable to load AI feature flags");

  const updaterIds = Array.from(new Set(
    (data ?? []).map((row) => row.updated_by).filter((value): value is string => typeof value === "string")
  ));
  const { data: profiles } = updaterIds.length > 0
    ? await supabase.from("profiles").select("id,full_name").in("id", updaterIds)
    : { data: [] };
  const updaterNames = new Map((profiles ?? []).map((profile) => [String(profile.id), String(profile.full_name ?? "").trim()]));

  return (data ?? []).flatMap((row) => {
    const key = String(row.key);
    if (!isAiFeatureFlagKey(key)) return [];
    const updaterId = typeof row.updated_by === "string" ? row.updated_by : null;
    return [{
      key,
      description: String(row.description ?? ""),
      enabled: row.enabled === true,
      updatedAt: typeof row.updated_at === "string" ? row.updated_at : null,
      updatedBy: updaterId ? updaterNames.get(updaterId) || updaterId.slice(0, 8) : null,
    } satisfies AiFeatureFlagAdminRow];
  });
}

export async function getAiSearchDailyMetrics(): Promise<AiSearchDailyMetrics> {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("ai_search_parse_events")
    .select("gateway_status,parser_source,latency_ms,estimated_cost_usd,zero_result,fallback_reason")
    .gte("created_at", start.toISOString())
    .order("created_at", { ascending: false })
    .limit(5000);
  if (error) throw new Error("Unable to load AI search metrics");

  const rows = data ?? [];
  const requests = rows.length;
  const successful = rows.filter((row) => row.gateway_status === "success").length;
  const fallback = rows.filter((row) => Boolean(row.fallback_reason) || row.parser_source === "deterministic").length;
  const zeroResult = rows.filter((row) => row.zero_result === true).length;
  const latencyRows = rows.map((row) => Number(row.latency_ms)).filter((value) => Number.isFinite(value) && value >= 0);
  const totalCost = rows.reduce((sum, row) => sum + Math.max(0, Number(row.estimated_cost_usd) || 0), 0);

  return {
    requests,
    successRate: requests > 0 ? successful / requests : 0,
    fallbackRate: requests > 0 ? fallback / requests : 0,
    zeroResultRate: requests > 0 ? zeroResult / requests : 0,
    averageLatencyMs: latencyRows.length > 0 ? Math.round(latencyRows.reduce((sum, value) => sum + value, 0) / latencyRows.length) : 0,
    estimatedCostUsd: Number(totalCost.toFixed(8)),
  };
}
