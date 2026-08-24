import { requirePermission } from "@/lib/auth";
import {
  adminAssignPermissionToRoleAction,
  adminAssignUserRoleAction,
  adminCreateRoleAction,
  adminRemovePermissionFromRoleAction,
} from "@/lib/actions/admin-rbac";
import { getAdminPermissionRows, getAdminRoleRows, getSuperAdminMfaReadinessRows } from "@/lib/data/admin-rbac";

export default async function AdminRolesPage() {
  await requirePermission("roles.view");
  const [roles, permissions, mfaReadiness] = await Promise.all([
    getAdminRoleRows(),
    getAdminPermissionRows(),
    getSuperAdminMfaReadinessRows(),
  ]);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold">Admin roles</h1>
      <p className="mt-1 text-[var(--ink-2)]">Manage role assignments and permission groups.</p>

      <section className="mt-6 rounded-2xl border border-[var(--line)] bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold">Super-admin MFA readiness</h2>
            <p className="mt-1 text-sm text-[var(--ink-2)]">
              Every super administrator should have at least one verified MFA factor before launch.
            </p>
          </div>
          <span className="rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-3 py-1 text-xs font-bold">
            {mfaReadiness.filter((row) => row.is_ready).length}/{mfaReadiness.length} ready
          </span>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-[var(--line)]">
          {mfaReadiness.length === 0 ? (
            <p className="p-3 text-sm text-[var(--ink-2)]">
              MFA readiness data is unavailable. Confirm the server has the Supabase service-role key before launch verification.
            </p>
          ) : (
            <div className="divide-y divide-[var(--line)]">
              {mfaReadiness.map((row) => (
                <div key={row.user_id} className="grid gap-2 p-3 text-sm md:grid-cols-[1fr_auto_auto] md:items-center">
                  <div>
                    <p className="font-semibold">{row.full_name || row.email || row.user_id}</p>
                    <p className="text-xs text-[var(--ink-2)]">{row.email ?? row.user_id}</p>
                  </div>
                  <span className="text-xs text-[var(--ink-2)]">{row.verified_factor_count} verified factors</span>
                  <span className={`rounded-full px-2 py-1 text-xs font-bold ${row.is_ready ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>
                    {row.is_ready ? "Ready" : "Needs MFA"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[var(--line)] bg-white p-4">
          <h2 className="font-display text-xl font-bold">Create role</h2>
          <form action={adminCreateRoleAction} className="mt-3 grid gap-3">
            <input name="name" placeholder="Role name" required className="rounded-xl border border-[var(--line)] px-3 py-2" />
            <textarea name="description" placeholder="Role description" className="min-h-20 rounded-xl border border-[var(--line)] px-3 py-2" />
            <button className="rounded-xl bg-[var(--ink-1)] px-4 py-2 text-sm font-semibold text-white">Create role</button>
          </form>
        </section>

        <section className="rounded-2xl border border-[var(--line)] bg-white p-4">
          <h2 className="font-display text-xl font-bold">Assign user role</h2>
          <form action={adminAssignUserRoleAction} className="mt-3 grid gap-3">
            <input name="user_id" placeholder="User UUID" required className="rounded-xl border border-[var(--line)] px-3 py-2" />
            <select name="role_id" required className="rounded-xl border border-[var(--line)] px-3 py-2">
              <option value="">Select role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
            <button className="rounded-xl bg-[var(--ink-1)] px-4 py-2 text-sm font-semibold text-white">Assign role</button>
          </form>
        </section>

        <section className="rounded-2xl border border-[var(--line)] bg-white p-4 lg:col-span-2">
          <h2 className="font-display text-xl font-bold">Assign permission to role</h2>
          <form action={adminAssignPermissionToRoleAction} className="mt-3 grid gap-3 md:grid-cols-2">
            <select name="role_id" required className="rounded-xl border border-[var(--line)] px-3 py-2">
              <option value="">Select role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
            <select name="permission_id" required className="rounded-xl border border-[var(--line)] px-3 py-2">
              <option value="">Select permission</option>
              {permissions.map((permission) => (
                <option key={permission.id} value={permission.id}>{permission.key}</option>
              ))}
            </select>
            <div className="md:col-span-2">
              <button className="rounded-xl bg-[var(--ink-1)] px-4 py-2 text-sm font-semibold text-white">Assign permission</button>
            </div>
          </form>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-[var(--line)] bg-white p-4">
        <h2 className="font-display text-xl font-bold">Roles</h2>
        <div className="mt-4 space-y-4">
          {roles.map((role) => (
            <div key={role.id} className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{role.name}</p>
                  {role.description ? <p className="text-sm text-[var(--ink-2)]">{role.description}</p> : null}
                </div>
                <span className="rounded-full border border-[var(--line)] bg-white px-2 py-1 text-xs font-semibold">
                  {role.user_count} users
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {role.permissions.length === 0 ? (
                  <span className="text-xs text-[var(--ink-2)]">No permissions assigned</span>
                ) : (
                  role.permissions.map((permission) => (
                    <form key={permission.id} action={adminRemovePermissionFromRoleAction} className="inline-flex items-center gap-2 rounded-full bg-[var(--ink-1)]/10 px-2 py-1">
                      <input type="hidden" name="role_id" value={role.id} />
                      <input type="hidden" name="permission_id" value={permission.id} />
                      <span className="text-xs font-medium text-[var(--ink-1)]">{permission.key}</span>
                      <button type="submit" className="text-[10px] font-semibold text-red-600">remove</button>
                    </form>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
