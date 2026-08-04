import test from "node:test";
import assert from "node:assert/strict";

import { normalizeCategorySchemaProfile, normalizeCategorySchemaProfileFromFormData, resolveCategorySchemaProfiles } from "../lib/data/category-schema";

test("normalizeCategorySchemaProfile trims and parses values", () => {
  const profile = normalizeCategorySchemaProfile({
    category_slug: "  vehicles  ",
    schema_key: "  vehicle-profile  ",
    title: "  Vehicle profile  ",
    description: "  Help buyers find specs  ",
    is_enabled: "true",
    sort_order: "2",
  });

  assert.equal(profile.category_slug, "vehicles");
  assert.equal(profile.schema_key, "vehicle-profile");
  assert.equal(profile.title, "Vehicle profile");
  assert.equal(profile.description, "Help buyers find specs");
  assert.equal(profile.sort_order, 2);
  assert.equal(profile.is_enabled, true);
});

test("resolveCategorySchemaProfiles filters disabled and sorts", () => {
  const profiles = resolveCategorySchemaProfiles([
    { category_slug: "vehicles", schema_key: "b", title: "B", description: "", is_enabled: true, sort_order: 2 },
    { category_slug: "vehicles", schema_key: "a", title: "A", description: "", is_enabled: true, sort_order: 1 },
    { category_slug: "vehicles", schema_key: "c", title: "C", description: "", is_enabled: false, sort_order: 3 },
  ] as Array<Record<string, unknown>>);

  assert.deepEqual(profiles.map((item) => item.schema_key), ["a", "b"]);
});

test("normalizeCategorySchemaProfileFromFormData preserves edit values", () => {
  const formData = new FormData();
  formData.set("category_slug", "  real-estate  ");
  formData.set("schema_key", "  apartment-profile  ");
  formData.set("title", "  Apartment profile  ");
  formData.set("description", "  Great for property specs  ");
  formData.set("sort_order", "5");
  formData.set("is_enabled", "on");

  const profile = normalizeCategorySchemaProfileFromFormData(formData);

  assert.equal(profile.category_slug, "real-estate");
  assert.equal(profile.schema_key, "apartment-profile");
  assert.equal(profile.title, "Apartment profile");
  assert.equal(profile.description, "Great for property specs");
  assert.equal(profile.sort_order, 5);
  assert.equal(profile.is_enabled, true);
});
