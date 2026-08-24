import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const migration = readFileSync(
  join(process.cwd(), "supabase", "migrations", "20260824104308_app_rate_limit_foundation.sql"),
  "utf8",
);

const helper = readFileSync(
  join(process.cwd(), "lib", "security", "rate-limit.ts"),
  "utf8",
);

const rpcRestrictionMigration = readFileSync(
  join(process.cwd(), "supabase", "migrations", "20260824104736_restrict_rate_limit_rpc_execution.sql"),
  "utf8",
);

function readRepoFile(...segments: string[]) {
  return readFileSync(join(process.cwd(), ...segments), "utf8");
}

test("rate limit migration stores hashed buckets behind a server-only RPC", () => {
  assert.match(migration, /create table if not exists public\.app_rate_limit_buckets/i);
  assert.match(migration, /actor_hash text not null/i);
  assert.match(migration, /actor_hash ~ '\^\[a-f0-9\]\{64\}\$'/i);
  assert.match(migration, /alter table public\.app_rate_limit_buckets enable row level security/i);
  assert.match(migration, /revoke all on table public\.app_rate_limit_buckets from anon, authenticated/i);
  assert.match(migration, /create or replace function public\.consume_app_rate_limit/i);
  assert.match(migration, /security definer/i);
  assert.match(migration, /set search_path = ''/i);
  assert.match(migration, /grant execute on function public\.consume_app_rate_limit\(text, text, integer, integer\) to service_role/i);
  assert.match(rpcRestrictionMigration, /revoke all on function public\.consume_app_rate_limit\(text, text, integer, integer\) from anon, authenticated/i);
  assert.match(rpcRestrictionMigration, /grant execute on function public\.consume_app_rate_limit\(text, text, integer, integer\) to service_role/i);
  assert.doesNotMatch(migration, /\b(delete|truncate|drop table|drop schema)\b/i);
});

test("rate limit helper hashes request actors and uses the server-only admin client", () => {
  assert.match(helper, /createHash\("sha256"\)/);
  assert.match(helper, /RATE_LIMIT_SALT/);
  assert.match(helper, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(helper, /createSupabaseAdmin/);
  assert.match(helper, /consume_app_rate_limit/);
  assert.match(helper, /p_actor_hash/);
  assert.match(helper, /allowed: true,[\s\S]*fallback: true/);
  assert.doesNotMatch(helper, /raw_ip|ip_address|user_agent_hashless/i);
});

test("abuse-prone posting and contact flows consume rate limits", () => {
  const aiRoute = readRepoFile("app", "api", "ai", "category-suggestion", "route.ts");
  const postingRoute = readRepoFile("app", "api", "posting", "suggest-category", "route.ts");
  const listingsAction = readRepoFile("lib", "actions", "listings.ts");
  const messagesAction = readRepoFile("lib", "actions", "messages.ts");
  const offersAction = readRepoFile("lib", "actions", "offers.ts");
  const reportsAction = readRepoFile("lib", "actions", "reports.ts");
  const inventoryAction = readRepoFile("lib", "actions", "inventory.ts");

  for (const [source, scope] of [
    [aiRoute, "ai.category_suggestion"],
    [postingRoute, "posting.category_suggestion"],
    [listingsAction, "listing.create"],
    [messagesAction, "message.send"],
    [messagesAction, "message.reply"],
    [offersAction, "offer.create"],
    [reportsAction, "report.listing"],
    [reportsAction, "report.conversation"],
    [inventoryAction, "inventory.claim"],
  ] as const) {
    assert.match(source, new RegExp(`scope:\\s*"${scope.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
  }

  assert.match(inventoryAction, /scope: `inventory\.contact\.\$\{eventType\}`/);
});
