import assert from "node:assert/strict";
import test from "node:test";
import { labelForLocale, normalizeListingSchemaConfig } from "../lib/listing-schema-config";
import { getSimpleCategoryConfig, shouldUseSimpleCategoryFallback } from "../lib/posting/simple-category-details";
import { getPublishedPostingFields, hasPublishedDetailValue } from "../lib/posting/published-schema-fields";

test("normalizes, orders, and preserves multilingual schema controls", () => {
  const config = normalizeListingSchemaConfig({
    schemaVersion: 99,
    sections: [{ key: "facts", titles: { en: "Facts", fa: "مشخصات", ps: "ځانګړنې" }, order: 1 }],
    fields: [
      { key: "model", type: "select", labels: { en: "Model", fa: "مدل", ps: "ماډل" }, sectionKey: "facts", order: 9, required: true, posting: true, filter: true, card: true, detail: true, options: [{ value: "x", labels: { en: "X", fa: "ایکس", ps: "ایکس" } }] },
      { key: "brand", type: "text", labels: { en: "Brand", fa: "برند", ps: "برانډ" }, sectionKey: "facts", order: 2 },
    ],
  });
  assert.equal(config.schemaVersion, 1);
  assert.deepEqual(config.fields.map((field) => field.key), ["brand", "model"]);
  assert.equal(config.fields[1].required, true);
  assert.equal(config.fields[1].filter, true);
  assert.equal(labelForLocale(config.fields[1].labels, "fa"), "مدل");
});

test("rejects duplicate keys and invalid option values", () => {
  assert.throws(() => normalizeListingSchemaConfig({ sections: [{ key: "details" }], fields: [{ key: "x", type: "text" }, { key: "x", type: "text" }] }), /duplicate key/);
  assert.throws(() => normalizeListingSchemaConfig({ sections: [{ key: "details" }], fields: [{ key: "x", type: "select", options: [{ value: "" }] }] }), /empty or duplicate option/);
});

test("published subcategory schemas replace hidden fallback posting fields", () => {
  const carFallback = getSimpleCategoryConfig("car");
  assert.equal(shouldUseSimpleCategoryFallback(carFallback, false), true);
  assert.equal(shouldUseSimpleCategoryFallback(carFallback, true), false);
});

test("published posting fields preserve multilingual labels, options, order, and required flags", () => {
  const config = normalizeListingSchemaConfig({
    sections: [{ key: "facts", titles: { en: "Facts", fa: "مشخصات", ps: "ځانګړنې" }, order: 1 }],
    fields: [
      { key: "condition", type: "select", labels: { en: "Condition", fa: "وضعیت", ps: "حالت" }, sectionKey: "facts", order: 1, required: true, posting: true, options: [{ value: "used", labels: { en: "Used", fa: "استفاده‌شده", ps: "کارول شوی" } }] },
      { key: "frame_size", type: "text", labels: { en: "Frame size", fa: "اندازه فریم", ps: "د چوکاټ اندازه" }, sectionKey: "facts", order: 2, required: false, posting: true },
    ],
  });
  const fields = getPublishedPostingFields(config, "fa", "vehicles/bicycles/city-bike");
  assert.deepEqual(fields.map((field) => field.key), ["condition", "frame_size"]);
  assert.equal(fields[0].label, "وضعیت");
  assert.equal(fields[0].options?.[0].label, "استفاده‌شده");
  assert.equal(fields[0].required, true);
  assert.equal(fields[1].required, false);
});

test("iPhone posting omits RAM while real-estate area units do not hide room details", () => {
  const iphone = normalizeListingSchemaConfig({
    sections: [{ key: "facts" }],
    fields: [
      { key: "storage_gb", type: "number", sectionKey: "facts", posting: true },
      { key: "ram_gb", type: "number", sectionKey: "facts", posting: true },
      { key: "battery_health", type: "number", sectionKey: "facts", posting: true },
    ],
  });
  assert.deepEqual(
    getPublishedPostingFields(iphone, "en", "mobile-phones-tablets/mobile-phones/apple-iphone").map((field) => field.key),
    ["storage_gb", "battery_health"],
  );

  const house = normalizeListingSchemaConfig({
    sections: [{ key: "facts" }],
    fields: [
      { key: "area_sqm", type: "number", sectionKey: "facts", posting: true, required: true },
      { key: "bedrooms", type: "number", sectionKey: "facts", posting: true },
      { key: "bathrooms", type: "number", sectionKey: "facts", posting: true },
    ],
  });
  assert.deepEqual(
    getPublishedPostingFields(house, "en", "real-estate/houses/normal-house").map((field) => field.key),
    ["areaSize", "areaUnit", "bedrooms", "bathrooms"],
  );
  assert.equal(hasPublishedDetailValue(false), true);
});
