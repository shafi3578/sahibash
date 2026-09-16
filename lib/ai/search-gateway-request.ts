import { createHash } from "node:crypto";
import { buildAiSearchIntentInstructions, parseAiSearchStructuredIntent, type AiSearchStructuredIntent } from "@/lib/ai/search-intent-schema";

const ENDPOINT = "https://ai-gateway.vercel.sh/v1/chat/completions";
const PRIMARY_MODEL = "mistral/mistral-small";
const INPUT_USD_PER_TOKEN = 0.0000001;
const OUTPUT_USD_PER_TOKEN = 0.0000003;

export type AiSearchGatewayStatus = "success" | "missing_token" | "timeout" | "invalid_response" | `http_${number}`;
export type AiSearchGatewayFailureReason =
  | "missing_token" | "timeout" | "network" | "envelope" | "refusal" | "truncated"
  | "invalid_json" | "schema" | `http_${number}`;
export type AiSearchGatewayResult = {
  intent: AiSearchStructuredIntent | null;
  status: AiSearchGatewayStatus;
  failureReason: AiSearchGatewayFailureReason | null;
  model: string | null;
  latencyMs: number;
  inputTokens: number | null;
  outputTokens: number | null;
  estimatedCostUsd: number | null;
};
export type AiSearchGatewayInput = { query: string; locale: "en" | "fa" | "ps"; userId?: string | null };

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : null;
}

function tokenCount(value: unknown) {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : null;
}

// The server-only wrapper supplies credentials. Dependency injection keeps tests offline.
export async function requestSearchGateway(
  input: AiSearchGatewayInput,
  options: { token?: string; environment?: string; fetch: typeof fetch },
): Promise<AiSearchGatewayResult> {
  const startedAt = Date.now();
  let model: string | null = null;
  let inputTokens: number | null = null;
  let outputTokens: number | null = null;
  const result = (
    status: AiSearchGatewayStatus,
    failureReason: AiSearchGatewayFailureReason | null,
    intent: AiSearchStructuredIntent | null = null,
  ): AiSearchGatewayResult => ({
    intent, status, failureReason, model,
    latencyMs: Date.now() - startedAt,
    inputTokens, outputTokens,
    estimatedCostUsd: inputTokens === null || outputTokens === null ? null
      : Number((inputTokens * INPUT_USD_PER_TOKEN + outputTokens * OUTPUT_USD_PER_TOKEN).toFixed(8)),
  });
  if (!options.token) return { ...result("missing_token", "missing_token"), latencyMs: 0 };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  let stage: "network" | "envelope" = "network";
  try {
    const response = await options.fetch(ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${options.token}`, "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: PRIMARY_MODEL,
        models: ["openai/gpt-5-nano"],
        temperature: 0,
        max_completion_tokens: 350,
        // Configured-model JSON Schema support has not been verified; retain JSON mode.
        response_format: { type: "json_object" },
        providerOptions: {
          gateway: {
            user: input.userId ? createHash("sha256").update(input.userId).digest("hex").slice(0, 24) : undefined,
            tags: ["feature:ai-search", `env:${options.environment ?? "unknown"}`],
          },
        },
        messages: [
          { role: "system", content: buildAiSearchIntentInstructions() },
          { role: "user", content: JSON.stringify({ locale: input.locale, query: input.query.slice(0, 240) }) },
        ],
      }),
    });
    if (!response.ok) return result(`http_${response.status}`, `http_${response.status}`);
    stage = "envelope";
    const payload = record(await response.json());
    if (!payload) return result("invalid_response", "envelope");

    // Preserve safe response metadata even when content validation later fails.
    model = typeof payload.model === "string" && /^[a-z0-9][a-z0-9._:/-]{0,119}$/i.test(payload.model)
      ? payload.model : null;
    const usage = record(payload.usage);
    inputTokens = tokenCount(usage?.prompt_tokens);
    outputTokens = tokenCount(usage?.completion_tokens);
    const choice = Array.isArray(payload.choices) ? record(payload.choices[0]) : null;
    const message = record(choice?.message);
    if (choice?.finish_reason === "content_filter" || (typeof message?.refusal === "string" && message.refusal.trim())) {
      return result("invalid_response", "refusal");
    }
    if (choice?.finish_reason === "length") return result("invalid_response", "truncated");
    if (typeof message?.content !== "string" || !message.content.trim()) {
      return result("invalid_response", "envelope");
    }
    let decoded: unknown;
    try {
      decoded = JSON.parse(message.content);
    } catch {
      return result("invalid_response", "invalid_json");
    }
    let intent: AiSearchStructuredIntent;
    try {
      intent = parseAiSearchStructuredIntent(decoded);
    } catch {
      return result("invalid_response", "schema");
    }
    model ??= PRIMARY_MODEL;
    return result("success", null, intent);
  } catch (error) {
    // Never return/log provider text, exception messages, request bodies or credentials.
    const timedOut = controller.signal.aborted || (error instanceof Error && error.name === "AbortError");
    return timedOut ? result("timeout", "timeout") : result("invalid_response", stage);
  } finally {
    clearTimeout(timeout);
  }
}
