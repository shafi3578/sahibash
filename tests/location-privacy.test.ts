import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

import { sanitizePublicLocation } from "../lib/location/privacy";
import { applyPublicLocationVisibility } from "../lib/location/public-query";

const finalHardeningMigration = readFileSync(
  join(process.cwd(), "supabase", "migrations", "20260824201724_final_step1_security_location_hardening.sql"),
  "utf8",
);

test("public location RPCs match public feed visibility and redact owner identities", () => {
  const sql = readFileSync(join(process.cwd(), "supabase", "migrations", "20260916082613_public_location_listing_visibility_boundary.sql"), "utf8");
  assert.equal((sql.match(/where l\.status = 'approved'::public\.listing_status/g) ?? []).length, 2);
  assert.equal((sql.match(/l\.price > 0/g) ?? []).length, 2);
  assert.equal((sql.match(/l\.expires_at is null or l\.expires_at > now\(\)/g) ?? []).length, 2);
  assert.equal((sql.match(/null::uuid as user_id/g) ?? []).length, 2);
  assert.doesNotMatch(sql, /listing_status::public\.listing_status|security definer|grant execute/i);
});

test("public location sanitizer hides coordinates for private visibility levels", () => {
  const hidden = sanitizePublicLocation({
    location_visibility: "province_district",
    latitude: 34.534567,
    longitude: 69.123456,
    address_text: "Exact street",
  });

  assert.equal(hidden.latitude, null);
  assert.equal(hidden.longitude, null);
  assert.equal(hidden.address_text, null);
});

test("public location sanitizer exposes only deterministic coarse approximate coordinates", () => {
  const approximate = sanitizePublicLocation({
    location_visibility: "approximate",
    latitude: 34.534567,
    longitude: 69.123456,
    address_text: "Exact street",
  });

  assert.equal(approximate.latitude, 34.53);
  assert.equal(approximate.longitude, 69.12);
  assert.equal(approximate.address_text, null);
});

test("missing or invalid coordinates never become a false zero coordinate", () => {
  for (const visibility of ["exact", "approximate"]) {
    for (const value of [null, undefined, Number.NaN, Number.POSITIVE_INFINITY, "", " ", false]) {
      const result = sanitizePublicLocation({
        location_visibility: visibility,
        latitude: value as number | null | undefined,
        longitude: value as number | null | undefined,
      });
      assert.equal(result.latitude, null);
      assert.equal(result.longitude, null);
    }
    assert.equal(sanitizePublicLocation({ location_visibility: visibility, latitude: 0 }).latitude, 0);
  }
});

test("public location helper avoids random offsets that can be averaged into exact points", () => {
  const locationActions = readFileSync(join(process.cwd(), "lib", "actions", "location.ts"), "utf8");

  assert.match(locationActions, /sanitizePublicLocation/);
  assert.doesNotMatch(locationActions, /Math\.random\(\)/);
});

test("public location queries enforce every visibility boundary before service-role reads", async () => {
  let requestedUrl: URL | undefined;
  const supabase = createClient("https://location-query-test.supabase.co", "test-key", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: async (input) => {
        requestedUrl = new URL(String(input));
        return new Response("[]", { status: 200, headers: { "Content-Type": "application/json" } });
      },
    },
  });

  const { error } = await applyPublicLocationVisibility(
    supabase.from("listings").select("id,category:category_id!inner(is_active,is_coming_soon)"),
    new Date("2026-09-16T12:00:00.000Z"),
  ).limit(50);

  assert.equal(error, null);
  assert.ok(requestedUrl);
  assert.equal(requestedUrl.searchParams.get("status"), "eq.approved");
  assert.equal(requestedUrl.searchParams.get("price"), "gt.0");
  assert.equal(requestedUrl.searchParams.get("removed_public_at"), "is.null");
  assert.equal(requestedUrl.searchParams.get("category.is_active"), "eq.true");
  assert.equal(requestedUrl.searchParams.get("category.is_coming_soon"), "eq.false");
  // Separate OR clauses are ANDed: publication, freshness, and expiry must all pass.
  assert.deepEqual(requestedUrl.searchParams.getAll("or"), [
    "(publication_status.is.null,publication_status.eq.published)",
    "(freshness_status.is.null,freshness_status.not.in.(expired,source_missing,sold_confirmed))",
    "(expires_at.is.null,expires_at.gt.2026-09-16T12:00:00.000Z)",
  ]);
});

test("all public location actions apply the boundary and reject caller-selected private status", () => {
  const actions = readFileSync(join(process.cwd(), "lib", "actions", "location.ts"), "utf8");
  const readActions = ["getNearbyListings", "getListingsByLocation", "getListingLocationInfo"];
  for (const [index, action] of readActions.entries()) {
    const start = actions.indexOf(`export async function ${action}(`);
    const end = index + 1 < readActions.length
      ? actions.indexOf(`export async function ${readActions[index + 1]}(`)
      : actions.length;
    assert.ok(start >= 0);
    const definition = actions.slice(start, end);
    assert.match(definition, /applyPublicLocationVisibility\(supabase/);
    assert.match(definition, /category:category_id!inner\(is_active,is_coming_soon\)/);
    assert.match(definition, /sanitizePublicLocation\(/);
    assert.doesNotMatch(definition, /filters\??\.status/);
  }

  const locationInfo = actions.slice(actions.indexOf("export async function getListingLocationInfo("));
  assert.match(locationInfo, /\.maybeSingle\(\)/);
  assert.match(locationInfo, /if \(!data\)\s*\{\s*return null;/);
});

test("public location RPCs share deterministic coordinate privacy", () => {
  const nearbyDefinition = finalHardeningMigration.slice(
    finalHardeningMigration.indexOf("create or replace function public.get_nearby_listings"),
    finalHardeningMigration.indexOf("create or replace function public.get_listings_by_location"),
  );
  const byLocationDefinition = finalHardeningMigration.slice(
    finalHardeningMigration.indexOf("create or replace function public.get_listings_by_location"),
    finalHardeningMigration.indexOf("revoke all on function public.get_nearby_listings"),
  );

  assert.match(finalHardeningMigration, /create or replace function public\.sanitize_public_listing_coordinate/i);
  assert.match(finalHardeningMigration, /visibility = 'exact'::public\.location_visibility then coordinate/i);
  assert.match(finalHardeningMigration, /visibility = 'approximate'::public\.location_visibility then round\(coordinate \* 100\) \/ 100/i);
  assert.match(finalHardeningMigration, /else null::numeric/i);
  assert.doesNotMatch(finalHardeningMigration, /random\(\)/i);

  for (const definition of [nearbyDefinition, byLocationDefinition]) {
    assert.match(definition, /sanitize_public_listing_coordinate\(l\.latitude::numeric, l\.location_visibility\)/i);
    assert.match(definition, /sanitize_public_listing_coordinate\(l\.longitude::numeric, l\.location_visibility\)/i);
    assert.match(definition, /p\.public_latitude/i);
    assert.match(definition, /p\.public_longitude/i);
  }
});
