import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { formatListingPrice } from "@/lib/listings/price-display";
import { mapSignalsToCategory } from "@/lib/ai/category-mapping";

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
const aiRoute = readFileSync(join(process.cwd(), "app", "api", "ai", "category-suggestion", "route.ts"), "utf8");
const aiGateway = readFileSync(join(process.cwd(), "lib", "ai", "gateway.ts"), "utf8");

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
    'data-testid="quick-post-title-description"',
    'data-testid="quick-post-description"',
    'data-testid="quick-post-price"',
    'data-testid="quick-post-location"',
    '"quick-post-category"',
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

test("Quick Post protects local work without continuously server-saving while typing", () => {
  for (const marker of [
    "QUICK_DRAFT_KEY",
    "QUICK_IMAGE_DB_NAME",
    "publishRequestId",
    "selectedCategory",
    "rootTouched",
    "aiResponse",
    "smartSuggestion",
    "damageParts",
    "locationSource",
    "locationVisibility",
    "locationAccuracy",
    "isConfirmed",
    'window.addEventListener("pagehide"',
    'navigator.sendBeacon(',
    '"/api/posting/draft"',
    "saveCurrentDraftNow(2)",
    "saveDraftAndExit",
    "userEditedDuringHydrationRef",
  ]) {
    assert.match(quickPostForm, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  const localPersistenceEffect = quickPostForm.slice(
    quickPostForm.indexOf("localStorage.setItem(quickDraftKey"),
    quickPostForm.indexOf('window.addEventListener("pagehide"'),
  );
  assert.doesNotMatch(localPersistenceEffect, /saveListingDraftAction/);
  assert.doesNotMatch(quickPostForm, /}, 1000\)/);
  assert.match(quickPostForm, /hasLocalRecovery \|\| userEditedDuringHydrationRef\.current/);
  assert.match(quickPostForm, /setRootTouched\(readDraftBoolean\(local\.rootTouched\) \|\| Boolean\(localCategory\?\.id && localCategory\?\.path\)\)/);
  assert.match(quickPostForm, /setRootTouched\(readDraftBoolean\(serverDetails\.rootTouched\) \|\| Boolean\(serverSelectedCategory\?\.id && serverSelectedCategory\?\.path\)\)/);
  const stepTransition = quickPostForm.slice(
    quickPostForm.indexOf("function goToStepTwo"),
    quickPostForm.indexOf("function goBackToStepOne"),
  );
  assert.doesNotMatch(stepTransition, /saveCurrentDraftNow|saveListingDraftAction|router\.refresh/);
  assert.match(quickPostForm, /const checkpoint = await saveCurrentDraftNow\(step\)/);
  assert.match(quickPostForm, /if \(!checkpoint\.persisted\)/);
  assert.match(quickPostForm, /window\.localStorage\.removeItem\(quickDraftKey\);[\s\S]*router\.push/);
  assert.match(quickPostForm, /const savedDraftId = checkpoint\.draftId/);
});

test("local posting recovery is isolated per authenticated account", () => {
  assert.match(createPage, /draftOwnerId=\{user\?\.id \?\? null\}/);
  assert.match(quickPostForm, /const draftOwnerScope = draftOwnerId \|\| "guest"/);
  assert.match(quickPostForm, /quickDraftStorageKey\(draftOwnerScope\)/);
  assert.match(quickPostForm, /loadQuickPostImages\(draftOwnerScope\)/);
  assert.match(quickPostForm, /persistQuickPostImages\(images, draftOwnerScope\)/);
  assert.match(quickPostForm, /image\.ownerScope === ownerScope/);
  assert.doesNotMatch(quickPostForm, /localStorage\.getItem\(QUICK_DRAFT_KEY\)/);
  assert.doesNotMatch(quickPostForm, /localStorage\.setItem\(QUICK_DRAFT_KEY/);
  assert.doesNotMatch(quickPostForm, /objectStore\(QUICK_IMAGE_STORE\)\.clear\(\)/);
});

test("Quick Post localizes category-specific labels without changing canonical stored option values", () => {
  assert.match(quickPostForm, /const QUICK_FIELD_LABELS/);
  assert.match(quickPostForm, /const QUICK_OPTION_LABELS/);
  assert.match(quickPostForm, /quickFieldLabel\(locale, field\)/);
  assert.match(quickPostForm, /value=\{option\}>\{quickOptionLabel\(locale, option\)\}/);
  assert.match(quickPostForm, /detected: "صاحبش تشخیص داد"/);
  assert.match(quickPostForm, /make: \{ fa: "برند \/ سازنده", ps: "برانډ \/ جوړوونکی" \}/);
  assert.match(quickPostForm, /Automatic: \{ fa: "اتومات", ps: "اتومات" \}/);
});

test("Quick Post resolves AI suggestions against canonical taxonomy instead of arbitrary IDs", () => {
  assert.match(quickPostForm, /\.from\("category_nodes"\)/);
  assert.match(quickPostForm, /\.eq\("is_active", true\)/);
  assert.match(quickPostForm, /json\.suggestions/);
  assert.match(quickPostForm, /manualChildren/);
  assert.match(quickPostForm, /candidate\.is_leaf/);
  assert.match(quickPostForm, /setSelectedCategory\(candidate\)/);
  assert.match(quickPostForm, /if \(!selectedCategoryPath\?\.startsWith\(nextRoot\)\) setSelectedCategory\(null\)/);
  assert.doesNotMatch(quickPostForm, /formData\.set\("category_node_id",\s*ai/i);
});

test("Quick Post AI uses Vercel OIDC safely and degrades to deterministic matching", () => {
  assert.match(aiGateway, /AI_GATEWAY_API_KEY \?\? process\.env\.VERCEL_OIDC_TOKEN/);
  assert.match(aiGateway, /mistral\/mistral-small/);
  assert.match(aiGateway, /models: \["openai\/gpt-5-nano"\]/);
  assert.match(aiGateway, /feature:category-suggest/);
  assert.match(aiGateway, /createHash\("sha256"\)\.update\(input\.userId\)/);
  assert.match(aiGateway, /15_000/);
  assert.doesNotMatch(aiGateway, /reasoning_effort/);
  assert.match(aiGateway, /max_completion_tokens: 512/);
  assert.match(aiGateway, /status: `http_\$\{response\.status\}`/);
  assert.match(aiGateway, /input\.allowedPaths\.includes\(path\)/);
  assert.match(aiRoute, /preliminarySuggestion/);
  assert.match(aiRoute, /const preliminaryRoot = preliminarySuggestion\?\.pathSlugs\?\.\[0\]/);
  assert.match(aiRoute, /path\.startsWith\(`\$\{preliminaryRoot\}\//);
  assert.match(aiRoute, /image instanceof File && key/);
  assert.match(aiRoute, /gatewaySuggestions\.length > 0 \? "gateway" : "deterministic"/);
  assert.match(aiRoute, /mappedCandidate && mappedCandidate\.confidence >= 0\.8/);
  assert.match(aiRoute, /\[mappedCandidate, \.\.\.gatewayCandidates\]/);
  assert.match(aiRoute, /seenCandidatePaths/);
  assert.match(aiRoute, /leafCategoryId/);
  assert.match(aiRoute, /pathIds/);
  assert.match(aiRoute, /gatewayModel: gatewayResult\.model/);
  assert.match(aiRoute, /\.slice\(0, 3\)/);
  assert.doesNotMatch(aiRoute, /if \(!key\) \{\s*return NextResponse/);
});

test("deterministic AI fallback resolves common multilingual signals to active leaf paths", () => {
  const cases = [
    ["Hyundai Elantra 2019", "النترا کم کار", "vehicles/cars/hyundai/elantra"],
    ["Nissan Patrol 2015", "نیسان پترول", "vehicles/cars/nissan/patrol"],
    ["Apple iPad tablet", "Used tablet, not a phone", "mobile-phones-tablets/tablets"],
    ["آپارتمان مبله برای کرایه", "خانه اپارتمانی با وسایل", "real-estate/apartments/furnished-apartment"],
    ["کرنیزه ځمکه د خرڅلاو لپاره", "Agricultural land for sale", "real-estate/land/for-sale/agricultural-land"],
    ["Used Dell laptop", "Second hand computer notebook", "second-hand-items/electronics-computers/laptops"],
    ["Solar panels 550W", "Used photovoltaic panels", "second-hand-items/electronics-computers/solar-power-equipment/solar-panels"],
    ["Samsung Galaxy S23", "Mobile phone in good condition", "mobile-phones-tablets/mobile-phones/samsung"],
  ] as const;

  for (const [title, description, expected] of cases) {
    const result = mapSignalsToCategory({ title, description, labels: [], specsMatch: null });
    assert.equal(result?.pathSlugs.join("/"), expected);
  }
});

test("Quick Post invalidates stale AI suggestions after materially editing Step 1", () => {
  assert.match(quickPostForm, /const aiResponseSignatureRef = useRef\(""\)/);
  assert.match(quickPostForm, /if \(!aiCacheRef\.current\.has\(aiSignature\) && aiResponseSignatureRef\.current !== aiSignature\) \{\s*setAiResponse\(null\);\s*setCategoryCandidates\(\[\]\);\s*setAiStatus\("working"\);\s*\}/);
  assert.match(quickPostForm, /aiResponseSignatureRef\.current = signature;\s*setAiResponse\(json\)/);
});

test("Quick Post deduplicates in-flight AI requests for the same Step 1 signature", () => {
  assert.match(quickPostForm, /const aiInFlightRef = useRef<Map<string, Promise<AiResponse \| null>>>\(new Map\(\)\)/);
  assert.match(quickPostForm, /let request = aiInFlightRef\.current\.get\(signature\)/);
  assert.match(quickPostForm, /aiInFlightRef\.current\.set\(signature, request\)/);
  assert.match(quickPostForm, /aiInFlightRef\.current\.delete\(signature\)/);
  assert.match(quickPostForm, /if \(!response\.ok\)/);
});

test("Quick Post tracks suggested detail provenance and preserves seller edits", () => {
  for (const marker of [
    "managedSuggestedDetailsRef",
    "userEditedDetailKeysRef",
    "applySuggestedDetails",
    "reconcileSuggestedDetails",
    "managedSuggestedDetails",
    "userEditedDetailKeys",
    "reconcileDetailsForCategoryChange",
  ]) {
    assert.match(quickPostForm, new RegExp(marker));
  }
  assert.match(aiRoute, /retryAfterSeconds/);
  assert.match(aiRoute, /"Retry-After"/);
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
    "/api/location/reverse",
    "streetText",
  ]) {
    assert.match(quickPostForm, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.doesNotMatch(quickPostForm, /toFixed\(6\)/);

  const locationSection = quickPostForm.slice(
    quickPostForm.indexOf('data-testid="quick-post-location"'),
    quickPostForm.indexOf('data-testid="quick-post-advanced-details"'),
  );
  assert.match(locationSection, /showLocationDetails/);
  assert.match(locationSection, /aria-expanded=\{showLocationDetails\}/);
  assert.match(locationSection, /id="quick-post-location-optional-details"/);
  assert.match(locationSection, /name="location_visibility"[\s\S]*<option value="approximate"/);
  assert.doesNotMatch(locationSection, /type="radio"/);
});

test("Step 1 presents photos, title and description, location, then price", () => {
  const photos = quickPostForm.indexOf('data-testid="quick-post-photos"');
  const titleDescription = quickPostForm.indexOf('data-testid="quick-post-title-description"');
  const locationOrder = quickPostForm.indexOf('data-testid="quick-post-location"');
  const priceOrder = quickPostForm.indexOf('data-testid="quick-post-price"');
  assert.ok(photos < titleDescription);
  assert.match(quickPostForm.slice(photos, titleDescription + 200), /order-10[\s\S]*order-20/);
  assert.match(quickPostForm.slice(locationOrder, locationOrder + 200), /order-30/);
  assert.match(quickPostForm.slice(priceOrder, priceOrder + 200), /order-40/);
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
  assert.doesNotMatch(listingDetail, /VehicleModelViewer|selectVehicleModel3D/);
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
    "persistQuickPostImages(images, draftOwnerScope)",
    "loadQuickPostImages(draftOwnerScope)",
    "clearQuickPostImages(draftOwnerScope)",
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
