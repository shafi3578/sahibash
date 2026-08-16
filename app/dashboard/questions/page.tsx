import { requireUser } from "@/lib/auth";
import { DashboardSection } from "@/components/dashboard-section";
import { getDictionary } from "@/lib/i18n/server";
import { getUiTranslations } from "@/lib/i18n/ui";
import { DASHBOARD_COPY } from "@/lib/i18n/dashboard-copy";

export default async function QuestionsPage() {
  await requireUser();
  const { locale } = await getDictionary();
  const ui = getUiTranslations(locale);
  const copy = DASHBOARD_COPY[locale];

  return (
    <DashboardSection
      currentPath="/dashboard/questions"
      title={ui.dashboard.questionsAnswers}
      description={ui.dashboard.questionsAnswersDescription}
    >
      <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface-2)] p-5">
        <p className="font-semibold text-[var(--ink-1)]">{copy.noQa}</p>
        <p className="mt-1 text-sm text-[var(--ink-2)]">
          {copy.qaHelp}
        </p>
      </div>
    </DashboardSection>
  );
}
