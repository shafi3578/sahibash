import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const sanitySql = readFileSync(
  join(process.cwd(), "scripts", "sql", "production_sanity_checks.sql"),
  "utf8",
);

test("production sanity checks are read-only and cover launch contamination risks", () => {
  assert.doesNotMatch(sanitySql, /\b(delete|update|insert|truncate|drop|alter|create)\b/i);
  assert.match(sanitySql, /e2e\|fixpass\|fixture/i);
  assert.match(sanitySql, /featured is true[\s\S]*status <> 'approved'/i);
  assert.match(sanitySql, /left join public\.listings/i);
  assert.match(sanitySql, /latitude < -90/i);
  assert.match(sanitySql, /source_type in \('external_indexed', 'partner_feed', 'scout_assisted'\)/i);
  assert.match(sanitySql, /l\.category_id is distinct from cn\.category_id/i);
  assert.match(sanitySql, /phones-electronics\/%/i);
  assert.match(sanitySql, /real-estate\/house-for-sale/i);
  assert.match(sanitySql, /real-estate\/land%/i);
  assert.match(sanitySql, /slug in \('vehicles','real-estate','mobile-phones-tablets','second-hand-items'\)/i);
});
