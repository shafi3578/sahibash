import assert from "node:assert/strict";
import test from "node:test";

import {
  getLocalizedListingLocation,
  localizeDistrictName,
  localizeProvinceName,
} from "../lib/i18n/location-labels";

test("province fallbacks use canonical English, Dari, and Pashto labels", () => {
  assert.equal(localizeProvinceName(null, "Herat", "en"), "Herat");
  assert.equal(localizeProvinceName(null, "Herat", "fa"), "هرات");
  assert.equal(localizeProvinceName(null, "Daykundi", "ps"), "دایکنډي");
});

test("localized relation values are preferred over legacy English columns", () => {
  const listing = {
    province: "Herat",
    district: "Herat City",
    provinces: { name_en: "Herat", name_fa: "هرات", name_ps: "هرات" },
    districts: { name_en: "Herat City", name_fa: "شهر هرات", name_ps: "هرات ښار" },
  };

  assert.equal(getLocalizedListingLocation(listing, "fa").label, "هرات · شهر هرات");
  assert.equal(getLocalizedListingLocation(listing, "ps").label, "هرات · هرات ښار");
  assert.equal(getLocalizedListingLocation(listing, "en").label, "Herat · Herat City");
});

test("legacy city fallbacks do not leak English into Dari or Pashto", () => {
  assert.equal(localizeDistrictName(null, "Herat City", "fa", "Herat", "هرات"), "شهر هرات");
  assert.equal(localizeDistrictName(null, "Kabul City", "ps", "Kabul", "کابل"), "کابل ښار");
});

test("legacy rows with English copied into localized columns use safe local labels", () => {
  const listing = {
    province: "Herat",
    district: "Kohsan",
    provinces: [{ name_en: "Herat", name_fa: "Herat", name_ps: "Herat" }],
    districts: [{ name_en: "Kohsan", name_fa: "Kohsan", name_ps: "Kohsan" }],
  };

  assert.equal(getLocalizedListingLocation(listing, "fa").label, "هرات · کهسان");
  assert.equal(getLocalizedListingLocation(listing, "ps").label, "هرات · کهسان");
});
