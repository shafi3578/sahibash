import { requireUser } from "@/lib/auth";
import { DashboardSection } from "@/components/dashboard-section";
import { getCurrentLocale } from "@/lib/i18n/server";
import { getUiTranslations } from "@/lib/i18n/ui";

export default async function SettingsPage() {
  await requireUser();
  const locale = await getCurrentLocale();
  const ui = getUiTranslations(locale);

  return (
    <DashboardSection
      currentPath="/dashboard/settings"
      title={ui.dashboard.settings}
      description={ui.dashboard.settingsDescription}
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
          <p className="font-semibold text-[var(--ink-1)]">{ui.dashboard.settingsLanguageTitle}</p>
          <p className="mt-1 text-sm text-[var(--ink-2)]">{ui.dashboard.settingsLanguageDescription}</p>
        </div>
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
          <p className="font-semibold text-[var(--ink-1)]">{ui.dashboard.settingsNotificationsTitle}</p>
          <p className="mt-1 text-sm text-[var(--ink-2)]">{ui.dashboard.settingsNotificationsDescription}</p>
        </div>
      </div>
    </DashboardSection>
  );
}
