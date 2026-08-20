import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildListingShareOutput } from "../lib/liquidity/share";
import { sanitizeWantedFilters, wantedCopy } from "../lib/liquidity/wanted";

const migration = readFileSync("supabase/migrations/20260820134015_step2_liquidity_foundation.sql", "utf8");

test("Step 2 migration creates demand, wanted, scout, organization, and share foundations with RLS", () => {
  for (const table of [
    "wanted_requests",
    "wanted_request_matches",
    "demand_signals",
    "seller_lead_summaries",
    "organizations",
    "organization_members",
    "scout_submissions",
    "listing_share_outputs",
  ]) {
    assert.match(migration, new RegExp(`create table if not exists public\\.${table}`, "i"));
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`, "i"));
  }

  assert.match(migration, /create or replace view public\.admin_supply_gap_cells\s+with \(security_invoker = true\)/i);
  assert.match(migration, /find_it_for_me/i);
  assert.match(migration, /seller_claim_value_preview/i);
});

test("wanted filters are allow-listed and bounded", () => {
  const params = new URLSearchParams({
    q: "corolla",
    province: "Kabul",
    categoryNodeId: "123",
    unsafe: "should-drop",
    token: "secret",
  });
  const filters = sanitizeWantedFilters(params);
  assert.deepEqual(filters, { q: "corolla", province: "Kabul", categoryNodeId: "123" });
});

test("wanted request copy is localized", () => {
  assert.equal(wantedCopy("en").title, "Find It For Me");
  assert.match(wantedCopy("fa").title, /پیدا/);
  assert.match(wantedCopy("ps").title, /پیدا/);
});

test("share output uses channel-specific UTM and does not invent specs", () => {
  const output = buildListingShareOutput(
    { id: "48e5816c-40e4-4317-83f9-b8267e5790b9", title: "Toyota Corolla", price: 850000, currency: "AFN", province: "Kabul" },
    "en",
    "whatsapp",
    "https://sahibash-three.vercel.app"
  );

  assert.match(output.shareUrl, /utm_source=whatsapp/);
  assert.match(output.shareText, /Toyota Corolla/);
  assert.doesNotMatch(output.shareText, /guaranteed|verified accident free/i);
});

test("Step 2 migration separates leads from transaction outcomes", () => {
  assert.match(migration, /seller_lead_summaries/i);
  assert.match(migration, /phone_reveal_count/i);
  assert.match(migration, /whatsapp_click_count/i);
  assert.doesNotMatch(migration, /sale_confirmed_count|guaranteed_sale/i);
});
