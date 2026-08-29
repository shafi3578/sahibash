import "server-only";

import { createHash } from "node:crypto";
import { parseAiSearchStructuredIntent, type AiSearchStructuredIntent } from "@/lib/ai/search-intent-schema";

const ENDPOINT = "https://ai-gateway.vercel.sh/v1/chat/completions";
const PRIMARY_MODEL = "mistral/mistral-small";
const INPUT_USD_PER_TOKEN = 0.0000001;
const OUTPUT_USD_PER_TOKEN = 0.0000003;

export type AiSearchGatewayStatus =
  | "success"
  | "missing_token"
  | "timeout"
  | "invalid_response"
  | `http_${number}`;

export type AiSearchGatewayResult = {
  intent: AiSearchStructuredIntent | null;
  status: AiSearchGatewayStatus;
  model: string | null;
  latencyMs: number;
  inputTokens: number | null;
  outputTokens: number | null;
  estimatedCostUsd: number | null;
};

export async function requestGatewaySearchIntent(input: {
  query: string;
  locale: "en" | "fa" | "ps";
  userId?: string | null;
}): Promise<AiSearchGatewayResult> {
  const token = process.env.AI_GATEWAY_API_KEY ?? process.env.VERCEL_OIDC_TOKEN;
  if (!token) {
    return { intent: null, status: "missing_token", model: null, latencyMs: 0, inputTokens: null, outputTokens: null, estimatedCostUsd: null };
  }

  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: PRIMARY_MODEL,
        models: ["openai/gpt-5-nano"],
        temperature: 0,
        max_completion_tokens: 350,
        response_format: { type: "json_object" },
        providerOptions: {
          gateway: {
            user: input.userId ? createHash("sha256").update(input.userId).digest("hex").slice(0, 24) : undefined,
            tags: ["feature:ai-search", `env:${process.env.VERCEL_ENV ?? "unknown"}`],
          },
        },
        messages: [
          {
            role: "system",
            content: [
              "Interpret an Afghanistan marketplace search. Return one JSON object only.",
              "Allowed keys: query, categoryPath, province, district, minPrice, maxPrice, currency, yearMin, yearMax, minRooms, minLandSize, maxLandSize, vehicleBrand, vehicleModel, phoneModel, rentalType, condition, listingType, sort, confidence.",
              "Use numeric AFN amounts. 1 lakh/لک/لاکه/لکه = 100000. 1 jerib/جریب/جریبه = 2000 square metres. 1 biswa/بسوه/بیسوه = 100 square metres.",
              "categoryPath is a slash-separated taxonomy hint, never SQL. Preserve uncertainty: omit fields you cannot infer and use the remaining product words in query.",
              "For 'or newer' set only yearMin; for 'or older' set only yearMax. confidence must be 0..1.",
            ].join(" "),
          },
          { role: "user", content: JSON.stringify({ locale: input.locale, query: input.query.slice(0, 240) }) },
        ],
      }),
    });

    const latencyMs = Date.now() - startedAt;
    if (!response.ok) {
      return { intent: null, status: `http_${response.status}`, model: null, latencyMs, inputTokens: null, outputTokens: null, estimatedCostUsd: null };
    }

    const payload = await response.json() as {
      model?: string;
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error("missing content");
    const intent = parseAiSearchStructuredIntent(JSON.parse(content));
    const inputTokens = Number.isFinite(payload.usage?.prompt_tokens) ? Number(payload.usage?.prompt_tokens) : null;
    const outputTokens = Number.isFinite(payload.usage?.completion_tokens) ? Number(payload.usage?.completion_tokens) : null;
    const estimatedCostUsd = inputTokens === null || outputTokens === null
      ? null
      : Number((inputTokens * INPUT_USD_PER_TOKEN + outputTokens * OUTPUT_USD_PER_TOKEN).toFixed(8));

    return { intent, status: "success", model: payload.model ?? PRIMARY_MODEL, latencyMs, inputTokens, outputTokens, estimatedCostUsd };
  } catch (error) {
    return {
      intent: null,
      status: error instanceof DOMException && error.name === "AbortError" ? "timeout" : "invalid_response",
      model: null,
      latencyMs: Date.now() - startedAt,
      inputTokens: null,
      outputTokens: null,
      estimatedCostUsd: null,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function verifyGatewayAiSearch(): Promise<AiSearchGatewayResult> {
  return requestGatewaySearchIntent({ query: "Toyota Corolla 2015 or newer in Kabul under 500000 AFN", locale: "en" });
}
