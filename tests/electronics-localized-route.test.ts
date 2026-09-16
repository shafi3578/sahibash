import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("localized legacy electronics route redirects to the unified posting flow", () => {
  const routePath = path.join(process.cwd(), "app", "[locale]", "post-ad", "electronics", "page.tsx");
  const content = fs.readFileSync(routePath, "utf8");

  assert.match(content, /import\s*\{\s*redirect\s*\}\s*from\s*["']next\/navigation["']/);
  assert.match(content, /const\s*\{\s*locale\s*\}\s*=\s*await\s+params/);
  assert.ok(content.includes('redirect(`/${locale}/post-ad/create`)'));
});
