"use client";

import { useEffect, useSyncExternalStore } from "react";
import { normalizeLocaleInput } from "@/lib/i18n/routing";
import { USER_COPY } from "@/lib/i18n/user-copy";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const locale = useSyncExternalStore(
    () => () => undefined,
    () => normalizeLocaleInput(document.documentElement.lang) ?? "en",
    () => "en" as const,
  );
  useEffect(() => {
    console.error(error);
  }, [error]);
  const copy = USER_COPY[locale];
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 items-center px-4 py-16 text-center">
      <section className="w-full rounded-2xl border border-[var(--line)] bg-white p-8">
        <h1 className="font-display text-2xl font-bold">{copy.errorTitle}</h1>
        <p className="mt-2 text-[var(--ink-2)]">{copy.errorDescription}</p>
        <button type="button" onClick={reset} className="mt-6 rounded-xl bg-[var(--ink-1)] px-4 py-2 text-sm font-semibold text-white">{copy.tryAgain}</button>
      </section>
    </main>
  );
}
