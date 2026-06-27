import { requireUser } from "@/lib/auth";
import { DashboardSection } from "@/components/dashboard-section";

export default async function DashboardPage() {
  await requireUser();

  return (
    <DashboardSection
      currentPath="/dashboard"
      title="My Account"
      description="Manage your listings, favorites, messages, offers, and account settings."
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
          <h2 className="text-base font-semibold text-[var(--ink-1)]">Welcome back</h2>
          <p className="mt-1 text-sm text-[var(--ink-2)]">
            Use the account menu to open each section. This page is now a summary view to avoid duplicated navigation blocks.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--line)] bg-white p-4">
            <p className="text-sm font-semibold text-[var(--ink-1)]">Listings and activity</p>
            <p className="mt-1 text-sm text-[var(--ink-2)]">
              Track your listings, messages, questions, and offers from the menu on the left.
            </p>
          </div>

          <div className="rounded-xl border border-[var(--line)] bg-white p-4">
            <p className="text-sm font-semibold text-[var(--ink-1)]">Profile and security</p>
            <p className="mt-1 text-sm text-[var(--ink-2)]">
              Update account information, password, privacy choices, and preferences in one place.
            </p>
          </div>
        </div>
      </div>
    </DashboardSection>
  );
}
