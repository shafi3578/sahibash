import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  containsPublicFixtureMarker,
  shouldBlockPublicFixtureListing,
} from "../lib/listings/fixture-guard";

test("production fixture guard detects only obvious engineering listings", () => {
  assert.equal(containsPublicFixtureMarker({ title: "FIXPASS vehicle smoke test" }), true);
  assert.equal(containsPublicFixtureMarker({ title: "Admin test house in Kabul" }), true);
  assert.equal(containsPublicFixtureMarker({ title: "Family house in Kabul", description: "Near school and market" }), false);
});

test("production fixture guard is active only in production runtime", () => {
  const listing = { title: "E2E smoke test apartment" };

  assert.equal(shouldBlockPublicFixtureListing(listing, { VERCEL_ENV: "production" }), true);
  assert.equal(shouldBlockPublicFixtureListing(listing, { VERCEL_ENV: "preview" }), false);
  assert.equal(shouldBlockPublicFixtureListing(listing, { SAHIBASH_ENV: "production" }), true);
});

test("listing creation and approval paths call the production fixture guard", () => {
  const listingActions = readFileSync(join(process.cwd(), "lib", "actions", "listings.ts"), "utf8");
  const createAction = listingActions.slice(
    listingActions.indexOf("export async function createListingAction"),
    listingActions.indexOf("export async function updateListingAction"),
  );
  const statusAction = listingActions.slice(listingActions.indexOf("export async function updateListingStatusAction"));

  assert.match(createAction, /shouldBlockPublicFixtureListing\(createdListing\.payload\)/);
  assert.match(statusAction, /status === "approved"/);
  assert.match(statusAction, /shouldBlockPublicFixtureListing\(listing\)/);
});
