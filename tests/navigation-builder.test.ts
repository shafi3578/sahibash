import test from "node:test";
import assert from "node:assert/strict";

import { normalizeNavigationItem, resolveNavigationItems } from "../lib/data/navigation";

test("normalizeNavigationItem trims values and defaults missing fields", () => {
  const item = normalizeNavigationItem({
    label: "  Browse  ",
    path: "  /listings  ",
    parent_id: "0",
    sort_order: "3",
    is_enabled: "true",
  });

  assert.equal(item.label, "Browse");
  assert.equal(item.path, "/listings");
  assert.equal(item.parent_id, null);
  assert.equal(item.sort_order, 3);
  assert.equal(item.is_enabled, true);
});

test("resolveNavigationItems returns enabled items in tree order", () => {
  const items = resolveNavigationItems([
    { id: 2, label: "Second", path: "/second", parent_id: null, sort_order: 2, is_enabled: true },
    { id: 1, label: "First", path: "/first", parent_id: null, sort_order: 1, is_enabled: true },
    { id: 3, label: "Hidden", path: "/hidden", parent_id: null, sort_order: 3, is_enabled: false },
  ] as Array<Record<string, unknown>>);

  assert.deepEqual(items.map((item) => item.label), ["First", "Second"]);
});
