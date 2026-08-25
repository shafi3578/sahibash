import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { parseSahibashAiSearch } from "@/lib/ai/search-parser";
import { buildShadowModerationSuggestion } from "@/lib/ai/moderation-core";

const root = process.cwd();
const telemetry = readFileSync(join(root, "lib", "search", "telemetry.ts"), "utf8");
const searchPage = readFileSync(join(root, "app", "search", "page.tsx"), "utf8");
const listingAssistant = readFileSync(join(root, "components", "listings", "listing-ai-assistant.tsx"), "utf8");
const listingActions = readFileSync(join(root, "lib", "actions", "listings.ts"), "utf8");

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
  assert.match(searchPage, /Find It With Sahibash AI|با هوش صاحبش پیدا کن|له صاحبش AI سره/);
  assert.match(searchPage, /logAiSearchParseTelemetry/);
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
