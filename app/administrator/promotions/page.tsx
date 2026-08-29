import Link from "next/link";
import { requireSuperAdministrator } from "@/lib/auth";
import { updateFeaturedCampaignConfigAction } from "@/lib/actions/featured-payments";
import { updateAiFeatureFlagAction } from "@/lib/actions/ai-feature-flags";
import { getAiFeatureFlagAdminRows, getAiSearchDailyMetrics, type AiFeatureFlagKey } from "@/lib/ai/feature-flags";
import { getActiveFeaturedCampaignConfig } from "@/lib/data/featured-payments";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentLocale } from "@/lib/i18n/server";
import { formatDate, formatNumber } from "@/lib/i18n/format";
import { adminPath } from "@/lib/admin/routing";

const COPY = {
  en: {
    title: "Promotion & AI Control Center",
    description: "Super Admin controls for Featured pricing, HesabPay launch references, AI flags, and launch readiness.",
    back: "Back to Control Center",
    featured: "Featured launch campaign",
    amount: "Launch price (AFN)",
    duration: "Duration in days",
    paymentMethod: "Payment method label",
    merchantReference: "HesabPay destination / merchant reference",
    instructionsEn: "Instructions in English",
    instructionsFa: "Instructions in Dari",
    instructionsPs: "Instructions in Pashto",
    save: "Save promotion config",
    noSecrets: "Do not store API keys or private credentials here. Keep secrets in server environment variables only.",
    current: "Current",
    notConfigured: "Featured campaign is not configured yet. Apply the Step 3 migration first.",
    launchFlags: "Launch feature flags",
    environment: "Environment readiness",
    configured: "Configured",
    missing: "Missing",
    provider: "Provider",
    updated: "Updated",
    aiFeatures: "AI feature controls",
    aiFeaturesHelp: "Independent, server-side controls. Enabling AI Search first verifies a real AI Gateway response. Posting AI remains optional and manual posting always works.",
    enabled: "Active",
    disabled: "Off",
    enable: "Enable",
    disable: "Disable",
    changedBy: "Changed by",
    never: "Not changed yet",
    gatewayReady: "AI Gateway credential",
    aiSaved: "AI feature setting saved and audited.",
    aiFailed: "The setting was not changed. Gateway verification, authorization, or audit logging failed.",
    today: "Today",
    requests: "AI requests",
    successRate: "Gateway success",
    fallbackRate: "Fallback",
    zeroRate: "Zero results",
    latency: "Average latency",
    cost: "Estimated cost",
  },
  fa: {
    title: "مرکز کنترل اعلان ویژه و هوش مصنوعی",
    description: "کنترل سوپر ادمین برای قیمت اعلان ویژه، مراجع HesabPay، فلگ‌های AI و آمادگی لانچ.",
    back: "بازگشت به مرکز کنترل",
    featured: "کمپاین آغازین اعلان ویژه",
    amount: "قیمت آغازین (AFN)",
    duration: "مدت به روز",
    paymentMethod: "برچسب روش پرداخت",
    merchantReference: "مقصد / مرجع تاجر HesabPay",
    instructionsEn: "راهنما به انگلیسی",
    instructionsFa: "راهنما به دری",
    instructionsPs: "راهنما به پشتو",
    save: "ذخیره تنظیم ویژه",
    noSecrets: "کلید API یا معلومات محرمانه را اینجا ذخیره نکنید. رازها فقط در متغیرهای محیطی سرور باشند.",
    current: "فعلی",
    notConfigured: "کمپاین اعلان ویژه هنوز تنظیم نشده است. ابتدا مایگریشن Step 3 را اجرا کنید.",
    launchFlags: "فلگ‌های لانچ",
    environment: "آمادگی محیط",
    configured: "تنظیم شده",
    missing: "ناقص",
    provider: "ارائه‌دهنده",
    updated: "به‌روزرسانی",
    aiFeatures: "کنترل قابلیت‌های هوش مصنوعی",
    aiFeaturesHelp: "کنترل‌های مستقل و سمت سرور. پیش از فعال‌شدن جستجوی AI یک درخواست واقعی Gateway تأیید می‌شود. AI نشر اعلان اختیاری است و نشر دستی همیشه کار می‌کند.",
    enabled: "فعال",
    disabled: "خاموش",
    enable: "فعال‌سازی",
    disable: "غیرفعال‌سازی",
    changedBy: "تغییر توسط",
    never: "هنوز تغییر نکرده",
    gatewayReady: "کلید AI Gateway",
    aiSaved: "تنظیم قابلیت AI ذخیره و ثبت شد.",
    aiFailed: "تنظیم تغییر نکرد. تأیید Gateway، مجوز یا ثبت رویداد موفق نبود.",
    today: "امروز",
    requests: "درخواست‌های AI",
    successRate: "موفقیت Gateway",
    fallbackRate: "بازگشت به جستجوی عادی",
    zeroRate: "بدون نتیجه",
    latency: "میانگین زمان پاسخ",
    cost: "هزینه تخمینی",
  },
  ps: {
    title: "د ځانګړي اعلان او AI کنټرول مرکز",
    description: "د سوپر اډمین کنټرولونه د ځانګړي اعلان بیې، HesabPay مراجع، AI فلګونو او لانچ چمتووالي لپاره.",
    back: "کنټرول مرکز ته بېرته",
    featured: "د ځانګړي اعلان د پیل کمپاین",
    amount: "د پیل بیه (AFN)",
    duration: "موده په ورځو",
    paymentMethod: "د تادیې طریقې لیبل",
    merchantReference: "د HesabPay منزل / سوداګریز رفرنس",
    instructionsEn: "انګلیسي لارښوونې",
    instructionsFa: "دري لارښوونې",
    instructionsPs: "پښتو لارښوونې",
    save: "د ځانګړي اعلان تنظیم خوندي کړئ",
    noSecrets: "API کیلي یا پټ معلومات دلته مه ساتئ. رازونه یوازې د سرور په محیط متغیرونو کې وساتئ.",
    current: "اوسنی",
    notConfigured: "د ځانګړي اعلان کمپاین لا نه دی تنظیم شوی. لومړی د Step 3 مایګریشن تطبیق کړئ.",
    launchFlags: "د لانچ فیچر فلګونه",
    environment: "د محیط چمتووالی",
    configured: "تنظیم شوی",
    missing: "ناقص",
    provider: "چمتوکوونکی",
    updated: "تازه شوی",
    aiFeatures: "د AI ځانګړنو کنټرول",
    aiFeaturesHelp: "خپلواک، سروري کنټرولونه. د AI لټون له فعالېدو مخکې د Gateway رښتینې غوښتنه تاییدېږي. د اعلان AI اختیاري دی او لاسي اعلان تل کار کوي.",
    enabled: "فعال",
    disabled: "بند",
    enable: "فعالول",
    disable: "بندول",
    changedBy: "بدلون کوونکی",
    never: "تر اوسه نه دی بدل شوی",
    gatewayReady: "د AI Gateway کیلي",
    aiSaved: "د AI ځانګړنې تنظیم خوندي او ثبت شو.",
    aiFailed: "تنظیم بدل نه شو. د Gateway تایید، اجازه یا د پلټنې ثبت ناکام شو.",
    today: "نن",
    requests: "د AI غوښتنې",
    successRate: "د Gateway بریا",
    fallbackRate: "عادي لټون ته ستنېدل",
    zeroRate: "بې پایلې",
    latency: "منځنی ځنډ",
    cost: "اټکلي لګښت",
  },
};

const AI_FLAG_COPY: Record<AiFeatureFlagKey, Record<"en" | "fa" | "ps", { title: string; description: string }>> = {
  ai_search_enabled: {
    en: { title: "AI Search", description: "Adds an optional AI Search button beside normal search. Normal search never calls a model." },
    fa: { title: "جستجوی AI", description: "یک دکمه اختیاری AI کنار جستجوی عادی می‌افزاید. جستجوی عادی هرگز مدل را فراخوانی نمی‌کند." },
    ps: { title: "AI لټون", description: "د عادي لټون تر څنګ اختیاري AI تڼۍ زیاتوي. عادي لټون هېڅکله ماډل نه رابولي." },
  },
  ai_posting_category_suggestions_enabled: {
    en: { title: "Posting category suggestions", description: "Allows optional text-based category suggestions. The seller still confirms a live leaf category." },
    fa: { title: "پیشنهاد دسته‌بندی اعلان", description: "پیشنهاد اختیاری دسته‌بندی بر اساس متن را فعال می‌کند. فروشنده همچنان دسته نهایی فعال را تأیید می‌کند." },
    ps: { title: "د اعلان کټګورۍ وړاندیز", description: "د متن اختیاري کټګورۍ وړاندیز فعالوي. پلورونکی بیا هم ژوندۍ وروستۍ کټګوري تاییدوي." },
  },
  ai_posting_image_detection_enabled: {
    en: { title: "Posting image detection", description: "Allows image classification only while category suggestions are also active." },
    fa: { title: "تشخیص تصویر اعلان", description: "طبقه‌بندی تصویر را فقط هنگامی اجازه می‌دهد که پیشنهاد دسته‌بندی نیز فعال باشد." },
    ps: { title: "د اعلان انځور پېژندنه", description: "یوازې هغه وخت د انځور طبقه‌بندي اجازه ورکوي چې د کټګورۍ وړاندیز هم فعال وي." },
  },
};

async function getLaunchFlags() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("feature_flags")
      .select("key, description, enabled, rollout_percent, updated_at")
      .in("key", [
        "featured_payments_hesabpay_manual",
        "sahibash_ai_search_parser",
        "ai_moderation_shadow",
        "professional_seller_dashboard",
      ])
      .order("key", { ascending: true });
    return (data ?? []) as Array<{
      key: string;
      description: string;
      enabled: boolean;
      rollout_percent: number;
      updated_at: string;
    }>;
  } catch {
    return [];
  }
}

export default async function AdministratorPromotionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireSuperAdministrator();
  const [locale, rawParams] = await Promise.all([getCurrentLocale(), searchParams]);
  const copy = COPY[locale];
  const [config, flags, aiFlags, aiMetrics] = await Promise.all([
    getActiveFeaturedCampaignConfig(),
    getLaunchFlags(),
    getAiFeatureFlagAdminRows(),
    getAiSearchDailyMetrics(),
  ]);
  const aiResult = Array.isArray(rawParams.ai) ? rawParams.ai[0] : rawParams.ai;

  const environment = [
    ["NEXT_PUBLIC_SUPABASE_URL", Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL)],
    ["NEXT_PUBLIC_SUPABASE_ANON_KEY", Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)],
    ["SUPABASE_SERVICE_ROLE_KEY", Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)],
    [copy.gatewayReady, Boolean(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN)],
    ["HUGGINGFACE_API_KEY", Boolean(process.env.HUGGINGFACE_API_KEY)],
  ] as const;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href={adminPath("/administrator")} className="text-sm font-semibold text-[var(--accent)]">
        ← {copy.back}
      </Link>
      <h1 className="mt-3 font-display text-3xl font-black">{copy.title}</h1>
      <p className="mt-1 text-sm text-[var(--ink-2)]">{copy.description}</p>
      {aiResult ? (
        <p className={`mt-4 rounded-xl border px-4 py-3 text-sm font-semibold ${aiResult === "saved" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-900"}`}>
          {aiResult === "saved" ? copy.aiSaved : copy.aiFailed}
        </p>
      ) : null}

      <section className="mt-6 rounded-3xl border border-indigo-200 bg-indigo-50/60 p-5">
        <h2 className="text-xl font-black text-indigo-950">{copy.aiFeatures}</h2>
        <p className="mt-1 text-sm text-indigo-900">{copy.aiFeaturesHelp}</p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3 lg:grid-cols-6">
          {[
            [copy.requests, formatNumber(aiMetrics.requests, locale)],
            [copy.successRate, `${formatNumber(aiMetrics.successRate * 100, locale, { maximumFractionDigits: 1 })}%`],
            [copy.fallbackRate, `${formatNumber(aiMetrics.fallbackRate * 100, locale, { maximumFractionDigits: 1 })}%`],
            [copy.zeroRate, `${formatNumber(aiMetrics.zeroResultRate * 100, locale, { maximumFractionDigits: 1 })}%`],
            [copy.latency, `${formatNumber(aiMetrics.averageLatencyMs, locale)} ms`],
            [copy.cost, `$${aiMetrics.estimatedCostUsd.toFixed(6)}`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-indigo-100 bg-white px-3 py-2">
              <p className="text-xs text-slate-500">{copy.today} · {label}</p>
              <p className="mt-1 font-bold text-slate-950">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-3">
          {aiFlags.map((flag) => {
            const localized = AI_FLAG_COPY[flag.key][locale];
            return (
              <div key={flag.key} className="grid gap-3 rounded-2xl border border-indigo-100 bg-white p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-slate-950">{localized.title}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${flag.enabled ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
                      {flag.enabled ? copy.enabled : copy.disabled}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{localized.description}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {copy.updated}: {flag.updatedAt ? formatDate(flag.updatedAt, locale, { dateStyle: "medium", timeStyle: "short" }) : copy.never}
                    {flag.updatedBy ? ` · ${copy.changedBy}: ${flag.updatedBy}` : ""}
                  </p>
                </div>
                <form action={updateAiFeatureFlagAction}>
                  <input type="hidden" name="key" value={flag.key} />
                  <input type="hidden" name="enabled" value={flag.enabled ? "false" : "true"} />
                  <button className={`min-h-11 rounded-xl px-4 text-sm font-bold ${flag.enabled ? "border border-slate-300 bg-white text-slate-700" : "bg-indigo-700 text-white"}`}>
                    {flag.enabled ? copy.disable : copy.enable}
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="text-xl font-black text-amber-950">{copy.featured}</h2>
        <p className="mt-1 text-sm text-amber-900">{copy.noSecrets}</p>
        {config ? (
          <div className="mt-4 grid gap-2 rounded-2xl bg-white p-4 text-sm text-slate-700 sm:grid-cols-3">
            <p>
              <span className="block font-semibold text-slate-950">{copy.current}</span>
              {formatNumber(config.amount, locale)} {config.currency} · {formatNumber(config.duration_days, locale)}
            </p>
            <p>
              <span className="block font-semibold text-slate-950">{copy.provider}</span>
              HesabPay
            </p>
            <p>
              <span className="block font-semibold text-slate-950">{copy.updated}</span>
              {config.updated_at ? formatDate(config.updated_at, locale, { dateStyle: "medium", timeStyle: "short" }) : "—"}
            </p>
          </div>
        ) : (
          <p className="mt-4 rounded-2xl border border-amber-200 bg-white p-4 text-sm text-amber-900">
            {copy.notConfigured}
          </p>
        )}

        <form action={updateFeaturedCampaignConfigAction} className="mt-5 grid gap-4 rounded-3xl border border-amber-100 bg-white p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-semibold">
              {copy.amount}
              <input name="amount" type="number" min="1" step="0.01" defaultValue={config?.amount ?? 10} className="min-h-11 rounded-xl border border-[var(--line)] px-3" />
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              {copy.duration}
              <input name="duration_days" type="number" min="1" max="365" defaultValue={config?.duration_days ?? 7} className="min-h-11 rounded-xl border border-[var(--line)] px-3" />
            </label>
          </div>
          <label className="grid gap-1 text-sm font-semibold">
            {copy.paymentMethod}
            <input name="payment_method" defaultValue={config?.payment_method ?? "HesabPay manual proof"} className="min-h-11 rounded-xl border border-[var(--line)] px-3" />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            {copy.merchantReference}
            <input name="merchant_reference" defaultValue={config?.merchant_reference ?? ""} className="min-h-11 rounded-xl border border-[var(--line)] px-3" />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            {copy.instructionsEn}
            <textarea name="instructions_en" defaultValue={config?.instructions_en ?? ""} className="min-h-28 rounded-xl border border-[var(--line)] px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            {copy.instructionsFa}
            <textarea name="instructions_fa" dir="rtl" defaultValue={config?.instructions_fa ?? ""} className="min-h-28 rounded-xl border border-[var(--line)] px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            {copy.instructionsPs}
            <textarea name="instructions_ps" dir="rtl" defaultValue={config?.instructions_ps ?? ""} className="min-h-28 rounded-xl border border-[var(--line)] px-3 py-2" />
          </label>
          <button className="min-h-11 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white">
            {copy.save}
          </button>
        </form>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-[var(--line)] bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black">{copy.launchFlags}</h2>
          <div className="mt-4 grid gap-2">
            {flags.map((flag) => (
              <div key={flag.key} className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{flag.key}</p>
                  <span className={flag.enabled ? "text-sm font-bold text-emerald-700" : "text-sm font-bold text-slate-500"}>
                    {flag.enabled ? copy.configured : copy.missing} · {formatNumber(flag.rollout_percent, locale)}%
                  </span>
                </div>
                <p className="mt-1 text-sm text-[var(--ink-2)]">{flag.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--line)] bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black">{copy.environment}</h2>
          <div className="mt-4 grid gap-2">
            {environment.map(([name, present]) => (
              <div key={name} className="flex items-center justify-between rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-3 text-sm">
                <span className="font-mono">{name}</span>
                <span className={present ? "font-bold text-emerald-700" : "font-bold text-red-700"}>
                  {present ? copy.configured : copy.missing}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
