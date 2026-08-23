import type { ReactNode } from "react";
import Link from "next/link";
import { AccountMenu } from "@/components/account-menu";
import { getCurrentLocale } from "@/lib/i18n/server";
import { localizePath } from "@/lib/i18n/routing";
import { ACCOUNT_EXPERIENCE_COPY } from "@/lib/account/copy";

export async function DashboardSection({
  currentPath,
  title,
  description,
  children,
}: {
  currentPath: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  const locale = await getCurrentLocale();
  const copy = ACCOUNT_EXPERIENCE_COPY[locale];
  const showMobileBack = currentPath !== "/dashboard";
  const backArrow = locale === "en" ? "←" : "→";

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {showMobileBack ? (
        <Link href={localizePath("/dashboard", locale)} className="mb-4 inline-flex min-h-11 items-center rounded-xl border border-[var(--line)] bg-white px-3 text-sm font-semibold text-[var(--ink-1)] lg:hidden">
          {backArrow} {copy.backToAccount}
        </Link>
      ) : null}
      <h1 className="font-display text-3xl font-bold">{title}</h1>
      <p className="mt-1 text-[var(--ink-2)]">{description}</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="hidden lg:block">
          <AccountMenu currentPath={currentPath} />
        </div>
        <section className="rounded-2xl border border-[var(--line)] bg-white p-4 sm:p-5">
          {children}
        </section>
      </div>
    </main>
  );
}
