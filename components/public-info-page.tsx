import Link from "next/link";
import { getCurrentLocale } from "@/lib/i18n/server";
import { localizePath } from "@/lib/i18n/routing";
import { USER_COPY, type UserInfoPage } from "@/lib/i18n/user-copy";

export async function PublicInfoPage({ page }: { page: UserInfoPage }) {
  const locale = await getCurrentLocale();
  const copy = USER_COPY[locale];
  const content = copy.info[page];

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <article className="rounded-2xl border border-[var(--line)] bg-white p-6 sm:p-8">
        <h1 className="font-display text-3xl font-bold">{content.title}</h1>
        <p className="mt-3 text-lg font-semibold text-[var(--ink-1)]">{content.intro}</p>
        <p className="mt-4 whitespace-pre-line leading-8 text-[var(--ink-2)]">{content.body}</p>
        <Link href={localizePath("/", locale)} className="mt-7 inline-flex rounded-xl bg-[var(--ink-1)] px-4 py-2 text-sm font-semibold text-white">
          {copy.backHome}
        </Link>
      </article>
    </main>
  );
}
