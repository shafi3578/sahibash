import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { getDictionary } from "@/lib/i18n/server";
import { localizePath } from "@/lib/i18n/routing";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return String(value[0] ?? "");
  return String(value ?? "");
}

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const { t, locale } = await getDictionary();
  const reason = readParam(params.reason);
  const redirectPath = readParam(params.redirect) || "/";
  const isPostLogin = reason === "post";

  const postMessages = {
    en: {
      title: "Login to post your ad",
      subtitle: "Create an account to manage your ads, receive messages, and build trust with buyers.",
      hint: "Please login or create an account to post your ad.",
    },
    fa: {
      title: "برای ثبت اعلان وارد شوید",
      subtitle: "برای مدیریت اعلان‌ها، دریافت پیام‌ها و ایجاد اعتماد با خریداران حساب بسازید.",
      hint: "لطفاً برای ثبت اعلان وارد حساب شوید یا حساب جدید بسازید.",
    },
    ps: {
      title: "د اعلان خپرولو لپاره ننوزئ",
      subtitle: "د اعلانونو مدیریت، پیغامونو ترلاسه کولو او د باور جوړولو لپاره حساب جوړ کړئ.",
      hint: "مهرباني وکړئ د اعلان خپرولو لپاره ننوزئ یا نوی حساب جوړ کړئ.",
    },
  }[locale];

  const registerHref = `${localizePath("/register", locale)}?redirect=${encodeURIComponent(redirectPath)}${isPostLogin ? "&reason=post" : ""}`;
  const resetHref = `${localizePath("/reset-password", locale)}${redirectPath ? `?redirect=${encodeURIComponent(redirectPath)}` : ""}`;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 items-center px-4 py-10 sm:px-6">
      <div className="w-full space-y-4">
        {isPostLogin ? (
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
            <h1 className="text-xl font-bold">{postMessages.title}</h1>
            <p className="mt-1 text-sm text-[var(--ink-2)]">{postMessages.subtitle}</p>
            <p className="mt-2 text-sm font-semibold text-[var(--accent)]">{postMessages.hint}</p>
          </div>
        ) : null}
        <LoginForm locale={locale} />
        <p className="text-sm text-[var(--ink-2)]">{t.auth.noAccount} <Link href={registerHref} className="font-semibold text-[var(--accent)]">{t.auth.createOne}</Link></p>
        <p className="text-sm text-[var(--ink-2)]">{t.auth.forgotPassword} <Link href={resetHref} className="font-semibold text-[var(--accent)]">{t.auth.resetIt}</Link></p>
      </div>
    </main>
  );
}
