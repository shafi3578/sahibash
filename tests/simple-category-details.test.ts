import test from "node:test";
import assert from "node:assert/strict";
import { getSimpleCategoryConfig, getSimpleCategoryKind } from "../lib/posting/simple-category-details";

test("recognizes subcategory paths for simple detail sections", () => {
  assert.equal(getSimpleCategoryKind("vehicles/cars/toyota", "vehicles"), "car");
  assert.equal(getSimpleCategoryKind("vehicles/motorcycles/honda", "vehicles"), "motorcycle");
  assert.equal(getSimpleCategoryKind("real-estate/apartments", "real-estate"), "apartment");
  assert.equal(getSimpleCategoryKind("real-estate/land", "real-estate"), "land");
  assert.equal(getSimpleCategoryKind("real-estate/dormitory/student-hostel", "real-estate"), "dormitory");
  assert.equal(getSimpleCategoryKind("mobile-phones-tablets/phones/apple-iphone", "mobile-phones-tablets"), "mobilePhone");
  assert.equal(getSimpleCategoryKind("electronics-computers/laptops/apple", "electronics-computers"), "fallback");
  assert.equal(getSimpleCategoryKind("second-hand-items/furniture", "second-hand-items"), "fallback");
});

test("dormitory details do not inherit house or land-only fields", () => {
  const config = getSimpleCategoryConfig("dormitory");
  assert.ok(config);
  const fieldKeys = new Set(config.fields.map((field) => field.key));
  for (const key of ["dormitory_fee", "payment_period", "gender_allowed", "room_type", "students_per_room", "internet", "hot_water", "nearby_institution"]) {
    assert.equal(fieldKeys.has(key), true, `Expected dormitory field ${key}`);
  }
  for (const key of ["areaSize", "areaUnit", "landType", "documentType", "floor", "floors", "balcony"]) {
    assert.equal(fieldKeys.has(key), false, `Dormitory should not include ${key}`);
  }
});
