import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentLocale } from "@/lib/i18n/server";
import { formatNumber } from "@/lib/i18n/format";

const COPY = {
  en: {
    title: "Professional Seller",
    description: "A launch dashboard for stores, dealers, and regular sellers using your existing Sahibash account.",
    storeProfile: "Store profile",
    inventory: "Inventory",
    active: "Active listings",
    pending: "Under review",
    sold: "Sold",
    contacts: "Lead/contact actions",
    featured: "Featured promotions",
    verification: "Verification",
    bulk: "Bulk upload/import",
    team: "Team members",
    templates: "Saved templates",
    analytics: "Performance analytics",
    comingSoon: "Prepared for launch controls. This section uses seller_entities and existing listings; no second account system.",
    myAds: "Manage listings",
  },
  fa: {
    title: "فروشنده حرفه‌ای",
    description: "داشبورد آغازین برای دکان‌ها، نمایشگاه‌ها و فروشندگان فعال با همان حساب صاحبش.",
    storeProfile: "پروفایل فروشگاه",
    inventory: "موجودی",
    active: "اعلان‌های فعال",
    pending: "در حال بررسی",
    sold: "فروخته‌شده",
    contacts: "اقدام‌های تماس/لید",
    featured: "تبلیغات ویژه",
    verification: "تأیید",
    bulk: "آپلود/واردات گروهی",
    team: "اعضای تیم",
    templates: "قالب‌های ذخیره‌شده",
    analytics: "تحلیل عملکرد",
    comingSoon: "برای کنترل‌های لانچ آماده شده است. این بخش از seller_entities و اعلان‌های موجود استفاده می‌کند؛ سیستم حساب دوم ندارد.",
    myAds: "مدیریت اعلان‌ها",
  },
  ps: {
    title: "مسلکي پلورونکی",
    description: "د دوکانونو، ډیلرانو او فعالو پلورونکو لپاره د هماغه صاحبش حساب سره د پیل ډشبورډ.",
    storeProfile: "د پلورنځي پروفایل",
    inventory: "موجودي",
    active: "فعال اعلانونه",
    pending: "تر کتنې لاندې",
    sold: "پلورل شوي",
    contacts: "د اړیکې/لېډ فعالیتونه",
    featured: "ځانګړي اعلانونه",
    verification: "تایید",
    bulk: "ډله‌ییز اپلوډ/واردات",
    team: "د ټیم غړي",
    templates: "ساتل شوي قالبونه",
    analytics: "د فعالیت شننه",
    comingSoon: "د لانچ کنټرولونو لپاره چمتو دی. دا برخه seller_entities او موجود اعلانونه کاروي؛ دوهم حساب سیسټم نه جوړوي.",
    myAds: "اعلانونه اداره کړئ",
  },
};

type CountResult = { count: number | null };

type CountQuery = PromiseLike<CountResult> & {
  eq: (column: string, value: unknown) => CountQuery;
};

async function countRows(table: string, apply: (query: CountQuery) => CountQuery) {
  try {
    const supabase = await createSupabaseServerClient();
    const fromTable = supabase.from.bind(supabase) as unknown as (tableName: string) => {
      select: (columns: string, options: { count: "exact"; head: true }) => CountQuery;
    };
    const query = apply(fromTable(table).select("id", { count: "exact", head: true }));
    const { count } = await query;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export default async function ProfessionalSellerPage() {
  const user = await requireUser();
  const locale = await getCurrentLocale();
  const copy = COPY[locale];
  const supabase = await createSupabaseServerClient();

  const [{ data: sellerEntity }, active, pending, sold, contacts, featuredRequests] = await Promise.all([
    supabase
      .from("seller_entities")
      .select("id, display_name, verification_status, preferred_locale, created_at")
      .eq("linked_user_id", user.id)
      .maybeSingle(),
    countRows("listings", (q) => q.eq("user_id", user.id).eq("status", "approved")),
    countRows("listings", (q) => q.eq("user_id", user.id).eq("status", "pending")),
    countRows("listings", (q) => q.eq("user_id", user.id).eq("status", "sold")),
    countRows("messages", (q) => q.eq("recipient_user_id", user.id)),
    countRows("promotion_payment_requests", (q) => q.eq("user_id", user.id)),
  ]);

  const stats = [
    [copy.active, active],
    [copy.pending, pending],
    [copy.sold, sold],
    [copy.contacts, contacts],
    [copy.featured, featuredRequests],
  ] as const;

  const modules = [
    copy.storeProfile,
    copy.inventory,
    copy.bulk,
    copy.team,
    copy.verification,
    copy.templates,
    copy.analytics,
  ];

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-[var(--line)] bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          {sellerEntity?.verification_status ?? "seller"}
        </p>
        <h1 className="mt-2 font-display text-3xl font-black">{sellerEntity?.display_name ?? copy.title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--ink-2)]">{copy.description}</p>
        <p className="mt-3 rounded-2xl bg-[var(--surface-2)] p-3 text-sm text-[var(--ink-2)]">{copy.comingSoon}</p>
        <Link href="/dashboard/my-ads" className="mt-4 inline-flex rounded-xl bg-[var(--ink-1)] px-4 py-2 text-sm font-bold text-white">
          {copy.myAds}
        </Link>
      </div>

      <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm">
            <p className="text-sm text-[var(--ink-2)]">{label}</p>
            <p className="mt-1 text-3xl font-black">{formatNumber(value, locale)}</p>
          </div>
        ))}
      </section>

      <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => (
          <div key={module} className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--surface-2)] p-4">
            <p className="font-bold">{module}</p>
            <p className="mt-1 text-sm text-[var(--ink-2)]">{copy.comingSoon}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
