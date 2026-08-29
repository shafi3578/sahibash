import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { parseAiSearchStructuredIntent } from "@/lib/ai/search-intent-schema";
import { localizeFilterLabel, localizeFilterOptionLabel } from "@/lib/i18n/filter-labels";

const root = process.cwd();
const read = (...parts: string[]) => readFileSync(join(root, ...parts), "utf8");
const flags = read("lib", "ai", "feature-flags.ts");
const flagAction = read("lib", "actions", "ai-feature-flags.ts");
const searchPage = read("app", "search", "page.tsx");
const quickPost = read("components", "posting", "QuickPostForm.tsx");
const createPage = read("app", "post-ad", "create", "page.tsx");
const categoryRoute = read("app", "api", "ai", "category-suggestion", "route.ts");
const legacyRoute = read("app", "api", "posting", "suggest-category", "route.ts");
const telemetry = read("lib", "search", "telemetry.ts");
const searchGateway = read("lib", "ai", "search-gateway.ts");
const searchInterpreter = read("lib", "ai", "search-interpreter.ts");
const migration = read("supabase", "migrations", "20260829162134_search_first_ai_release.sql");

test("AI search schema rejects invented fields and invalid numeric ranges", () => {
  assert.deepEqual(parseAiSearchStructuredIntent({ query: "Corolla", maxPrice: 500000, confidence: 0.9 }), {
    query: "Corolla",
    maxPrice: 500000,
    confidence: 0.9,
  });
  assert.throws(() => parseAiSearchStructuredIntent({ sql: "select *", confidence: 1 }), /Unsupported/);
  assert.throws(() => parseAiSearchStructuredIntent({ minPrice: 10, maxPrice: 1, confidence: 1 }), /inverted/);
  assert.throws(() => parseAiSearchStructuredIntent({ confidence: 2 }), /invalid/);
});

test("legacy search filters and option captions are localized without changing stored values", () => {
  assert.equal(localizeFilterLabel("vehicle_model", "Model", "fa"), "مدل موتر");
  assert.equal(localizeFilterLabel("vehicle_model", "Model", "ps"), "د موټر ماډل");
  assert.equal(localizeFilterOptionLabel("Automatic", "Automatic", "fa"), "اتومات");
  assert.equal(localizeFilterOptionLabel("Automatic", "Automatic", "ps"), "اتومات");
  assert.equal(localizeFilterOptionLabel("Toyota", "Toyota", "fa"), "Toyota");
});

test("one server-only flag source fails closed and keeps public clients away from the table", () => {
  assert.match(flags, /import "server-only"/);
  assert.match(flags, /ai_search_enabled/);
  assert.match(flags, /ai_posting_category_suggestions_enabled/);
  assert.match(flags, /ai_posting_image_detection_enabled/);
  assert.match(flags, /aiSearchEnabled: false/);
  assert.match(flags, /createSupabaseAdmin/);

  assert.match(migration, /feature_flags_public_read/);
  assert.match(migration, /revoke all on table public\.feature_flags from anon, authenticated/);
  assert.match(migration, /private\.is_aal2\(\)/);
  assert.match(migration, /'ai\.configure'/);
  assert.match(migration, /guard_feature_flag_mutation/);
});

test("AI feature mutations require RBAC, AAL2-backed RLS, Gateway verification, and audit", () => {
  assert.match(flagAction, /requirePermission\("ai\.configure"\)/);
  assert.match(flagAction, /verifyGatewayAiSearch\(\)/);
  assert.match(flagAction, /verification\.status !== "success"/);
  assert.match(flagAction, /recordAuditEvent/);
  assert.match(flagAction, /AI_FEATURE_FLAG_UPDATED/);
  assert.match(flagAction, /audit-failed/);
});

test("normal search is default and never enters the AI interpreter without explicit AI mode", () => {
  assert.match(searchPage, /rawParams\.mode === "ai"/);
  assert.match(searchPage, /const aiParsed = aiRequested[\s\S]*interpretAiSearch/);
  assert.match(searchPage, /name="mode" value="normal"/);
  assert.match(searchPage, /aiFlags\.aiSearchEnabled \? \(/);
  assert.match(searchPage, /name="mode" value="ai"/);
  assert.match(searchPage, /getFilterDefinitionsForNode\(effectiveCategoryNodeId, locale\)/);
  assert.doesNotMatch(searchPage, /bg-gradient-to-br from-indigo-50/);
  assert.match(searchPage, /broadenedAiFallback/);
  assert.match(searchPage, /zero_result_category_broadened/);
  assert.match(
    searchPage,
    /\.\.\.listingFilters,\s*categoryNodeId: undefined,\s*categoryScope: undefined/,
    "category broadening must retain exact model, price, location, and other interpreted filters"
  );
});

test("AI Gateway failures, invalid responses, low confidence, and rate limits fall back deterministically", () => {
  assert.match(searchGateway, /"missing_token"/);
  assert.match(searchGateway, /"timeout"/);
  assert.match(searchGateway, /"invalid_response"/);
  assert.match(searchGateway, /parseAiSearchStructuredIntent/);
  assert.match(searchInterpreter, /if \(!gateway\.intent\)/);
  assert.match(searchInterpreter, /gateway\.intent\.confidence < 0\.45/);
  assert.match(searchInterpreter, /fallbackReason: "low_confidence"/);
  assert.match(searchInterpreter, /gatewayStatus: "rate_limited"/);
  assert.match(searchInterpreter, /getCategoryNodeByPath\(intent\.categoryPath\)/);
  assert.match(searchInterpreter, /matchAfghanistanLocationRows/);
});

test("posting AI is dormant by default in both UI and server routes", () => {
  assert.match(createPage, /getAiFeatureFlags\(\)/);
  assert.match(createPage, /postingCategorySuggestionsEnabled=\{aiFlags\.postingCategorySuggestionsEnabled\}/);
  assert.match(quickPost, /postingCategorySuggestionsEnabled = false/);
  assert.match(quickPost, /postingImageDetectionEnabled = false/);
  assert.match(quickPost, /if \(!postingCategorySuggestionsEnabled\) return/);
  assert.match(quickPost, /postingImageDetectionEnabled && images\[0\]/);
  assert.match(quickPost, /postingCategorySuggestionsEnabled \? "quick-post-ai-chips" : "quick-post-category"/);
  for (const route of [categoryRoute, legacyRoute]) {
    const flagCheck = route.indexOf("postingCategorySuggestionsEnabled");
    const rateLimit = route.indexOf("consumeRateLimit({");
    assert.ok(flagCheck >= 0 && rateLimit > flagCheck, "feature flag must be checked before rate limiting or model work");
  }
});

test("AI telemetry is privacy-safe and server-written with operational metrics", () => {
  assert.match(telemetry, /createSupabaseAdmin\(\)/);
  assert.match(telemetry, /raw_query_hash/);
  assert.match(telemetry, /gateway_status/);
  assert.match(telemetry, /estimated_cost_usd/);
  assert.doesNotMatch(telemetry, /raw_query:\s*args\.rawQuery/);
  assert.match(migration, /revoke insert on table public\.ai_search_parse_events from anon, authenticated/);
});
