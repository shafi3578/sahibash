import { resetPasswordAction, updatePasswordAction } from "@/lib/actions/auth";

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 items-center px-4 py-10 sm:px-6">
      <div className="w-full space-y-6">
        <section className="space-y-3 rounded-2xl border border-[var(--line)] bg-white p-6">
          <h1 className="font-display text-2xl font-bold">Request Password Reset</h1>
          <form action={resetPasswordAction} className="space-y-3">
            <input
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2"
            />
            <button className="w-full rounded-xl bg-[var(--ink-1)] px-4 py-2 font-semibold text-white">Send Reset Link</button>
          </form>
        </section>

        <section className="space-y-3 rounded-2xl border border-[var(--line)] bg-white p-6">
          <h2 className="font-display text-2xl font-bold">Set New Password</h2>
          <form action={updatePasswordAction} className="space-y-3">
            <input
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="New password"
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2"
            />
            <button className="w-full rounded-xl bg-[var(--accent)] px-4 py-2 font-semibold text-white">Update Password</button>
          </form>
        </section>
      </div>
    </main>
  );
}
