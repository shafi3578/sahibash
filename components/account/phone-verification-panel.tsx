"use client";

import { useActionState } from "react";
import type { AppLocale } from "@/lib/i18n/translations";
import {
  requestProfilePhoneVerificationAction,
  verifyProfilePhoneOtpAction,
} from "@/lib/actions/profile";

const INITIAL_PHONE_VERIFICATION_STATE = { status: "idle" as const };

const COPY = {
  en: { title: "Phone verification", verified: "Verified", unverified: "Not verified", send: "Send verification code", sending: "Sending…", code: "6-digit SMS code", verify: "Verify phone", verifying: "Verifying…", sent: "A verification code was sent to your profile phone.", invalid: "Check the phone number or six-digit code.", unavailable: "SMS verification is unavailable. Check the Supabase phone provider configuration.", expired: "The code is invalid or expired. Request a new code.", rate_limited: "Too many attempts. Please wait before trying again." },
  fa: { title: "تأیید شماره موبایل", verified: "تأیید شده", unverified: "تأیید نشده", send: "ارسال کود تأیید", sending: "در حال ارسال…", code: "کود شش‌رقمی پیامک", verify: "تأیید شماره", verifying: "در حال تأیید…", sent: "کود تأیید به شماره پروفایل شما فرستاده شد.", invalid: "شماره یا کود شش‌رقمی را بررسی کنید.", unavailable: "تأیید پیامکی در دسترس نیست. تنظیمات ارائه‌دهنده تلفن Supabase را بررسی کنید.", expired: "کود نادرست یا منقضی است. کود تازه درخواست کنید.", rate_limited: "تلاش‌ها بیش از حد است. کمی بعد دوباره امتحان کنید." },
  ps: { title: "د موبایل شمېرې تایید", verified: "تایید شوې", unverified: "نه ده تایید شوې", send: "د تایید کوډ ولېږئ", sending: "لېږل کېږي…", code: "شپږ رقمي SMS کوډ", verify: "شمېره تایید کړئ", verifying: "تاییدېږي…", sent: "د تایید کوډ ستاسو د پروفایل شمېرې ته ولېږل شو.", invalid: "شمېره یا شپږ رقمي کوډ وګورئ.", unavailable: "د SMS تایید نشته. د Supabase تلیفون برابرونکي تنظیمات وګورئ.", expired: "کوډ ناسم یا زوړ دی. نوی کوډ وغواړئ.", rate_limited: "ډېرې هڅې وشوې. لږ وروسته بیا هڅه وکړئ." },
} as const;

export function PhoneVerificationPanel({ locale, verified }: { locale: AppLocale; verified: boolean }) {
  const copy = COPY[locale];
  const [requestState, requestAction, requestPending] = useActionState(requestProfilePhoneVerificationAction, INITIAL_PHONE_VERIFICATION_STATE);
  const [verifyState, verifyAction, verifyPending] = useActionState(verifyProfilePhoneOtpAction, INITIAL_PHONE_VERIFICATION_STATE);
  const state = verifyState.status !== "idle" ? verifyState : requestState;
  const message = state.status === "sent" ? copy.sent : state.status === "error" ? copy[state.code ?? "unavailable"] : null;
  const isVerified = verified || state.status === "verified";

  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3 text-sm sm:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-[var(--ink-1)]">{copy.title}</p>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${isVerified ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
          {isVerified ? copy.verified : copy.unverified}
        </span>
      </div>
      {!isVerified ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-[auto_1fr]">
          <form action={requestAction}>
            <button disabled={requestPending} className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-4 font-bold disabled:opacity-60">
              {requestPending ? copy.sending : copy.send}
            </button>
          </form>
          <form action={verifyAction} className="flex gap-2">
            <input name="token" required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} aria-label={copy.code} placeholder={copy.code} className="min-w-0 flex-1 rounded-xl border border-[var(--line)] bg-white px-3 py-2" />
            <button disabled={verifyPending} className="min-h-11 rounded-xl bg-[var(--accent)] px-4 font-bold text-white disabled:opacity-60">
              {verifyPending ? copy.verifying : copy.verify}
            </button>
          </form>
        </div>
      ) : null}
      {message ? <p role="status" className={`mt-2 text-xs font-semibold ${state.status === "error" ? "text-red-700" : "text-emerald-700"}`}>{message}</p> : null}
    </div>
  );
}
