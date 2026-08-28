"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { recordMfaAuditAction } from "@/lib/actions/account-security";
import type { AppLocale } from "@/lib/i18n/translations";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type FactorSummary = {
  id: string;
  factor_type: string;
  status: "verified" | "unverified" | string;
  friendly_name?: string;
  created_at?: string;
};

type EnrollmentState = {
  factorId: string;
  qrCode: string;
  secret: string;
};

const MFA_COPY = {
  en: {
    title: "Two-step verification",
    description: "Use an authenticator app to protect admin and account actions. Super administrators must reach AAL2 before sensitive admin tools open.",
    requiredTitle: "Security confirmation required",
    requiredBody: "Your administrator session needs MFA confirmation. Set up an authenticator app or enter a current code from your existing factor.",
    currentLevel: "Current session",
    nextLevel: "Available level",
    verifiedFactors: "Verified factors",
    noVerified: "No verified authenticator factor yet.",
    ready: "MFA is ready for this account.",
    setup: "Set up authenticator app",
    setupHelp: "Scan the QR code in Google Authenticator, 1Password, Microsoft Authenticator, or another TOTP app. If scanning fails, enter the secret manually.",
    secret: "Manual secret",
    verificationCode: "6-digit code",
    verifySetup: "Verify and enable MFA",
    confirmSession: "Confirm this session",
    confirmHelp: "If you already enrolled MFA, enter the code from your authenticator app to upgrade this session to AAL2.",
    refresh: "Refresh status",
    cancelSetup: "Cancel setup",
    loading: "Checking MFA status…",
    working: "Working…",
    verified: "Verified",
    unverified: "Unverified",
    success: "MFA verified. Sensitive admin actions can now continue.",
    auditWarning: "MFA succeeded, but the admin audit event could not be recorded. Try refreshing and confirm again before launch verification.",
    error: "We could not complete the MFA step. Check the code and try again.",
  },
  fa: {
    title: "تأیید دومرحله‌ای",
    description: "برای محافظت از حساب و کارهای مدیریتی از اپلیکیشن تأییدکننده استفاده کنید. مدیر کل باید پیش از ورود به ابزارهای حساس به AAL2 برسد.",
    requiredTitle: "تأیید امنیتی لازم است",
    requiredBody: "نشست مدیریتی شما به تأیید MFA نیاز دارد. یک اپلیکیشن تأییدکننده تنظیم کنید یا کود فعلی عامل موجود را وارد نمایید.",
    currentLevel: "نشست فعلی",
    nextLevel: "سطح قابل دسترس",
    verifiedFactors: "عامل‌های تأییدشده",
    noVerified: "هنوز عامل تأییدکننده تأییدشده ندارید.",
    ready: "MFA برای این حساب آماده است.",
    setup: "تنظیم اپلیکیشن تأییدکننده",
    setupHelp: "QR را در Google Authenticator، 1Password، Microsoft Authenticator یا اپ TOTP دیگر اسکن کنید. اگر اسکن نشد، رمز را دستی وارد کنید.",
    secret: "رمز دستی",
    verificationCode: "کود ۶ رقمی",
    verifySetup: "تأیید و فعال‌سازی MFA",
    confirmSession: "تأیید این نشست",
    confirmHelp: "اگر MFA را قبلاً فعال کرده‌اید، کود اپلیکیشن تأییدکننده را وارد کنید تا نشست به AAL2 ارتقا یابد.",
    refresh: "تازه‌سازی وضعیت",
    cancelSetup: "لغو تنظیم",
    loading: "در حال بررسی وضعیت MFA…",
    working: "در حال انجام…",
    verified: "تأییدشده",
    unverified: "تأییدنشده",
    success: "MFA تأیید شد. اکنون کارهای حساس مدیریتی می‌تواند ادامه یابد.",
    auditWarning: "MFA موفق شد، اما رویداد گزارش مدیریتی ثبت نشد. برای تأیید نهایی، صفحه را تازه کرده دوباره تأیید کنید.",
    error: "مرحله MFA تکمیل نشد. کود را بررسی کرده دوباره کوشش کنید.",
  },
  ps: {
    title: "دوه پړاوه تایید",
    description: "د حساب او اداري کړنو د ساتنې لپاره د تایید اپ وکاروئ. عمومي مدیر باید د حساسو اداري وسیلو مخکې AAL2 ته ورسېږي.",
    requiredTitle: "امنیتي تایید اړین دی",
    requiredBody: "ستاسو اداري ناسته MFA تایید ته اړتیا لري. د تایید اپ جوړ کړئ یا د شته عامل اوسنی کوډ دننه کړئ.",
    currentLevel: "اوسنۍ ناسته",
    nextLevel: "شته کچه",
    verifiedFactors: "تایید شوي عاملونه",
    noVerified: "لا تایید شوی تاییدوونکی عامل نشته.",
    ready: "MFA د دې حساب لپاره چمتو دی.",
    setup: "د تایید اپ جوړول",
    setupHelp: "QR په Google Authenticator، 1Password، Microsoft Authenticator یا بل TOTP اپ کې سکین کړئ. که سکین ونه شو، پټ رمز په لاس دننه کړئ.",
    secret: "لاسي پټ رمز",
    verificationCode: "۶ عددي کوډ",
    verifySetup: "MFA تایید او فعال کړئ",
    confirmSession: "دا ناسته تایید کړئ",
    confirmHelp: "که MFA مو مخکې فعال کړی وي، د تایید اپ کوډ دننه کړئ چې ناسته AAL2 ته پورته شي.",
    refresh: "وضعیت تازه کړئ",
    cancelSetup: "جوړول لغوه کړئ",
    loading: "د MFA وضعیت کتل کېږي…",
    working: "کار روان دی…",
    verified: "تایید شوی",
    unverified: "نا تایید",
    success: "MFA تایید شو. حساس اداري کارونه اوس دوام کولی شي.",
    auditWarning: "MFA بریالی شو، خو د اداري راپور پېښه ثبت نه شوه. د وروستي تایید لپاره پاڼه تازه او بیا تایید کړئ.",
    error: "د MFA پړاو بشپړ نه شو. کوډ وګورئ او بیا هڅه وکړئ.",
  },
} as const;

function normalizeCode(value: string) {
  return value.replace(/\D/g, "").slice(0, 6);
}

export function MfaSetupPanel({
  locale,
  isPrivilegedUser,
  securityRedirect,
  initialCurrentLevel,
  initialNextLevel,
}: {
  locale: AppLocale;
  isPrivilegedUser: boolean;
  securityRedirect: boolean;
  initialCurrentLevel: string | null;
  initialNextLevel: string | null;
}) {
  const copy = MFA_COPY[locale];
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [factors, setFactors] = useState<FactorSummary[]>([]);
  const [currentLevel, setCurrentLevel] = useState(initialCurrentLevel ?? "aal1");
  const [nextLevel, setNextLevel] = useState(initialNextLevel ?? "aal1");
  const [enrollment, setEnrollment] = useState<EnrollmentState | null>(null);
  const [setupCode, setSetupCode] = useState("");
  const [sessionCode, setSessionCode] = useState("");
  const [message, setMessage] = useState("");
  const [warning, setWarning] = useState("");
  const [error, setError] = useState("");
  const [loading, startTransition] = useTransition();

  const verifiedFactors = factors.filter((factor) => factor.status === "verified");
  const firstVerifiedFactor = verifiedFactors[0] ?? null;
  const isAal2 = currentLevel === "aal2";

  async function refreshStatus() {
    const [factorResult, aalResult] = await Promise.all([
      supabase.auth.mfa.listFactors(),
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    ]);

    if (factorResult.error) throw factorResult.error;
    if (aalResult.error) throw aalResult.error;

    setFactors((factorResult.data?.all ?? []) as FactorSummary[]);
    setCurrentLevel(aalResult.data?.currentLevel ?? "aal1");
    setNextLevel(aalResult.data?.nextLevel ?? "aal1");
  }

  useEffect(() => {
    startTransition(async () => {
      try {
        await refreshStatus();
      } catch {
        setError(copy.error);
      }
    });
    // The Supabase browser client is memoized and copy changes only with locale.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [copy.error]);

  function run(action: () => Promise<void>) {
    setError("");
    setWarning("");
    setMessage("");
    startTransition(async () => {
      try {
        await action();
      } catch {
        setError(copy.error);
      }
    });
  }

  async function startEnrollment() {
    const { data, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Sahibash Authenticator",
    });
    if (enrollError || !data || data.type !== "totp") throw enrollError ?? new Error("MFA enrollment failed");

    setEnrollment({
      factorId: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
    });
    await refreshStatus();
  }

  async function cancelEnrollment() {
    if (enrollment?.factorId) {
      await supabase.auth.mfa.unenroll({ factorId: enrollment.factorId });
    }
    setEnrollment(null);
    setSetupCode("");
    await refreshStatus();
  }

  async function verifyFactor(factorId: string, code: string, event: "MFA_VERIFIED" | "MFA_SESSION_CONFIRMED") {
    const safeCode = normalizeCode(code);
    if (safeCode.length !== 6) {
      setError(copy.error);
      return;
    }

    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError || !challenge?.id) throw challengeError ?? new Error("MFA challenge failed");

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code: safeCode,
    });
    if (verifyError) throw verifyError;

    const auditResult = await recordMfaAuditAction(event);
    if (!auditResult.ok && isPrivilegedUser) {
      setWarning(copy.auditWarning);
    }

    setEnrollment(null);
    setSetupCode("");
    setSessionCode("");
    setMessage(copy.success);
    await refreshStatus();
  }

  return (
    <div className="space-y-4">
      {isPrivilegedUser && (securityRedirect || !isAal2) ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-bold">{copy.requiredTitle}</p>
          <p className="mt-1 leading-6">{copy.requiredBody}</p>
        </div>
      ) : null}

      <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold">{copy.title}</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--ink-2)]">{copy.description}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${isAal2 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>
            {currentLevel}
          </span>
        </div>

        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-xl bg-white p-3">
            <p className="text-xs font-semibold text-[var(--ink-2)]">{copy.currentLevel}</p>
            <p className="mt-1 font-bold">{currentLevel}</p>
          </div>
          <div className="rounded-xl bg-white p-3">
            <p className="text-xs font-semibold text-[var(--ink-2)]">{copy.nextLevel}</p>
            <p className="mt-1 font-bold">{nextLevel}</p>
          </div>
          <div className="rounded-xl bg-white p-3">
            <p className="text-xs font-semibold text-[var(--ink-2)]">{copy.verifiedFactors}</p>
            <p className="mt-1 font-bold">{verifiedFactors.length}</p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {loading ? <p className="text-sm text-[var(--ink-2)]">{copy.loading}</p> : null}
          {message ? <p className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{message}</p> : null}
          {warning ? <p className="rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-800">{warning}</p> : null}
          {error ? <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--line)] bg-white p-4">
        {verifiedFactors.length > 0 ? (
          <div className="space-y-2">
            <p className="font-semibold text-emerald-700">{copy.ready}</p>
            {verifiedFactors.map((factor) => (
              <div key={factor.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--line)] p-3 text-sm">
                <div>
                  <p className="font-semibold">{factor.friendly_name || "Authenticator app"}</p>
                  <p className="text-xs text-[var(--ink-2)]">{factor.factor_type} · {copy.verified}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--ink-2)]">{copy.noVerified}</p>
        )}

        {firstVerifiedFactor && !isAal2 ? (
          <div className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
            <p className="text-sm text-[var(--ink-2)]">{copy.confirmHelp}</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                value={sessionCode}
                onChange={(event) => setSessionCode(normalizeCode(event.target.value))}
                placeholder={copy.verificationCode}
                className="min-h-11 flex-1 rounded-xl border border-[var(--line)] px-3"
              />
              <button
                type="button"
                disabled={loading || sessionCode.length !== 6}
                onClick={() => run(() => verifyFactor(firstVerifiedFactor.id, sessionCode, "MFA_SESSION_CONFIRMED"))}
                className="rounded-xl bg-[var(--ink-1)] px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? copy.working : copy.confirmSession}
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-[var(--line)] bg-white p-4">
        {!enrollment ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => run(startEnrollment)}
              className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? copy.working : copy.setup}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => run(refreshStatus)}
              className="rounded-xl border border-[var(--line)] bg-white px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {copy.refresh}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm leading-6 text-[var(--ink-2)]">{copy.setupHelp}</p>
            <div className="grid gap-4 md:grid-cols-[220px_1fr]">
              <div className="rounded-2xl border border-[var(--line)] bg-white p-3">
                <Image
                  src={enrollment.qrCode}
                  alt="MFA QR code"
                  width={220}
                  height={220}
                  unoptimized
                  className="h-auto w-full rounded-xl"
                />
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-2)]">{copy.secret}</p>
                  <code className="mt-1 block break-all rounded-xl bg-[var(--surface-2)] p-3 text-sm">{enrollment.secret}</code>
                </div>
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={setupCode}
                  onChange={(event) => setSetupCode(normalizeCode(event.target.value))}
                  placeholder={copy.verificationCode}
                  className="min-h-11 w-full rounded-xl border border-[var(--line)] px-3"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={loading || setupCode.length !== 6}
                    onClick={() => run(() => verifyFactor(enrollment.factorId, setupCode, "MFA_VERIFIED"))}
                    className="rounded-xl bg-[var(--ink-1)] px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? copy.working : copy.verifySetup}
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => run(cancelEnrollment)}
                    className="rounded-xl border border-[var(--line)] bg-white px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {copy.cancelSetup}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
