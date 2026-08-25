import Link from "next/link";
import { requireSuperAdministrator } from "@/lib/auth";
import { getSuperAdminControlCenterSnapshot, type ControlCenterMetric } from "@/lib/data/control-center";
import { getCurrentLocale } from "@/lib/i18n/server";
import { getUiTranslations } from "@/lib/i18n/ui";
import { ADMIN_CONTROL_COPY } from "@/lib/i18n/admin-control-copy";
import { adminPath } from "@/lib/admin/routing";

function statusClass(status?: "ready" | "attention" | "manual") {
  if (status === "attention") return "border-amber-300 bg-amber-50 text-amber-900";
  if (status === "manual") return "border-sky-300 bg-sky-50 text-sky-900";
  return "border-emerald-300 bg-emerald-50 text-emerald-900";
}

function MetricGrid({ items }: { items: ControlCenterMetric[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => {
        const body = (
          <>
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-slate-700">{item.label}</p>
              {item.status ? (
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${statusClass(item.status)}`}>
                  {item.status}
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-2xl font-black text-slate-950">{item.value}</p>
            {item.description ? <p className="mt-2 text-xs leading-5 text-[var(--ink-2)]">{item.description}</p> : null}
          </>
        );

        if (item.href) {
          return (
            <Link key={item.label} href={adminPath(item.href)} className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--accent)]">
              {body}
            </Link>
          );
        }

        return (
          <section key={item.label} className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm">
            {body}
          </section>
        );
      })}
    </div>
  );
}

export default async function AdministratorPage() {
  await requireSuperAdministrator();
  const locale = await getCurrentLocale();
  const ui = getUiTranslations(locale);
  const copy = ADMIN_CONTROL_COPY[locale];
  const href = (path: string) => adminPath(path);
  const snapshot = await getSuperAdminControlCenterSnapshot();

  const controlCopy = locale === "fa"
    ? {
        subtitle: "مرکز کنترل امن برای آمادگی پرداخت، AI، واردات، نقش‌ها، MFA، تنظیمات و وضعیت راه‌اندازی. هیچ کلید محرمانه‌ای نمایش داده نمی‌شود.",
        deployment: "نقشه تولید",
        readiness: "آمادگی محیط و مشاورها",
        operations: "عملیات بازار",
        security: "امنیت و دسترسی",
        paymentsAi: "پرداخت، Featured و AI",
        inventory: "واردات، کسب‌وکار و داده",
        configured: "فعال",
        missing: "نیازمند توجه",
        generated: "به‌روزرسانی",
      }
    : locale === "ps"
      ? {
          subtitle: "د تادیې، AI، وارداتو، رولونو، MFA، تنظیماتو او لانچ چمتووالي خوندي کنټرول مرکز. هېڅ پټ کیلي نه ښودل کېږي.",
          deployment: "د تولید نقشه",
          readiness: "چاپېریال او Advisor چمتووالی",
          operations: "د بازار عملیات",
          security: "امنیت او لاسرسی",
          paymentsAi: "تادیه، Featured او AI",
          inventory: "واردات، سوداګري او ډاټا",
          configured: "فعال",
          missing: "پاملرنه غواړي",
          generated: "وروستی کتنه",
        }
      : {
          subtitle: "Secure launch control center for payments, AI, imports, roles, MFA, configuration, and production readiness. No secret values are rendered.",
          deployment: "Production mapping",
          readiness: "Environment & Advisor readiness",
          operations: "Marketplace operations",
          security: "Security & access",
          paymentsAi: "Payments, Featured & AI",
          inventory: "Inventory, business & data",
          configured: "Configured",
          missing: "Needs attention",
          generated: "Generated",
        };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold">{copy.administrator}</h1>
      <p className="mt-1 max-w-4xl text-sm leading-6 text-[var(--ink-2)]">{controlCopy.subtitle}</p>

      <section className="mt-6 rounded-3xl border border-[var(--line)] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--accent)]">{controlCopy.generated}</p>
            <h2 className="mt-1 font-display text-2xl font-black">{controlCopy.deployment}</h2>
          </div>
          <p className="text-xs text-[var(--ink-2)]">{new Date(snapshot.generatedAt).toISOString()}</p>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl bg-[var(--surface-2)] p-3">
            <p className="text-xs text-[var(--ink-2)]">Environment</p>
            <p className="mt-1 font-semibold">{snapshot.deployment.environment}</p>
          </div>
          <div className="rounded-2xl bg-[var(--surface-2)] p-3">
            <p className="text-xs text-[var(--ink-2)]">Git SHA</p>
            <p className="mt-1 truncate font-mono text-xs">{snapshot.deployment.commitSha ?? "local / unavailable"}</p>
          </div>
          <div className="rounded-2xl bg-[var(--surface-2)] p-3">
            <p className="text-xs text-[var(--ink-2)]">Deployment URL</p>
            <p className="mt-1 truncate text-xs font-semibold">{snapshot.deployment.deploymentUrl ?? "local / unavailable"}</p>
          </div>
          <div className="rounded-2xl bg-[var(--surface-2)] p-3">
            <p className="text-xs text-[var(--ink-2)]">Production URL</p>
            <p className="mt-1 truncate text-xs font-semibold">{snapshot.deployment.productionUrl ?? "verify in Vercel"}</p>
          </div>
          <div className="rounded-2xl bg-[var(--surface-2)] p-3">
            <p className="text-xs text-[var(--ink-2)]">Supabase ref</p>
            <p className="mt-1 font-mono text-xs font-semibold">{snapshot.deployment.supabaseProjectRef ?? "not configured"}</p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-[var(--line)] bg-white p-5 shadow-sm">
        <h2 className="font-display text-2xl font-black">{controlCopy.readiness}</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {snapshot.readiness.map((item) => (
            <div key={item.label} className={`rounded-2xl border p-4 ${statusClass(item.status)}`}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-black">{item.label}</p>
                <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-black uppercase">
                  {item.configured ? controlCopy.configured : controlCopy.missing}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Link href={href("/admin/listings")} className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold">{copy.moderation}</p>
          <p className="mt-1 text-sm text-[var(--ink-2)]">{copy.moderationDescription}</p>
        </Link>
        <Link href={href("/administrator/settings")} className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold">{copy.siteSettings}</p>
          <p className="mt-1 text-sm text-[var(--ink-2)]">{copy.settingsDescription}</p>
        </Link>
        <Link href={href("/administrator/promotions")} className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <p className="text-sm font-semibold">{locale === "fa" ? "پرداخت و اعلان ویژه" : locale === "ps" ? "تادیه او ځانګړی اعلان" : "Payments & Featured"}</p>
          <p className="mt-1 text-sm text-[var(--ink-2)]">{locale === "fa" ? "قیمت، مدت، مراجع HesabPay و آمادگی AI را مدیریت کنید." : locale === "ps" ? "بیه، موده، د HesabPay مراجع او د AI چمتووالی اداره کړئ." : "Manage price, duration, HesabPay references, and AI launch readiness."}</p>
        </Link>
        <Link href={href("/admin/categories")} className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold">{copy.categoriesSchemas}</p>
          <p className="mt-1 text-sm text-[var(--ink-2)]">{copy.categoriesDescription}</p>
        </Link>
        <Link href={href("/admin/listing-schema")} className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold">{copy.schemaBuilder}</p>
          <p className="mt-1 text-sm text-[var(--ink-2)]">{copy.schemaDescription}</p>
        </Link>
        <Link href={href("/admin/pages")} className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold">{copy.staticPages}</p>
          <p className="mt-1 text-sm text-[var(--ink-2)]">{copy.pagesDescription}</p>
        </Link>
        <Link href={href("/admin/users")} className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold">{copy.users}</p>
          <p className="mt-1 text-sm text-[var(--ink-2)]">{copy.usersDescription}</p>
        </Link>
        <Link href={href("/admin/roles")} className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold">{copy.rolesPermissions}</p>
          <p className="mt-1 text-sm text-[var(--ink-2)]">{copy.rolesDescription}</p>
        </Link>
        <Link href={href("/admin/audit")} className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold">{copy.auditLog}</p>
          <p className="mt-1 text-sm text-[var(--ink-2)]">{copy.auditDescription}</p>
        </Link>
        <Link href={href("/admin/search")} className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold">{copy.searchAdministration}</p>
          <p className="mt-1 text-sm text-[var(--ink-2)]">{copy.searchDescription}</p>
        </Link>
      </div>

      <section className="mt-8 space-y-4">
        <h2 className="font-display text-2xl font-black">{controlCopy.operations}</h2>
        <MetricGrid items={snapshot.operations} />
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="font-display text-2xl font-black">{controlCopy.security}</h2>
        <MetricGrid items={snapshot.security} />
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="font-display text-2xl font-black">{controlCopy.paymentsAi}</h2>
        <MetricGrid items={snapshot.paymentsAi} />
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="font-display text-2xl font-black">{controlCopy.inventory}</h2>
        <MetricGrid items={snapshot.inventoryBusiness} />
      </section>

      <div className="mt-8 rounded-2xl border border-[var(--line)] bg-white p-4">
        <h2 className="font-display text-xl font-bold">{copy.administratorAccess}</h2>
        <p className="mt-2 text-sm text-[var(--ink-2)]">{copy.adminDescription}</p>
        <p className="mt-2 text-sm text-[var(--ink-2)]">{ui.admin.listingApprovalQueue} remains in the moderator/admin area; consumer navigation stays separate.</p>
        <p className="mt-4 text-sm text-[var(--ink-2)]">{copy.settingsDescription}</p>
      </div>
    </main>
  );
}
