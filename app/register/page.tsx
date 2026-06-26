import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";
import { getDictionary } from "@/lib/i18n/server";
import { localizePath } from "@/lib/i18n/routing";

export default async function RegisterPage() {
  const { t, locale } = await getDictionary();
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 items-center px-4 py-10 sm:px-6">
      <div className="w-full space-y-4">
        <RegisterForm locale={locale} />
        <p className="text-sm text-[var(--ink-2)]">{t.auth.alreadyHaveAccount} <Link href={localizePath("/login", locale)} className="font-semibold text-[var(--accent)]">{t.auth.signIn}</Link></p>
      </div>
    </main>
  );
}
