import test from "node:test";
import assert from "node:assert/strict";
import { reconcileSuggestedDetails, sanitizeSuggestedDetails } from "@/lib/posting/suggested-details";

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
