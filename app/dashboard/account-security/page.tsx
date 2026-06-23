import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { DashboardSection } from "@/components/dashboard-section";

export default async function AccountSecurityPage() {
  await requireUser();

  return (
    <DashboardSection
      currentPath="/dashboard/account-security"
      title="Account Security"
      description="Manage password and account security preferences."
    >
      <div className="space-y-3">
        <p className="text-sm text-[var(--ink-2)]">
          You can reset your password securely using the password reset flow.
        </p>
        <Link
          href="/reset-password"
          className="inline-flex rounded-lg bg-[var(--ink-1)] px-4 py-2 text-sm font-semibold text-white"
        >
          Reset Password
        </Link>
      </div>
    </DashboardSection>
  );
}
