import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const migration = readFileSync(
  join(process.cwd(), "supabase", "migrations", "20260824190249_step1_marketplace_foundation_repair.sql"),
  "utf8",
);
const registerForm = readFileSync(join(process.cwd(), "components", "auth", "register-form.tsx"), "utf8");
const authActions = readFileSync(join(process.cwd(), "lib", "actions", "auth.ts"), "utf8");
const profileActions = readFileSync(join(process.cwd(), "lib", "actions", "profile.ts"), "utf8");
const accountSettingsPage = readFileSync(join(process.cwd(), "app", "dashboard", "settings", "account", "page.tsx"), "utf8");
const postAdForm = readFileSync(join(process.cwd(), "app", "post-ad", "post-ad-form.tsx"), "utf8");
const postAdCreatePage = readFileSync(join(process.cwd(), "app", "post-ad", "create", "page.tsx"), "utf8");
const listingActions = readFileSync(join(process.cwd(), "lib", "actions", "listings.ts"), "utf8");
const inventoryActions = readFileSync(join(process.cwd(), "lib", "actions", "inventory.ts"), "utf8");
const categoryHomeList = readFileSync(join(process.cwd(), "components", "categories", "CategoryHomeList.tsx"), "utf8");
const categoryBrowser = readFileSync(join(process.cwd(), "components", "categories", "CategoryBrowser.tsx"), "utf8");
const simpleDetails = readFileSync(join(process.cwd(), "lib", "posting", "simple-category-details.ts"), "utf8");
const realEstateSchema = readFileSync(join(process.cwd(), "lib", "listingSchemas", "realEstate.ts"), "utf8");
const queries = readFileSync(join(process.cwd(), "lib", "data", "queries.ts"), "utf8");
const authModule = readFileSync(join(process.cwd(), "lib", "auth.ts"), "utf8");
const mfaAuthorizationModule = readFileSync(join(process.cwd(), "lib", "auth", "mfa-authorization.ts"), "utf8");

test("signup and account profile require profile-owned Afghanistan contact details", () => {
  assert.match(registerForm, /dict\.auth\.mobilePhone/);
  assert.match(registerForm, /normalizeAfghanistanPhone\(phone\)/);
  assert.match(registerForm, /preferred_language: locale/);
  assert.match(authActions, /normalizeAfghanistanPhone/);
  assert.match(authActions, /preferred_language: preferredLanguage/);
  assert.match(profileActions, /updateAccountProfileAction/);
  assert.match(profileActions, /\.from\("profiles"\)\s*\.\s*update\(payload\)/);
  assert.match(accountSettingsPage, /Seller profile|پروفایل فروشنده|د پلورونکي پروفایل/);
});

test("native posting and editing use profile contact instead of ad-level free text", () => {
  assert.match(postAdCreatePage, /\.from\("profiles"\)[\s\S]*\.select\("full_name, phone"\)/);
  assert.match(postAdForm, /sellerProfile/);
  assert.match(postAdForm, /profileContactTitle/);
  assert.match(postAdForm, /localizePath\("\/dashboard\/settings\/account"/);
  assert.doesNotMatch(postAdForm, /updateCore\("contact_phone"/);
  assert.doesNotMatch(postAdForm, /updateCore\("contact_name"/);
  assert.match(listingActions, /resolveNativeSellerContact/);
  assert.match(listingActions, /contact_phone: sellerContact\.phone/);
  assert.match(listingActions, /contact_name: sellerContact\.fullName/);
});

test("phone reveal resolves native profile phone and keeps external listing fallback", () => {
  assert.match(inventoryActions, /function resolveRevealPhone/);
  assert.match(inventoryActions, /\.from\("profiles"\)[\s\S]*\.select\("phone"\)/);
  assert.match(inventoryActions, /contactSource: "profile_phone"/);
  assert.match(inventoryActions, /source_listing_phone/);
  assert.match(inventoryActions, /contact_source: contactSource/);
});

test("category navigation opens localized root browsers", () => {
  assert.match(categoryHomeList, /localizePath\(`\/categories\/\$\{category\.slug\}`/);
  assert.doesNotMatch(categoryHomeList, /fallbackName: category\.slug === "mobile-phones-tablets" \? "Phones & Electronics"/);
  assert.match(categoryBrowser, /localizePath\(`\/search\?categoryNodeId=\$\{node\.id\}&scope=subtree`/);
  assert.match(categoryBrowser, /localizePath\(`\/categories\/\$\{item\.slug\}\?node=\$\{item\.id\}`/);
});

test("land units and dorm student filters are first-class and category-aware", () => {
  assert.match(simpleDetails, /optionValues\(\["sqm", "biswa", "jerib"\]\)/);
  assert.match(simpleDetails, /student\|dormitory\|hostel[\s\S]*return "dormitory"/);
  assert.match(realEstateSchema, /area_original_value/);
  assert.match(realEstateSchema, /area_sqm/);
  assert.match(queries, /paymentPeriod\?: string/);
  assert.match(queries, /roomType\?: string/);
  assert.match(queries, /numberOfBedsMin\?: number/);
  assert.match(queries, /applyAttributeTextFilter\("payment_period", filters\?\.paymentPeriod\)/);
  assert.match(queries, /applyAttributeNumberFilter\("number_of_beds", filters\?\.numberOfBedsMin/);
  assert.match(queries, /applyAttributeNumberFilter\("area_sqm", filters\?\.minLandSize, filters\?\.maxLandSize\)/);
});

test("Step 1 migration repairs taxonomy, land fields, public counts, and nearby privacy", () => {
  assert.match(migration, /alter column preferred_language set default 'fa'::public\.language_code/i);
  assert.match(migration, /create or replace function public\.handle_new_user\(\)/i);
  assert.match(migration, /set name = 'Vehicles'/i);
  assert.match(migration, /phones-electronics\/%/i);
  assert.match(migration, /mobile-phones-tablets\/mobile-phones\/samsung/i);
  assert.match(migration, /real-estate\/house-for-sale/i);
  assert.match(migration, /f\.field_key in \([\s\S]*'rooms'[\s\S]*'parking'/i);
  assert.match(migration, /'payment_period', 'Payment Period'/i);
  assert.match(migration, /create or replace function public\.get_category_tree_counts/i);
  assert.match(migration, /c\.is_coming_soon = false/i);
  assert.match(migration, /round\(l\.latitude::numeric \* 100\) \/ 100/i);
  assert.doesNotMatch(migration.slice(migration.indexOf("create or replace function public.get_nearby_listings")), /random\(\)/i);
  assert.match(migration, /revoke all on function public\.get_nearby_listings/i);
});

test("privileged admin writes require MFA through the shared permission gate", () => {
  assert.match(authModule, /requiresPrivilegedMfa\(permission\)/);
  assert.match(mfaAuthorizationModule, /function requiresPrivilegedMfa/);
  assert.match(mfaAuthorizationModule, /!permission\.endsWith\("\.view"\)/);
  assert.match(authModule, /await requireVerifiedAuthenticatorAssurance\(supabase\)/);
});
