import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("localized electronics posting route reuses the real electronics page implementation", () => {
  const routePath = path.join(process.cwd(), "app", "[locale]", "post-ad", "electronics", "page.tsx");
  const content = fs.readFileSync(routePath, "utf8");

  assert.match(
    content,
    /import ElectronicsPostAdPage from ["']@\/app\/post-ad\/electronics\/page["']/
  );
});
