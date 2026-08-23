import { requireUser } from "@/lib/auth";
import { DashboardSection } from "@/components/dashboard-section";
import { getCurrentLocale } from "@/lib/i18n/server";
import { USER_COPY } from "@/lib/i18n/user-copy";
import { ACCOUNT_EXPERIENCE_COPY } from "@/lib/account/copy";

export default async function AccountSafetyPage() {
  await requireUser();
  const locale = await getCurrentLocale();
  const copy = ACCOUNT_EXPERIENCE_COPY[locale];
  const safety = USER_COPY[locale].info.safety;

  return (
    <DashboardSection
      currentPath="/dashboard/safety"
      title={copy.safety}
      description={copy.safetyDescription}
    >
      <article className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
        <h2 className="font-display text-xl font-bold text-[var(--ink-1)]">{safety.title}</h2>
        <p className="mt-2 text-sm font-semibold text-[var(--ink-1)]">{safety.intro}</p>
        <p className="mt-3 text-sm leading-7 text-[var(--ink-2)]">{safety.body}</p>
      </article>
    </DashboardSection>
  );
}
