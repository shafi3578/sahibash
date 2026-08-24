import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { formatListingPrice } from "@/lib/listings/price-display";

const quickPostForm = readFileSync(join(process.cwd(), "components", "posting", "QuickPostForm.tsx"), "utf8");
const createPage = readFileSync(join(process.cwd(), "app", "post-ad", "create", "page.tsx"), "utf8");
const listingActions = readFileSync(join(process.cwd(), "lib", "actions", "listings.ts"), "utf8");
const listingValidator = readFileSync(join(process.cwd(), "lib", "validators", "listing.ts"), "utf8");
const listingCard = readFileSync(join(process.cwd(), "components", "listing-card.tsx"), "utf8");
const listingDetail = readFileSync(join(process.cwd(), "app", "listings", "[id]", "page.tsx"), "utf8");

test("consumer create page defaults to the one-screen Quick Post but preserves the standard form", () => {
  assert.match(createPage, /import QuickPostForm/);
  assert.match(createPage, /posting === "standard" \? "standard" : "quick"/);
  assert.match(createPage, /initialMode === "quick"/);
  assert.match(createPage, /<QuickPostForm/);
  assert.match(createPage, /<PostAdForm/);
});

test("Quick Post includes the Step 2 one-screen core and existing draft/publish systems", () => {
  for (const marker of [
    'data-testid="quick-post-form"',
    'data-testid="quick-post-photos"',
    'data-testid="quick-post-description"',
    'data-testid="quick-post-price"',
    'data-testid="quick-post-location"',
    'data-testid="quick-post-ai-chips"',
    'data-testid="quick-post-advanced-details"',
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
  ]) {
    assert.match(quickPostForm, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("Quick Post resolves AI suggestions against canonical taxonomy instead of arbitrary IDs", () => {
  assert.match(quickPostForm, /\.from\("category_nodes"\)/);
  assert.match(quickPostForm, /\.eq\("is_active", true\)/);
  assert.match(quickPostForm, /suggestedProduct\?\.categoryNodeId/);
  assert.match(quickPostForm, /scoreCategoryNode/);
  assert.doesNotMatch(quickPostForm, /formData\.set\("category_node_id",\s*ai/i);
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

test("listing cards and detail pages use contextual price display", () => {
  assert.match(listingCard, /formatListingPrice\(listing, locale, attributes\)/);
  assert.match(listingDetail, /formatListingPrice\(listing, locale, attributeMap\)/);

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
