import { requireUser } from "@/lib/auth";
import { DashboardSection } from "@/components/dashboard-section";
import { getCurrentLocale } from "@/lib/i18n/server";
import { setLocaleAction } from "@/lib/actions/i18n";
import { ACCOUNT_EXPERIENCE_COPY, languageName } from "@/lib/account/copy";
import type { AppLocale } from "@/lib/i18n/translations";

const LOCALE_OPTIONS: AppLocale[] = ["en", "fa", "ps"];

export default async function AccountLanguageSettingsPage() {
  await requireUser();
  const locale = await getCurrentLocale();
  const copy = ACCOUNT_EXPERIENCE_COPY[locale];

  return (
    <DashboardSection
      currentPath="/dashboard/settings"
      title={copy.language}
      description={copy.languageDescription}
    >
      <form action={setLocaleAction} className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
        <input type="hidden" name="returnTo" value="/dashboard/settings/language" />
        <p className="text-sm font-semibold text-[var(--ink-1)]">
          {copy.currentLanguage}: {languageName(locale)}
        </p>
        <fieldset className="mt-4 grid gap-3 sm:grid-cols-3">
          <legend className="sr-only">{copy.language}</legend>
          {LOCALE_OPTIONS.map((option) => (
            <label key={option} className="flex min-h-12 items-center gap-3 rounded-xl border border-[var(--line)] bg-white px-3 text-sm font-semibold">
              <input type="radio" name="locale" value={option} defaultChecked={option === locale} />
              {languageName(option)}
            </label>
          ))}
        </fieldset>
        <button className="mt-4 min-h-11 rounded-xl bg-[var(--ink-1)] px-4 text-sm font-bold text-white">
          {copy.saveLanguage}
        </button>
      </form>
    </DashboardSection>
  );
}
