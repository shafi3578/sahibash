import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import {
  getAdminFeaturedPaymentQueue,
  getAdminFeaturedPaymentStats,
  isFeaturedCurrentlyActive,
} from "@/lib/data/featured-payments";
import {
  adminApproveFeaturedPaymentRequestAction,
  adminRejectFeaturedPaymentRequestAction,
} from "@/lib/actions/featured-payments";
import { getCurrentLocale } from "@/lib/i18n/server";
import { formatDate, formatNumber } from "@/lib/i18n/format";
import { adminPath } from "@/lib/admin/routing";

const COPY = {
  en: {
    title: "Featured Requests",
    description: "Review HesabPay payment proofs before Featured promotion activation.",
    pendingReview: "Pending review",
    pendingPayment: "Awaiting proof",
    rejectedRecent: "Rejected recently",
    activeFeatured: "Active Featured",
    back: "Back to Admin",
    amount: "Amount",
    submitted: "Submitted",
    created: "Created",
    transaction: "Transaction reference",
    receipt: "Receipt",
    openReceipt: "Open private receipt",
    noReceipt: "No receipt file",
    openListing: "Open listing",
    openSeller: "Open seller",
    promotionState: "Promotion state",
    seller: "Seller",
    risk: "Risk indicators",
    alreadyFeatured: "Already Featured",
    phoneUnverified: "Seller phone not verified",
    missingReference: "Missing transaction reference",
    rejectedStatus: "Rejected request",
    none: "No immediate risk flags",
    adminNote: "Admin note",
    approve: "Approve Featured",
    reject: "Reject",
    rejectionReason: "Rejection reason",
    empty: "No Featured payment requests need attention right now.",
  },
  fa: {
    title: "درخواست‌های اعلان ویژه",
    description: "رسیدهای پرداخت HesabPay را پیش از فعال‌سازی اعلان ویژه بررسی کنید.",
    pendingReview: "در انتظار بررسی",
    pendingPayment: "در انتظار رسید",
    rejectedRecent: "ردشده‌های اخیر",
    activeFeatured: "اعلان‌های ویژه فعال",
    back: "بازگشت به ادمین",
    amount: "مبلغ",
    submitted: "ثبت رسید",
    created: "ایجاد",
    transaction: "شماره تراکنش",
    receipt: "رسید",
    openReceipt: "باز کردن رسید خصوصی",
    noReceipt: "فایل رسید ندارد",
    openListing: "باز کردن اعلان",
    openSeller: "باز کردن فروشنده",
    promotionState: "حالت ویژه",
    seller: "فروشنده",
    risk: "نشانه‌های ریسک",
    alreadyFeatured: "قبلاً ویژه است",
    phoneUnverified: "تلفن فروشنده تأیید نشده",
    missingReference: "شماره تراکنش ندارد",
    rejectedStatus: "درخواست ردشده",
    none: "نشانه فوری ریسک نیست",
    adminNote: "یادداشت ادمین",
    approve: "تأیید ویژه",
    reject: "رد",
    rejectionReason: "دلیل رد",
    empty: "فعلاً درخواست پرداخت ویژه برای بررسی وجود ندارد.",
  },
  ps: {
    title: "د ځانګړي اعلان غوښتنې",
    description: "د HesabPay رسیدونه د ځانګړي اعلان له فعالېدو مخکې وڅېړئ.",
    pendingReview: "د کتنې په انتظار",
    pendingPayment: "د رسید په انتظار",
    rejectedRecent: "وروستي رد شوي",
    activeFeatured: "فعال ځانګړي اعلانونه",
    back: "اډمین ته بېرته",
    amount: "مبلغ",
    submitted: "رسید ثبت شوی",
    created: "جوړ شوی",
    transaction: "د معاملې شمېره",
    receipt: "رسید",
    openReceipt: "خصوصي رسید پرانیزئ",
    noReceipt: "د رسید فایل نشته",
    openListing: "اعلان پرانیزئ",
    openSeller: "پلورونکی پرانیزئ",
    promotionState: "د ځانګړي حالت",
    seller: "پلورونکی",
    risk: "د خطر نښې",
    alreadyFeatured: "مخکې ځانګړی دی",
    phoneUnverified: "د پلورونکي تلیفون نه دی تایید شوی",
    missingReference: "د معاملې شمېره نشته",
    rejectedStatus: "رد شوې غوښتنه",
    none: "سمدستي خطر نشته",
    adminNote: "د اډمین یادښت",
    approve: "ځانګړی تایید کړئ",
    reject: "رد",
    rejectionReason: "د رد دلیل",
    empty: "اوس د کتنې لپاره د ځانګړي اعلان تادیه نشته.",
  },
};

function getRiskFlags(row: Awaited<ReturnType<typeof getAdminFeaturedPaymentQueue>>[number], copy: typeof COPY.en) {
  const flags: string[] = [];
  if (row.listing && isFeaturedCurrentlyActive(row.listing)) flags.push(copy.alreadyFeatured);
  if (row.seller?.phone_verification_status !== "verified") flags.push(copy.phoneUnverified);
  if (!row.transaction_reference) flags.push(copy.missingReference);
  if (row.status === "rejected") flags.push(copy.rejectedStatus);
  return flags;
}

export default async function AdminFeaturedPaymentsPage() {
  await requirePermission("payments.view");
  const locale = await getCurrentLocale();
  const copy = COPY[locale];
  const [stats, queue] = await Promise.all([
    getAdminFeaturedPaymentStats(),
    getAdminFeaturedPaymentQueue(),
  ]);

  const statCards = [
    [copy.pendingReview, stats.pendingReview],
    [copy.pendingPayment, stats.pendingPayment],
    [copy.rejectedRecent, stats.rejectedRecent],
    [copy.activeFeatured, stats.activeFeatured],
  ] as const;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href={adminPath("/admin")} className="text-sm font-semibold text-[var(--accent)]">
            ← {copy.back}
          </Link>
          <h1 className="mt-3 font-display text-3xl font-black">{copy.title}</h1>
          <p className="mt-1 text-sm text-[var(--ink-2)]">{copy.description}</p>
        </div>
      </div>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm">
            <p className="text-sm text-[var(--ink-2)]">{label}</p>
            <p className="mt-1 text-3xl font-black">{formatNumber(value, locale)}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 grid gap-4">
        {queue.length === 0 ? (
          <div className="rounded-2xl border border-[var(--line)] bg-white p-6 text-sm text-[var(--ink-2)]">
            {copy.empty}
          </div>
        ) : null}

        {queue.map((row) => {
          const riskFlags = getRiskFlags(row, copy);
          const submittedAt = row.submitted_at ?? row.created_at;
          return (
            <article key={row.id} className="rounded-3xl border border-[var(--line)] bg-white p-5 shadow-sm">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                      {row.status}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                      HesabPay
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                      {copy.amount}: {formatNumber(row.amount, locale)} {row.currency}
                    </span>
                  </div>

                  <h2 className="mt-3 text-xl font-black text-slate-950">
                    {row.listing?.title ?? row.listing_id}
                  </h2>
                  <dl className="mt-3 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <dt className="font-semibold text-slate-950">{copy.seller}</dt>
                      <dd>{row.seller?.full_name ?? row.seller?.email ?? row.user_id}</dd>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <dt className="font-semibold text-slate-950">{copy.submitted}</dt>
                      <dd>{formatDate(submittedAt, locale, { dateStyle: "medium", timeStyle: "short" })}</dd>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <dt className="font-semibold text-slate-950">{copy.transaction}</dt>
                      <dd>{row.transaction_reference || "—"}</dd>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <dt className="font-semibold text-slate-950">{copy.promotionState}</dt>
                      <dd>
                        {row.listing && isFeaturedCurrentlyActive(row.listing)
                          ? `${copy.activeFeatured}${row.listing.featured_until ? ` · ${formatDate(row.listing.featured_until, locale)}` : ""}`
                          : row.listing?.status ?? "—"}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-4">
                    <p className="text-sm font-bold text-slate-950">{copy.risk}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(riskFlags.length ? riskFlags : [copy.none]).map((flag) => (
                        <span key={flag} className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700">
                          {flag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {row.receiptSignedUrl ? (
                      <a
                        href={row.receiptSignedUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl bg-slate-950 px-3 py-2 text-sm font-semibold text-white"
                      >
                        {copy.openReceipt}
                      </a>
                    ) : (
                      <span className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-500">
                        {copy.noReceipt}
                      </span>
                    )}
                    <Link href={`/listings/${row.listing_id}`} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold">
                      {copy.openListing}
                    </Link>
                    <Link href={adminPath(`/admin/users?user=${row.user_id}`)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold">
                      {copy.openSeller}
                    </Link>
                  </div>
                </div>

                <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <form action={adminApproveFeaturedPaymentRequestAction} className="grid gap-2">
                    <input type="hidden" name="request_id" value={row.id} />
                    <label className="grid gap-1 text-sm font-semibold text-slate-900">
                      {copy.adminNote}
                      <textarea name="admin_note" className="min-h-20 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                    </label>
                    <button
                      className="min-h-11 rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white disabled:opacity-50"
                      disabled={row.status !== "pending_review"}
                    >
                      {copy.approve}
                    </button>
                  </form>

                  <form action={adminRejectFeaturedPaymentRequestAction} className="grid gap-2 border-t border-slate-200 pt-3">
                    <input type="hidden" name="request_id" value={row.id} />
                    <label className="grid gap-1 text-sm font-semibold text-slate-900">
                      {copy.rejectionReason}
                      <textarea required name="rejection_reason" className="min-h-20 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                    </label>
                    <label className="grid gap-1 text-sm font-semibold text-slate-900">
                      {copy.adminNote}
                      <textarea name="admin_note" className="min-h-16 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                    </label>
                    <button
                      className="min-h-11 rounded-xl bg-red-700 px-4 text-sm font-bold text-white disabled:opacity-50"
                      disabled={row.status !== "pending_review"}
                    >
                      {copy.reject}
                    </button>
                  </form>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
