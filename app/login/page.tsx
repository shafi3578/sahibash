import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 items-center px-4 py-10 sm:px-6">
      <div className="w-full space-y-4">
        <LoginForm />
        <p className="text-sm text-[var(--ink-2)]">No account yet? <Link href="/register" className="font-semibold text-[var(--accent)]">Create one</Link></p>
        <p className="text-sm text-[var(--ink-2)]">Forgot password? <Link href="/reset-password" className="font-semibold text-[var(--accent)]">Reset it</Link></p>
      </div>
    </main>
  );
}
