import { getPostingRootCategories } from "@/lib/data/queries";
import { getDictionary } from "@/lib/i18n/server";
import Link from "next/link";
import { localizePath } from "@/lib/i18n/routing";
import { getUiTranslations } from "@/lib/i18n/ui";

export default async function PostAdPage() {
  const [categories, { t, locale }] = await Promise.all([getPostingRootCategories(), getDictionary()]);
  const ui = getUiTranslations(locale);

  const activeCategories = categories.filter((category) => !category.is_coming_soon);
  const optionCards = [
    {
      key: "sell",
      title: ui.postAdLanding.sellSomething,
      description: ui.postAdLanding.sellSomethingDescription,
      href: localizePath("/post-ad/create?posting=sell", locale),
    },
  ];

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold">
        {ui.postAdLanding.whatDoYouWantToDo}
      </h1>
      <p className="mt-2 text-sm text-[var(--ink-2)]">
        {ui.postAdLanding.chooseFlowDescription}
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-1">
        {optionCards.map((option) => (
          <Link
            key={option.key}
            href={option.href}
            className="rounded-2xl border border-[var(--line)] bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <h2 className="text-lg font-bold">{option.title}</h2>
            <p className="mt-2 text-sm text-[var(--ink-2)]">{option.description}</p>
            <p className="mt-4 text-sm font-semibold text-[var(--accent)]">{t.postAd.continue}</p>
          </Link>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-[var(--line)] bg-white p-4">
        <h2 className="text-base font-bold">
          {ui.postAdLanding.quickPost}
        </h2>
        <p className="mt-1 text-sm text-[var(--ink-2)]">
          {ui.postAdLanding.quickPostDescription}
        </p>
        <Link href={localizePath("/post-ad/create?posting=quick", locale)} className="mt-3 inline-block rounded-xl bg-[var(--ink-1)] px-4 py-2 text-sm font-semibold text-white">
          {ui.postAdLanding.startQuickPost}
        </Link>
      </div>

      <div className="mt-6 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
        <p className="text-sm font-semibold">
          {ui.postAdLanding.activeCategories}
        </p>
        <p className="mt-1 text-sm text-[var(--ink-2)]">{activeCategories.map((category) => category.name).join(" • ")}</p>
      </div>
    </main>
  );
}
