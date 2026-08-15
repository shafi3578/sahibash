import test from "node:test";
import assert from "node:assert/strict";

import { normalizeSiteSettings, resolveSiteSettingsVersionSnapshot } from "../lib/data/site-settings";

test("normalizeSiteSettings keeps required values and strips empty ones", () => {
  const normalized = normalizeSiteSettings({
    site_name: "Sahibash",
    site_tagline: "",
    contact_email: "hello@example.com",
    contact_phone: "",
    default_locale: "fa",
    home_hero_title: "  Control Center  ",
    home_hero_subtitle: "  Edit the public surface  ",
    home_primary_cta_label: " Browse listings ",
    home_primary_cta_path: " /listings ",
    home_secondary_cta_label: " Post an ad ",
    home_secondary_cta_path: " /post-ad/create?posting=sell ",
    navigation_links: "Listings|/listings\nCategories|/categories",
    extra: "ignored",
  });

  assert.deepEqual(normalized, {
    site_name: "Sahibash",
    contact_email: "hello@example.com",
    default_locale: "fa",
    home_hero_title: "Control Center",
    home_hero_subtitle: "Edit the public surface",
    home_primary_cta_label: "Browse listings",
    home_primary_cta_path: "/listings",
    home_secondary_cta_label: "Post an ad",
    home_secondary_cta_path: "/post-ad/create?posting=sell",
    navigation_links: [
      { label: "Listings", path: "/listings" },
      { label: "Categories", path: "/categories" },
    ],
  });
});

test("resolveSiteSettingsVersionSnapshot falls back to public defaults", () => {
  const snapshot = resolveSiteSettingsVersionSnapshot({
    site_name: "Control Center",
    contact_phone: "",
  });

  assert.equal(snapshot.site_name, "Control Center");
  assert.equal(snapshot.site_tagline, "Marketplace for Afghanistan");
  assert.equal(snapshot.contact_phone, "+93700000000");
  assert.equal(snapshot.default_locale, "fa");
  assert.equal(snapshot.home_hero_title, "Discover trusted listings across Afghanistan");
  assert.deepEqual(snapshot.navigation_links, [
    { label: "Listings", path: "/listings" },
    { label: "Categories", path: "/categories" },
  ]);
});
