import test from "node:test";
import assert from "node:assert/strict";
import { getSimpleCategoryKind } from "../lib/posting/simple-category-details";

test("recognizes subcategory paths for simple detail sections", () => {
  assert.equal(getSimpleCategoryKind("vehicles/cars/toyota", "vehicles"), "car");
  assert.equal(getSimpleCategoryKind("vehicles/motorcycles/honda", "vehicles"), "motorcycle");
  assert.equal(getSimpleCategoryKind("real-estate/apartments", "real-estate"), "apartment");
  assert.equal(getSimpleCategoryKind("real-estate/land", "real-estate"), "land");
  assert.equal(getSimpleCategoryKind("mobile-phones-tablets/phones/apple-iphone", "mobile-phones-tablets"), "mobilePhone");
  assert.equal(getSimpleCategoryKind("electronics-computers/laptops/apple", "electronics-computers"), "fallback");
  assert.equal(getSimpleCategoryKind("second-hand-items/furniture", "second-hand-items"), "fallback");
});
