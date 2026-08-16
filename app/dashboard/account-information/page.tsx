import { requireUser } from "@/lib/auth";
import { DashboardSection } from "@/components/dashboard-section";
import { getDictionary } from "@/lib/i18n/server";
import { getUiTranslations } from "@/lib/i18n/ui";
import { DASHBOARD_COPY } from "@/lib/i18n/dashboard-copy";

export default async function AccountInformationPage() {
  const user = await requireUser();
  const { locale } = await getDictionary();
  const ui = getUiTranslations(locale);
  const copy = DASHBOARD_COPY[locale];

  return (
    <DashboardSection
      currentPath="/dashboard/account-information"
      title={ui.dashboard.accountInformation}
      description={ui.dashboard.accountInformationDescription}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-2)]">{copy.userId}</p>
          <p className="mt-1 text-sm text-[var(--ink-1)]">{user.id}</p>
        </div>
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-2)]">{copy.email}</p>
          <p className="mt-1 text-sm text-[var(--ink-1)]">{user.email ?? copy.unavailable}</p>
        </div>
      </div>
    </DashboardSection>
  );
}
