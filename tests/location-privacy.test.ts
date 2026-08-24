import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { sanitizePublicLocation } from "../lib/location/privacy";

const finalHardeningMigration = readFileSync(
  join(process.cwd(), "supabase", "migrations", "20260824201724_final_step1_security_location_hardening.sql"),
  "utf8",
);

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

test("public location helper avoids random offsets that can be averaged into exact points", () => {
  const locationActions = readFileSync(join(process.cwd(), "lib", "actions", "location.ts"), "utf8");

  assert.match(locationActions, /sanitizePublicLocation/);
  assert.doesNotMatch(locationActions, /Math\.random\(\)/);
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
