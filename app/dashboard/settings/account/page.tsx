import { requireUser } from "@/lib/auth";
import { DashboardSection } from "@/components/dashboard-section";
import { getCurrentLocale } from "@/lib/i18n/server";
import { ACCOUNT_EXPERIENCE_COPY } from "@/lib/account/copy";

export default async function AccountManagementSettingsPage() {
  await requireUser();
  const locale = await getCurrentLocale();
  const copy = ACCOUNT_EXPERIENCE_COPY[locale];

  return (
    <DashboardSection
      currentPath="/dashboard/settings"
      title={copy.accountManagement}
      description={copy.accountManagementDescription}
    >
      <div className="space-y-4">
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
          <h2 className="font-semibold text-[var(--ink-1)]">{copy.accountManagement}</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--ink-2)]">{copy.logoutNotice}</p>
        </section>

        <section className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <h2 className="font-semibold text-red-800">{copy.deletionTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-red-800">{copy.deletionDescription}</p>
          <p className="mt-2 text-sm leading-6 text-red-700">{copy.deletionUnavailable}</p>
        </section>
      </div>
    </DashboardSection>
  );
}
