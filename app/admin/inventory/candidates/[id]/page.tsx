import Link from "next/link";
import { notFound } from "next/navigation";
import { adminPath } from "@/lib/admin/routing";
import { requirePermission } from "@/lib/auth";
import { getCurrentLocale } from "@/lib/i18n/server";
import { localizePath } from "@/lib/i18n/routing";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type CandidateRow = {
  id: string;
  job_id: string;
  source_id: string | null;
  row_number: number;
  source_item_id: string | null;
  status: string;
  normalized_payload: Record<string, unknown> | null;
  candidate_listing_id: string | null;
  normalized_title: string | null;
  normalized_location: string | null;
  normalized_price_afn: number | null;
  category_node_id: number | null;
  created_at: string;
};

type SourceRow = { name: string; platform: string | null; source_type: string; status: string };
type JobRow = { status: string; dry_run: boolean; accepted_rows: number; rejected_rows: number; error_rows: number };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function displayText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
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

export default async function InventoryCandidatePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("listings.view");
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) notFound();

  const locale = await getCurrentLocale();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("listing_ingest_candidates")
    .select("id,job_id,source_id,row_number,source_item_id,status,normalized_payload,candidate_listing_id,normalized_title,normalized_location,normalized_price_afn,category_node_id,created_at")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();

  const candidate = data as CandidateRow;
  const [sourceResult, jobResult] = await Promise.all([
    candidate.source_id
      ? supabase.from("listing_sources").select("name,platform,source_type,status").eq("id", candidate.source_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("listing_ingest_jobs").select("status,dry_run,accepted_rows,rejected_rows,error_rows").eq("id", candidate.job_id).maybeSingle(),
  ]);
  const source = sourceResult.data as SourceRow | null;
  const job = jobResult.data as JobRow | null;
  const payload = candidate.normalized_payload ?? {};
  const copy = locale === "fa"
    ? { back: "بازگشت به موجودی", title: "بررسی انتقال", subtitle: "جزئیات ردیف انتقال‌شده پیش از تبدیل به اعلان عمومی.", waiting: "این مورد هنوز اعلان عمومی نیست و نیاز به بررسی دارد.", content: "محتوای انتقال‌شده", readiness: "آمادگی اعلان", source: "منبع و وظیفه", adTitle: "عنوان", description: "توضیحات", category: "دسته‌بندی", location: "موقعیت", price: "قیمت", photos: "تصویرها", sourceItem: "شناسه در منبع", received: "دریافت‌شده", status: "وضعیت", job: "وظیفه انتقال", dryRun: "اجرای آزمایشی", liveRun: "اجرای واقعی", notSet: "تعیین نشده", noDescription: "توضیحی دریافت نشده است.", noPhotos: "تعیین نشده", openListing: "بازکردن اعلان", openSource: "بازکردن منبع اصلی", notCreated: "هنوز اعلان ساخته نشده", accepted: "پذیرفته", rejected: "ردشده", errors: "خطا" }
    : locale === "ps"
      ? { back: "موجودۍ ته بېرته", title: "د لېږد بیاکتنه", subtitle: "د عام اعلان تر جوړېدو مخکې د لېږدول شوي ریکارډ جزیات.", waiting: "دا مورد لا عام اعلان نه دی او بیاکتنې ته اړتیا لري.", content: "لېږدول شوې منځپانګه", readiness: "د اعلان چمتووالی", source: "سرچینه او دنده", adTitle: "سرلیک", description: "تشریح", category: "کټګوري", location: "ځای", price: "بیه", photos: "انځورونه", sourceItem: "په سرچینه کې پېژند", received: "ترلاسه شوی", status: "حالت", job: "د لېږد دنده", dryRun: "ازمایښتي اجرا", liveRun: "اصلي اجرا", notSet: "نه دی ټاکل شوی", noDescription: "تشریح نه ده ترلاسه شوې.", noPhotos: "نه دي ټاکل شوي", openListing: "اعلان پرانیستل", openSource: "اصلي سرچینه پرانیستل", notCreated: "اعلان لا نه دی جوړ شوی", accepted: "منل شوي", rejected: "رد شوي", errors: "تېروتنې" }
      : { back: "Back to inventory", title: "Review transfer", subtitle: "The transferred row before it becomes a public listing.", waiting: "This item is not a public listing yet and needs administrative review.", content: "Transferred content", readiness: "Listing readiness", source: "Source and job", adTitle: "Title", description: "Description", category: "Category", location: "Location", price: "Price", photos: "Photos", sourceItem: "Source item", received: "Received", status: "Status", job: "Import job", dryRun: "Dry run", liveRun: "Live run", notSet: "Not assigned", noDescription: "No description was received.", noPhotos: "Not reported", openListing: "Open listing", openSource: "Open original source", notCreated: "Listing not created yet", accepted: "Accepted", rejected: "Rejected", errors: "Errors" };
  const dateLocale = locale === "fa" ? "fa-AF" : locale === "ps" ? "ps-AF" : "en-AF";
  const receivedAt = new Intl.DateTimeFormat(dateLocale, { dateStyle: "long", timeStyle: "short" }).format(new Date(candidate.created_at));
  const title = displayText(payload.title, candidate.normalized_title || copy.notSet);
  const description = displayText(payload.description, copy.noDescription);
  const photoCount = typeof payload.photo_count === "number" ? payload.photo_count : copy.noPhotos;
  const sourceHref = safeExternalHref(payload.source_url ?? payload.sourceUrl);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href={adminPath("/admin/inventory#candidates")} className="text-sm font-semibold text-[var(--ink-2)]">← {copy.back}</Link>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div><h1 className="font-display text-3xl font-bold">{copy.title}</h1><p className="mt-2 text-sm text-[var(--ink-2)]">{copy.subtitle}</p></div>
        <span className="self-start rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 ring-1 ring-amber-200">{candidate.status.replaceAll("_", " ")}</span>
      </div>

      {!candidate.candidate_listing_id ? <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-950" role="status">{copy.waiting}</div> : null}

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
        <section className="rounded-2xl border border-[var(--line)] bg-white p-5">
          <h2 className="font-display text-xl font-bold">{copy.content}</h2>
          <dl className="mt-4 space-y-5"><div><dt className="text-xs font-bold uppercase tracking-wide text-[var(--ink-2)]">{copy.adTitle}</dt><dd className="mt-1 whitespace-pre-line text-lg font-bold leading-7">{title}</dd></div><div><dt className="text-xs font-bold uppercase tracking-wide text-[var(--ink-2)]">{copy.description}</dt><dd className="mt-1 whitespace-pre-line text-sm leading-7 text-[var(--ink-1)]">{description}</dd></div></dl>
        </section>

        <div className="space-y-5">
          <section className="rounded-2xl border border-[var(--line)] bg-white p-5"><h2 className="font-display text-lg font-bold">{copy.readiness}</h2><dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between gap-4"><dt className="text-[var(--ink-2)]">{copy.category}</dt><dd className="font-semibold">{candidate.category_node_id ?? copy.notSet}</dd></div><div className="flex justify-between gap-4"><dt className="text-[var(--ink-2)]">{copy.location}</dt><dd className="font-semibold">{candidate.normalized_location || copy.notSet}</dd></div><div className="flex justify-between gap-4"><dt className="text-[var(--ink-2)]">{copy.price}</dt><dd className="font-semibold">{candidate.normalized_price_afn === null ? copy.notSet : `${new Intl.NumberFormat(dateLocale).format(candidate.normalized_price_afn)} AFN`}</dd></div><div className="flex justify-between gap-4"><dt className="text-[var(--ink-2)]">{copy.photos}</dt><dd className="font-semibold">{photoCount}</dd></div></dl></section>
          <section className="rounded-2xl border border-[var(--line)] bg-white p-5"><h2 className="font-display text-lg font-bold">{copy.source}</h2><dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between gap-4"><dt className="text-[var(--ink-2)]">{copy.source}</dt><dd className="text-end font-semibold">{source?.name || source?.platform || source?.source_type || copy.notSet}</dd></div><div className="flex justify-between gap-4"><dt className="text-[var(--ink-2)]">{copy.sourceItem}</dt><dd className="font-semibold">{candidate.source_item_id || copy.notSet}</dd></div><div className="flex justify-between gap-4"><dt className="text-[var(--ink-2)]">{copy.status}</dt><dd className="font-semibold">{source?.status || copy.notSet}</dd></div><div className="flex justify-between gap-4"><dt className="text-[var(--ink-2)]">{copy.job}</dt><dd className="text-end font-semibold">{job ? `${job.status} · ${job.dry_run ? copy.dryRun : copy.liveRun}` : copy.notSet}</dd></div>{job ? <div className="rounded-xl bg-[var(--surface-2)] p-3 text-xs text-[var(--ink-2)]">{copy.accepted} {job.accepted_rows} · {copy.rejected} {job.rejected_rows} · {copy.errors} {job.error_rows}</div> : null}<div className="flex justify-between gap-4"><dt className="text-[var(--ink-2)]">{copy.received}</dt><dd className="text-end font-semibold">{receivedAt}</dd></div></dl></section>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">{candidate.candidate_listing_id ? <Link href={localizePath(`/listings/${candidate.candidate_listing_id}`, locale)} className="rounded-xl bg-[var(--ink-1)] px-4 py-2.5 text-sm font-bold text-white">{copy.openListing}</Link> : <span className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-600">{copy.notCreated}</span>}{sourceHref ? <a href={sourceHref} target="_blank" rel="noreferrer" className="rounded-xl border border-[var(--line)] px-4 py-2.5 text-sm font-bold">{copy.openSource}</a> : null}</div>
    </main>
  );
}
