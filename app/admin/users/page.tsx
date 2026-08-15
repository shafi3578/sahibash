import { requirePermission } from "@/lib/auth";
import { adminAssignUserRoleAction } from "@/lib/actions/admin-rbac";
import { getAdminRoleRows, getAdminUserRows } from "@/lib/data/admin-rbac";

export default async function AdminUsersPage() {
  await requirePermission("users.view");
  const [users, roles] = await Promise.all([getAdminUserRows(), getAdminRoleRows()]);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold">Admin users</h1>
      <p className="mt-1 text-[var(--ink-2)]">User listing with role metadata and account-level visibility.</p>

      <section className="mt-6 rounded-2xl border border-[var(--line)] bg-white p-4">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] text-[var(--ink-2)]">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Legacy role</th>
                <th className="py-2 pr-4">RBAC roles</th>
                <th className="py-2 pr-4">Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-[var(--line)] last:border-none">
                  <td className="py-3 pr-4">{user.full_name ?? "—"}</td>
                  <td className="py-3 pr-4">{user.email ?? "—"}</td>
                  <td className="py-3 pr-4">{user.role}</td>
                  <td className="py-3 pr-4">
                    {user.assigned_roles.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {user.assigned_roles.map((roleName) => (
                          <span key={`${user.id}-${roleName}`} className="rounded-full border border-[var(--line)] px-2 py-1 text-xs font-medium">
                            {roleName}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[var(--ink-2)]">None</span>
                    )}
                  </td>
                  <td className="py-3 pr-4">{new Date(user.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-[var(--line)] bg-white p-4">
        <h2 className="font-display text-xl font-bold">Assign role to user</h2>
        <form action={adminAssignUserRoleAction} className="mt-3 grid gap-3 md:grid-cols-2">
          <select name="user_id" className="rounded-xl border border-[var(--line)] px-3 py-2" defaultValue="">
            <option value="">Select user</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>{user.email ?? user.full_name ?? user.id}</option>
            ))}
          </select>
          <select name="role_id" className="rounded-xl border border-[var(--line)] px-3 py-2" defaultValue="">
            <option value="">Select role</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>{role.name}</option>
            ))}
          </select>
          <div className="md:col-span-2">
            <button type="submit" className="rounded-xl bg-[var(--ink-1)] px-4 py-2 text-sm font-semibold text-white">
              Submit assignment
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
