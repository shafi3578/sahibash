import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentLocale } from "@/lib/i18n/server";
import { localizePath } from "@/lib/i18n/routing";

type CellRow = {
  category_id: number | null;
  category_node_id: number | null;
  province: string | null;
  district: string | null;
  cell_status: string;
  demand_score: number | null;
  fresh_supply_score: number | null;
  search_success_rate: number | null;
  contact_rate: number | null;
  stale_rate: number | null;
  native_or_claimed_share: number | null;
  active_supply: number | null;
  external_unclaimed_supply: number | null;
  active_wanted_requests: number | null;
  priority_score?: number | null;
  recommended_action?: string | null;
};

type RetirementRow = {
  category_id: number | null;
  category_node_id: number | null;
  province: string | null;
  district: string | null;
  current_stage: string;
  recommended_next_stage: string;
  active_supply: number | null;
  external_unclaimed_supply: number | null;
  supply_without_external: number | null;
  simulated_result_retention_rate: number | null;
  simulated_zero_result_risk: number | null;
  simulation_only: boolean | null;
  rollback_enabled: boolean | null;
};

type PriceRow = {
  category_id: number | null;
  category_node_id: number | null;
  province: string | null;
  currency: string;
  sample_count: number;
  p25_price: number | null;
  median_price: number | null;
  p75_price: number | null;
  confidence: number | null;
};

type TrustRow = {
  quality_band: string;
  count: number;
};

type SourceRow = {
  source_type: string;
  total_listings: number | null;
  approved_listings: number | null;
  removed_or_archived: number | null;
  stale_or_expired: number | null;
  claim_or_native_share: number | null;
  stale_rate: number | null;
};

const pct = (value: number | null | undefined) => `${((Number(value ?? 0)) * 100).toFixed(1)}%`;
const num = (value: number | null | undefined) => Number(value ?? 0).toLocaleString("en-US");

function cellLabel(row: { category_id: number | null; category_node_id: number | null; province: string | null; district?: string | null }) {
  const market = `cat ${row.category_id ?? "any"} / sub ${row.category_node_id ?? "any"}`;
  const place = [row.province, row.district].filter(Boolean).join(" / ") || "All Afghanistan";
  return `${market} · ${place}`;
}

export default async function AdminNetworkReadinessPage() {
  await requirePermission("search.view");
  const locale = await getCurrentLocale();
  const supabase = await createSupabaseServerClient();

  const [marketsResult, retirementResult, pricesResult, trustResult, sourceResult] = await Promise.all([
    supabase.from("admin_next_best_markets").select("*").limit(12),
    supabase.from("admin_external_retirement_simulation").select("*").limit(12),
    supabase.from("admin_price_intelligence_cohorts").select("*").order("confidence", { ascending: false }).limit(10),
    supabase.from("admin_listing_trust_quality").select("quality_band").limit(500),
    supabase.from("admin_source_health").select("*").limit(12),
  ]);

  const markets = (marketsResult.data ?? []) as CellRow[];
  const retirement = (retirementResult.data ?? []) as RetirementRow[];
  const prices = (pricesResult.data ?? []) as PriceRow[];
  const sources = (sourceResult.data ?? []) as SourceRow[];
  const trustCounts = ((trustResult.data ?? []) as Array<{ quality_band: string }>).reduce<Record<string, number>>((acc, row) => {
    acc[row.quality_band] = (acc[row.quality_band] ?? 0) + 1;
    return acc;
  }, {});
  const trust = Object.entries(trustCounts).map(([quality_band, count]) => ({ quality_band, count })) as TrustRow[];

  const copy = locale === "fa"
    ? {
        back: "بازگشت به ادمین",
        title: "آمادگی شبکه صاحباش",
        subtitle: "نمای تجمیعی و بدون اطلاعات شخصی برای نقدینگی بازار، کاهش وابستگی به موجودی خارجی، قیمت، اعتماد و سلامت منبع.",
        nextBest: "بازارهای پیشنهادی بعدی",
        retirement: "شبیه‌سازی کاهش موجودی خارجی",
        price: "هوش قیمت",
        trust: "کیفیت و اعتماد",
        source: "سلامت منابع",
        empty: "هنوز داده کافی با آستانه حریم خصوصی وجود ندارد.",
      }
    : locale === "ps"
      ? {
          back: "ادمین ته بېرته",
          title: "د صاحباش شبکې چمتووالی",
          subtitle: "د بازار مایعیت، بهرني موجودي کمولو، بیې، باور او سرچینې روغتیا لپاره ټولیز او بې‌PII لید.",
          nextBest: "راتلونکي غوره بازارونه",
          retirement: "د بهرني موجودي کمولو شبیه‌سازي",
          price: "د بیې پوهه",
          trust: "کیفیت او باور",
          source: "د سرچینو روغتیا",
          empty: "لا د خوندي ښودلو لپاره کافي معلومات نشته.",
        }
      : {
          back: "Back to admin",
          title: "Sahibash Network Readiness",
          subtitle: "Aggregate, PII-safe control room for liquidity, bootstrap retirement, price intelligence, trust quality, and source health.",
          nextBest: "Next Best Markets",
          retirement: "External Retirement Simulation",
          price: "Price Intelligence",
          trust: "Trust & Quality Bands",
          source: "Source Health",
          empty: "Not enough privacy-safe aggregate data yet.",
        };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href={localizePath("/admin", locale)} className="text-sm font-semibold text-[var(--ink-2)]">
        ← {copy.back}
      </Link>
      <p className="mt-6 text-xs font-bold uppercase tracking-widest text-[var(--accent)]">Step 3</p>
      <h1 className="mt-2 font-display text-3xl font-bold">{copy.title}</h1>
      <p className="mt-2 max-w-4xl text-sm leading-6 text-[var(--ink-2)]">{copy.subtitle}</p>

      <section className="mt-6 rounded-2xl border border-[var(--line)] bg-white p-5">
        <h2 className="font-display text-xl font-bold">{copy.nextBest}</h2>
        <div className="mt-4 divide-y divide-[var(--line)]">
          {markets.length ? markets.map((row) => (
            <article key={`${row.category_id}-${row.category_node_id}-${row.province}-${row.district}`} className="py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{cellLabel(row)}</p>
                  <p className="mt-1 text-xs text-[var(--ink-2)]">{row.recommended_action}</p>
                </div>
                <span className="rounded-full bg-[var(--surface-2)] px-3 py-1 text-xs font-bold">{row.cell_status}</span>
              </div>
              <div className="mt-3 grid gap-2 text-xs text-[var(--ink-2)] sm:grid-cols-4">
                <span>Priority {num(row.priority_score)}</span>
                <span>Search success {pct(row.search_success_rate)}</span>
                <span>Contact {pct(row.contact_rate)}</span>
                <span>Native/claimed {pct(row.native_or_claimed_share)}</span>
              </div>
            </article>
          )) : <p className="py-4 text-sm text-[var(--ink-2)]">{copy.empty}</p>}
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[var(--line)] bg-white p-5">
          <h2 className="font-display text-xl font-bold">{copy.retirement}</h2>
          <div className="mt-4 space-y-3">
            {retirement.length ? retirement.map((row) => (
              <div key={`${row.category_id}-${row.category_node_id}-${row.province}-${row.district}`} className="rounded-xl border border-[var(--line)] p-4 text-sm">
                <p className="font-semibold">{cellLabel(row)}</p>
                <p className="mt-1 text-[var(--ink-2)]">{row.current_stage} → {row.recommended_next_stage}</p>
                <p className="mt-2 text-xs text-[var(--ink-2)]">Supply after removing unclaimed external: {num(row.supply_without_external)} / {num(row.active_supply)} · zero-result risk {pct(row.simulated_zero_result_risk)} · rollback {row.rollback_enabled ? "on" : "off"}</p>
              </div>
            )) : <p className="py-4 text-sm text-[var(--ink-2)]">{copy.empty}</p>}
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--line)] bg-white p-5">
          <h2 className="font-display text-xl font-bold">{copy.price}</h2>
          <div className="mt-4 space-y-3">
            {prices.length ? prices.map((row) => (
              <div key={`${row.category_id}-${row.category_node_id}-${row.province}-${row.currency}`} className="rounded-xl border border-[var(--line)] p-4 text-sm">
                <p className="font-semibold">{cellLabel(row)}</p>
                <p className="mt-1 text-[var(--ink-2)]">{row.currency} {num(row.p25_price)} – {num(row.p75_price)} · median {num(row.median_price)}</p>
                <p className="mt-2 text-xs text-[var(--ink-2)]">Samples {num(row.sample_count)} · confidence {pct(row.confidence)} · seller guidance only</p>
              </div>
            )) : <p className="py-4 text-sm text-[var(--ink-2)]">{copy.empty}</p>}
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--line)] bg-white p-5">
          <h2 className="font-display text-xl font-bold">{copy.trust}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {trust.length ? trust.map((row) => (
              <div key={row.quality_band} className="rounded-xl border border-[var(--line)] p-4">
                <p className="text-sm text-[var(--ink-2)]">{row.quality_band}</p>
                <p className="mt-2 text-2xl font-bold">{num(row.count)}</p>
              </div>
            )) : <p className="text-sm text-[var(--ink-2)]">{copy.empty}</p>}
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--line)] bg-white p-5">
          <h2 className="font-display text-xl font-bold">{copy.source}</h2>
          <div className="mt-4 space-y-3">
            {sources.length ? sources.map((row) => (
              <div key={row.source_type} className="rounded-xl border border-[var(--line)] p-4 text-sm">
                <div className="flex justify-between gap-3">
                  <p className="font-semibold">{row.source_type}</p>
                  <p>{num(row.approved_listings)} approved</p>
                </div>
                <p className="mt-2 text-xs text-[var(--ink-2)]">Total {num(row.total_listings)} · stale {pct(row.stale_rate)} · claimed/native {pct(row.claim_or_native_share)} · removed/archived {num(row.removed_or_archived)}</p>
              </div>
            )) : <p className="py-4 text-sm text-[var(--ink-2)]">{copy.empty}</p>}
          </div>
        </section>
      </div>
    </main>
  );
}
