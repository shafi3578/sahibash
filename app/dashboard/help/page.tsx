import { requireUser } from "@/lib/auth";
import { DashboardSection } from "@/components/dashboard-section";
import { getDictionary } from "@/lib/i18n/server";
import { getUiTranslations } from "@/lib/i18n/ui";
import { DASHBOARD_COPY } from "@/lib/i18n/dashboard-copy";

export default async function HelpCenterPage() {
  await requireUser();
  const { locale } = await getDictionary();
  const ui = getUiTranslations(locale);
  const copy = DASHBOARD_COPY[locale];

  return (
    <DashboardSection
      currentPath="/dashboard/help"
      title={ui.dashboard.helpCenter}
      description={ui.dashboard.helpCenterDescription}
    >
      <ul className="space-y-2 text-sm text-[var(--ink-2)]">
        <li>{copy.helpPost}</li>
        <li>{copy.helpModeration}</li>
        <li>{copy.helpReport}</li>
        <li>{copy.helpContact}</li>
      </ul>
    </DashboardSection>
  );
}
