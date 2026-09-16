import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const directory = join(process.cwd(), "supabase", "migrations");
const filenames = readdirSync(directory).filter((name) => name.endsWith("_social_interaction_integrity.sql"));
assert.equal(filenames.length, 1);
const migration = readFileSync(join(directory, filenames[0]), "utf8");
const body = (name: string) => {
  const start = migration.indexOf(`create or replace function ${name}(`);
  assert.ok(start >= 0, name);
  return migration.slice(start, migration.indexOf("$$;", start) + 3);
};

test("social hardening preserves existing RLS scopes and revokes non-RLS-protected operations", () => {
  assert.match(migration, /revoke truncate, trigger, references on public\.messages, public\.reports from anon, authenticated/);
  assert.doesNotMatch(migration, /(?:create|drop|alter) policy/i);
  assert.doesNotMatch(migration, /disable row level security|truncate table|delete from public\.(?:messages|reports|listings)/i);
  for (const name of ["guard_message_integrity", "adjust_message_count", "guard_block_insert", "remove_blocked_follows", "guard_report_integrity"]) {
    assert.match(migration, new RegExp(`revoke all on function private\\.${name}\\(\\) from public, anon, authenticated, service_role`));
    assert.match(body(`private.${name}`), /set search_path = ''/);
  }
});

test("trigger-owned message count uses the same accountable publication boundary", () => {
  const counter = body("private.adjust_message_count");
  assert.match(counter, /security definer/);
  assert.match(counter, /new\.sender_user_id is distinct from auth\.uid\(\)/);
  assert.match(counter, /set messages_count = listing\.messages_count \+ 1/);
  assert.match(counter, /listing\.user_id in \(new\.sender_user_id, new\.recipient_user_id\)/);
  assert.match(counter, /listing\.status = 'approved'/);
  assert.match(counter, /listing\.publication_status = 'published'/);
  assert.match(counter, /listing\.source_type = 'native' or listing\.ownership_status = 'claimed'/);
  assert.match(counter, /if not found then/);
  assert.doesNotMatch(counter, /set (?:status|publication_status|featured|urgent|approved_at)\s*=/);
});

test("block creation serializes with messages and follows before atomic reciprocal cleanup", () => {
  for (const name of ["public.enforce_message_block_boundary", "public.enforce_follow_block_boundary", "private.guard_block_insert"]) {
    const guard = body(name);
    assert.match(guard, /volatile/);
    assert.match(guard, /perform private\.lock_social_pair/);
    assert.match(guard, /auth\.uid\(\) is null/);
  }
  assert.match(body("private.lock_social_pair"), /pg_advisory_xact_lock/);
  assert.match(body("private.lock_social_pair"), /least\(first_user, second_user\).*greatest\(first_user, second_user\)/);
  const action = readFileSync(join(process.cwd(), "lib/actions/social.ts"), "utf8")
    .split("export async function blockUserAction")[1]
    .split("export async function unblockUserAction")[0];
  assert.match(action, /requireUser\(\)/);
  assert.match(action, /consumeRateLimit/);
  assert.match(action, /from\("user_blocks"\)\.insert/);
  assert.doesNotMatch(action, /from\("user_follows"\)/);
});

test("message attribution and original report evidence cannot be rewritten", () => {
  const message = body("private.guard_message_integrity");
  assert.match(message, /new\.status is distinct from 'sent'::public\.message_status/);
  assert.match(message, /new\.read_at is not null/);
  assert.match(message, /new\.created_at := now\(\)/);
  assert.match(message, /row\(new\.id, new\.listing_id, new\.sender_user_id, new\.recipient_user_id, new\.body, new\.created_at\)/);
  assert.match(message, /new\.read_at := case/);
  const report = body("private.guard_report_integrity");
  assert.match(report, /new\.status is distinct from 'open'::public\.report_status/);
  assert.match(report, /private\.is_aal2\(\) and public\.is_admin\(actor_id\)/);
  assert.match(report, /row\(new\.id, new\.listing_id, new\.reporter_user_id, new\.reason, new\.details, new\.created_at\)/);
  assert.match(report, /new\.resolved_by := actor_id/);
  assert.match(report, /new\.resolved_at := now\(\)/);
});
