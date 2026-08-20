import { requirePermission } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentLocale } from "@/lib/i18n/server";

type CountQuery = {
  eq: (column: string, value: unknown) => CountQuery;
  neq: (column: string, value: unknown) => CountQuery;
  in: (column: string, values: unknown[]) => CountQuery;
} & PromiseLike<{ count: number | null }>;

async function countRows(table: string, filter?: (query: CountQuery) => CountQuery) {
  try {
    const supabase = await createSupabaseServerClient();
    let query = (supabase as unknown as { from: (name: string) => { select: (columns: string, options: { count: "exact"; head: true }) => CountQuery & PromiseLike<{ count: number | null }> } })
      .from(table)
      .select("id", { count: "exact", head: true });
    if (filter) query = filter(query);
    const { count } = await query;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export default async function InventoryControlCenterPage() {
  await requirePermission("listings.view");
  const locale = await getCurrentLocale();
  const copy = locale === "fa"
    ? {
        title: "کنترول موجودی و منابع",
        subtitle: "نمای عملیاتی برای فیدها، واردات، ادعاها، حذف‌ها و موجودی بیرونی.",
        sources: "منابع واردات",
        jobs: "وظایف واردات",
        candidates: "ردیف‌های مرحله‌بندی",
        claims: "ادعاهای مالکیت",
        duplicates: "گروه‌های تکراری",
        optOuts: "انصراف دائمی",
        external: "اعلان‌های بیرونی فعال",
        stale: "کهنه یا منقضی",
      }
    : locale === "ps"
      ? {
          title: "د موجودۍ او سرچینو کنټرول",
          subtitle: "د فیډونو، وارداتو، دعوو، لرې کولو او بهرنۍ موجودۍ عملیاتي لید.",
          sources: "د وارداتو سرچینې",
          jobs: "د وارداتو دندې",
          candidates: "مرحله شوي ریکارډونه",
          claims: "د مالکیت دعوې",
          duplicates: "تکراري ډلې",
          optOuts: "دایمي منع",
          external: "فعاله بهرنۍ اعلانونه",
          stale: "زاړه یا تېر شوي",
        }
      : {
          title: "Inventory Source Control",
          subtitle: "Operational view for feeds, imports, claims, removals, and external inventory.",
          sources: "Import sources",
          jobs: "Import jobs",
          candidates: "Staged rows",
          claims: "Ownership claims",
          duplicates: "Duplicate groups",
          optOuts: "Permanent opt-outs",
          external: "Active external listings",
          stale: "Stale or expired",
        };

  const [
    sources,
    jobs,
    candidates,
    claims,
    duplicates,
    optOuts,
    external,
    stale,
  ] = await Promise.all([
    countRows("listing_sources"),
    countRows("listing_ingest_jobs"),
    countRows("listing_ingest_candidates"),
    countRows("listing_claims"),
    countRows("listing_duplicate_groups"),
    countRows("external_import_opt_outs"),
    countRows("listings", (query) => query.neq("source_type", "native").eq("publication_status", "published")),
    countRows("listings", (query) => query.in("freshness_status", ["stale", "expired", "source_missing"])),
  ]);

  const cards = [
    [copy.sources, sources],
    [copy.jobs, jobs],
    [copy.candidates, candidates],
    [copy.claims, claims],
    [copy.duplicates, duplicates],
    [copy.optOuts, optOuts],
    [copy.external, external],
    [copy.stale, stale],
  ];

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold">{copy.title}</h1>
      <p className="mt-2 max-w-3xl text-sm text-[var(--ink-2)]">{copy.subtitle}</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([label, value]) => (
          <section key={label} className="rounded-xl border border-[var(--line)] bg-white p-4">
            <p className="text-sm text-[var(--ink-2)]">{label}</p>
            <p className="mt-2 text-3xl font-bold text-[var(--ink-1)]">{value}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
