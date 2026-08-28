import test from "node:test";
import assert from "node:assert/strict";
import { isPostAdPath, isProtectedPostingPath } from "@/lib/auth/protected-routes";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { isProxyExcludedPath, resolveBrowserLocale } from "@/proxy";

const canonicalPostingForm = readFileSync(
  join(process.cwd(), "app", "post-ad", "post-ad-form.tsx"),
  "utf8",
);

test("Protected posting paths are correctly detected", () => {
  const protectedPaths = [
    "/dashboard",
    "/post-ad/create",
    "/post-ad/create-v2",
    "/post-ad/create-new",
    "/dashboard/my-ads",
    "/dashboard/my-listings",
    "/dashboard/messages",
    "/dashboard/settings",
    "/dashboard/account-information",
    "/dashboard/account-security",
    "/listings/create",
    "/listings/edit",
    "/listings/abc/edit",
    "/listings/abc/manage",
  ];

  for (const path of protectedPaths) {
    assert.equal(isProtectedPostingPath(path), true, `Expected protected: ${path}`);
  }
});

test("Public posting flows stay open", () => {
  const publicPaths = [
    "/",
    "/post-ad",
    "/post-ad/electronics",
    "/post-ad/some-other-flow",
    "/search",
    "/listings",
    "/listings/abc",
    "/categories",
    "/fa/listings",
  ];

  for (const path of publicPaths) {
    assert.equal(isProtectedPostingPath(path), false, `Expected public: ${path}`);
  }
});

test("Post ad path marker works for reason=post messaging", () => {
  assert.equal(isPostAdPath("/post-ad"), true);
  assert.equal(isPostAdPath("/post-ad/create"), true);
  assert.equal(isPostAdPath("/post-ad/electronics"), true);
  assert.equal(isPostAdPath("/search"), false);
});

test("legacy posting routes converge on the canonical posting flow", () => {
  for (const route of ["create-new", "create-v2", "electronics"]) {
    const source = readFileSync(join(process.cwd(), "app", "post-ad", route, "page.tsx"), "utf8");
    assert.match(source, /redirect\("\/post-ad\/create/);
  }
});

test("the locale switch endpoint bypasses locale-prefix enforcement", () => {
  assert.equal(isProxyExcludedPath("/locale"), true);
  assert.equal(isProxyExcludedPath("/api/location/provinces"), true);
  assert.equal(isProxyExcludedPath("/search"), false);
});

test("browser locale detection prefers supported Afghan locales and safely falls back to Dari", () => {
  assert.equal(resolveBrowserLocale("ps-AF,ps;q=0.9,en;q=0.8"), "ps");
  assert.equal(resolveBrowserLocale("fa-AF,fa;q=0.9"), "fa");
  assert.equal(resolveBrowserLocale("de-DE,de;q=0.9"), "fa");
  assert.equal(resolveBrowserLocale(null), "fa");
});

test("Vercel telemetry assets bypass locale routing", () => {
  assert.equal(isProxyExcludedPath("/_vercel/insights/script.js"), true);
  assert.equal(isProxyExcludedPath("/_vercel/speed-insights/script.js"), true);
});

test("final category selection exposes a direct details action above mobile navigation", () => {
  assert.match(canonicalPostingForm, /data-testid="category-continue-to-details"/);
  assert.match(canonicalPostingForm, /data-testid="posting-step-actions"/);
  assert.match(canonicalPostingForm, /bottom-\[calc\(4\.5rem\+env\(safe-area-inset-bottom\)\)\]/);
  assert.match(canonicalPostingForm, /lg:bottom-0/);
});

test("standard posting drafts and remembered locations are account scoped from first render", () => {
  assert.match(canonicalPostingForm, /draftOwnerId\?: string \| null/);
  assert.match(canonicalPostingForm, /const draftOwnerScope = draftOwnerId \|\| "guest"/);
  assert.match(canonicalPostingForm, /`\$\{DRAFT_KEY\}:\$\{draftOwnerScope\}`/);
  assert.match(canonicalPostingForm, /`\$\{PREVIOUS_LOCATION_KEY\}:\$\{draftOwnerScope\}`/);
  assert.doesNotMatch(canonicalPostingForm, /useState\(DRAFT_KEY\)/);
  assert.doesNotMatch(canonicalPostingForm, /setDraftStorageKey/);
});
