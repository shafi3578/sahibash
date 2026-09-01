import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IngestCandidatePublish } from "@/components/admin/ingest-candidate-publish";
import { IngestCandidateReviewForm } from "@/components/admin/ingest-candidate-review-form";
import { TelegramPhotoRecovery } from "@/components/admin/telegram-photo-recovery";
import { adminPath } from "@/lib/admin/routing";
import { requirePermission } from "@/lib/auth";
import { localizeCategoryName } from "@/lib/i18n/category-labels";
import { getCurrentLocale } from "@/lib/i18n/server";
import { localizePath } from "@/lib/i18n/routing";
import { normalizeListingSchemaConfig, type ListingSchemaConfig } from "@/lib/listing-schema-config";
import { extractAfghanistanPhone, normalizeAfghanistanPhone } from "@/lib/inventory/normalization";
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
  normalized_phone: string | null;
  category_node_id: number | null;
  created_at: string;
};

type SourceRow = { name: string; platform: string | null; source_type: string; status: string };
type JobRow = { status: string; dry_run: boolean; accepted_rows: number; rejected_rows: number; error_rows: number };
type MediaRow = {
  id: string;
  storage_bucket: string;
  storage_path: string;
  width: number | null;
  height: number | null;
};
type LeafCategoryRow = { id: number; name: string; slug: string; path: string };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LEAF_CATEGORY_PAGE_SIZE = 100;
const MAX_LEAF_CATEGORIES = 5_000;

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
  const viewer = await requirePermission("listings.view");
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) notFound();

  const locale = await getCurrentLocale();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("listing_ingest_candidates")
    .select("id,job_id,source_id,row_number,source_item_id,status,normalized_payload,candidate_listing_id,normalized_title,normalized_location,normalized_price_afn,normalized_phone,category_node_id,created_at")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();

  const candidate = data as CandidateRow;
  const [sourceResult, jobResult, mediaResult, superAdminResult, launchCategoriesResult, provincesResult, districtsResult] = await Promise.all([
    candidate.source_id
      ? supabase.from("listing_sources").select("name,platform,source_type,status").eq("id", candidate.source_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("listing_ingest_jobs").select("status,dry_run,accepted_rows,rejected_rows,error_rows").eq("id", candidate.job_id).maybeSingle(),
    supabase
      .from("listing_ingest_candidate_media")
      .select("id,storage_bucket,storage_path,width,height")
      .eq("candidate_id", candidate.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase.rpc("is_super_administrator", { uid: viewer.id }),
    supabase.from("categories").select("id").eq("is_active", true).eq("is_coming_soon", false),
    supabase.from("provinces").select("id,name,name_fa,name_ps").eq("is_active", true).order("sort_order"),
    supabase.from("districts").select("id,province_id,name,name_fa,name_ps").eq("is_active", true).order("sort_order"),
  ]);
  const source = sourceResult.data as SourceRow | null;
  const job = jobResult.data as JobRow | null;
  const payload = candidate.normalized_payload ?? {};
  const launchCategoryIds = (launchCategoriesResult.data ?? []).map((category) => Number(category.id));
  const leafData: LeafCategoryRow[] = [];
  if (launchCategoryIds.length) {
    for (let offset = 0; offset < MAX_LEAF_CATEGORIES; offset += LEAF_CATEGORY_PAGE_SIZE) {
      const { data: page, error } = await supabase
        .from("category_nodes")
        .select("id,name,slug,path")
        .in("category_id", launchCategoryIds)
        .eq("is_active", true)
        .eq("is_leaf", true)
        .order("path", { ascending: true })
        .order("id", { ascending: true })
        .range(offset, offset + LEAF_CATEGORY_PAGE_SIZE - 1);
      if (error) throw new Error(`Unable to load the complete category taxonomy: ${error.message}`);

      const rows = (page ?? []) as LeafCategoryRow[];
      leafData.push(...rows);
      if (rows.length < LEAF_CATEGORY_PAGE_SIZE) break;
      if (offset + LEAF_CATEGORY_PAGE_SIZE >= MAX_LEAF_CATEGORIES) {
        throw new Error("The category taxonomy exceeds the safe administrator review limit.");
      }
    }
  }
  const { data: initialSchemaData } = candidate.category_node_id
    ? await supabase
        .from("listing_schema_versions")
        .select("config")
        .eq("category_node_id", candidate.category_node_id)
        .eq("status", "published")
        .maybeSingle()
    : { data: null };
  let initialSchema: ListingSchemaConfig | null = null;
  try {
    initialSchema = initialSchemaData ? normalizeListingSchemaConfig(initialSchemaData.config) : null;
  } catch {
    initialSchema = null;
  }
  const copy = locale === "fa"
    ? { back: "بازگشت به موجودی", title: "بررسی انتقال", subtitle: "جزئیات ردیف انتقال‌شده پیش از تبدیل به اعلان عمومی.", waiting: "این مورد هنوز اعلان عمومی نیست و نیاز به بررسی دارد.", content: "محتوای انتقال‌شده", readiness: "آمادگی اعلان", source: "منبع و وظیفه", adTitle: "عنوان", description: "توضیحات", category: "دسته‌بندی", location: "موقعیت", price: "قیمت", photos: "تصویرها", sourceItem: "شناسه در منبع", received: "دریافت‌شده", status: "وضعیت", job: "وظیفه انتقال", dryRun: "اجرای آزمایشی", liveRun: "اجرای واقعی", notSet: "تعیین نشده", noDescription: "توضیحی دریافت نشده است.", noPhotos: "هیچ تصویری ذخیره نشده است. برای دریافت همه تصویرهای آلبوم، اعلان را دوباره به ربات بفرستید.", recoverPhoto: "بازیابی تصویر باقی‌مانده", recoveringPhoto: "در حال بازیابی…", recoveredPhoto: "تصویر ذخیره شد.", unavailablePhoto: "مرجع قدیمی تصویر دیگر در تلگرام قابل دریافت نیست. لطفاً اعلان را دوباره بفرستید.", configurationError: "بازیابی تلگرام در سرور تنظیم نشده است.", storageError: "تصویر دریافت شد اما ذخیره‌سازی ناموفق بود. دوباره تلاش کنید.", failedRecovery: "بازیابی تصویر ناموفق بود.", openListing: "بازکردن اعلان", openSource: "بازکردن منبع اصلی", notCreated: "هنوز اعلان ساخته نشده", accepted: "پذیرفته", rejected: "ردشده", errors: "خطا" }
    : locale === "ps"
      ? { back: "موجودۍ ته بېرته", title: "د لېږد بیاکتنه", subtitle: "د عام اعلان تر جوړېدو مخکې د لېږدول شوي ریکارډ جزیات.", waiting: "دا مورد لا عام اعلان نه دی او بیاکتنې ته اړتیا لري.", content: "لېږدول شوې منځپانګه", readiness: "د اعلان چمتووالی", source: "سرچینه او دنده", adTitle: "سرلیک", description: "تشریح", category: "کټګوري", location: "ځای", price: "بیه", photos: "انځورونه", sourceItem: "په سرچینه کې پېژند", received: "ترلاسه شوی", status: "حالت", job: "د لېږد دنده", dryRun: "ازمایښتي اجرا", liveRun: "اصلي اجرا", notSet: "نه دی ټاکل شوی", noDescription: "تشریح نه ده ترلاسه شوې.", noPhotos: "هېڅ انځور نه دی خوندي شوی. د البوم ټولو انځورونو لپاره اعلان بیا رباټ ته ولېږئ.", recoverPhoto: "پاتې انځور بېرته ترلاسه کړئ", recoveringPhoto: "د بېرته ترلاسه کولو په حال کې…", recoveredPhoto: "انځور خوندي شو.", unavailablePhoto: "د تلگرام پخوانی انځور نور د ترلاسه کولو وړ نه دی. اعلان بیا رباټ ته ولېږئ.", configurationError: "د تلگرام بیا ترلاسه کول په سرور کې نه دي تنظیم شوي.", storageError: "انځور ترلاسه شو خو خوندي نه شو. بیا هڅه وکړئ.", failedRecovery: "د انځور بیا ترلاسه کول ناکام شول.", openListing: "اعلان پرانیستل", openSource: "اصلي سرچینه پرانیستل", notCreated: "اعلان لا نه دی جوړ شوی", accepted: "منل شوي", rejected: "رد شوي", errors: "تېروتنې" }
      : { back: "Back to inventory", title: "Review transfer", subtitle: "The transferred row before it becomes a public listing.", waiting: "This item is not a public listing yet and needs administrative review.", content: "Transferred content", readiness: "Listing readiness", source: "Source and job", adTitle: "Title", description: "Description", category: "Category", location: "Location", price: "Price", photos: "Photos", sourceItem: "Source item", received: "Received", status: "Status", job: "Import job", dryRun: "Dry run", liveRun: "Live run", notSet: "Not assigned", noDescription: "No description was received.", noPhotos: "No photo was stored. Forward the ad to the bot again to capture every album image.", recoverPhoto: "Recover retained photo", recoveringPhoto: "Recovering…", recoveredPhoto: "Photo stored.", unavailablePhoto: "The old Telegram photo reference is no longer available. Forward the ad to the bot again.", configurationError: "Telegram recovery is not configured on the server.", storageError: "The photo was retrieved but could not be stored. Try again.", failedRecovery: "Photo recovery failed.", openListing: "Open listing", openSource: "Open original source", notCreated: "Listing not created yet", accepted: "Accepted", rejected: "Rejected", errors: "Errors" };
  const publishCopy = locale === "fa"
    ? { button: "نشر اعلان بررسی‌شده", pending: "در حال نشر امن…", published: "اعلان با موفقیت نشر شد.", openListing: "مشاهده اعلان عمومی", notReady: "ابتدا همه اصلاحات و بررسی‌ها را تکمیل کنید.", media: "تصویرهای اعلان کامل یا معتبر نیستند.", storage: "انتقال امن تصویرها ناموفق شد. دوباره تلاش کنید.", publication: "پایگاه داده نشر را نپذیرفت؛ هیچ اعلان ناقصی نشر نشد.", failed: "نشر اعلان ناموفق بود. دوباره تلاش کنید." }
    : locale === "ps"
      ? { button: "بیاکتل شوی اعلان خپور کړئ", pending: "په خوندي ډول خپرېږي…", published: "اعلان په بریالیتوب خپور شو.", openListing: "عام اعلان وګورئ", notReady: "لومړی ټول سمونونه او بیاکتنې بشپړې کړئ.", media: "د اعلان انځورونه بشپړ یا سم نه دي.", storage: "د انځورونو خوندي لېږد ناکام شو. بیا هڅه وکړئ.", publication: "ډیټابېس خپرول ونه منل؛ نیمګړی اعلان نه دی خپور شوی.", failed: "د اعلان خپرول ناکام شول. بیا هڅه وکړئ." }
      : { button: "Publish reviewed listing", pending: "Publishing safely…", published: "The listing was published successfully.", openListing: "View public listing", notReady: "Complete every correction and review before publishing.", media: "The listing photos are incomplete or invalid.", storage: "The secure photo transfer failed. Try again.", publication: "The database rejected publication; no partial listing was published.", failed: "The listing could not be published. Try again." };
  const dateLocale = locale === "fa" ? "fa-AF" : locale === "ps" ? "ps-AF" : "en-AF";
  const receivedAt = new Intl.DateTimeFormat(dateLocale, { dateStyle: "long", timeStyle: "short" }).format(new Date(candidate.created_at));
  const title = displayText(payload.title, candidate.normalized_title || copy.notSet);
  const description = displayText(payload.description, copy.noDescription);
  const categoryLabel = displayText(payload.category_path, candidate.category_node_id ? String(candidate.category_node_id) : copy.notSet);
  const priceMode = displayText(payload.price_mode, "").toLowerCase();
  const priceLabel = priceMode === "contact"
    ? locale === "fa" ? "برای قیمت تماس بگیرید" : locale === "ps" ? "د بیې لپاره اړیکه ونیسئ" : "Contact for price"
    : candidate.normalized_price_afn === null
      ? copy.notSet
      : `${new Intl.NumberFormat(dateLocale).format(candidate.normalized_price_afn)} AFN`;
  const signedMedia = (await Promise.all(((mediaResult.data ?? []) as MediaRow[]).map(async (item) => {
    const { data: signed } = await supabase.storage
      .from(item.storage_bucket)
      .createSignedUrl(item.storage_path, 10 * 60);
    return signed?.signedUrl ? { ...item, url: signed.signedUrl } : null;
  }))).filter((item): item is MediaRow & { url: string } => item !== null);
  const photoCount = signedMedia.length;
  const sourceHref = safeExternalHref(payload.source_url ?? payload.sourceUrl);
  const reviewPhone = normalizeAfghanistanPhone(candidate.normalized_phone).normalized
    ?? extractAfghanistanPhone([
      payload.contact_phone,
      payload.phone,
      payload.description,
      payload.title,
    ].join(" ")).normalized
    ?? "";
  const initialProvinceId = Number(payload.province_id);
  const initialDistrictId = Number(payload.district_id);
  const categoryOptions = leafData.map((node) => {
    const localizedName = localizeCategoryName({ locale, fallbackName: node.name, slug: node.slug, path: node.path });
    return {
      id: Number(node.id),
      label: locale === "en" ? `${localizedName} · ${node.path.replaceAll("/", " › ")}` : `${localizedName} · #${node.id}`,
      path: node.path,
    };
  });
  const localizeLocation = (row: { name: string; name_fa: string; name_ps: string }) =>
    locale === "fa" ? row.name_fa : locale === "ps" ? row.name_ps : row.name;
  const provinceOptions = (provincesResult.data ?? []).map((province) => ({
    id: Number(province.id),
    label: localizeLocation(province),
  }));
  const districtOptions = (districtsResult.data ?? []).map((district) => ({
    id: Number(district.id),
    provinceId: Number(district.province_id),
    label: localizeLocation(district),
  }));

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
          <div className="mt-6 border-t border-[var(--line)] pt-5">
            <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--ink-2)]">{copy.photos}</h3>
            {signedMedia.length ? (
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {signedMedia.map((item, index) => (
                  <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface-2)]">
                    <Image src={item.url} alt={`${title} — ${copy.photos} ${index + 1}`} fill sizes="(max-width: 639px) 50vw, 240px" className="object-cover transition-transform group-hover:scale-[1.02]" />
                  </a>
                ))}
              </div>
            ) : <div className="mt-3 rounded-xl bg-amber-50 p-3 text-sm font-semibold leading-6 text-amber-900"><p>{copy.noPhotos}</p>{source?.platform === "telegram" ? <TelegramPhotoRecovery candidateId={candidate.id} copy={{ button: copy.recoverPhoto, pending: copy.recoveringPhoto, success: copy.recoveredPhoto, unavailable: copy.unavailablePhoto, configuration: copy.configurationError, storage: copy.storageError, failed: copy.failedRecovery }} /> : null}</div>}
          </div>
        </section>

        <div className="space-y-5">
          <section className="rounded-2xl border border-[var(--line)] bg-white p-5"><h2 className="font-display text-lg font-bold">{copy.readiness}</h2><dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between gap-4"><dt className="text-[var(--ink-2)]">{copy.category}</dt><dd className="text-end font-semibold">{categoryLabel}</dd></div><div className="flex justify-between gap-4"><dt className="text-[var(--ink-2)]">{copy.location}</dt><dd className="text-end font-semibold">{candidate.normalized_location || copy.notSet}</dd></div><div className="flex justify-between gap-4"><dt className="text-[var(--ink-2)]">{copy.price}</dt><dd className="text-end font-semibold">{priceLabel}</dd></div><div className="flex justify-between gap-4"><dt className="text-[var(--ink-2)]">{copy.photos}</dt><dd className="font-semibold">{photoCount}</dd></div></dl></section>
          {candidate.status === "publishable" && !candidate.candidate_listing_id ? (
            <IngestCandidatePublish candidateId={candidate.id} locale={locale} copy={publishCopy} />
          ) : null}
          <section className="rounded-2xl border border-[var(--line)] bg-white p-5"><h2 className="font-display text-lg font-bold">{copy.source}</h2><dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between gap-4"><dt className="text-[var(--ink-2)]">{copy.source}</dt><dd className="text-end font-semibold">{source?.name || source?.platform || source?.source_type || copy.notSet}</dd></div><div className="flex justify-between gap-4"><dt className="text-[var(--ink-2)]">{copy.sourceItem}</dt><dd className="font-semibold">{candidate.source_item_id || copy.notSet}</dd></div><div className="flex justify-between gap-4"><dt className="text-[var(--ink-2)]">{copy.status}</dt><dd className="font-semibold">{source?.status || copy.notSet}</dd></div><div className="flex justify-between gap-4"><dt className="text-[var(--ink-2)]">{copy.job}</dt><dd className="text-end font-semibold">{job ? `${job.status} · ${job.dry_run ? copy.dryRun : copy.liveRun}` : copy.notSet}</dd></div>{job ? <div className="rounded-xl bg-[var(--surface-2)] p-3 text-xs text-[var(--ink-2)]">{copy.accepted} {job.accepted_rows} · {copy.rejected} {job.rejected_rows} · {copy.errors} {job.error_rows}</div> : null}<div className="flex justify-between gap-4"><dt className="text-[var(--ink-2)]">{copy.received}</dt><dd className="text-end font-semibold">{receivedAt}</dd></div></dl></section>
        </div>
      </div>

      {superAdminResult.data === true && !candidate.candidate_listing_id ? (
        <div className="mt-6">
          <IngestCandidateReviewForm
            candidateId={candidate.id}
            locale={locale}
            initial={{
              categoryNodeId: candidate.category_node_id,
              provinceId: Number.isInteger(initialProvinceId) && initialProvinceId > 0 ? initialProvinceId : null,
              districtId: Number.isInteger(initialDistrictId) && initialDistrictId > 0 ? initialDistrictId : null,
              normalizedPhone: reviewPhone,
              normalizedPriceAfn: candidate.normalized_price_afn,
              payload,
            }}
            categories={categoryOptions}
            provinces={provinceOptions}
            districts={districtOptions}
            initialSchema={initialSchema}
          />
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2">{candidate.candidate_listing_id ? <Link href={localizePath(`/listings/${candidate.candidate_listing_id}`, locale)} className="rounded-xl bg-[var(--ink-1)] px-4 py-2.5 text-sm font-bold text-white">{copy.openListing}</Link> : <span className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-600">{copy.notCreated}</span>}{sourceHref ? <a href={sourceHref} target="_blank" rel="noreferrer" className="rounded-xl border border-[var(--line)] px-4 py-2.5 text-sm font-bold">{copy.openSource}</a> : null}</div>
    </main>
  );
}
