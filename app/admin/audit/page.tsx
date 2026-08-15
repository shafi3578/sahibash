import { requirePermission } from "@/lib/auth";
import { getAuditLogRows } from "@/lib/data/admin-rbac";

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams?: { action?: string; entity?: string };
}) {
  await requirePermission("audit_logs.view");
  const actionFilter = typeof searchParams?.action === "string" ? searchParams.action : "";
  const entityFilter = typeof searchParams?.entity === "string" ? searchParams.entity : "";
  const logs = await getAuditLogRows(100, {
    action: actionFilter || undefined,
    entityType: entityFilter || undefined,
  });

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold">Audit log</h1>
      <p className="mt-1 text-[var(--ink-2)]">Recent administrative actions and configuration changes.</p>

      <section className="mt-6 rounded-2xl border border-[var(--line)] bg-white p-4">
        <form method="get" className="mb-4 grid gap-3 md:grid-cols-2">
          <select name="action" defaultValue={actionFilter} className="rounded-xl border border-[var(--line)] px-3 py-2">
            <option value="">All actions</option>
            <option value="ROLE_UPDATED">ROLE_UPDATED</option>
            <option value="CATEGORY_CREATED">CATEGORY_CREATED</option>
            <option value="CATEGORY_UPDATED">CATEGORY_UPDATED</option>
            <option value="CATEGORY_ARCHIVED">CATEGORY_ARCHIVED</option>
            <option value="LISTING_APPROVED">LISTING_APPROVED</option>
            <option value="LISTING_REJECTED">LISTING_REJECTED</option>
          </select>
          <select name="entity" defaultValue={entityFilter} className="rounded-xl border border-[var(--line)] px-3 py-2">
            <option value="">All entities</option>
            <option value="category">category</option>
            <option value="admin_role">admin_role</option>
            <option value="admin_user_role">admin_user_role</option>
            <option value="admin_role_permission">admin_role_permission</option>
            <option value="listing">listing</option>
          </select>
          <div className="md:col-span-2">
            <button className="rounded-xl bg-[var(--ink-1)] px-4 py-2 text-sm font-semibold text-white">Apply filters</button>
          </div>
        </form>

        <div className="space-y-3">
          {logs.length === 0 ? (
            <p className="text-sm text-[var(--ink-2)]">No audit events recorded yet.</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">{log.action}</p>
                  <span className="text-xs text-[var(--ink-2)]">{new Date(log.created_at).toLocaleString()}</span>
                </div>
                <div className="mt-2 space-y-1 text-sm text-[var(--ink-2)]">
                  <p>Actor: {log.admin_user_id}</p>
                  <p>Entity: {log.entity_type} / {log.entity_id ?? "n/a"}</p>
                  {log.safe_changes ? (
                    <pre className="overflow-auto rounded-lg border border-[var(--line)] bg-white p-2 text-xs text-slate-700">
                      {JSON.stringify(log.safe_changes, null, 2)}
                    </pre>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
