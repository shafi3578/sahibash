import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { DashboardSection } from "@/components/dashboard-section";
import { getCurrentLocale } from "@/lib/i18n/server";
import { localizePath } from "@/lib/i18n/routing";
import { USER_COPY } from "@/lib/i18n/user-copy";

export default async function AccountSecurityPage() {
  await requireUser();
  const locale = await getCurrentLocale();
  const copy = USER_COPY[locale];

  return (
    <DashboardSection
      currentPath="/dashboard/account-security"
      title={copy.accountSecurity}
      description={copy.accountSecurityDescription}
    >
      <div className="space-y-3">
        <p className="text-sm text-[var(--ink-2)]">
          {copy.resetPasswordHelp}
        </p>
        <Link
          href={localizePath("/reset-password", locale)}
          className="inline-flex rounded-lg bg-[var(--ink-1)] px-4 py-2 text-sm font-semibold text-white"
        >
          {copy.resetPassword}
        </Link>
      </div>
    </DashboardSection>
  );
}
