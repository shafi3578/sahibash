import test from "node:test";
import assert from "node:assert/strict";
import {
  reconcileSuggestedDetails,
  sanitizeSuggestedDetails,
  shouldApplyCategorySuggestedDetails,
} from "@/lib/posting/suggested-details";

test("suggested details replace and remove only values previously managed by suggestions", () => {
  const result = reconcileSuggestedDetails({
    current: { brand: "Samsung", make: "Samsung", model: "Galaxy S23 Ultra", color: "White" },
    previousManaged: { brand: "Samsung", make: "Samsung", model: "Galaxy S23 Ultra" },
    nextSuggested: { brand: "Toyota", make: "Toyota" },
  });

  assert.deepEqual(result.details, { brand: "Toyota", make: "Toyota", color: "White" });
  assert.deepEqual(result.managed, { brand: "Toyota", make: "Toyota" });
});

test("seller-edited values are never overwritten or restored by later AI responses", () => {
  const result = reconcileSuggestedDetails({
    current: { model: "Seller-entered Corolla" },
    previousManaged: { model: "Galaxy S23 Ultra" },
    nextSuggested: { model: "Corolla" },
    userEditedKeys: new Set(["model"]),
  });

  assert.deepEqual(result.details, { model: "Seller-entered Corolla" });
  assert.deepEqual(result.managed, {});
});

test("a seller-cleared field stays empty while a late AI response arrives", () => {
  const result = reconcileSuggestedDetails({
    current: { model: "" },
    previousManaged: {},
    nextSuggested: { model: "Corolla" },
    userEditedKeys: new Set(["model"]),
  });

  assert.deepEqual(result.details, { model: "" });
});

test("legacy non-empty draft values without provenance are preserved for safe manual review", () => {
  const result = reconcileSuggestedDetails({
    current: { model: "Legacy value" },
    previousManaged: {},
    nextSuggested: { model: "Corolla" },
  });

  assert.deepEqual(result.details, { model: "Legacy value" });
  assert.deepEqual(result.managed, {});
});

test("suggestion metadata accepts only non-empty strings and booleans", () => {
  assert.deepEqual(
    sanitizeSuggestedDetails({ make: " Toyota ", model: "", negotiable: true, count: 2, nested: {} }),
    { make: "Toyota", negotiable: true },
  );
});

test("category suggestions cannot repopulate fields after the seller chooses a different root", () => {
  assert.equal(shouldApplyCategorySuggestedDetails({
    userChoseCategory: true,
    selectedRootSlug: "vehicles",
    selectedCategoryPath: "vehicles/cars/toyota/corolla",
    suggestedRootSlug: "phones-electronics",
    suggestedCategoryPath: "phones-electronics/mobile-phones/samsung",
  }), false);
});

test("category suggestions apply after a matching suggested leaf is selected", () => {
  assert.equal(shouldApplyCategorySuggestedDetails({
    userChoseCategory: true,
    selectedRootSlug: "phones-electronics",
    selectedCategoryPath: "phones-electronics/mobile-phones/samsung",
    suggestedRootSlug: "phones-electronics",
    suggestedCategoryPath: "phones-electronics/mobile-phones/samsung",
  }), true);
});

test("manual root and intermediate selections remain free of category-specific suggestions", () => {
  assert.equal(shouldApplyCategorySuggestedDetails({
    userChoseCategory: true,
    selectedRootSlug: "vehicles",
    selectedCategoryPath: null,
    suggestedRootSlug: "vehicles",
    suggestedCategoryPath: "vehicles/cars/honda/civic",
  }), false);
});

test("automatic suggestions remain available before the seller overrides category selection", () => {
  assert.equal(shouldApplyCategorySuggestedDetails({
    userChoseCategory: false,
    selectedRootSlug: "vehicles",
    selectedCategoryPath: null,
    suggestedRootSlug: "phones-electronics",
    suggestedCategoryPath: "phones-electronics/mobile-phones/samsung",
  }), true);
});
