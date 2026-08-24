import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const migration = readFileSync(
  join(process.cwd(), "supabase", "migrations", "20260824104239_harden_listing_image_bucket_limits.sql"),
  "utf8",
);

const imageValidation = readFileSync(
  join(process.cwd(), "lib", "posting", "image-validation.ts"),
  "utf8",
);

test("listing image bucket limits mirror the app upload validator", () => {
  assert.match(migration, /update storage\.buckets/i);
  assert.match(migration, /where id = 'listing-images'/i);
  assert.match(migration, /file_size_limit = 10485760/i);

  for (const mime of ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]) {
    assert.match(migration, new RegExp(mime.replace("/", "\\/"), "i"));
    assert.match(imageValidation, new RegExp(mime.replace("/", "\\/"), "i"));
  }

  assert.doesNotMatch(migration, /\b(delete|truncate|drop)\b/i);
});
