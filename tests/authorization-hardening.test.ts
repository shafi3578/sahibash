import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { SCHEMA_BUILDER_COPY } from "@/lib/i18n/schema-builder-copy";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase",
    "migrations",
    "20260805044513_harden_roles_and_listing_promotions.sql",
  ),
  "utf8",
);

const rlsHelperMigration = readFileSync(
  join(
    process.cwd(),
    "supabase",
    "migrations",
    "20260805045848_restore_guarded_rls_helpers.sql",
  ),
  "utf8",
);

const advisorHardeningMigration = readFileSync(
  join(
    process.cwd(),
    "supabase",
    "migrations",
    "20260805050645_database_advisor_hardening.sql",
  ),
  "utf8",
);

const listingActions = readFileSync(
  join(process.cwd(), "lib", "actions", "listings.ts"),
  "utf8",
);

const listingSchemaActions = readFileSync(
  join(process.cwd(), "lib", "actions", "listing-schema.ts"),
  "utf8",
);

const authModule = readFileSync(
  join(process.cwd(), "lib", "auth.ts"),
  "utf8",
);

const stepUpAuthModule = readFileSync(
  join(process.cwd(), "lib", "auth", "step-up.ts"),
  "utf8",
);

const schemaCategoryNavigator = readFileSync(
  join(process.cwd(), "app", "admin", "listing-schema", "category-navigator.tsx"),
  "utf8",
);

const aiCategoryRoute = readFileSync(
  join(process.cwd(), "app", "api", "ai", "category-suggestion", "route.ts"),
  "utf8",
);

const postingSuggestCategoryRoute = readFileSync(
  join(process.cwd(), "app", "api", "posting", "suggest-category", "route.ts"),
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

test("public RLS helper is callable but cannot inspect another identity", () => {
  assert.match(rlsHelperMigration, /uid = \(select auth\.uid\(\)\)/i);
  assert.match(rlsHelperMigration, /grant execute on function public\.is_admin\(uuid\) to anon, authenticated, service_role/i);
  assert.match(rlsHelperMigration, /set search_path = ''/i);
});

test("database advisor hardening pins function paths and covers foreign keys", () => {
  const fixedPaths = advisorHardeningMigration.match(/set search_path = public, pg_temp/gi) ?? [];
  const coveringIndexes = advisorHardeningMigration.match(/create index if not exists/gi) ?? [];
  assert.equal(fixedPaths.length, 19);
  assert.equal(coveringIndexes.length, 27);
  assert.match(advisorHardeningMigration, /drop index if exists public\.idx_listings_category_node_id/i);
  assert.doesNotMatch(advisorHardeningMigration, /delete\s+from|truncate\s+/i);
});

test("schema builder category activation is super-admin-only and audited", () => {
  const statusAction = listingSchemaActions.slice(
    listingSchemaActions.indexOf("export async function updateSchemaCategoryStatusAction"),
  );

  assert.match(statusAction, /await requireSuperAdministrator\(\)/);
  assert.match(statusAction, /Number\.isInteger\(categoryNodeId\)/);
  assert.match(statusAction, /\.from\("category_nodes"\)/);
  assert.match(statusAction, /current\.parent_id === null/);
  assert.match(statusAction, /\.from\("categories"\)/);
  assert.match(statusAction, /action: "CATEGORY_UPDATED"/);
  assert.match(statusAction, /source: "listing_schema_builder"/);
  assert.match(schemaCategoryNavigator, /action=\{updateSchemaCategoryStatusAction\}/);
  assert.match(schemaCategoryNavigator, /copy\.deactivate/);
  assert.match(schemaCategoryNavigator, /copy\.activate/);
  assert.equal(SCHEMA_BUILDER_COPY.en.deactivate, "Deactivate category");
  assert.equal(SCHEMA_BUILDER_COPY.en.activate, "Activate category");
});

test("authorization step-up does not trust user-editable metadata", () => {
  assert.doesNotMatch(stepUpAuthModule, /user_metadata/i);
  assert.match(stepUpAuthModule, /last_sign_in_at/);
});

test("super administrator gates require a verified current MFA assurance level", () => {
  const superAdminGate = authModule.slice(authModule.indexOf("export async function requireSuperAdministrator"));

  assert.match(authModule, /getAuthenticatorAssuranceLevel\(\)/);
  assert.match(authModule, /data\?\.currentLevel !== "aal2"/);
  assert.match(superAdminGate, /rpc\("is_super_administrator"/);
  assert.match(superAdminGate, /await requireFreshPrimaryAuthentication\(user\)/);
  assert.match(superAdminGate, /await requireVerifiedAuthenticatorAssurance\(supabase\)/);
});

test("paid AI category inference requires a user and bounds uploaded input", () => {
  assert.match(aiCategoryRoute, /if \(!user\)/);
  assert.match(aiCategoryRoute, /status: 401/);
  assert.match(aiCategoryRoute, /MAX_IMAGE_BYTES = 10 \* 1024 \* 1024/);
  assert.match(aiCategoryRoute, /MAX_IMAGE_URL_LENGTH = 2048/);
  assert.match(aiCategoryRoute, /image\.type\.startsWith\("image\/"\)/);
  assert.match(aiCategoryRoute, /url\.protocol !== "https:"/);
  assert.match(aiCategoryRoute, /title\.length > 120/);
  assert.match(aiCategoryRoute, /description\.length > 5000/);
  assert.match(aiCategoryRoute, /AI suggestions are temporarily unavailable/);
  assert.doesNotMatch(
    aiCategoryRoute.slice(aiCategoryRoute.indexOf("if (!key)"), aiCategoryRoute.indexOf("const formData")),
    /HUGGINGFACE_API_KEY/,
  );
  assert.doesNotMatch(aiCategoryRoute, /error instanceof Error \? error\.message/);
});

test("posting category suggestion API is authenticated and bounded", () => {
  assert.match(postingSuggestCategoryRoute, /supabase\.auth\.getUser\(\)/);
  assert.match(postingSuggestCategoryRoute, /if \(!user\)/);
  assert.match(postingSuggestCategoryRoute, /status: 401/);
  assert.match(postingSuggestCategoryRoute, /MAX_TITLE_LENGTH = 120/);
  assert.match(postingSuggestCategoryRoute, /MAX_DESCRIPTION_LENGTH = 5000/);
  assert.match(postingSuggestCategoryRoute, /MAX_PHOTO_URLS = 12/);
  assert.match(postingSuggestCategoryRoute, /MAX_PHOTO_URL_LENGTH = 2048/);
  assert.match(postingSuggestCategoryRoute, /url\.protocol !== "https:"/);
  assert.doesNotMatch(postingSuggestCategoryRoute, /console\.error\("Category suggestion error:", error\)/);
});
