import test from "node:test";
import assert from "node:assert/strict";
import { isPostAdPath, isProtectedPostingPath } from "@/lib/auth/protected-routes";

test("Protected posting paths are correctly detected", () => {
  const protectedPaths = [
    "/post-ad",
    "/post-ad/create",
    "/post-ad/electronics",
    "/dashboard/my-ads",
    "/dashboard/my-listings",
    "/listings/create",
    "/listings/edit",
    "/listings/abc/edit",
    "/listings/abc/manage",
  ];

  for (const path of protectedPaths) {
    assert.equal(isProtectedPostingPath(path), true, `Expected protected: ${path}`);
  }
});

test("Public browsing paths stay open", () => {
  const publicPaths = [
    "/",
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
  assert.equal(isPostAdPath("/search"), false);
});
