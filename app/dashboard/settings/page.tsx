import { requireUser } from "@/lib/auth";
import { DashboardSection } from "@/components/dashboard-section";

export default async function SettingsPage() {
  await requireUser();

  return (
    <DashboardSection
      currentPath="/dashboard/settings"
      title="Settings"
      description="Configure account preferences like language and notifications."
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
          <p className="font-semibold text-[var(--ink-1)]">Language</p>
          <p className="mt-1 text-sm text-[var(--ink-2)]">English is active. Dari and Pashto can be enabled next.</p>
        </div>
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
          <p className="font-semibold text-[var(--ink-1)]">Notifications</p>
          <p className="mt-1 text-sm text-[var(--ink-2)]">Saved-search and message notifications will be configurable here.</p>
        </div>
      </div>
    </DashboardSection>
  );
}
