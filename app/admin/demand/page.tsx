import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentLocale } from "@/lib/i18n/server";
import { localizePath } from "@/lib/i18n/routing";

type SupplyGapCell = {
  category_path: string | null;
  province: string | null;
  district: string | null;
  raw_searches: number | null;
  zero_result_searches: number | null;
  wanted_requests: number | null;
  contact_actions: number | null;
  qualified_demand_score: number | null;
  privacy_safe_gap_score: number | null;
  last_signal_at: string | null;
};

export default async function AdminDemandPage() {
  await requirePermission("search.view");
  const locale = await getCurrentLocale();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("admin_supply_gap_cells")
    .select("category_path,province,district,raw_searches,zero_result_searches,wanted_requests,contact_actions,qualified_demand_score,privacy_safe_gap_score,last_signal_at")
    .not("privacy_safe_gap_score", "is", null)
    .order("privacy_safe_gap_score", { ascending: false })
    .limit(30);

  const rows = (data ?? []) as SupplyGapCell[];
  const copy = locale === "fa"
    ? {
        title: "تقاضا و کمبود عرضه",
        subtitle: "نمای خصوصی و تجمیعی از جاهایی که صاحباش باید موجودی بیشتری جذب کند.",
        back: "بازگشت به ادمین",
        market: "بازار",
        signals: "سیگنال‌ها",
        gap: "امتیاز کمبود",
        none: "هنوز داده کافی برای نمایش امن وجود ندارد.",
      }
    : locale === "ps"
      ? {
          title: "تقاضا او د عرضې تشه",
          subtitle: "خصوصي او ټولیز لید چې صاحباش چیرته باید نوره موجودي راجلب کړي.",
          back: "ادمین ته بېرته",
          market: "بازار",
          signals: "سیګنالونه",
          gap: "د تشې نمره",
          none: "لا د خوندي ښودلو لپاره کافي معلومات نشته.",
        }
      : {
          title: "Demand & Supply Gaps",
          subtitle: "Privacy-safe aggregate view of where Sahibash should acquire more inventory next.",
          back: "Back to admin",
          market: "Market",
          signals: "Signals",
          gap: "Gap score",
          none: "Not enough privacy-safe demand data yet.",
        };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href={localizePath("/admin", locale)} className="text-sm font-semibold text-[var(--ink-2)]">
        ← {copy.back}
      </Link>
      <h1 className="mt-4 font-display text-3xl font-bold">{copy.title}</h1>
      <p className="mt-2 max-w-3xl text-sm text-[var(--ink-2)]">{copy.subtitle}</p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
        {rows.length === 0 ? (
          <p className="p-5 text-sm text-[var(--ink-2)]">{copy.none}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[var(--surface-2)] text-xs uppercase tracking-wide text-[var(--ink-2)]">
                <tr>
                  <th className="px-4 py-3">{copy.market}</th>
                  <th className="px-4 py-3">{copy.signals}</th>
                  <th className="px-4 py-3">{copy.gap}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={`${row.category_path}-${row.province}-${row.district}`} className="border-t border-[var(--line)]">
                    <td className="px-4 py-3">
                      <p className="font-semibold">{row.category_path ?? "uncategorized"}</p>
                      <p className="text-xs text-[var(--ink-2)]">{[row.province, row.district].filter(Boolean).join(" / ") || "All Afghanistan"}</p>
                    </td>
                    <td className="px-4 py-3 text-[var(--ink-2)]">
                      search {row.raw_searches ?? 0} · zero {row.zero_result_searches ?? 0} · wanted {row.wanted_requests ?? 0} · contact {row.contact_actions ?? 0}
                    </td>
                    <td className="px-4 py-3 font-bold">{row.privacy_safe_gap_score ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
