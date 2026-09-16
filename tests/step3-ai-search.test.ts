import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { parseSahibashAiSearch } from "@/lib/ai/search-parser";
import { buildShadowModerationSuggestion } from "@/lib/ai/moderation-core";
import { requestSearchGateway, type AiSearchGatewayFailureReason } from "@/lib/ai/search-gateway-request";
import { buildAiSearchIntentContract, buildAiSearchIntentInstructions, parseAiSearchStructuredIntent } from "@/lib/ai/search-intent-schema";

const root = process.cwd();
const telemetry = readFileSync(join(root, "lib", "search", "telemetry.ts"), "utf8");
const searchPage = readFileSync(join(root, "app", "search", "page.tsx"), "utf8");
const listingAssistant = readFileSync(join(root, "components", "listings", "listing-ai-assistant.tsx"), "utf8");
const listingActions = readFileSync(join(root, "lib", "actions", "listings.ts"), "utf8");
const shadowModerationRecorder = readFileSync(join(root, "lib", "ai", "moderation.ts"), "utf8");
const shadowModerationMigration = readFileSync(
  join(root, "supabase", "migrations", "20260825103528_connect_ai_shadow_moderation_to_operations.sql"),
  "utf8"
);

const gatewayInput = { query: "Toyota Corolla in Kabul", locale: "en" as const, userId: "private-fixture-user" };
const mockGatewayOptions = (fetch: typeof globalThis.fetch) => ({ token: "private-fixture-token", environment: "test", fetch });
function completion(content: unknown, choice: Record<string, unknown> = {}) {
  return {
    model: "mistral/mistral-small", usage: { prompt_tokens: 100, completion_tokens: 20 },
    choices: [{ finish_reason: "stop", message: { content }, ...choice }],
  };
}
function mockGatewayResponse(body: unknown, status = 200): typeof fetch {
  return async () => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

test("AI search prompt and validator share all optional, null, enum, length, and numeric constraints", () => {
  const contract = buildAiSearchIntentContract();
  const instructions = buildAiSearchIntentInstructions();
  assert.equal(contract.additionalProperties, false);
  assert.deepEqual(contract.required, ["confidence"]);
  assert.ok(instructions.includes(JSON.stringify(contract)));
  assert.match(instructions, /minPrice <= maxPrice, yearMin <= yearMax, and minLandSize <= maxLandSize/);
  assert.match(instructions, /never quoted strings/);
  const properties = contract.properties as Record<string, {
    type: string | string[]; enum?: (string | null)[]; maxLength?: number; minimum?: number; maximum?: number;
  }>;
  assert.equal(Object.keys(properties).length, 20);
  for (const [key, rule] of Object.entries(properties)) {
    if (key !== "confidence") {
      assert.ok(Array.isArray(rule.type) && rule.type.includes("null"), key);
      assert.deepEqual(parseAiSearchStructuredIntent({ confidence: 0.8, [key]: null }), { confidence: 0.8 });
    }
    if (rule.maxLength !== undefined) {
      assert.doesNotThrow(() => parseAiSearchStructuredIntent({ confidence: 0.8, [key]: "a".repeat(rule.maxLength!) }));
      assert.throws(() => parseAiSearchStructuredIntent({ confidence: 0.8, [key]: "a".repeat(rule.maxLength! + 1) }));
    }
    if (rule.enum) {
      for (const value of rule.enum) assert.doesNotThrow(() => parseAiSearchStructuredIntent({ confidence: 0.8, [key]: value }));
      assert.throws(() => parseAiSearchStructuredIntent({ confidence: 0.8, [key]: "invented-value" }));
    }
    if (rule.minimum !== undefined && rule.maximum !== undefined) {
      for (const value of [rule.minimum, rule.maximum]) assert.doesNotThrow(() => parseAiSearchStructuredIntent({ confidence: 0.8, [key]: value }));
      for (const value of [rule.minimum - 1, rule.maximum + 1, String(rule.minimum)]) {
        assert.throws(() => parseAiSearchStructuredIntent({ confidence: 0.8, [key]: value }));
      }
    }
  }
  assert.throws(() => parseAiSearchStructuredIntent({ confidence: null }));
  assert.throws(() => parseAiSearchStructuredIntent({ confidence: 0.8, unexpected: true }));
});

test("AI Gateway missing credentials do not send a request", async () => {
  let called = false;
  const result = await requestSearchGateway(gatewayInput, { fetch: async () => { called = true; throw new Error("must not fetch"); } });
  assert.equal(called, false);
  assert.equal(result.status, "missing_token");
  assert.equal(result.failureReason, "missing_token");
  assert.equal(result.latencyMs, 0);
});

test("AI Gateway mocked success keeps models, routing, token budget, costs and safe user attribution", async () => {
  const intent = { query: "Corolla", province: "Kabul", vehicleBrand: "Toyota", district: null, confidence: 0.9 };
  const result = await requestSearchGateway(gatewayInput, mockGatewayOptions(async (url, init) => {
    assert.equal(url, "https://ai-gateway.vercel.sh/v1/chat/completions");
    assert.equal(init?.method, "POST");
    assert.equal(new Headers(init?.headers).get("authorization"), "Bearer private-fixture-token");
    assert.ok(init?.signal instanceof AbortSignal);
    const body = JSON.parse(String(init?.body));
    assert.equal(body.model, "mistral/mistral-small");
    assert.deepEqual(body.models, ["openai/gpt-5-nano"]);
    assert.equal(body.max_completion_tokens, 350);
    assert.equal(body.temperature, 0);
    assert.deepEqual(body.response_format, { type: "json_object" });
    assert.match(body.providerOptions.gateway.user, /^[a-f0-9]{24}$/);
    assert.deepEqual(body.providerOptions.gateway.tags, ["feature:ai-search", "env:test"]);
    assert.equal(body.messages[0].content, buildAiSearchIntentInstructions());
    assert.deepEqual(JSON.parse(body.messages[1].content), { locale: "en", query: gatewayInput.query });
    assert.doesNotMatch(String(init?.body), /private-fixture-user|private-fixture-token/);
    return new Response(JSON.stringify(completion(JSON.stringify(intent))));
  }));
  assert.equal(result.status, "success");
  assert.equal(result.failureReason, null);
  assert.deepEqual(result.intent, { query: "Corolla", province: "Kabul", vehicleBrand: "Toyota", confidence: 0.9 });
  assert.equal(result.inputTokens, 100);
  assert.equal(result.outputTokens, 20);
  assert.equal(result.estimatedCostUsd, 0.000016);
});

test("AI Gateway HTTP rejections retain their distinct status without leaking the body", async () => {
  for (const status of [400, 401, 402, 429, 503]) {
    const result = await requestSearchGateway(gatewayInput, mockGatewayOptions(mockGatewayResponse({ error: "private-provider-body" }, status)));
    assert.equal(result.status, `http_${status}`);
    assert.equal(result.failureReason, `http_${status}`);
    assert.equal(result.intent, null);
    assert.doesNotMatch(JSON.stringify(result), /private-/);
  }
});

test("AI Gateway classifies refusal, truncation, envelope, JSON and schema failures while retaining usage", async () => {
  const valid = JSON.stringify({ confidence: 0.9, query: "Corolla" });
  const cases: Array<[AiSearchGatewayFailureReason, unknown]> = [
    ["envelope", { ...completion(valid), choices: [] }],
    ["envelope", completion(null)],
    ["envelope", completion([{ text: "private-provider-body" }])],
    ["refusal", completion(null, { message: { refusal: "private-provider-body" } })],
    ["refusal", completion(valid, { finish_reason: "content_filter" })],
    ["truncated", completion(valid, { finish_reason: "length" })],
    ["invalid_json", completion("private-provider-body{")],
    ["schema", completion(JSON.stringify({ confidence: 0.9, listingType: "sale", query: "private-provider-body" }))],
    ["schema", completion(JSON.stringify({ confidence: 0.9, unexpected: "private-provider-body" }))],
  ];
  for (const [reason, body] of cases) {
    const result = await requestSearchGateway(gatewayInput, mockGatewayOptions(mockGatewayResponse(body)));
    assert.equal(result.status, "invalid_response", reason);
    assert.equal(result.failureReason, reason);
    assert.equal(result.intent, null);
    assert.equal(result.model, "mistral/mistral-small");
    assert.equal(result.inputTokens, 100);
    assert.equal(result.outputTokens, 20);
    assert.equal(result.estimatedCostUsd, 0.000016);
    assert.doesNotMatch(JSON.stringify(result), /private-/);
  }
});

test("AI Gateway distinguishes offline transport, timeout and malformed outer envelope safely", async () => {
  const cases: Array<[AiSearchGatewayFailureReason, typeof fetch]> = [
    ["network", async () => { throw new TypeError("private-network-error"); }],
    ["timeout", async () => { throw new DOMException("private-timeout-error", "AbortError"); }],
    ["envelope", async () => new Response("private-malformed-envelope")],
    ["envelope", mockGatewayResponse(null)],
    ["envelope", mockGatewayResponse([])],
  ];
  for (const [reason, fetch] of cases) {
    const result = await requestSearchGateway(gatewayInput, mockGatewayOptions(fetch));
    assert.equal(result.status, reason === "timeout" ? "timeout" : "invalid_response");
    assert.equal(result.failureReason, reason);
    assert.equal(result.model, null);
    assert.equal(result.inputTokens, null);
    assert.equal(result.outputTokens, null);
    assert.doesNotMatch(JSON.stringify(result), /private-/);
  }
});

test("AI Gateway rejects unsafe metadata and routes classified reasons into existing fallback telemetry", async () => {
  const result = await requestSearchGateway(gatewayInput, mockGatewayOptions(mockGatewayResponse({
    ...completion("private-invalid-json"), model: "private provider text with spaces",
    usage: { prompt_tokens: -1, completion_tokens: "20" },
  })));
  assert.equal(result.failureReason, "invalid_json");
  assert.equal(result.model, null);
  assert.equal(result.inputTokens, null);
  assert.equal(result.outputTokens, null);
  assert.equal(result.estimatedCostUsd, null);
  assert.doesNotMatch(JSON.stringify(result), /private/);
  const interpreter = readFileSync(join(root, "lib/ai/search-interpreter.ts"), "utf8");
  assert.match(interpreter, /fallbackReason: gateway\.failureReason \?\? gateway\.status/);
  assert.match(interpreter, /if \(!gateway\.intent\) \{\s*return \{\s*\.\.\.deterministic/);
  assert.match(telemetry, /fallback_reason: normalizeNullableFilter\(args\.fallbackReason\)/);
});

test("Sahibash AI parses Corolla in Kabul under 400000 into deterministic filters", () => {
  const parsed = parseSahibashAiSearch("a Corolla in Kabul under 400000", "en");
  assert.ok(parsed);
  assert.equal(parsed.params.q, "Corolla");
  assert.equal(parsed.params.vehicleBrand, "Toyota");
  assert.equal(parsed.params.vehicleModel, "Corolla");
  assert.equal(parsed.params.province, "Kabul");
  assert.equal(parsed.params.maxPrice, "400000");
  assert.equal(parsed.params.currency, "AFN");
  assert.ok(parsed.chips.some((chip) => chip.value === "Corolla"));
  assert.ok(parsed.chips.some((chip) => chip.value.includes("400,000")));
});

test("Sahibash AI keeps numeric constraints exact and does not fuzzy-broaden years", () => {
  const parsed = parseSahibashAiSearch("2012 corola in kabul under 400000", "en");
  assert.ok(parsed);
  assert.equal(parsed.params.yearMin, "2012");
  assert.equal(parsed.params.yearMax, "2012");
  assert.notEqual(parsed.params.yearMin, "2021");
  assert.equal(parsed.params.maxPrice, "400000");
});

test("Sahibash AI supports Dari/Pashto province and product hints", () => {
  const dari = parseSahibashAiSearch("کرولا در کابل زیر ۴۰۰۰۰۰ افغانی", "fa");
  assert.ok(dari);
  assert.equal(dari.params.vehicleModel, "Corolla");
  assert.equal(dari.params.province, "Kabul");
  assert.equal(dari.params.maxPrice, "400000");

  const pashto = parseSahibashAiSearch("Corolla په کابل کې تر 400000 کم", "ps");
  assert.ok(pashto);
  assert.equal(pashto.params.vehicleModel, "Corolla");
  assert.equal(pashto.params.province, "Kabul");
});

test("AI parse telemetry stores a hash and interpreted filters, not raw query text", () => {
  assert.match(telemetry, /raw_query_hash/);
  assert.match(telemetry, /createHash\("sha256"\)/);
  assert.match(telemetry, /interpreted_filters/);
  assert.doesNotMatch(telemetry, /raw_query:\s*args\.rawQuery/);
  assert.match(searchPage, /aiFlags\.aiSearchEnabled/);
  assert.doesNotMatch(searchPage, /name="mode" value="normal"/);
  assert.match(searchPage, /name="mode" value="ai"/);
  assert.match(searchPage, /logAiSearchParseTelemetry/);
});

test("deterministic AI fallback supports Afghanistan price, year, room, and land units", () => {
  const lakh = parseSahibashAiSearch("house with 3 rooms under 5 lakh in Kabul", "en");
  assert.ok(lakh);
  assert.equal(lakh.params.maxPrice, "500000");
  assert.equal(lakh.params.minRooms, "3");

  const newer = parseSahibashAiSearch("Toyota Corolla 2015 or newer", "en");
  assert.ok(newer);
  assert.equal(newer.params.yearMin, "2015");
  assert.equal(newer.params.yearMax, undefined);

  const jerib = parseSahibashAiSearch("2 jerib agricultural land for sale", "en");
  assert.ok(jerib);
  assert.equal(jerib.params.minLandSize, "4000");
  assert.equal(jerib.params.maxLandSize, "4000");

  const biswa = parseSahibashAiSearch("زمین 5 بسوه برای فروش", "fa");
  assert.ok(biswa);
  assert.equal(biswa.params.minLandSize, "500");

  const iphone = parseSahibashAiSearch("iPhone 15 Pro in Kabul", "en");
  assert.ok(iphone);
  assert.equal(iphone.params.q, "iPhone 15 Pro");
  assert.equal(iphone.params.phoneModel, "iPhone 15 Pro");
  assert.equal(iphone.params.vehicleBrand, undefined);
  assert.equal(iphone.params.vehicleModel, undefined);
});

test("listing AI assistant is factual-only and does not call an LLM", () => {
  assert.match(listingAssistant, /Factual answers only|فقط پاسخ‌های واقعی|یوازې د اعلان/);
  assert.match(listingAssistant, /Not mentioned in this listing|در این اعلان ذکر نشده|په دې اعلان کې نه دي یاد شوي/);
  assert.doesNotMatch(listingAssistant, /HUGGINGFACE_API_KEY|generateText|fetch\(/);
});

test("AI moderation is shadow-first and non-blocking", () => {
  const clean = buildShadowModerationSuggestion({
    listingId: "00000000-0000-4000-8000-000000000000",
    title: "Toyota Corolla 2012 clean car",
    description: "Clean family car with documents, photos, location, and maintenance details available for buyers.",
    price: 390000,
    categoryPath: "vehicles/cars/toyota/corolla",
  });
  assert.equal(clean.mode, "shadow");
  assert.equal(clean.decision_suggestion, "approve");

  const blocked = buildShadowModerationSuggestion({
    listingId: "00000000-0000-4000-8000-000000000001",
    title: "Fake document",
    description: "fake document service",
    price: 5000,
    categoryPath: "services",
  });
  assert.equal(blocked.decision_suggestion, "block");
  assert.ok(blocked.reason_codes.some((code) => code.startsWith("prohibited_term")));

  assert.match(listingActions, /recordShadowModerationReview/);
});

test("AI shadow moderation persists into operational moderation surfaces without auto-rejecting", () => {
  assert.match(shadowModerationRecorder, /ai_moderation_reviews/);
  assert.match(shadowModerationRecorder, /listing_risk_signals/);
  assert.match(shadowModerationRecorder, /listing_quality_signals/);
  assert.match(shadowModerationRecorder, /moderation_workflow_entries/);
  assert.match(shadowModerationRecorder, /entity_uuid:\s*input\.listingId/);
  assert.match(shadowModerationRecorder, /source:\s*"ai_shadow_moderation"/);
  assert.match(shadowModerationRecorder, /decision_suggestion !== "approve"/);
  assert.doesNotMatch(shadowModerationRecorder, /\.from\("listings"\)\.update|status:\s*"rejected"|to_status:\s*"rejected"/);
  assert.match(shadowModerationRecorder, /catch \{[\s\S]*never block the seller posting path/);

  assert.match(shadowModerationMigration, /add column if not exists entity_uuid uuid/);
  assert.match(shadowModerationMigration, /add column if not exists metadata jsonb/);
  assert.match(shadowModerationMigration, /idx_moderation_workflow_entries_entity_uuid/);
});
