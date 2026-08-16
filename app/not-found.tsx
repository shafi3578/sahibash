import Link from "next/link";
import { getCurrentLocale } from "@/lib/i18n/server";
import { localizePath } from "@/lib/i18n/routing";
import { USER_COPY } from "@/lib/i18n/user-copy";

export default async function NotFoundPage() {
  const locale = await getCurrentLocale();
  const copy = USER_COPY[locale];
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 items-center px-4 py-16 text-center">
      <section className="w-full rounded-2xl border border-[var(--line)] bg-white p-8">
        <p className="text-5xl font-black text-[var(--accent)]">404</p>
        <h1 className="mt-4 font-display text-2xl font-bold">{copy.notFoundTitle}</h1>
        <p className="mt-2 text-[var(--ink-2)]">{copy.notFoundDescription}</p>
        <Link href={localizePath("/", locale)} className="mt-6 inline-flex rounded-xl bg-[var(--ink-1)] px-4 py-2 text-sm font-semibold text-white">{copy.backHome}</Link>
      </section>
    </main>
  );
}
