import test from "node:test";
import assert from "node:assert/strict";

import { normalizeStaticPageDraft, resolvePublishedStaticPage } from "../lib/data/static-pages";

test("normalizeStaticPageDraft trims localized fields", () => {
  const draft = normalizeStaticPageDraft({
    page_key: " about-sahibash ",
    slug_en: " about ",
    slug_fa: " about-fa ",
    slug_ps: " about-ps ",
    title_en: " About Sahibash ",
    body_en: " Hello world ",
    seo_title_en: " SEO ",
    seo_description_en: " Description ",
  });

  assert.deepEqual(draft.page_key, "about-sahibash");
  assert.deepEqual(draft.slug_en, "about");
  assert.deepEqual(draft.title.en, "About Sahibash");
  assert.deepEqual(draft.body.en, "Hello world");
  assert.deepEqual(draft.seo_title.en, "SEO");
});

test("resolvePublishedStaticPage falls back to English content", () => {
  const page = resolvePublishedStaticPage(
    {
      id: 11,
      page_key: "privacy-policy",
      slug_en: "privacy-policy",
      slug_fa: "",
      slug_ps: "",
      title_en: "Privacy Policy",
      title_fa: "",
      title_ps: "",
      body_en: "This is the policy.",
      body_fa: "",
      body_ps: "",
      seo_title_en: "Privacy Policy",
      seo_title_fa: "",
      seo_title_ps: "",
      seo_description_en: "How data is handled.",
      seo_description_fa: "",
      seo_description_ps: "",
    },
    "fa"
  );

  assert.equal(page.title, "Privacy Policy");
  assert.equal(page.body, "This is the policy.");
  assert.equal(page.slug, "privacy-policy");
  assert.equal(page.locale, "fa");
});