import { resetPasswordAction, updatePasswordAction } from "@/lib/actions/auth";
import { getCurrentLocale } from "@/lib/i18n/server";
import { getUiTranslations } from "@/lib/i18n/ui";

export default async function ResetPasswordPage() {
  const locale = await getCurrentLocale();
  const ui = getUiTranslations(locale);
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 items-center px-4 py-10 sm:px-6">
      <div className="w-full space-y-6">
        <section className="space-y-3 rounded-2xl border border-[var(--line)] bg-white p-6">
          <h1 className="font-display text-2xl font-bold">{ui.resetPassword.requestPasswordReset}</h1>
          <form action={resetPasswordAction} className="space-y-3">
            <input
              name="email"
              type="email"
              required
              placeholder={ui.resetPassword.emailPlaceholder}
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2"
            />
            <button className="w-full rounded-xl bg-[var(--ink-1)] px-4 py-2 font-semibold text-white">{ui.resetPassword.sendResetLink}</button>
          </form>
        </section>

        <section className="space-y-3 rounded-2xl border border-[var(--line)] bg-white p-6">
          <h2 className="font-display text-2xl font-bold">{ui.resetPassword.setNewPassword}</h2>
          <form action={updatePasswordAction} className="space-y-3">
            <input
              name="password"
              type="password"
              required
              minLength={6}
              placeholder={ui.resetPassword.newPasswordPlaceholder}
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2"
            />
            <button className="w-full rounded-xl bg-[var(--accent)] px-4 py-2 font-semibold text-white">{ui.resetPassword.updatePassword}</button>
          </form>
        </section>
      </div>
    </main>
  );
}
