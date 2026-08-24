import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { MfaSetupPanel } from "@/components/account/mfa-setup-panel";
import { DashboardSection } from "@/components/dashboard-section";
import { getCurrentLocale } from "@/lib/i18n/server";
import { localizePath } from "@/lib/i18n/routing";
import { USER_COPY } from "@/lib/i18n/user-copy";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AccountSecurityPage({
  searchParams,
}: {
  searchParams?: Promise<{ reason?: string }>;
}) {
  const user = await requireUser();
  const resolvedSearchParams = await searchParams;
  const locale = await getCurrentLocale();
  const copy = USER_COPY[locale];
  const supabase = await createSupabaseServerClient();
  const [{ data: isSuperAdmin }, { data: aal }] = await Promise.all([
    supabase.rpc("is_super_administrator", { uid: user.id }),
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
  ]);

  return (
    <DashboardSection
      currentPath="/dashboard/account-security"
      title={copy.accountSecurity}
      description={copy.accountSecurityDescription}
    >
      <div className="space-y-6">
        <MfaSetupPanel
          locale={locale}
          isPrivilegedUser={isSuperAdmin === true}
          securityRedirect={resolvedSearchParams?.reason === "security"}
          initialCurrentLevel={aal?.currentLevel ?? null}
          initialNextLevel={aal?.nextLevel ?? null}
        />

        <div className="space-y-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
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
      </div>
    </DashboardSection>
  );
}
