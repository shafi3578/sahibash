import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { getSchemaCategoryNavigationHref, getSchemaCategoryOptions } from "../lib/admin/schema-category-navigation";
import { SCHEMA_BUILDER_COPY } from "../lib/i18n/schema-builder-copy";

const nodes = [
  { id: 1, name: "Business & Industry", path: "business-industry" },
  { id: 2, name: "City Bike", path: "vehicles/bicycles/city-bike" },
  { id: 3, name: "Mountain Bike", path: "vehicles/bicycles/mountain-bike" },
] as const;

test("empty and whitespace searches preserve the complete category list", () => {
  for (const search of ["", "   "]) {
    const result = getSchemaCategoryOptions(nodes, 1, search);
    assert.deepEqual(result.options, nodes);
    assert.equal(result.matchCount, 3);
    assert.equal(result.selected?.id, 1);
    assert.equal(result.retainedSelection, undefined);
  }
});

test("a matching active category appears once and name/path searches remain case insensitive", () => {
  for (const search of [" CITY BIKE ", "VEHICLES/BICYCLES/CITY-BIKE"]) {
    const result = getSchemaCategoryOptions(nodes, 2, search);
    assert.deepEqual(result.options.map((node) => node.id), [2]);
    assert.equal(result.matchCount, 1);
    assert.equal(result.retainedSelection, undefined);
  }
});

test("filtering to another category retains the real editor target without counting it as a match", () => {
  const result = getSchemaCategoryOptions(nodes, 1, "vehicles/bicycles/city-bike");
  assert.deepEqual(result.options.map((node) => node.id), [1, 2]);
  assert.equal(result.selected?.id, 1);
  assert.equal(result.retainedSelection?.id, 1);
  assert.equal(result.matchCount, 1);
  assert.equal(new Set(result.options.map((node) => node.id)).size, result.options.length);
  assert.deepEqual(nodes.map((node) => node.id), [1, 2, 3]);
});

test("no results keep the active category visible while reporting zero matches", () => {
  const result = getSchemaCategoryOptions(nodes, 1, "no-such-category");
  assert.deepEqual(result.options.map((node) => node.id), [1]);
  assert.equal(result.selected?.id, 1);
  assert.equal(result.retainedSelection?.id, 1);
  assert.equal(result.matchCount, 0);
});

test("matching filters do not duplicate the current category and missing ids are not fabricated", () => {
  const result = getSchemaCategoryOptions(nodes, 2, "bicycles");
  assert.deepEqual(result.options.map((node) => node.id), [2, 3]);
  assert.equal(result.matchCount, 2);
  assert.equal(result.retainedSelection, undefined);
  const missing = getSchemaCategoryOptions(nodes, 999, "bicycles");
  assert.equal(missing.selected, undefined);
  assert.equal(missing.retainedSelection, undefined);
  assert.deepEqual(missing.options.map((node) => node.id), [2, 3]);
});

test("only explicit selection creates a navigation target; unchanged and invalid values are ignored", () => {
  assert.equal(getSchemaCategoryNavigationHref("/admin/listing-schema", 1, "2"), "/admin/listing-schema?node=2");
  assert.equal(getSchemaCategoryNavigationHref("/administrator/listing-schema", 1, "2"), "/administrator/listing-schema?node=2");
  assert.equal(getSchemaCategoryNavigationHref("/admin/listing-schema", 1, "1"), null);
  assert.equal(getSchemaCategoryNavigationHref("/admin/listing-schema", 1, "invalid"), null);
  assert.equal(getSchemaCategoryNavigationHref("/admin/listing-schema", 1, "1.5"), null);
});

test("navigator wiring keeps search separate from navigation and labels the actual select explicitly", () => {
  const source = readFileSync(join(process.cwd(), "app/admin/listing-schema/category-navigator.tsx"), "utf8");
  assert.match(source, /<input value=\{search\} onChange=\{\(event\) => setSearch\(event\.target\.value\)\}/);
  assert.match(source, /onChange=\{\(event\) => selectNode\(event\.target\.value\)\}/);
  assert.match(source, /const href = getSchemaCategoryNavigationHref\(pathname, selectedId, value\)/);
  assert.match(source, /router\.replace\(href, \{ scroll: false \}\)/);
  assert.equal((source.match(/router\.replace\(/g) ?? []).length, 1);
  assert.doesNotMatch(source, /useEffect|setSelectedId/);
  assert.match(source, /const categorySelectId = useId\(\)/);
  assert.match(source, /<label htmlFor=\{categorySelectId\}>\{copy\.categoryOrSubcategory\}<\/label>/);
  assert.match(source, /<select id=\{categorySelectId\} value=\{selectedId\}/);
  assert.match(source, /\{copy\.matchingCategories\}: \{matchCount\}/);
  assert.match(source, /name="category_node_id" value=\{selected\.id\}/);
});

test("match-count copy is localized in all supported schema-builder languages", () => {
  for (const locale of ["en", "fa", "ps"] as const) {
    assert.ok(SCHEMA_BUILDER_COPY[locale].matchingCategories.length > 0);
  }
  assert.notEqual(SCHEMA_BUILDER_COPY.fa.matchingCategories, SCHEMA_BUILDER_COPY.en.matchingCategories);
  assert.notEqual(SCHEMA_BUILDER_COPY.ps.matchingCategories, SCHEMA_BUILDER_COPY.en.matchingCategories);
});
