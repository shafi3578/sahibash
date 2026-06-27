"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { TRANSLATIONS, getSafeTranslations, type AppLocale } from "@/lib/i18n/translations";

type Dictionary = (typeof TRANSLATIONS)["en"];

export function LoginForm({ locale }: { locale: AppLocale }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [dict] = useState<Dictionary>(() => getSafeTranslations(locale));

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message);
        setIsLoading(false);
        return;
      }
      const redirectPath = searchParams.get("redirect") || searchParams.get("returnTo");
      router.push(redirectPath && redirectPath.startsWith("/") ? redirectPath : "/post-ad");
      router.refresh();
    } catch {
      setError(dict.auth.supabaseMissing);
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-[var(--line)] bg-white p-6">
      <h1 className="font-display text-2xl font-bold">{dict.auth.loginTitle}</h1>
      <label className="block text-sm font-semibold">{dict.auth.email}<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2" /></label>
      <label className="block text-sm font-semibold">{dict.auth.password}
        <div className="mt-1 flex items-center gap-2">
          <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2" />
          <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="rounded-lg border border-[var(--line)] px-3 py-2 text-xs font-semibold">
            {showPassword ? dict.auth.hidePassword : dict.auth.showPassword}
          </button>
        </div>
      </label>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button type="submit" disabled={isLoading} className="w-full rounded-xl bg-[var(--accent)] px-4 py-2 font-semibold text-white disabled:opacity-60">{isLoading ? dict.auth.signingIn : dict.auth.signIn}</button>
    </form>
  );
}
