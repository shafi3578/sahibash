import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const migrationsDirectory = join(process.cwd(), "supabase", "migrations");

const taxonomyMigration = readFileSync(
  join(migrationsDirectory, "20260804233253_taxonomy_specific_listing_schemas.sql"),
  "utf8",
);

const refinementMigration = readFileSync(
  join(migrationsDirectory, "20260804233519_refine_electronics_schema_families.sql"),
  "utf8",
);

const quickPostAlignmentMigration = readFileSync(
  join(migrationsDirectory, "20260831021513_align_quick_post_leaf_schema.sql"),
  "utf8",
);

test("taxonomy migration covers the major marketplace schema families", () => {
  const requiredFamilies = [
    "car",
    "motorcycle",
    "vehicle_part",
    "residential_property",
    "commercial_property",
    "land",
    "phone",
    "computer",
    "appliance",
    "furniture",
    "clothing",
    "animal",
    "course",
    "business_equipment",
  ];

  for (const family of requiredFamilies) {
    assert.match(taxonomyMigration, new RegExp(`'${family}'`));
  }
});

test("published schema replacement is versioned and preserves old versions", () => {
  assert.match(taxonomyMigration, /coalesce\(max\(v\.version\), 0\) \+ 1 next_version/);
  assert.match(taxonomyMigration, /set status = 'archived'/);
  assert.doesNotMatch(taxonomyMigration, /delete\s+from\s+public\.listing_schema_versions/i);
  assert.doesNotMatch(taxonomyMigration, /delete\s+from\s+public\.(listings|category_nodes|users)/i);
});

test("all generated labels contain English, Dari, and Pashto", () => {
  assert.match(
    taxonomyMigration,
    /jsonb_build_object\('en', label_en, 'fa', label_fa, 'ps', label_ps\)/,
  );
  assert.match(taxonomyMigration, /jsonb_build_object\('en',[\s\S]*?'fa',[\s\S]*?'ps'/);
});

test("compound electronics paths receive specific correction families", () => {
  assert.match(refinementMigration, /audio-speakers/);
  assert.match(refinementMigration, /solar-power-equipment/);
  assert.match(refinementMigration, /satellite-receivers/);
  assert.match(refinementMigration, /'media_device'/);
  assert.match(refinementMigration, /'power_equipment'/);
});

test("leaf alignment is versioned, non-destructive, and removes known irrelevant controls", () => {
  assert.match(quickPostAlignmentMigration, /is_leaf = not exists/);
  assert.match(quickPostAlignmentMigration, /apple-iphone/);
  assert.match(quickPostAlignmentMigration, /ram_gb/);
  assert.match(quickPostAlignmentMigration, /bicycle-parts/);
  assert.match(quickPostAlignmentMigration, /motorcycle-parts/);
  assert.match(quickPostAlignmentMigration, /electric-motorcycles/);
  assert.match(quickPostAlignmentMigration, /'fuel_type', 'engine_size', 'engine_cc', 'start_type'/);
  assert.match(quickPostAlignmentMigration, /set status = 'archived'/);
  assert.doesNotMatch(quickPostAlignmentMigration, /delete\s+from/i);
});
