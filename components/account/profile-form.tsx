"use client";

import { useActionState, useState } from "react";
import { updateAccountProfileAction } from "@/lib/actions/profile";
import { PROFILE_FEEDBACK } from "@/lib/account/profile-feedback";
import type { AppLocale } from "@/lib/i18n/translations";

type ProfileResult = Awaited<ReturnType<typeof updateAccountProfileAction>> | null;
type ProfileFormCopy = {
  fullName: string;
  phone: string;
  phoneHint: string;
  language: string;
  save: string;
};

export function AccountProfileForm({
  locale, copy, initialName, initialPhone, initialLanguage,
}: {
  locale: AppLocale;
  copy: ProfileFormCopy;
  initialName: string;
  initialPhone: string;
  initialLanguage: string;
}) {
  // Controlled fields preserve the user's edits when server validation fails.
  const [fullName, setFullName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [language, setLanguage] = useState(initialLanguage);
  const [result, formAction, pending] = useActionState<ProfileResult, FormData>(
    async (_previous, formData) => updateAccountProfileAction(formData),
    null,
  );
  const feedback = PROFILE_FEEDBACK[locale];

  return (
    <form action={formAction} aria-busy={pending} className="mt-4 grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-semibold text-[var(--ink-1)]">
        {copy.fullName}
        <input name="full_name" required minLength={2} maxLength={80} autoComplete="name" disabled={pending}
          value={fullName} onChange={(event) => setFullName(event.target.value)}
          className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
      </label>
      <label className="text-sm font-semibold text-[var(--ink-1)]">
        {copy.phone}
        <input name="phone" type="tel" inputMode="tel" autoComplete="tel" required minLength={9} maxLength={20} dir="ltr" disabled={pending}
          value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+93 7xx xxx xxx"
          className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
        <span className="mt-1 block text-xs font-normal text-[var(--ink-2)]">{copy.phoneHint}</span>
      </label>
      <label className="text-sm font-semibold text-[var(--ink-1)]">
        {copy.language}
        <select name="preferred_language" value={language} onChange={(event) => setLanguage(event.target.value)} disabled={pending}
          className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2">
          <option value="fa">دری</option><option value="ps">پښتو</option><option value="en">English</option>
        </select>
      </label>
      <div className="sm:col-span-2">
        <button disabled={pending} className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
          {pending ? feedback.saving : copy.save}
        </button>
        {result ? <p role={result.ok ? "status" : "alert"} className={`mt-3 text-sm font-semibold ${result.ok ? "text-emerald-700" : "text-red-700"}`}>
          {feedback[result.code]}
        </p> : null}
      </div>
    </form>
  );
}
