import assert from "node:assert/strict";
import test from "node:test";
import { labelForLocale, normalizeListingSchemaConfig } from "../lib/listing-schema-config";
import { getSimpleCategoryConfig, shouldUseSimpleCategoryFallback } from "../lib/posting/simple-category-details";

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
