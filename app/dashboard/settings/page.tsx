import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { DashboardSection } from "@/components/dashboard-section";
import { getCurrentLocale } from "@/lib/i18n/server";
import { getUiTranslations } from "@/lib/i18n/ui";
import { localizePath } from "@/lib/i18n/routing";
import { ACCOUNT_EXPERIENCE_COPY } from "@/lib/account/copy";

export default async function SettingsPage() {
  await requireUser();
  const locale = await getCurrentLocale();
  const ui = getUiTranslations(locale);
  const copy = ACCOUNT_EXPERIENCE_COPY[locale];

  const settingCards = [
    { title: copy.language, description: copy.languageDescription, href: "/dashboard/settings/language" },
    { title: copy.notifications, description: copy.notificationsDescription, href: "/dashboard/settings/notifications" },
    { title: copy.privacySecurity, description: copy.privacySecurityDescription, href: "/dashboard/account-security" },
    { title: copy.accountManagement, description: copy.accountManagementDescription, href: "/dashboard/settings/account" },
  ];

  return (
    <DashboardSection
      currentPath="/dashboard/settings"
      title={ui.dashboard.settings}
      description={copy.settingsHubDescription}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {settingCards.map((card) => (
          <Link key={card.href} href={localizePath(card.href, locale)} className="group rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4 transition hover:border-[var(--ink-1)] hover:bg-white">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-[var(--ink-1)]">{card.title}</h2>
                <p className="mt-1 text-sm leading-6 text-[var(--ink-2)]">{card.description}</p>
              </div>
              <span className="shrink-0 rounded-full bg-white px-2 py-1 text-xs font-bold text-[var(--ink-2)] group-hover:bg-[var(--ink-1)] group-hover:text-white">
                {copy.open}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </DashboardSection>
  );
}
