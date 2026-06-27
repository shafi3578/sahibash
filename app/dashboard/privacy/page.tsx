import { requireUser } from "@/lib/auth";
import { DashboardSection } from "@/components/dashboard-section";
import { getCurrentLocale } from "@/lib/i18n/server";
import { getUiTranslations } from "@/lib/i18n/ui";

export default async function PrivacyTermsPage() {
  await requireUser();
  const locale = await getCurrentLocale();
  const ui = getUiTranslations(locale);

  return (
    <DashboardSection
      currentPath="/dashboard/privacy"
      title={ui.dashboard.privacyTerms}
      description={ui.dashboard.privacyTermsDescription}
    >
      <div className="space-y-3 text-sm text-[var(--ink-2)]">
        <p>{ui.dashboard.privacyPlaceholderPrimary}</p>
        <p>
          {ui.dashboard.privacyPlaceholderSecondary}
        </p>
      </div>
    </DashboardSection>
  );
}
