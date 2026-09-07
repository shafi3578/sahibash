"use client";

import { useActionState } from "react";
import { submitSupportRequest, type SupportRequestState } from "@/lib/actions/support";
import type { AppLocale } from "@/lib/i18n/translations";

const COPY = {
  en: { title: "Send a request", name: "Your name", email: "Email", subject: "Topic", message: "How can we help?", send: "Send request", sending: "Sending…", success: "Your request was received. Our support team will review it.", invalid: "Complete every field and write at least 20 characters.", failed: "The request could not be sent. Please try again.", rate: "Too many requests. Please try again later.", subjects: ["Account", "Listing", "Safety", "Payment", "Technical", "Other"] },
  fa: { title: "ارسال درخواست", name: "نام شما", email: "ایمیل", subject: "موضوع", message: "چگونه می‌توانیم کمک کنیم؟", send: "ارسال درخواست", sending: "در حال ارسال…", success: "درخواست شما دریافت شد و تیم پشتیبانی آن را بررسی می‌کند.", invalid: "همه بخش‌ها را تکمیل کنید و حداقل ۲۰ نویسه بنویسید.", failed: "درخواست ارسال نشد. لطفاً دوباره کوشش کنید.", rate: "درخواست‌ها بیش از حد است. لطفاً بعداً کوشش کنید.", subjects: ["حساب", "اعلان", "مصئونیت", "پرداخت", "مشکل فنی", "سایر"] },
  ps: { title: "غوښتنه ولېږئ", name: "ستاسو نوم", email: "برېښنالیک", subject: "موضوع", message: "څنګه مرسته درسره وکړو؟", send: "غوښتنه ولېږئ", sending: "لېږل کېږي…", success: "ستاسو غوښتنه ترلاسه شوه او د ملاتړ ډله به یې وڅېړي.", invalid: "ټولې برخې بشپړې او لږ تر لږه ۲۰ توري ولیکئ.", failed: "غوښتنه ونه لېږل شوه. بیا هڅه وکړئ.", rate: "غوښتنې ډېرې شوې. وروسته بیا هڅه وکړئ.", subjects: ["حساب", "اعلان", "خوندیتوب", "تادیه", "تخنیکي ستونزه", "نور"] },
} as const;

const SUBJECT_VALUES = ["account", "listing", "safety", "payment", "technical", "other"] as const;

export function SupportRequestForm({ locale }: { locale: AppLocale }) {
  const [state, action, pending] = useActionState<SupportRequestState, FormData>(submitSupportRequest, { status: "idle" });
  const copy = COPY[locale];
  const error = state.code === "rate_limited" ? copy.rate : state.code === "invalid" ? copy.invalid : copy.failed;

  return (
    <section className="rounded-2xl border border-[var(--line)] bg-white p-4 sm:p-5">
      <h2 className="text-lg font-bold">{copy.title}</h2>
      {state.status === "success" ? <p role="status" className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{copy.success}</p> : null}
      {state.status === "error" ? <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</p> : null}
      <form action={action} className="mt-4 grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="locale" value={locale} />
        <input name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
        <label className="text-sm font-semibold">{copy.name}<input name="name" required minLength={2} maxLength={100} className="mt-1 block w-full rounded-xl border border-[var(--line)] px-3 py-2.5" /></label>
        <label className="text-sm font-semibold">{copy.email}<input name="email" type="email" required maxLength={254} className="mt-1 block w-full rounded-xl border border-[var(--line)] px-3 py-2.5" dir="ltr" /></label>
        <label className="text-sm font-semibold sm:col-span-2">{copy.subject}<select name="subject" required defaultValue="technical" className="mt-1 block w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5">{SUBJECT_VALUES.map((value, index) => <option key={value} value={value}>{copy.subjects[index]}</option>)}</select></label>
        <label className="text-sm font-semibold sm:col-span-2">{copy.message}<textarea name="message" required minLength={20} maxLength={3000} rows={5} className="mt-1 block w-full resize-y rounded-xl border border-[var(--line)] px-3 py-2.5" /></label>
        <button disabled={pending} className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60 sm:col-span-2">{pending ? copy.sending : copy.send}</button>
      </form>
    </section>
  );
}
