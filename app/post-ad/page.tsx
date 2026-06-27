import { getPostingRootCategories } from "@/lib/data/queries";
import { getDictionary } from "@/lib/i18n/server";
import Link from "next/link";
import { localizePath } from "@/lib/i18n/routing";

export default async function PostAdPage() {
  const [categories, { t, locale }] = await Promise.all([getPostingRootCategories(), getDictionary()]);

  const activeCategories = categories.filter((category) => !category.is_coming_soon);
  const optionCards = [
    {
      key: "sell",
      title: locale === "fa" ? "چیزی برای فروش" : locale === "ps" ? "د خرڅلاو اعلان" : "Sell something",
      description:
        locale === "fa"
          ? "اعلان معمولی فروش ایجاد کنید."
          : locale === "ps"
            ? "د خرڅلاو عادي اعلان جوړ کړئ."
            : "Create a normal for-sale listing.",
      href: localizePath("/post-ad/create?posting=sell", locale),
    },
    {
      key: "wanted",
      title: locale === "fa" ? "نیازمندی / درخواست" : locale === "ps" ? "غوښتنه / Wanted" : "Request something / Wanted ad",
      description:
        locale === "fa"
          ? "اعلان نیازمندی ثبت کنید تا فروشنده‌ها با شما تماس بگیرند."
          : locale === "ps"
            ? "Wanted اعلان ثبت کړئ تر څو پلورونکي له تاسو سره اړیکه ونیسي."
            : "Post what you are looking for and let sellers contact you.",
      href: localizePath("/post-ad/create?posting=wanted", locale),
    },
  ];

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold">
        {locale === "fa" ? "چه کاری می خواهید انجام دهید؟" : locale === "ps" ? "تاسو څه کول غواړئ؟" : "What do you want to do?"}
      </h1>
      <p className="mt-2 text-sm text-[var(--ink-2)]">
        {locale === "fa"
          ? "نوع اعلان را انتخاب کنید. سپس قبل از انتشار می توانید همه فیلدها را ویرایش کنید."
          : locale === "ps"
            ? "د اعلان ډول وټاکئ. د خپرولو مخکې ټول معلومات ایډیټ کولی شئ."
            : "Choose your posting flow. You can edit everything before publishing."}
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
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
          {locale === "fa" ? "پست سریع" : locale === "ps" ? "چټک پوسټ" : "Quick Post"}
        </h2>
        <p className="mt-1 text-sm text-[var(--ink-2)]">
          {locale === "fa"
            ? "فقط عنوان، قیمت، عکس و موقعیت را وارد کنید؛ بقیه فیلدها به طور هوشمند پیشنهاد می شود."
            : locale === "ps"
              ? "یوازې سرلیک، بیه، انځورونه او ځای ولیکئ؛ نور معلومات به هوښیار وړاندیز شي."
              : "Enter title, price, photos, and location first; we will suggest the rest intelligently."}
        </p>
        <Link href={localizePath("/post-ad/create?posting=quick", locale)} className="mt-3 inline-block rounded-xl bg-[var(--ink-1)] px-4 py-2 text-sm font-semibold text-white">
          {locale === "fa" ? "شروع پست سریع" : locale === "ps" ? "چټک پوسټ پیل کړئ" : "Start Quick Post"}
        </Link>
      </div>

      <div className="mt-6 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
        <p className="text-sm font-semibold">
          {locale === "fa" ? "دسته های فعال" : locale === "ps" ? "فعاله کټګورۍ" : "Active categories"}
        </p>
        <p className="mt-1 text-sm text-[var(--ink-2)]">{activeCategories.map((category) => category.name).join(" • ")}</p>
      </div>
    </main>
  );
}
