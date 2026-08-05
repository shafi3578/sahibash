import assert from "node:assert/strict";
import test from "node:test";
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
