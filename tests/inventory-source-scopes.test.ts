import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  detectTelegramSourceScope,
  summarizeTelegramSourceScopes,
} from "../lib/inventory/source-scope";

const repoRoot = process.cwd();
const sourceScopeAction = readFileSync(
  path.join(repoRoot, "lib/actions/inventory-source-scopes.ts"),
  "utf8",
);

test("detects a source-specific Telegram scope from a source item id", () => {
  assert.deepEqual(detectTelegramSourceScope({
    source_item_id: "Online_car_trading:1307125",
    normalized_payload: {},
  }), {
    username: "Online_car_trading",
    slug: "telegram-online_car_trading",
    scopeIdentifier: "@Online_car_trading",
    displayName: "@Online_car_trading",
    sourceUrl: "https://t.me/Online_car_trading",
  });
});

test("prefers explicit public-post provenance over fallback identifiers", () => {
  const scope = detectTelegramSourceScope({
    source_item_id: "FallbackChannel:99",
    normalized_payload: {
      public_post_username: "VerifiedChannel",
      source_url: "https://t.me/AnotherChannel/42",
    },
  });
  assert.equal(scope?.scopeIdentifier, "@VerifiedChannel");
});

test("detects public t.me links but rejects private, malformed and numeric-only records", () => {
  assert.equal(detectTelegramSourceScope({
    source_item_id: "685",
    normalized_payload: { source_url: "https://t.me/CarshoponlineHerat1/519469" },
  })?.slug, "telegram-carshoponlineherat1");
  assert.equal(detectTelegramSourceScope({
    source_item_id: "685",
    normalized_payload: { source_url: "https://t.me/+privateInviteToken" },
  }), null);
  assert.equal(detectTelegramSourceScope({ source_item_id: "685", normalized_payload: {} }), null);
  assert.equal(detectTelegramSourceScope({
    source_item_id: "685",
    normalized_payload: { source_url: "http://t.me/PublicChannel/10" },
  }), null);
});

test("summarizes detected source scopes without mixing channels", () => {
  const summaries = summarizeTelegramSourceScopes([
    { source_item_id: "Online_car_trading:1" },
    { normalized_payload: { source_url: "https://t.me/Online_car_trading/2" } },
    { source_item_id: "CarshoponlineHerat1:3" },
    { source_item_id: "4" },
  ]);
  assert.deepEqual(summaries.map(({ scopeIdentifier, candidateCount }) => ({ scopeIdentifier, candidateCount })), [
    { scopeIdentifier: "@Online_car_trading", candidateCount: 2 },
    { scopeIdentifier: "@CarshoponlineHerat1", candidateCount: 1 },
  ]);
});

test("source separation remains super-admin, AAL2 and audit protected", () => {
  assert.match(sourceScopeAction, /requireSuperAdministrator\(\)/);
  assert.match(sourceScopeAction, /LISTING_SOURCE_SCOPE_DISCOVERY_STARTED/);
  assert.match(sourceScopeAction, /LISTING_SOURCE_SCOPE_DISCOVERY_COMPLETED/);
  assert.match(sourceScopeAction, /rights_verified:\s*false/);
});

test("source separation cannot publish or rewrite listing content", () => {
  assert.doesNotMatch(sourceScopeAction, /publication_status/);
  assert.doesNotMatch(sourceScopeAction, /status:\s*["']published["']/);
  assert.doesNotMatch(sourceScopeAction, /\.from\(["']listings["']\)/);
  assert.doesNotMatch(sourceScopeAction, /title\s*:/);
  assert.doesNotMatch(sourceScopeAction, /description\s*:/);
});
