import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { sanitizePublicLocation } from "../lib/location/privacy";

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
