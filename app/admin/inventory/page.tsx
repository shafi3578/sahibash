import Link from "next/link";
import { InventoryLiveRefresh } from "@/components/admin/inventory-live-refresh";
import { adminPath } from "@/lib/admin/routing";
import { requirePermission } from "@/lib/auth";
import { getCurrentLocale } from "@/lib/i18n/server";
import { localizePath } from "@/lib/i18n/routing";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type CountQuery = {
  eq: (column: string, value: unknown) => CountQuery;
  neq: (column: string, value: unknown) => CountQuery;
  in: (column: string, values: unknown[]) => CountQuery;
} & PromiseLike<{ count: number | null }>;

type SourceRow = {
  id: string;
  name: string;
  source_type: string;
  platform: string | null;
  ingest_method: string;
  status: string;
  kill_switch_enabled: boolean;
  created_at: string;
};

type JobRow = {
  id: string;
  source_id: string | null;
  source_type: string;
  status: string;
  dry_run: boolean;
  total_rows: number;
  accepted_rows: number;
  rejected_rows: number;
  duplicate_rows: number;
  error_rows: number;
  error_summary: string | null;
  created_at: string;
};

type CandidateRow = {
  id: string;
  job_id: string;
  source_id: string | null;
  row_number: number;
  source_item_id: string | null;
  status: string;
  normalized_payload: Record<string, unknown> | null;
  validation_errors: unknown;
  candidate_listing_id: string | null;
  normalized_title: string | null;
  normalized_location: string | null;
  normalized_price_afn: number | null;
  category_node_id: number | null;
  created_at: string;
};

type ExternalListingRow = {
  id: string;
  title: string;
  source_type: string;
  source_platform: string | null;
  source_url: string | null;
  publication_status: string;
  freshness_status: string;
  province: string | null;
  district: string | null;
  created_at: string;
};

type ClaimRow = {
  id: string;
  listing_id: string;
  status: string;
  challenge_channel: string | null;
  created_at: string;
};

type DuplicateRow = {
  id: string;
  canonical_listing_id: string | null;
  confidence: string;
  score: number | null;
  status: string;
  created_at: string;
};

type OptOutRow = {
  id: string;
  source_id: string | null;
  source_type: string | null;
  source_platform: string | null;
  reason: string | null;
  created_at: string;
};

const RECENT_LIMIT = 25;

async function countRows(table: string, filter?: (query: CountQuery) => CountQuery) {
  try {
    const supabase = await createSupabaseServerClient();
    let query = (supabase as unknown as {
      from: (name: string) => {
        select: (columns: string, options: { count: "exact"; head: true }) => CountQuery;
      };
    }).from(table).select("id", { count: "exact", head: true });
    if (filter) query = filter(query);
    const { count } = await query;
    return count ?? 0;
  } catch {
    return 0;
  }
}

function safeExternalHref(value: unknown) {
  if (typeof value !== "string" || value.trim() === "") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function StatusBadge({ value }: { value: string }) {
  const status = value.toLowerCase();
  const tone = ["active", "published", "accepted", "approved", "completed", "fresh"].includes(status)
    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
    : ["failed", "rejected", "blocked", "removed", "expired", "source_missing"].includes(status)
      ? "bg-red-50 text-red-700 ring-red-200"
      : ["awaiting_approval", "needs_review", "pending", "staged", "dry_run", "aging", "stale"].includes(status)
        ? "bg-amber-50 text-amber-800 ring-amber-200"
        : "bg-slate-100 text-slate-700 ring-slate-200";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${tone}`}>{value.replaceAll("_", " ")}</span>;
}

function Section({ id, title, description, children }: { id: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
      <div className="border-b border-[var(--line)] px-4 py-4 sm:px-5">
        <h2 className="font-display text-xl font-bold">{title}</h2>
        <p className="mt-1 text-sm text-[var(--ink-2)]">{description}</p>
      </div>
      {children}
    </section>
  );
}

export default async function InventoryControlCenterPage() {
  await requirePermission("listings.view");
  const locale = await getCurrentLocale();
  const supabase = await createSupabaseServerClient();
  const copy = locale === "fa"
    ? {
        title: "کنترول موجودی و منابع", subtitle: "منابع، انتقال‌ها، ردیف‌های در انتظار بررسی و اعلان‌های بیرونی را مشاهده و پیگیری کنید.", back: "بازگشت به ادمین",
        sources: "منابع انتقال", jobs: "وظایف انتقال", candidates: "ردیف‌های انتقال‌شده", claims: "ادعاهای مالکیت", duplicates: "گروه‌های تکراری", optOuts: "انصراف‌های دائمی", external: "اعلان‌های بیرونی", stale: "کهنه یا منقضی",
        view: "دیدن ردیف‌ها", sourcesHelp: "منابع تأییدشده‌ای که اعلان‌ها را به صاحباش می‌فرستند.", jobsHelp: "وضعیت هر انتقال، اجرای آزمایشی و نتیجه پردازش.", candidatesHelp: "ردیف‌های دریافت‌شده پیش از تبدیل‌شدن به اعلان واقعی.", externalHelp: "اعلان‌هایی که با موفقیت ساخته شده‌اند؛ هر ردیف پیوند صفحه اعلان را دارد.", reviewHelp: "ادعاها، موارد تکراری و انصراف‌های ثبت‌شده.",
        empty: "هنوز هیچ ردیفی وجود ندارد.", notCreated: "هنوز اعلان ساخته نشده", waiting: "انتقال دریافت شده، اما هنوز اعلان عمومی نیست. پس از بررسی و تبدیل موفق، پیوند اعلان در همین‌جا ظاهر می‌شود.", live: "صف اعلان‌های تازه هر ۳۰ ثانیه بررسی می‌شود", reviewTransfer: "بررسی انتقال", openListing: "بازکردن اعلان", openSource: "بازکردن منبع اصلی", source: "منبع", status: "وضعیت", created: "ایجادشده", method: "روش", platform: "پلتفرم", rows: "ردیف‌ها", result: "نتیجه", dryRun: "اجرای آزمایشی", liveRun: "اجرای واقعی", accepted: "پذیرفته", rejected: "ردشده", errors: "خطا", row: "ردیف", sourceItem: "شناسه در منبع", category: "دسته‌بندی", location: "موقعیت", price: "قیمت", missingCategory: "تعیین نشده", missingLocation: "تعیین نشده", missingPrice: "تنظیم نشده", activeSource: "منبع فعال", emergencyStop: "توقف اضطراری روشن", reason: "دلیل", score: "امتیاز", latest: `نمایش تازه‌ترین ${RECENT_LIMIT} ردیف`, claimsEmpty: "درخواست مالکیت وجود ندارد.", duplicatesEmpty: "مورد تکراری وجود ندارد.", optOutsEmpty: "انصرافی ثبت نشده است.",
      }
    : locale === "ps"
      ? {
          title: "د موجودۍ او سرچینو کنټرول", subtitle: "سرچینې، لېږدونه، د بیاکتنې ریکارډونه او بهرني اعلانونه وګورئ او تعقیب یې کړئ.", back: "ادمین ته بېرته",
          sources: "د لېږد سرچینې", jobs: "د لېږد دندې", candidates: "لېږدول شوي ریکارډونه", claims: "د مالکیت دعوې", duplicates: "تکراري ډلې", optOuts: "دایمي منع", external: "بهرني اعلانونه", stale: "زاړه یا تېر شوي",
          view: "ریکارډونه وګورئ", sourcesHelp: "تأیید شوې سرچینې چې صاحباش ته اعلانونه لېږي.", jobsHelp: "د هر لېږد حالت، ازمایښتي اجرا او د پروسس پایله.", candidatesHelp: "تر اصلي اعلان جوړېدو مخکې ترلاسه شوي ریکارډونه.", externalHelp: "په بریالیتوب جوړ شوي اعلانونه؛ هر ریکارډ د اعلان پاڼې تړونی لري.", reviewHelp: "د مالکیت دعوې، تکراري موارد او ثبت شوې منع.",
          empty: "تر اوسه هېڅ ریکارډ نشته.", notCreated: "اعلان لا نه دی جوړ شوی", waiting: "لېږد ترلاسه شوی، خو لا عام اعلان نه دی. له بیاکتنې او بریالۍ جوړونې وروسته به یې تړونی همدلته ښکاره شي.", live: "د نویو اعلانونو کتار هر ۳۰ ثانیې کتل کېږي", reviewTransfer: "لېږد بیاکتل", openListing: "اعلان پرانیستل", openSource: "اصلي سرچینه پرانیستل", source: "سرچینه", status: "حالت", created: "جوړ شوی", method: "طریقه", platform: "پلېټفارم", rows: "ریکارډونه", result: "پایله", dryRun: "ازمایښتي اجرا", liveRun: "اصلي اجرا", accepted: "منل شوي", rejected: "رد شوي", errors: "تېروتنې", row: "ریکارډ", sourceItem: "په سرچینه کې پېژند", category: "کټګوري", location: "ځای", price: "بیه", missingCategory: "نه ده ټاکل شوې", missingLocation: "نه دی ټاکل شوی", missingPrice: "نه ده ټاکل شوې", activeSource: "سرچینه فعاله ده", emergencyStop: "بېړنی تم فعال دی", reason: "دلیل", score: "نمره", latest: `وروستي ${RECENT_LIMIT} ریکارډونه ښودل کېږي`, claimsEmpty: "د مالکیت غوښتنه نشته.", duplicatesEmpty: "تکراري مورد نشته.", optOutsEmpty: "منع نه ده ثبت شوې.",
        }
      : {
          title: "Inventory Source Control", subtitle: "Inspect and trace sources, transfers, review candidates, and created external listings.", back: "Back to admin",
          sources: "Import sources", jobs: "Import jobs", candidates: "Transferred rows", claims: "Ownership claims", duplicates: "Duplicate groups", optOuts: "Permanent opt-outs", external: "External listings", stale: "Stale or expired",
          view: "View records", sourcesHelp: "Approved sources that send listing inventory into Sahibash.", jobsHelp: "Every transfer run, its dry-run state, and processing result.", candidatesHelp: "Received rows before they are converted into actual listings.", externalHelp: "Successfully created listings; every record includes its listing-page link.", reviewHelp: "Ownership claims, duplicate reviews, and recorded opt-outs.",
          empty: "No records yet.", notCreated: "Listing not created yet", waiting: "The transfer was received, but it is not a public listing yet. After review and successful conversion, its listing link will appear here.", live: "Checking the new-listing queue every 30 seconds", reviewTransfer: "Review transfer", openListing: "Open listing", openSource: "Open original source", source: "Source", status: "Status", created: "Created", method: "Method", platform: "Platform", rows: "Rows", result: "Result", dryRun: "Dry run", liveRun: "Live run", accepted: "Accepted", rejected: "Rejected", errors: "Errors", row: "Row", sourceItem: "Source item", category: "Category", location: "Location", price: "Price", missingCategory: "Not assigned", missingLocation: "Not resolved", missingPrice: "Not normalized", activeSource: "Source enabled", emergencyStop: "Emergency stop enabled", reason: "Reason", score: "Score", latest: `Showing the latest ${RECENT_LIMIT} records`, claimsEmpty: "No ownership claims.", duplicatesEmpty: "No duplicate cases.", optOutsEmpty: "No opt-outs recorded.",
        };

  const [sources, jobs, candidates, claims, duplicates, optOuts, external, stale, sourcesResult, jobsResult, candidatesResult, claimsResult, duplicatesResult, optOutsResult, externalResult] = await Promise.all([
    countRows("listing_sources"),
    countRows("listing_ingest_jobs"),
    countRows("listing_ingest_candidates"),
    countRows("listing_claims"),
    countRows("listing_duplicate_groups"),
    countRows("external_import_opt_outs"),
    countRows("listings", (query) => query.neq("source_type", "native").eq("publication_status", "published")),
    countRows("listings", (query) => query.neq("source_type", "native").in("freshness_status", ["stale", "expired", "source_missing"])),
    supabase.from("listing_sources").select("id,name,source_type,platform,ingest_method,status,kill_switch_enabled,created_at").order("created_at", { ascending: false }).limit(RECENT_LIMIT),
    supabase.from("listing_ingest_jobs").select("id,source_id,source_type,status,dry_run,total_rows,accepted_rows,rejected_rows,duplicate_rows,error_rows,error_summary,created_at").order("created_at", { ascending: false }).limit(RECENT_LIMIT),
    supabase.from("listing_ingest_candidates").select("id,job_id,source_id,row_number,source_item_id,status,normalized_payload,validation_errors,candidate_listing_id,normalized_title,normalized_location,normalized_price_afn,category_node_id,created_at").order("created_at", { ascending: false }).limit(RECENT_LIMIT),
    supabase.from("listing_claims").select("id,listing_id,status,challenge_channel,created_at").order("created_at", { ascending: false }).limit(RECENT_LIMIT),
    supabase.from("listing_duplicate_groups").select("id,canonical_listing_id,confidence,score,status,created_at").order("created_at", { ascending: false }).limit(RECENT_LIMIT),
    supabase.from("external_import_opt_outs").select("id,source_id,source_type,source_platform,reason,created_at").order("created_at", { ascending: false }).limit(RECENT_LIMIT),
    supabase.from("listings").select("id,title,source_type,source_platform,source_url,publication_status,freshness_status,province,district,created_at").neq("source_type", "native").order("created_at", { ascending: false }).limit(RECENT_LIMIT),
  ]);

  const sourceRows = (sourcesResult.data ?? []) as SourceRow[];
  const jobRows = (jobsResult.data ?? []) as JobRow[];
  const candidateRows = (candidatesResult.data ?? []) as CandidateRow[];
  const claimRows = (claimsResult.data ?? []) as ClaimRow[];
  const duplicateRows = (duplicatesResult.data ?? []) as DuplicateRow[];
  const optOutRows = (optOutsResult.data ?? []) as OptOutRow[];
  const externalRows = (externalResult.data ?? []) as ExternalListingRow[];
  const sourceNames = new Map(sourceRows.map((source) => [source.id, source.name]));
  const dateLocale = locale === "fa" ? "fa-AF" : locale === "ps" ? "ps-AF" : "en-AF";
  const formatDate = (value: string) => new Intl.DateTimeFormat(dateLocale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  const formatPrice = (value: number | null) => value === null ? copy.missingPrice : `${new Intl.NumberFormat(dateLocale, { maximumFractionDigits: 0 }).format(value)} AFN`;
  const cards = [
    ["sources", copy.sources, sources], ["jobs", copy.jobs, jobs], ["candidates", copy.candidates, candidates], ["reviews", copy.claims, claims],
    ["reviews", copy.duplicates, duplicates], ["reviews", copy.optOuts, optOuts], ["external-listings", copy.external, external], ["external-listings", copy.stale, stale],
  ] as const;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href={adminPath("/admin")} className="text-sm font-semibold text-[var(--ink-2)]">← {copy.back}</Link>
      <h1 className="mt-4 font-display text-3xl font-bold">{copy.title}</h1>
      <p className="mt-2 max-w-3xl text-sm text-[var(--ink-2)]">{copy.subtitle}</p>
      <div className="mt-3"><InventoryLiveRefresh label={copy.live} /></div>

      {candidates > 0 && externalRows.length === 0 ? <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950" role="status"><p className="font-bold">{copy.notCreated}</p><p className="mt-1">{copy.waiting}</p></div> : null}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([id, label, value], index) => <a key={`${id}-${index}`} href={`#${id}`} className="group rounded-xl border border-[var(--line)] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-sm"><p className="text-sm text-[var(--ink-2)]">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p><p className="mt-3 text-xs font-bold text-[var(--accent)]">{copy.view} →</p></a>)}
      </div>

      <div className="mt-8 space-y-6">
        <Section id="candidates" title={copy.candidates} description={copy.candidatesHelp}>
          {candidateRows.length === 0 ? <p className="p-5 text-sm text-[var(--ink-2)]">{copy.empty}</p> : <div className="divide-y divide-[var(--line)]">{candidateRows.map((candidate) => {
            const sourceHref = safeExternalHref(candidate.normalized_payload?.source_url ?? candidate.normalized_payload?.sourceUrl);
            return <article key={candidate.id} className="p-4 sm:p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><StatusBadge value={candidate.status} /><span className="text-xs text-[var(--ink-2)]">{copy.row} #{candidate.row_number}</span>{candidate.source_item_id ? <span className="text-xs text-[var(--ink-2)]">{copy.sourceItem}: {candidate.source_item_id}</span> : null}</div><h3 className="mt-3 whitespace-pre-line text-base font-bold leading-6 line-clamp-3">{candidate.normalized_title || `${copy.row} #${candidate.row_number}`}</h3><p className="mt-2 text-xs text-[var(--ink-2)]">{sourceNames.get(candidate.source_id ?? "") ?? copy.source} · {formatDate(candidate.created_at)}</p></div><div className="flex shrink-0 flex-wrap gap-2"><Link href={adminPath(`/admin/inventory/candidates/${candidate.id}`)} className="rounded-xl border border-[var(--line)] px-3 py-2 text-sm font-bold">{copy.reviewTransfer}</Link>{candidate.candidate_listing_id ? <Link href={localizePath(`/listings/${candidate.candidate_listing_id}`, locale)} className="rounded-xl bg-[var(--ink-1)] px-3 py-2 text-sm font-bold text-white">{copy.openListing}</Link> : <span className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-600">{copy.notCreated}</span>}{sourceHref ? <a href={sourceHref} target="_blank" rel="noreferrer" className="rounded-xl border border-[var(--line)] px-3 py-2 text-sm font-bold">{copy.openSource}</a> : null}</div></div><dl className="mt-4 grid gap-2 text-sm sm:grid-cols-3"><div className="rounded-xl bg-[var(--surface-2)] p-3"><dt className="text-xs text-[var(--ink-2)]">{copy.category}</dt><dd className="mt-1 font-semibold">{candidate.category_node_id ?? copy.missingCategory}</dd></div><div className="rounded-xl bg-[var(--surface-2)] p-3"><dt className="text-xs text-[var(--ink-2)]">{copy.location}</dt><dd className="mt-1 font-semibold">{candidate.normalized_location || copy.missingLocation}</dd></div><div className="rounded-xl bg-[var(--surface-2)] p-3"><dt className="text-xs text-[var(--ink-2)]">{copy.price}</dt><dd className="mt-1 font-semibold">{formatPrice(candidate.normalized_price_afn)}</dd></div></dl></article>;
          })}</div>}
        </Section>

        <Section id="external-listings" title={copy.external} description={copy.externalHelp}>
          {externalRows.length === 0 ? <p className="p-5 text-sm text-[var(--ink-2)]">{copy.empty}</p> : <div className="divide-y divide-[var(--line)]">{externalRows.map((listing) => { const sourceHref = safeExternalHref(listing.source_url); return <article key={listing.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"><div className="min-w-0"><div className="flex flex-wrap gap-2"><StatusBadge value={listing.publication_status} /><StatusBadge value={listing.freshness_status} /></div><h3 className="mt-2 truncate font-bold">{listing.title}</h3><p className="mt-1 text-xs text-[var(--ink-2)]">{listing.source_platform || listing.source_type} · {[listing.province, listing.district].filter(Boolean).join(" / ") || copy.missingLocation} · {formatDate(listing.created_at)}</p></div><div className="flex shrink-0 gap-2"><Link href={localizePath(`/listings/${listing.id}`, locale)} className="rounded-xl bg-[var(--ink-1)] px-3 py-2 text-sm font-bold text-white">{copy.openListing}</Link>{sourceHref ? <a href={sourceHref} target="_blank" rel="noreferrer" className="rounded-xl border border-[var(--line)] px-3 py-2 text-sm font-bold">{copy.openSource}</a> : null}</div></article>; })}</div>}
        </Section>

        <Section id="sources" title={copy.sources} description={copy.sourcesHelp}>
          {sourceRows.length === 0 ? <p className="p-5 text-sm text-[var(--ink-2)]">{copy.empty}</p> : <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">{sourceRows.map((source) => <article key={source.id} className="rounded-xl border border-[var(--line)] p-4"><div className="flex items-start justify-between gap-3"><h3 className="font-bold">{source.name}</h3><StatusBadge value={source.status} /></div><dl className="mt-3 space-y-1 text-sm text-[var(--ink-2)]"><div className="flex justify-between gap-3"><dt>{copy.platform}</dt><dd className="font-semibold text-[var(--ink-1)]">{source.platform || source.source_type}</dd></div><div className="flex justify-between gap-3"><dt>{copy.method}</dt><dd className="font-semibold text-[var(--ink-1)]">{source.ingest_method}</dd></div></dl><p className="mt-3 text-xs font-semibold text-[var(--ink-2)]">{source.kill_switch_enabled ? copy.emergencyStop : copy.activeSource} · {formatDate(source.created_at)}</p></article>)}</div>}
        </Section>

        <Section id="jobs" title={copy.jobs} description={copy.jobsHelp}>
          {jobRows.length === 0 ? <p className="p-5 text-sm text-[var(--ink-2)]">{copy.empty}</p> : <div className="divide-y divide-[var(--line)]">{jobRows.map((job) => <article key={job.id} className="p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-bold">{sourceNames.get(job.source_id ?? "") ?? job.source_type}</h3><p className="mt-1 text-xs text-[var(--ink-2)]">{job.dry_run ? copy.dryRun : copy.liveRun} · {formatDate(job.created_at)}</p></div><StatusBadge value={job.status} /></div><div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4"><p className="rounded-lg bg-[var(--surface-2)] p-2">{copy.rows}: <strong>{job.total_rows}</strong></p><p className="rounded-lg bg-[var(--surface-2)] p-2">{copy.accepted}: <strong>{job.accepted_rows}</strong></p><p className="rounded-lg bg-[var(--surface-2)] p-2">{copy.rejected}: <strong>{job.rejected_rows}</strong></p><p className="rounded-lg bg-[var(--surface-2)] p-2">{copy.errors}: <strong>{job.error_rows}</strong></p></div>{job.error_summary ? <p className="mt-3 text-sm text-red-700">{job.error_summary}</p> : null}</article>)}</div>}
        </Section>

        <Section id="reviews" title={`${copy.claims} · ${copy.duplicates} · ${copy.optOuts}`} description={copy.reviewHelp}>
          <div className="grid gap-4 p-4 lg:grid-cols-3">
            <div><h3 className="font-bold">{copy.claims} ({claims})</h3>{claimRows.length === 0 ? <p className="mt-2 text-sm text-[var(--ink-2)]">{copy.claimsEmpty}</p> : <div className="mt-2 space-y-2">{claimRows.map((claim) => <article key={claim.id} className="rounded-xl bg-[var(--surface-2)] p-3"><StatusBadge value={claim.status} /><p className="mt-2 truncate text-xs text-[var(--ink-2)]">{claim.challenge_channel || copy.status} · {formatDate(claim.created_at)}</p><Link href={localizePath(`/listings/${claim.listing_id}`, locale)} className="mt-2 inline-block text-xs font-bold text-[var(--accent)]">{copy.openListing} →</Link></article>)}</div>}</div>
            <div><h3 className="font-bold">{copy.duplicates} ({duplicates})</h3>{duplicateRows.length === 0 ? <p className="mt-2 text-sm text-[var(--ink-2)]">{copy.duplicatesEmpty}</p> : <div className="mt-2 space-y-2">{duplicateRows.map((group) => <article key={group.id} className="rounded-xl bg-[var(--surface-2)] p-3"><div className="flex flex-wrap gap-2"><StatusBadge value={group.status} /><StatusBadge value={group.confidence} /></div><p className="mt-2 text-xs text-[var(--ink-2)]">{copy.score}: {group.score ?? "—"} · {formatDate(group.created_at)}</p>{group.canonical_listing_id ? <Link href={localizePath(`/listings/${group.canonical_listing_id}`, locale)} className="mt-2 inline-block text-xs font-bold text-[var(--accent)]">{copy.openListing} →</Link> : null}</article>)}</div>}</div>
            <div><h3 className="font-bold">{copy.optOuts} ({optOuts})</h3>{optOutRows.length === 0 ? <p className="mt-2 text-sm text-[var(--ink-2)]">{copy.optOutsEmpty}</p> : <div className="mt-2 space-y-2">{optOutRows.map((optOut) => <article key={optOut.id} className="rounded-xl bg-[var(--surface-2)] p-3"><p className="font-semibold">{optOut.source_platform || sourceNames.get(optOut.source_id ?? "") || optOut.source_type || copy.source}</p><p className="mt-1 text-xs text-[var(--ink-2)]">{copy.reason}: {optOut.reason || "—"}</p><p className="mt-1 text-xs text-[var(--ink-2)]">{formatDate(optOut.created_at)}</p></article>)}</div>}</div>
          </div>
        </Section>
      </div>
      <p className="mt-5 text-center text-xs text-[var(--ink-2)]">{copy.latest}</p>
    </main>
  );
}
