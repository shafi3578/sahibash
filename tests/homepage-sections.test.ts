import test from "node:test";
import assert from "node:assert/strict";

import { normalizeHomepageSectionDraft, resolveHomepageSections } from "../lib/data/homepage-sections";

test("normalizeHomepageSectionDraft trims and defaults values", () => {
  const normalized = normalizeHomepageSectionDraft({
    title: "  Welcome  ",
    body: "  Browse the marketplace  ",
    cta_label: "",
    cta_path: "",
    section_type: "hero",
    sort_order: "2",
    is_enabled: "true",
  });

  assert.equal(normalized.title, "Welcome");
  assert.equal(normalized.body, "Browse the marketplace");
  assert.equal(normalized.section_type, "hero");
  assert.equal(normalized.sort_order, 2);
  assert.equal(normalized.is_enabled, true);
});

test("resolveHomepageSections uses fallback values and sorts by order", () => {
  const sections = resolveHomepageSections([
    { id: 2, title: "Second", body: "", section_type: "promo", sort_order: 2, is_enabled: true },
    { id: 1, title: "First", body: "Body", section_type: "hero", sort_order: 1, is_enabled: true },
    { id: 3, title: "Disabled", body: "Hidden", section_type: "promo", sort_order: 3, is_enabled: false },
  ] as Array<Record<string, unknown>>);

  assert.equal(sections[0].title, "First");
  assert.equal(sections[1].title, "Second");
  assert.equal(sections[0].body, "Body");
  assert.equal(sections[1].body, "No content yet");
  assert.equal(sections.length, 2);
});
