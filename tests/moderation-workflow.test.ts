import test from "node:test";
import assert from "node:assert/strict";

import { normalizeModerationEntry, resolveModerationEntries } from "../lib/data/moderation-workflow";

test("normalizeModerationEntry trims values and defaults state", () => {
  const entry = normalizeModerationEntry({
    entity_type: "  listing  ",
    entity_id: "  42  ",
    status: "  pending  ",
    summary: "  Needs review  ",
  });

  assert.equal(entry.entity_type, "listing");
  assert.equal(entry.entity_id, 42);
  assert.equal(entry.status, "pending");
  assert.equal(entry.summary, "Needs review");
});

test("resolveModerationEntries sorts and filters", () => {
  const entries = resolveModerationEntries([
    { entity_type: "listing", entity_id: 2, status: "approved", summary: "", created_at: "2024-01-02" },
    { entity_type: "listing", entity_id: 1, status: "pending", summary: "Needs attention", created_at: "2024-01-01" },
    { entity_type: "listing", entity_id: 3, status: "rejected", summary: "Bad", created_at: "2024-01-03" },
  ] as Array<Record<string, unknown>>);

  assert.equal(entries[0].entity_id, 1);
  assert.equal(entries[1].entity_id, 2);
  assert.equal(entries.length, 2);
});
