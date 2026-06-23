import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 items-center px-4 py-10 sm:px-6">
      <div className="w-full space-y-4">
        <RegisterForm />
        <p className="text-sm text-[var(--ink-2)]">Already have an account? <Link href="/login" className="font-semibold text-[var(--accent)]">Sign in</Link></p>
      </div>
    </main>
  );
}
