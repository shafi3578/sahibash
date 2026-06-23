import { requireUser } from "@/lib/auth";
import { DashboardSection } from "@/components/dashboard-section";

export default async function AccountInformationPage() {
  const user = await requireUser();

  return (
    <DashboardSection
      currentPath="/dashboard/account-information"
      title="Account Information"
      description="Manage your personal and contact information."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-2)]">User ID</p>
          <p className="mt-1 text-sm text-[var(--ink-1)]">{user.id}</p>
        </div>
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-2)]">Email</p>
          <p className="mt-1 text-sm text-[var(--ink-1)]">{user.email ?? "Not available"}</p>
        </div>
      </div>
    </DashboardSection>
  );
}
