import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const migration = readFileSync(join(process.cwd(), "supabase", "migrations", "20260916080840_admin_mutation_mfa_policy_boundary.sql"), "utf8");
const match = migration.match(/\$reviewed_policy_snapshot\$([\s\S]*?)\$reviewed_policy_snapshot\$/);
assert.ok(match, "An exact reviewed policy snapshot must be embedded");

type ReviewedPolicy = {
  schemaname: string;
  tablename: string;
  policyname: string;
  cmd: string;
  roles: string;
  permissive: string;
  qual: string | null;
  with_check: string | null;
  strategy: string;
  new_using: string | null;
  new_check: string | null;
};

const policies = JSON.parse(match[1]) as ReviewedPolicy[];
const aal2 = "( SELECT private.is_aal2() AS is_aal2)";
const admin = "( SELECT is_admin(( SELECT auth.uid() AS uid)) AS is_admin)";
const moderator = "has_admin_permission(( SELECT auth.uid() AS uid), 'listings.moderate'::text)";
const storageAdmin = "is_admin(auth.uid())";

test("MFA migration targets only the reviewed mutation policies", () => {
  assert.equal(policies.length, 119);
  assert.equal(new Set(policies.map((p) => `${p.schemaname}.${p.tablename}.${p.policyname}`)).size, 119);
  assert.equal(policies.filter((p) => p.strategy === "split_admin_all").length, 28);
  assert.equal(policies.filter((p) => p.strategy === "gate_admin_operation").length, 66);
  assert.equal(policies.filter((p) => p.strategy === "gate_admin_branch").length, 25);
  assert.equal(policies.filter((p) => p.schemaname === "storage").length, 3);
  assert.ok(policies.every((p) => p.cmd !== "SELECT"));
  assert.ok(policies.every((p) => !`${p.qual} ${p.with_check}`.includes("is_aal2")));
  assert.ok(policies.every((p) => !["listing_notes", "saved_searches", "wanted_requests"].includes(p.tablename)));
});

test("MFA branch changes preserve every original owner and participant predicate exactly", () => {
  for (const policy of policies.filter((p) => p.strategy === "gate_admin_branch")) {
    for (const [before, after] of [[policy.qual, policy.new_using], [policy.with_check, policy.new_check]]) {
      if (before === null) {
        assert.equal(after, null);
        continue;
      }
      assert.ok(after);
      assert.ok(after.includes(aal2), policy.policyname);
      const withoutAdminGate = [admin, moderator, storageAdmin].reduce(
        (expression, branch) => expression.split(`(${aal2} AND ${branch})`).join(branch),
        after,
      );
      assert.equal(withoutAdminGate, before, policy.policyname);
    }
  }
});

test("Admin-only mutations add MFA without replacing existing authorization", () => {
  for (const policy of policies.filter((p) => p.strategy !== "gate_admin_branch")) {
    if (policy.qual !== null) {
      assert.equal(policy.new_using, `(${aal2} AND (${policy.qual}))`, policy.policyname);
    }
    const effectiveCheck = policy.with_check ?? (["ALL", "UPDATE"].includes(policy.cmd) ? policy.qual : null);
    if (effectiveCheck !== null) {
      assert.equal(policy.new_check, `(${aal2} AND (${effectiveCheck}))`, policy.policyname);
    }
  }
});

test("Migration validates drift before changes and preserves ALL-policy SELECT semantics", () => {
  for (const field of ["cmd", "permissive", "roles::text", "qual", "with_check"]) {
    assert.ok(migration.includes(`actual.${field} is distinct from`));
  }
  assert.ok(migration.indexOf("raise exception 'Policy drift") < migration.indexOf("execute format('drop policy"));
  assert.match(migration, /for select to %s using \(%s\)/);
  assert.match(migration, /roles_sql, target->>'qual'/);
  assert.doesNotMatch(migration, /create or replace function|alter table|update public\.|delete from public\./i);
  assert.doesNotMatch(migration, /regexp_replace\s*\(/i);
});
