import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { formatListingPrice } from "@/lib/listings/price-display";

const quickPostForm = readFileSync(join(process.cwd(), "components", "posting", "QuickPostForm.tsx"), "utf8");
const createPage = readFileSync(join(process.cwd(), "app", "post-ad", "create", "page.tsx"), "utf8");
const listingActions = readFileSync(join(process.cwd(), "lib", "actions", "listings.ts"), "utf8");
const listingQueries = readFileSync(join(process.cwd(), "lib", "data", "queries.ts"), "utf8");
const listingValidator = readFileSync(join(process.cwd(), "lib", "validators", "listing.ts"), "utf8");
const listingCard = readFileSync(join(process.cwd(), "components", "listing-card.tsx"), "utf8");
const listingDetail = readFileSync(join(process.cwd(), "app", "listings", "[id]", "page.tsx"), "utf8");
const homePage = readFileSync(join(process.cwd(), "app", "page.tsx"), "utf8");
const featuredPage = readFileSync(join(process.cwd(), "app", "featured", "page.tsx"), "utf8");
const detailSpecs = readFileSync(join(process.cwd(), "lib", "listings", "detailSpecs.ts"), "utf8");

test("consumer create page defaults to the two-step Quick Post but preserves the standard form", () => {
  assert.match(createPage, /import QuickPostForm/);
  assert.match(createPage, /posting === "standard" \? "standard" : "quick"/);
  assert.match(createPage, /initialMode === "quick"/);
  assert.match(createPage, /<QuickPostForm/);
  assert.match(createPage, /<PostAdForm/);
});

test("Quick Post is exactly two required steps and preserves existing draft/publish systems", () => {
  for (const marker of [
    "type QuickStep = 1 | 2",
    'data-testid="quick-post-step-indicator"',
    'data-testid="quick-post-form"',
    'data-testid="quick-post-photos"',
    'data-testid="quick-post-description"',
    'data-testid="quick-post-price"',
    'data-testid="quick-post-location"',
    'data-testid="quick-post-ai-chips"',
    'data-testid="quick-post-advanced-details"',
    'data-testid="quick-post-review"',
    'name="contact_for_price"',
    'name="rahn_gerawy_enabled"',
    'name="suitable_for_students"',
    "saveListingDraftAction",
    "getMyActiveDraftAction",
    "createListingAction",
    "uploadListingImageAction",
    "/api/ai/category-suggestion",
    "parseSmartPostingText",
    "posting_mode",
    "price_mode",
    "publish_request_id",
    "draft_id",
  ]) {
    assert.match(quickPostForm, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(quickPostForm, /onClick=\{goToStepTwo\}/);
  assert.match(quickPostForm, /\{c\.continue\}/);
  assert.match(quickPostForm, /step === 1 \? c\.stepOne : c\.stepTwo/);
  assert.doesNotMatch(quickPostForm, /type QuickStep = 1 \| 2 \| 3/);
});

test("Step 1 collects universal seller information without category blocking", () => {
  const stepOneGuard = quickPostForm.slice(
    quickPostForm.indexOf("function validateStepOneBeforeContinue"),
    quickPostForm.indexOf("function goToStepTwo")
  );

  assert.match(stepOneGuard, /description\.trim\(\)\.length < 20/);
  assert.match(stepOneGuard, /contactForPrice/);
  assert.match(stepOneGuard, /selectedProvinceId/);
  assert.match(stepOneGuard, /locationConfirmed/);
  assert.doesNotMatch(stepOneGuard, /missingCategory/);
});

test("Quick Post restores and autosaves complete local/server drafts with a 1-second debounce", () => {
  for (const marker of [
    "QUICK_DRAFT_KEY",
    "QUICK_IMAGE_DB_NAME",
    "publishRequestId",
    "selectedCategory",
    "aiResponse",
    "smartSuggestion",
    "damageParts",
    "locationSource",
    "locationVisibility",
    "locationAccuracy",
    "isConfirmed",
    "lastServerDraftSignatureRef",
    "window.setTimeout",
    "}, 1000)",
    "saveCurrentDraftNow(2)",
  ]) {
    assert.match(quickPostForm, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("Quick Post resolves AI suggestions against canonical taxonomy instead of arbitrary IDs", () => {
  assert.match(quickPostForm, /\.from\("category_nodes"\)/);
  assert.match(quickPostForm, /\.eq\("is_active", true\)/);
  assert.match(quickPostForm, /suggestedProduct\?\.categoryNodeId/);
  assert.match(quickPostForm, /scoreCategoryNode/);
  assert.match(quickPostForm, /categoryCandidates\.slice\(0, 4\)/);
  assert.match(quickPostForm, /setSelectedCategory\(candidate\)/);
  assert.doesNotMatch(quickPostForm, /formData\.set\("category_node_id",\s*ai/i);
});

test("Quick Post supports professional item location without exposing device GPS by default", () => {
  for (const marker of [
    "handleUseCurrentLocation",
    "navigator.geolocation.getCurrentPosition",
    "LocationMapPicker",
    "locationSource",
    "locationVisibility",
    "privacyApproximate",
    "province_district",
    "hidden",
    "formData.set(\"location_visibility\", locationVisibility)",
    "formData.set(\"is_location_confirmed\", locationConfirmed ? \"true\" : \"false\")",
  ]) {
    assert.match(quickPostForm, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("Quick Post restores car-only 2D damage reporting and buyer detail visibility", () => {
  for (const marker of [
    "VehicleDamageDiagram",
    "defaultVehicleDamageParts",
    "isQuickPostCarDamageCategory",
    'data-testid="quick-post-car-damage"',
    "damage_parts_json",
    "damage_all_original",
  ]) {
    assert.match(quickPostForm, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(listingActions, /persistVehicleDamage\(supabase, data\.id, formData\)/);
  assert.match(listingDetail, /VehicleDamageCard/);
  assert.match(listingDetail, /vehicleDamageCardParts/);
});

test("Quick Post exposes only Step 2 launch roots and maps unsupported item detections into second-hand", () => {
  assert.match(quickPostForm, /const CATEGORY_ROOTS = \[[\s\S]*"vehicles",[\s\S]*"real-estate",[\s\S]*"mobile-phones-tablets",[\s\S]*"second-hand-items",[\s\S]*\] as const/);
  assert.match(quickPostForm, /normalizeQuickPostRootSlug/);
  assert.match(quickPostForm, /rootSlug === "electronics-computers" \|\| rootSlug === "home-furniture-appliances"/);
  assert.match(listingActions, /"second-hand-items"/);
});

test("server validation relaxes configured required details only for quick mode", () => {
  assert.match(listingValidator, /priceModeEnum/);
  assert.match(listingValidator, /price_mode/);
  assert.match(listingValidator, /price.*nonnegative/);
  assert.match(listingValidator, /unless contact-for-price is selected/);
  assert.match(listingActions, /function isQuickPostingMode/);
  assert.match(listingActions, /field\.required === true && values\.length === 0 && !quickMode/);
  assert.match(listingActions, /field\.required && !value && !quickMode/);
});

test("Quick Post persists category-specific metadata for detail/search without duplicate listing rows", () => {
  for (const marker of [
    "persistQuickPostMetaAttributes",
    "dormitory_fee",
    "monthly_rent",
    "gerawy_amount",
    "land_lease_price",
    "areaSize",
    "areaUnit",
    "students_per_room",
    "suitable_for_students",
    "onConflict: \"listing_id,attribute_key\"",
  ]) {
    assert.match(listingActions, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(listingActions, /isDormitory = \/dormitory\|student\|hostel\//);
  assert.match(listingActions, /isDormitory \|\| \(isRentListing && explicitSuitable\)/);
});

test("Quick Post publish is idempotent through the existing listing draft", () => {
  for (const marker of [
    "getExistingQuickPublishedListingId",
    "markQuickDraftPublished",
    "readQuickPublishedListingId",
    ".from(\"listing_drafts\")",
    ".eq(\"user_id\", userId)",
    "status: \"published\"",
    "published_listing_id",
    "publishRequestId",
  ]) {
    assert.match(listingActions, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("Quick Post preserves photo drafts and normalizes short publish titles", () => {
  for (const marker of [
    "QUICK_IMAGE_DB_NAME",
    "persistQuickPostImages(images)",
    "loadQuickPostImages()",
    "clearQuickPostImages()",
    "buildSuggestedQuickPostTitle",
    "normalizeTitleCandidate",
    "maxLength={120}",
    "descriptionRequirement",
    "titleTooShort",
  ]) {
    assert.match(quickPostForm, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("listing cards and detail pages use contextual price display", () => {
  assert.match(listingCard, /formatListingPrice\(listing, locale, attributes\)/);
  assert.match(listingDetail, /formatListingPrice\(listing, locale, attributeMap\)/);
  assert.match(homePage, /formatListingPrice\(listing, locale\)/);
  assert.match(featuredPage, /formatListingPrice\(listing, locale\)/);
  assert.match(detailSpecs, /formatListingPrice\(listing, locale\)/);

  const contact = formatListingPrice({ price: 0, currency: "AFN", listing_attributes: [{ attribute_key: "price_mode", attribute_value_text: "contact" }] }, "en");
  assert.equal(contact, "Contact for price");

  const dormitory = formatListingPrice({
    price: 2500,
    currency: "AFN",
    listing_attributes: [
      { attribute_key: "price_mode", attribute_value_text: "dormitory_fee" },
      { attribute_key: "dormitory_fee", attribute_value_number: 2500 },
      { attribute_key: "payment_period", attribute_value_text: "monthly" },
    ],
  }, "en");
  assert.equal(dormitory, "Dorm fee: 2,500 AFN / month");

  const gerawy = formatListingPrice({
    price: 200000,
    currency: "AFN",
    listing_attributes: [
      { attribute_key: "price_mode", attribute_value_text: "gerawy_rahn" },
      { attribute_key: "gerawy_amount", attribute_value_number: 200000 },
      { attribute_key: "monthly_rent", attribute_value_number: 3000 },
    ],
  }, "en");
  assert.equal(gerawy, "Gerawy/Rahn: 200,000 AFN + 3,000 AFN");
});

test("contact-for-price sentinel is excluded from public price filters and price sorting", () => {
  assert.match(listingQueries, /hasPriceBoundaryFilter/);
  assert.match(listingQueries, /hasPriceSort/);
  assert.match(listingQueries, /shouldExcludeContactPriceSentinel/);
  assert.match(listingQueries, /studentQuery = studentQuery\.gt\("price", 0\)/);
  assert.match(listingQueries, /realEstateQuery = realEstateQuery\.gt\("price", 0\)/);
  assert.match(listingQueries, /query = query\.gt\("price", 0\)/);
});
