import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";
import { getDictionary } from "@/lib/i18n/server";
import { localizePath } from "@/lib/i18n/routing";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return String(value[0] ?? "");
  return String(value ?? "");
}

export default async function RegisterPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const { t, locale } = await getDictionary();
  const reason = readParam(params.reason);
  const redirectPath = readParam(params.redirect) || "/post-ad";
  const isPostRegister = reason === "post";

  const postMessages = {
    en: {
      title: "Create account to post your ad",
      subtitle: "Manage your ads, receive messages, and build trust with buyers.",
      hint: "Please login or create an account to post your ad.",
    },
    fa: {
      title: "برای ثبت اعلان حساب بسازید",
      subtitle: "اعلان‌های خود را مدیریت کنید، پیام بگیرید و اعتماد خریداران را جلب کنید.",
      hint: "لطفاً برای ثبت اعلان وارد حساب شوید یا حساب جدید بسازید.",
    },
    ps: {
      title: "د اعلان خپرولو لپاره حساب جوړ کړئ",
      subtitle: "خپل اعلانونه اداره کړئ، پیغامونه ترلاسه کړئ او له پېرودونکو سره باور جوړ کړئ.",
      hint: "مهرباني وکړئ د اعلان خپرولو لپاره ننوزئ یا نوی حساب جوړ کړئ.",
    },
  }[locale];

  const loginHref = `${localizePath("/login", locale)}?redirect=${encodeURIComponent(redirectPath)}${isPostRegister ? "&reason=post" : ""}`;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 items-center px-4 py-10 sm:px-6">
      <div className="w-full space-y-4">
        {isPostRegister ? (
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
            <h1 className="text-xl font-bold">{postMessages.title}</h1>
            <p className="mt-1 text-sm text-[var(--ink-2)]">{postMessages.subtitle}</p>
            <p className="mt-2 text-sm font-semibold text-[var(--accent)]">{postMessages.hint}</p>
          </div>
        ) : null}
        <RegisterForm locale={locale} />
        <p className="text-sm text-[var(--ink-2)]">{t.auth.alreadyHaveAccount} <Link href={loginHref} className="font-semibold text-[var(--accent)]">{t.auth.signIn}</Link></p>
      </div>
    </main>
  );
}
