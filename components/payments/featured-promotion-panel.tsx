import {
  getCampaignInstructions,
  getCampaignName,
  isFeaturedCurrentlyActive,
  type FeaturedPaymentSummary,
} from "@/lib/data/featured-payments";
import {
  requestFeaturedPromotionAction,
  submitFeaturedPaymentProofAction,
} from "@/lib/actions/featured-payments";
import { formatDate, formatNumber } from "@/lib/i18n/format";
import type { AppLocale } from "@/lib/i18n/translations";
import Link from "next/link";

type Copy = {
  success: string;
  visibility: string;
  intro: string;
  makeFeatured: string;
  notNow: string;
  launchPrice: string;
  duration: string;
  status: string;
  active: string;
  activeUntil: string;
  pendingPayment: string;
  pendingReview: string;
  rejected: string;
  rejectedHelp: string;
  hesabPayInstructions: string;
  merchantReference: string;
  paymentMethod: string;
  transactionReference: string;
  transactionPlaceholder: string;
  receipt: string;
  submitProof: string;
  proofHint: string;
  unavailable: string;
  unavailableHelp: string;
  listingStatusBlocked: string;
  freePathNote: string;
};

const COPY: Record<AppLocale, Copy> = {
  en: {
    success: "Your ad was submitted successfully.",
    visibility: "Want more visibility?",
    intro: "Make this listing Featured after HesabPay proof is reviewed by Admin.",
    makeFeatured: "Make Featured",
    notNow: "Not now",
    launchPrice: "Special launch price",
    duration: "Featured duration",
    status: "Featured status",
    active: "Active",
    activeUntil: "Active until",
    pendingPayment: "Waiting for HesabPay payment proof.",
    pendingReview: "Payment proof submitted. Admin will review it soon.",
    rejected: "Payment proof was rejected.",
    rejectedHelp: "You can upload a clearer receipt or transaction reference again.",
    hesabPayInstructions: "HesabPay instructions",
    merchantReference: "Payment destination",
    paymentMethod: "Payment method",
    transactionReference: "Transaction reference",
    transactionPlaceholder: "HesabPay transaction/reference number",
    receipt: "Receipt or screenshot",
    submitProof: "Submit proof for review",
    proofHint: "Accepted: JPG, PNG, WebP or PDF up to 5 MB. Receipt upload does not activate Featured automatically.",
    unavailable: "Featured payments are not configured yet.",
    unavailableHelp: "A Super Admin must configure the launch campaign and HesabPay destination first.",
    listingStatusBlocked: "Featured can be requested only for submitted or approved listings.",
    freePathNote: "Free posting remains active. Featured is optional.",
  },
  fa: {
    success: "اعلان شما با موفقیت ثبت شد.",
    visibility: "می‌خواهید بیشتر دیده شود؟",
    intro: "پس از بررسی رسید HesabPay توسط ادمین، این اعلان ویژه می‌شود.",
    makeFeatured: "ویژه‌سازی اعلان",
    notNow: "فعلاً نه",
    launchPrice: "قیمت ویژه آغازین",
    duration: "مدت نمایش ویژه",
    status: "حالت اعلان ویژه",
    active: "فعال",
    activeUntil: "فعال تا",
    pendingPayment: "در انتظار رسید پرداخت HesabPay.",
    pendingReview: "رسید پرداخت ثبت شد و به‌زودی توسط ادمین بررسی می‌شود.",
    rejected: "رسید پرداخت رد شد.",
    rejectedHelp: "می‌توانید رسید واضح‌تر یا شماره تراکنش را دوباره بارگذاری کنید.",
    hesabPayInstructions: "راهنمای پرداخت HesabPay",
    merchantReference: "مقصد پرداخت",
    paymentMethod: "روش پرداخت",
    transactionReference: "شماره تراکنش",
    transactionPlaceholder: "شماره/رفرنس تراکنش HesabPay",
    receipt: "رسید یا اسکرین‌شات",
    submitProof: "ارسال رسید برای بررسی",
    proofHint: "فرمت‌های مجاز: JPG، PNG، WebP یا PDF تا ۵ MB. بارگذاری رسید به تنهایی اعلان را ویژه نمی‌کند.",
    unavailable: "پرداخت اعلان ویژه هنوز تنظیم نشده است.",
    unavailableHelp: "ابتدا سوپر ادمین باید کمپاین آغازین و مقصد HesabPay را تنظیم کند.",
    listingStatusBlocked: "درخواست ویژه فقط برای اعلان‌های ثبت‌شده یا تأییدشده ممکن است.",
    freePathNote: "ثبت رایگان اعلان فعال است. ویژه‌سازی اختیاری است.",
  },
  ps: {
    success: "ستاسو اعلان په بریالیتوب ثبت شو.",
    visibility: "غواړئ زیات ښکاره شي؟",
    intro: "دا اعلان د HesabPay رسید د اډمین له کتنې وروسته ځانګړی کېږي.",
    makeFeatured: "ځانګړی اعلان کړئ",
    notNow: "اوس نه",
    launchPrice: "د پیل ځانګړې بیه",
    duration: "د ځانګړي حالت موده",
    status: "د ځانګړي اعلان حالت",
    active: "فعال",
    activeUntil: "فعال تر",
    pendingPayment: "د HesabPay د تادیې رسید ته انتظار دی.",
    pendingReview: "د تادیې رسید ثبت شو. اډمین به یې ژر وګوري.",
    rejected: "د تادیې رسید رد شو.",
    rejectedHelp: "تاسو کولای شئ روښانه رسید یا د معاملې شمېره بیا پورته کړئ.",
    hesabPayInstructions: "د HesabPay لارښوونې",
    merchantReference: "د تادیې ځای",
    paymentMethod: "د تادیې طریقه",
    transactionReference: "د معاملې شمېره",
    transactionPlaceholder: "د HesabPay د معاملې/رفرنس شمېره",
    receipt: "رسید یا سکرین‌شاټ",
    submitProof: "رسید د کتنې لپاره ولېږئ",
    proofHint: "منل کېږي: JPG، PNG، WebP یا PDF تر ۵ MB. رسید پورته کول په خپله اعلان ځانګړی نه کوي.",
    unavailable: "د ځانګړي اعلان تادیه لا نه ده تنظیم شوې.",
    unavailableHelp: "سوپر اډمین باید لومړی د پیل کمپاین او د HesabPay ځای تنظیم کړي.",
    listingStatusBlocked: "ځانګړی حالت یوازې د ثبت شویو یا تایید شویو اعلانونو لپاره غوښتل کېږي.",
    freePathNote: "وړیا اعلان ورکول فعال دي. ځانګړی کول اختیاري دي.",
  },
};

function statusTone(status?: string | null) {
  if (status === "approved") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (status === "pending_review") return "border-blue-200 bg-blue-50 text-blue-900";
  if (status === "rejected") return "border-red-200 bg-red-50 text-red-900";
  return "border-amber-200 bg-amber-50 text-amber-900";
}

export function FeaturedPromotionPanel({
  listingId,
  listingStatus,
  listingTitle,
  listing,
  summary,
  locale,
}: {
  listingId: string;
  listingStatus: string;
  listingTitle: string;
  listing: { featured?: boolean; featured_until?: string | null };
  summary: FeaturedPaymentSummary;
  locale: AppLocale;
}) {
  const copy = COPY[locale];
  const config = summary.config;
  const request = summary.request;
  const isActive = summary.activePromotion || isFeaturedCurrentlyActive(listing);
  const canRequest = listingStatus === "pending" || listingStatus === "approved";
  const requestStatus = request?.status;

  return (
    <section className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-xl text-white shadow-sm">
          ★
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">{copy.success}</p>
          <h2 className="mt-1 text-lg font-black text-slate-950">{copy.visibility}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-700">{copy.intro}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">{copy.freePathNote}</p>
        </div>
      </div>

      {!canRequest ? (
        <p className="mt-4 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
          {copy.listingStatusBlocked}
        </p>
      ) : null}

      {config ? (
        <div className="mt-4 grid gap-2 rounded-2xl border border-white/80 bg-white/80 p-3 text-sm text-slate-700">
          <div className="flex items-center justify-between gap-3">
            <span>{getCampaignName(config, locale)}</span>
            <strong className="text-amber-700">
              {copy.launchPrice}: {formatNumber(config.amount, locale)} {config.currency}
            </strong>
          </div>
          <div className="text-xs text-slate-500">
            {copy.duration}: {formatNumber(config.duration_days, locale)} {locale === "en" ? "days" : locale === "ps" ? "ورځې" : "روز"}
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600">
          <p className="font-semibold text-slate-900">{copy.unavailable}</p>
          <p className="mt-1">{copy.unavailableHelp}</p>
        </div>
      )}

      {isActive ? (
        <div className={`mt-4 rounded-xl border px-3 py-2 text-sm ${statusTone("approved")}`}>
          <strong>{copy.status}: {copy.active}</strong>
          {listing.featured_until ? (
            <p className="mt-1">
              {copy.activeUntil}: {formatDate(new Date(listing.featured_until), locale, { dateStyle: "medium" })}
            </p>
          ) : null}
        </div>
      ) : null}

      {!isActive && !request && config && canRequest ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <form action={requestFeaturedPromotionAction.bind(null, listingId)}>
            <button className="min-h-11 rounded-xl bg-amber-600 px-4 text-sm font-bold text-white shadow-sm hover:bg-amber-700">
              {copy.makeFeatured}
            </button>
          </form>
          <Link href="/dashboard/my-ads" className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700">
            {copy.notNow}
          </Link>
        </div>
      ) : null}

      {!isActive && request ? (
        <div className={`mt-4 rounded-xl border p-3 text-sm ${statusTone(requestStatus)}`}>
          <p className="font-bold">
            {requestStatus === "pending_review"
              ? copy.pendingReview
              : requestStatus === "rejected"
                ? copy.rejected
                : copy.pendingPayment}
          </p>
          {requestStatus === "rejected" && request.rejection_reason ? (
            <p className="mt-1">{request.rejection_reason}</p>
          ) : null}
          {requestStatus === "rejected" ? <p className="mt-1">{copy.rejectedHelp}</p> : null}
        </div>
      ) : null}

      {!isActive && request && config && ["pending_payment", "rejected"].includes(request.status) ? (
        <div className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-white p-3">
          <div>
            <p className="text-sm font-bold text-slate-950">{copy.hesabPayInstructions}</p>
            <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-700">
              {getCampaignInstructions(config, locale)}
            </p>
          </div>
          <div className="grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
            {config.payment_method ? (
              <p className="rounded-xl bg-slate-50 p-2">
                <span className="block font-semibold text-slate-900">{copy.paymentMethod}</span>
                {config.payment_method}
              </p>
            ) : null}
            {config.merchant_reference ? (
              <p className="rounded-xl bg-slate-50 p-2">
                <span className="block font-semibold text-slate-900">{copy.merchantReference}</span>
                {config.merchant_reference}
              </p>
            ) : null}
          </div>

          <form action={submitFeaturedPaymentProofAction} className="grid gap-3" encType="multipart/form-data">
            <input type="hidden" name="request_id" value={request.id} />
            <label className="grid gap-1 text-sm font-semibold text-slate-900">
              {copy.transactionReference}
              <input
                name="transaction_reference"
                defaultValue={request.transaction_reference ?? ""}
                placeholder={copy.transactionPlaceholder}
                maxLength={240}
                className="min-h-11 rounded-xl border border-slate-200 px-3 text-sm"
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-slate-900">
              {copy.receipt}
              <input
                name="receipt"
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm"
              />
            </label>
            <p className="text-xs leading-5 text-slate-500">{copy.proofHint}</p>
            <button className="min-h-11 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white">
              {copy.submitProof}
            </button>
          </form>
        </div>
      ) : null}

      <p className="sr-only">{listingTitle}</p>
    </section>
  );
}
