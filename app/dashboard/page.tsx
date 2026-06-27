import { requireUser } from "@/lib/auth";
import { DashboardSection } from "@/components/dashboard-section";
import { getCurrentLocale } from "@/lib/i18n/server";
import { getUiTranslations } from "@/lib/i18n/ui";

export default async function DashboardPage() {
  await requireUser();
  const locale = await getCurrentLocale();
  const ui = getUiTranslations(locale);

  return (
    <DashboardSection
      currentPath="/dashboard"
      title={ui.dashboard.myAccount}
      description={ui.dashboard.myAccountDescription}
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
          <h2 className="text-base font-semibold text-[var(--ink-1)]">{ui.dashboard.welcomeBack}</h2>
          <p className="mt-1 text-sm text-[var(--ink-2)]">
            {ui.dashboard.welcomeBackDescription}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--line)] bg-white p-4">
            <p className="text-sm font-semibold text-[var(--ink-1)]">{ui.dashboard.listingsActivity}</p>
            <p className="mt-1 text-sm text-[var(--ink-2)]">
              {ui.dashboard.listingsActivityDescription}
            </p>
          </div>

          <div className="rounded-xl border border-[var(--line)] bg-white p-4">
            <p className="text-sm font-semibold text-[var(--ink-1)]">{ui.dashboard.profileSecurity}</p>
            <p className="mt-1 text-sm text-[var(--ink-2)]">
              {ui.dashboard.profileSecurityDescription}
            </p>
          </div>
        </div>
      </div>
    </DashboardSection>
  );
}
