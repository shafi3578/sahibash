import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase",
    "migrations",
    "20260805043957_harden_roles_and_listing_promotions.sql",
  ),
  "utf8",
);

const listingActions = readFileSync(
  join(process.cwd(), "lib", "actions", "listings.ts"),
  "utf8",
);

test("authenticated users cannot insert profiles or update authorization columns", () => {
  assert.match(migration, /revoke insert, update on table public\.profiles from anon, authenticated/i);
  assert.match(migration, /grant update \([\s\S]*preferred_language[\s\S]*\) on public\.profiles to authenticated/i);
  assert.doesNotMatch(
    migration.match(/grant update \([\s\S]*?\) on public\.profiles to authenticated/i)?.[0] ?? "",
    /\brole\b/i,
  );
  assert.match(migration, /drop policy if exists profiles_insert_own/i);
});

test("exactly one restricted owner listing update policy is installed", () => {
  assert.match(migration, /drop policy if exists listings_update_owner_or_admin/i);
  assert.match(migration, /and featured = false/i);
  assert.match(migration, /and urgent = false/i);
  assert.match(migration, /and approved_by is null/i);
  assert.match(migration, /and approved_at is null/i);
});

test("seller promotion actions cannot write featured or urgent flags", () => {
  const featuredAction = listingActions.slice(
    listingActions.indexOf("export async function toggleListingFeaturedAction"),
    listingActions.indexOf("export async function toggleListingUrgentAction"),
  );
  const urgentAction = listingActions.slice(
    listingActions.indexOf("export async function toggleListingUrgentAction"),
  );

  assert.doesNotMatch(featuredAction, /\.update\(\{\s*featured/i);
  assert.doesNotMatch(urgentAction, /\.update\(\{\s*urgent/i);
});
