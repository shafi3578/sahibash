import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  containsPublicFixtureMarker,
  shouldBlockPublicFixtureListing,
} from "../lib/listings/fixture-guard";
import { assertNonProductionSupabaseFixtureTarget } from "../lib/testing/production-fixture-guard";

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

test("live Auth fixtures reject the production project even with test overrides", () => {
  const projectRef = "sbtzkniuquewrtctsdpy";
  assert.throws(() => assertNonProductionSupabaseFixtureTarget(`https://${projectRef}.supabase.co`, {
    SAHIBASH_ENV: "test",
    SAHIBASH_TEST_SUPABASE_PROJECT_REF: projectRef,
    RUN_LIVE_SUPABASE_MFA_E2E: "1",
  }), /production Supabase project/);
  for (const key of ["VERCEL_ENV", "SAHIBASH_ENV", "NODE_ENV"]) {
    assert.throws(() => assertNonProductionSupabaseFixtureTarget("http://127.0.0.1:54321", {
      [key]: "production",
    }), /forbidden in production/);
  }
});

test("live Auth fixtures allow only local or explicitly confirmed remote test projects", () => {
  const projectRef = "abcdefghijklmnopqrst";
  const url = `https://${projectRef}.supabase.co`;
  const env = { SAHIBASH_ENV: "test", SAHIBASH_TEST_SUPABASE_PROJECT_REF: projectRef };
  assert.doesNotThrow(() => assertNonProductionSupabaseFixtureTarget("http://127.0.0.1:54321", {}));
  assert.doesNotThrow(() => assertNonProductionSupabaseFixtureTarget(url, env));
  assert.throws(() => assertNonProductionSupabaseFixtureTarget(url, {}));
  assert.throws(() => assertNonProductionSupabaseFixtureTarget(url, { ...env, SAHIBASH_TEST_SUPABASE_PROJECT_REF: "different-project" }));
  for (const unsafeUrl of [
    "https://custom-supabase.example.com", `http://${projectRef}.supabase.co`,
    `${url}:8443`, `${url}/auth`, `${url}?project=production`, `${url}#production`,
    "http://user:password@localhost:54321", "http://127.0.0.1:54321/proxy", "not-a-url",
  ]) {
    assert.throws(() => assertNonProductionSupabaseFixtureTarget(unsafeUrl, env));
  }
});

test("live MFA checks the resolved target before creating any Supabase client or user", () => {
  const source = readFileSync(join(process.cwd(), "tests", "live-mfa-e2e.test.ts"), "utf8");
  const guard = source.indexOf("assertNonProductionSupabaseFixtureTarget(url, env)");
  const client = source.indexOf("createClient(url,");
  const createUser = source.indexOf("admin.auth.admin.createUser(");
  assert.ok(guard > source.indexOf("const env = { ...readLocalEnv(), ...process.env }"));
  assert.ok(client > guard && createUser > client);
});
