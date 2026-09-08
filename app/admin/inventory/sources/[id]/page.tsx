import Link from "next/link";
import { notFound } from "next/navigation";
import { registerListingSourcePermissionAction } from "@/lib/actions/inventory-source-permissions";
import { adminPath } from "@/lib/admin/routing";
import { requirePermission } from "@/lib/auth";
import { getCurrentLocale } from "@/lib/i18n/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ result?: string }>;
};

type SourcePermission = {
  id: string;
  scope_identifier: string;
  permission_basis: string;
  evidence_url: string | null;
  status: string;
  valid_from: string;
  valid_until: string | null;
  verified_at: string | null;
  created_at: string;
};

export default async function ListingSourcePermissionsPage({ params, searchParams }: PageProps) {
  await requirePermission("listings.view");
  const { id } = await params;
  const { result } = await searchParams;
  const locale = await getCurrentLocale();
  const supabase = await createSupabaseServerClient();
  const [{ data: source }, { data: permissions }] = await Promise.all([
    supabase
      .from("listing_sources")
      .select("id,name,slug,source_type,platform,permission_basis,permission_record_id,status,kill_switch_enabled")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("listing_source_permissions")
      .select("id,scope_identifier,permission_basis,evidence_url,status,valid_from,valid_until,verified_at,created_at")
      .eq("source_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);
  if (!source) notFound();

  const copy = locale === "fa"
    ? {
        back: "بازگشت به کنترول موجودی", title: "مجوز منبع بیرونی", subtitle: "پیش از نشر، منبع مشخص و مدرک حق بازنشر را ثبت و تأیید کنید.",
        mixedWarning: "این منبع چند گروه نامشخص را باهم دارد و برای آن مجوز عمومی صادر نمی‌شود. اعلان‌ها را با لینک عمومی یا منبع مشخص دوباره بفرستید.",
        scope: "شناسه دقیق منبع", scopeHelp: "مانند @channelname یا نام رسمی منبع", basis: "مبنای مجوز", attestation: "شرح مجوز و مسئولیت", evidence: "پیوند مدرک (HTTPS)", until: "تاریخ پایان (اختیاری)",
        record: "ثبت برای بررسی", verify: "ثبت و تأیید", history: "سابقه مجوز", empty: "هنوز مجوزی ثبت نشده است.", verified: "مجوز تأیید شد.", recorded: "مجوز برای بررسی ثبت شد.", invalid: "اطلاعات مجوز کامل یا معتبر نیست.", failed: "ثبت مجوز انجام نشد. منبع عمومی یا مدرک را بررسی کنید.", sourceOwner: "اجازه مالک منبع", groupAdmin: "اجازه مدیر گروه", license: "جواز محتوا", operator: "تصدیق مسئول پلتفرم", evidenceLink: "مشاهده مدرک",
      }
    : locale === "ps"
      ? {
          back: "د موجودۍ کنټرول ته بېرته", title: "د بهرنۍ سرچینې اجازه", subtitle: "له خپرولو مخکې کره سرچینه او د بیا خپرولو د حق ثبوت ثبت او تایید کړئ.",
          mixedWarning: "دا سرچینه څو نامعلومې ډلې ګډوي؛ عمومي اجازه ورته نه شي ورکول کېدای. اعلانونه د عامه تړوني یا کره سرچینې له لارې بیا ولېږئ.",
          scope: "د سرچینې کره پېژند", scopeHelp: "لکه @channelname یا د سرچینې رسمي نوم", basis: "د اجازې بنسټ", attestation: "د اجازې او مسوولیت بیان", evidence: "د ثبوت تړونی (HTTPS)", until: "د پای نېټه (اختیاري)",
          record: "د بیاکتنې لپاره ثبت", verify: "ثبت او تایید", history: "د اجازې مخینه", empty: "تر اوسه اجازه نه ده ثبت شوې.", verified: "اجازه تایید شوه.", recorded: "اجازه د بیاکتنې لپاره ثبت شوه.", invalid: "د اجازې معلومات بشپړ یا سم نه دي.", failed: "اجازه ثبت نه شوه؛ عامه سرچینه یا ثبوت وګورئ.", sourceOwner: "د سرچینې د مالک اجازه", groupAdmin: "د ډلې د مدیر اجازه", license: "د منځپانګې جواز", operator: "د پلېټفارم مسوول تصدیق", evidenceLink: "ثبوت وګورئ",
        }
      : {
          back: "Back to inventory control", title: "External source permission", subtitle: "Record and verify the exact source and republishing rights before any listing can go live.",
          mixedWarning: "This source mixes unidentified groups and cannot receive blanket authorization. Re-forward with a public link or a source-specific intake context.",
          scope: "Exact source identifier", scopeHelp: "For example @channelname or the source's legal name", basis: "Permission basis", attestation: "Permission and accountability statement", evidence: "Evidence URL (HTTPS)", until: "Expiry date (optional)",
          record: "Record for review", verify: "Record and verify", history: "Permission history", empty: "No permission record exists yet.", verified: "Permission verified.", recorded: "Permission recorded for review.", invalid: "The permission details are incomplete or invalid.", failed: "Permission could not be recorded. Check the source scope and evidence.", sourceOwner: "Source owner permission", groupAdmin: "Group administrator permission", license: "Content license", operator: "Platform operator attestation", evidenceLink: "View evidence",
        };
  const notice = result === "verified"
    ? copy.verified
    : result === "recorded"
      ? copy.recorded
      : result === "invalid"
        ? copy.invalid
        : result === "failed"
          ? copy.failed
          : null;
  const rows = (permissions ?? []) as SourcePermission[];
  const isMixedSource = source.slug === "telegram-forwarded";
  const dateLocale = locale === "fa" ? "fa-AF" : locale === "ps" ? "ps-AF" : "en-AF";
  const formatDate = (value: string) => new Intl.DateTimeFormat(dateLocale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <Link href={adminPath("/admin/inventory#sources")} className="text-sm font-semibold text-[var(--ink-2)]">← {copy.back}</Link>
      <div className="mt-5 rounded-2xl border border-[var(--line)] bg-white p-5 sm:p-7">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent)]">{source.platform || source.source_type}</p>
        <h1 className="mt-2 font-display text-3xl font-bold">{copy.title}</h1>
        <p className="mt-2 text-sm text-[var(--ink-2)]">{copy.subtitle}</p>
        <div className="mt-5 rounded-xl bg-[var(--surface-2)] p-4">
          <p className="font-bold">{source.name}</p>
          <p className="mt-1 text-xs text-[var(--ink-2)]">{source.slug} · {source.status}</p>
        </div>
        {notice ? <p role="status" className={`mt-4 rounded-xl p-3 text-sm font-semibold ${result === "verified" || result === "recorded" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>{notice}</p> : null}
        {isMixedSource ? <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-950">{copy.mixedWarning}</p> : null}

        <form action={registerListingSourcePermissionAction} className="mt-6 grid gap-4">
          <input type="hidden" name="sourceId" value={source.id} />
          <label className="grid gap-1.5 text-sm font-semibold">
            {copy.scope}
            <input name="scopeIdentifier" required minLength={2} maxLength={240} defaultValue={source.slug.startsWith("telegram-") && !isMixedSource ? `@${source.slug.slice("telegram-".length)}` : ""} className="rounded-xl border border-[var(--line)] px-3 py-2.5 font-normal" />
            <span className="text-xs font-normal text-[var(--ink-2)]">{copy.scopeHelp}</span>
          </label>
          <label className="grid gap-1.5 text-sm font-semibold">
            {copy.basis}
            <select name="permissionBasis" className="rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 font-normal">
              <option value="source_owner_permission">{copy.sourceOwner}</option>
              <option value="group_admin_permission">{copy.groupAdmin}</option>
              <option value="content_license">{copy.license}</option>
              <option value="operator_attestation">{copy.operator}</option>
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-semibold">
            {copy.attestation}
            <textarea name="attestationText" required minLength={30} maxLength={2000} className="min-h-28 rounded-xl border border-[var(--line)] px-3 py-2.5 font-normal" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-semibold">{copy.evidence}<input name="evidenceUrl" type="url" inputMode="url" placeholder="https://…" className="rounded-xl border border-[var(--line)] px-3 py-2.5 font-normal" /></label>
            <label className="grid gap-1.5 text-sm font-semibold">{copy.until}<input name="validUntil" type="date" className="rounded-xl border border-[var(--line)] px-3 py-2.5 font-normal" /></label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <button name="decision" value="record" className="rounded-xl border border-[var(--line)] px-4 py-3 text-sm font-bold">{copy.record}</button>
            <button name="decision" value="verify" disabled={isMixedSource} className="rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">{copy.verify}</button>
          </div>
          <p className="text-xs text-[var(--ink-2)]">AAL2 MFA + listings.moderate</p>
        </form>
      </div>

      <section className="mt-6 overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
        <div className="border-b border-[var(--line)] p-5"><h2 className="font-display text-xl font-bold">{copy.history}</h2></div>
        {rows.length === 0 ? <p className="p-5 text-sm text-[var(--ink-2)]">{copy.empty}</p> : <div className="divide-y divide-[var(--line)]">{rows.map((permission) => (
          <article key={permission.id} className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-bold">{permission.scope_identifier}</p><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold">{permission.status}</span></div>
            <p className="mt-2 text-sm text-[var(--ink-2)]">{permission.permission_basis.replaceAll("_", " ")} · {formatDate(permission.created_at)}</p>
            {permission.evidence_url ? <a href={permission.evidence_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-bold text-[var(--accent)]">{copy.evidenceLink} ↗</a> : null}
          </article>
        ))}</div>}
      </section>
    </main>
  );
}
