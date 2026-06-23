"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function RegisterForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Supabase is not configured yet. Add env values in .env.local.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-[var(--line)] bg-white p-6">
      <h1 className="font-display text-2xl font-bold">Register</h1>
      <label className="block text-sm font-semibold">Full name<input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2" /></label>
      <label className="block text-sm font-semibold">Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2" /></label>
      <label className="block text-sm font-semibold">Password<input type="password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2" /></label>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button type="submit" className="w-full rounded-xl bg-[var(--accent)] px-4 py-2 font-semibold text-white">Create account</button>
    </form>
  );
}
