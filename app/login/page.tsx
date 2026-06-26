import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { getDictionary } from "@/lib/i18n/server";
import { localizePath } from "@/lib/i18n/routing";

export default async function LoginPage() {
  const { t, locale } = await getDictionary();
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 items-center px-4 py-10 sm:px-6">
      <div className="w-full space-y-4">
        <LoginForm locale={locale} />
        <p className="text-sm text-[var(--ink-2)]">{t.auth.noAccount} <Link href={localizePath("/register", locale)} className="font-semibold text-[var(--accent)]">{t.auth.createOne}</Link></p>
        <p className="text-sm text-[var(--ink-2)]">{t.auth.forgotPassword} <Link href={localizePath("/reset-password", locale)} className="font-semibold text-[var(--accent)]">{t.auth.resetIt}</Link></p>
      </div>
    </main>
  );
}
