import test from "node:test";
import assert from "node:assert/strict";

import { buildRoleSummaryRows } from "../lib/data/admin-rbac";

test("buildRoleSummaryRows groups permissions and user counts correctly", () => {
  const rows = buildRoleSummaryRows({
    roles: [
      { id: 1, name: "admin", description: "Base admin role", created_at: "2024-01-01", updated_at: "2024-01-02" },
    ],
    permissions: [
      { id: 11, key: "users.view", description: "View user profiles" },
      { id: 12, key: "roles.manage", description: "Manage roles" },
    ],
    rolePermissions: [
      { role_id: 1, permission_id: 11 },
      { role_id: 1, permission_id: 12 },
    ],
    userAssignments: [
      { role_id: 1, user_id: "user-1" },
      { role_id: 1, user_id: "user-2" },
    ],
  });

  assert.equal(rows.length, 1);
  assert.equal(rows[0].user_count, 2);
  assert.deepEqual(
    rows[0].permissions.map((permission) => permission.key),
    ["roles.manage", "users.view"],
  );
});
