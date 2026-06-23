import type { ReactNode } from "react";
import { AccountMenu } from "@/components/account-menu";

export function DashboardSection({
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
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold">{title}</h1>
      <p className="mt-1 text-[var(--ink-2)]">{description}</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <AccountMenu currentPath={currentPath} />
        <section className="rounded-2xl border border-[var(--line)] bg-white p-4 sm:p-5">
          {children}
        </section>
      </div>
    </main>
  );
}
