import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { MAX_LISTING_IMAGE_BYTES, validateListingImage } from "../lib/posting/image-validation";

test("accepts a genuine JPEG signature with matching MIME type", async () => {
  const image = new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0])], { type: "image/jpeg" });
  assert.deepEqual(await validateListingImage(image), { ok: true, extension: "jpg" });
});

test("rejects executable or SVG content disguised with an image filename", async () => {
  const image = new Blob(["<svg><script>alert(1)</script></svg>"], { type: "image/svg+xml" });
  const result = await validateListingImage(image);
  assert.equal(result.ok, false);
});

test("rejects a spoofed MIME type when the file signature does not match", async () => {
  const image = new Blob(["not a jpeg"], { type: "image/jpeg" });
  const result = await validateListingImage(image);
  assert.equal(result.ok, false);
});

test("rejects images larger than the posting limit", async () => {
  const image = new Blob([new Uint8Array(MAX_LISTING_IMAGE_BYTES + 1)], { type: "image/png" });
  const result = await validateListingImage(image);
  assert.equal(result.ok, false);
});

test("marketplace showcases preserve the full listing photo while thumbnails may crop", () => {
  const gallery = readFileSync(join(process.cwd(), "components", "listings", "listing-gallery.tsx"), "utf8");
  const card = readFileSync(join(process.cwd(), "components", "listing-card.tsx"), "utf8");
  const home = readFileSync(join(process.cwd(), "app", "page.tsx"), "utf8");
  assert.match(gallery, /className="object-contain"/);
  assert.match(gallery, /loading="eager"[\s\S]*fetchPriority="high"/);
  assert.doesNotMatch(gallery, /\bpriority\b/);
  assert.match(card, /className="object-contain"/);
  assert.equal((home.match(/className="object-contain/g) ?? []).length, 3);
});
