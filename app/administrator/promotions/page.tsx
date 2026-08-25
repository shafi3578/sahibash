import Link from "next/link";
import { requireSuperAdministrator } from "@/lib/auth";
import { updateFeaturedCampaignConfigAction } from "@/lib/actions/featured-payments";
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

export default async function AdministratorPromotionsPage() {
  await requireSuperAdministrator();
  const locale = await getCurrentLocale();
  const copy = COPY[locale];
  const [config, flags] = await Promise.all([
    getActiveFeaturedCampaignConfig(),
    getLaunchFlags(),
  ]);

  const environment = [
    ["NEXT_PUBLIC_SUPABASE_URL", Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL)],
    ["NEXT_PUBLIC_SUPABASE_ANON_KEY", Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)],
    ["SUPABASE_SERVICE_ROLE_KEY", Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)],
    ["HUGGINGFACE_API_KEY", Boolean(process.env.HUGGINGFACE_API_KEY)],
  ] as const;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href={adminPath("/administrator")} className="text-sm font-semibold text-[var(--accent)]">
        ← {copy.back}
      </Link>
      <h1 className="mt-3 font-display text-3xl font-black">{copy.title}</h1>
      <p className="mt-1 text-sm text-[var(--ink-2)]">{copy.description}</p>

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
