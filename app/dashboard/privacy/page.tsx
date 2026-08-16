import { requireUser } from "@/lib/auth";
import { DashboardSection } from "@/components/dashboard-section";
import { getCurrentLocale } from "@/lib/i18n/server";
import { getUiTranslations } from "@/lib/i18n/ui";
import Link from "next/link";
import { localizePath } from "@/lib/i18n/routing";
import { USER_COPY } from "@/lib/i18n/user-copy";

export default async function PrivacyTermsPage() {
  await requireUser();
  const locale = await getCurrentLocale();
  const ui = getUiTranslations(locale);
  const copy = USER_COPY[locale];

  return (
    <DashboardSection
      currentPath="/dashboard/privacy"
      title={ui.dashboard.privacyTerms}
      description={ui.dashboard.privacyTermsDescription}
    >
      <div className="space-y-4 text-sm text-[var(--ink-2)]">
        <section><h2 className="font-semibold text-[var(--ink-1)]">{copy.info.privacy.title}</h2><p className="mt-1 leading-7">{copy.info.privacy.body}</p></section>
        <section><h2 className="font-semibold text-[var(--ink-1)]">{copy.info.terms.title}</h2><p className="mt-1 leading-7">{copy.info.terms.body}</p></section>
        <div className="flex flex-wrap gap-2">
          <Link href={localizePath("/privacy", locale)} className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 font-semibold">{copy.info.privacy.title}</Link>
          <Link href={localizePath("/terms", locale)} className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 font-semibold">{copy.info.terms.title}</Link>
          <Link href={localizePath("/safety", locale)} className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 font-semibold">{copy.info.safety.title}</Link>
        </div>
      </div>
    </DashboardSection>
  );
}
