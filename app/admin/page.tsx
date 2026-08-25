import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { hasAdminPermission } from "@/lib/authorization";
import { adminGetStatsAction } from "@/lib/actions/listings";
import { getAdminAttentionSummary } from "@/lib/data/featured-payments";
import { getCurrentLocale } from "@/lib/i18n/server";
import { getUiTranslations } from "@/lib/i18n/ui";
import { ADMIN_CONTROL_COPY } from "@/lib/i18n/admin-control-copy";
import { adminPath } from "@/lib/admin/routing";

export default async function AdminPage() {
  const user = await requirePermission("admins.view");
  const locale = await getCurrentLocale();
  const ui = getUiTranslations(locale);
  const copy = ADMIN_CONTROL_COPY[locale];
  const [stats, attention, permissions] = await Promise.all([
    adminGetStatsAction(),
    getAdminAttentionSummary(),
    Promise.all([
      hasAdminPermission(user.id, "listings.view"),
      hasAdminPermission(user.id, "payments.view"),
      hasAdminPermission(user.id, "payments.configure"),
      hasAdminPermission(user.id, "search.view"),
      hasAdminPermission(user.id, "users.view"),
      hasAdminPermission(user.id, "audit_logs.view"),
      hasAdminPermission(user.id, "business_sellers.view"),
    ]),
  ]);
  const [
    canViewListings,
    canViewPayments,
    canConfigurePayments,
    canViewSearch,
    canViewUsers,
    canViewAudit,
    canViewBusinessSellers,
  ] = permissions;
  const href = (path: string) => adminPath(path);
  const operationalCopy = {
    attention: locale === "fa" ? "نیازمند توجه اکنون" : locale === "ps" ? "اوس پاملرنې ته اړتیا" : "Needs attention now",
    recent: locale === "fa" ? "فعالیت امروز / ۷ روز" : locale === "ps" ? "نن / ۷ ورځو فعالیت" : "Today / 7-day activity",
    pendingListings: locale === "fa" ? "اعلان‌های در انتظار" : locale === "ps" ? "په انتظار اعلانونه" : "Pending listings",
    reportedListings: locale === "fa" ? "گزارش‌های باز" : locale === "ps" ? "پرانیستي راپورونه" : "Reported listings",
    featuredRequests: locale === "fa" ? "درخواست‌های ویژه" : locale === "ps" ? "ځانګړې غوښتنې" : "Featured Requests",
    importCandidates: locale === "fa" ? "کاندیدهای واردات" : locale === "ps" ? "د وارداتو کاندیدان" : "Import candidates",
    importFailures: locale === "fa" ? "خطاهای واردات" : locale === "ps" ? "د وارداتو تېروتنې" : "Import failures",
    claims: locale === "fa" ? "ادعاهای مالکیت" : locale === "ps" ? "د مالکیت ادعاوې" : "Claims pending",
    duplicates: locale === "fa" ? "بررسی تکراری‌ها" : locale === "ps" ? "د تکرار کتنه" : "Duplicate review",
    users: locale === "fa" ? "کاربران نیازمند بررسی" : locale === "ps" ? "کارونکي د کتنې لپاره" : "Users requiring review",
    moderation: locale === "fa" ? "اقدامات اخیر مدیریت" : locale === "ps" ? "وروستي اداري اقدامات" : "Recent moderation",
    alerts: locale === "fa" ? "هشدارهای عملیاتی" : locale === "ps" ? "عملیاتي خبرتیاوې" : "Operational alerts",
    listingsActivity: locale === "fa" ? "اعلان‌ها" : locale === "ps" ? "اعلانونه" : "Listings",
    contactActivity: locale === "fa" ? "اقدام‌های تماس" : locale === "ps" ? "د اړیکې فعالیتونه" : "Contact actions",
    view: locale === "fa" ? "باز کردن" : locale === "ps" ? "پرانستل" : "Open",
  };

  const attentionCards = [
    { label: operationalCopy.pendingListings, value: attention.pendingListings, href: "/admin/listings", can: canViewListings },
    { label: operationalCopy.reportedListings, value: attention.reportedListings, href: "/admin/listings", can: canViewListings },
    { label: `${operationalCopy.featuredRequests} (${attention.pendingReview})`, value: attention.pendingReview, href: "/admin/featured-payments", can: canViewPayments },
    { label: operationalCopy.importCandidates, value: attention.importCandidates, href: "/admin/inventory", can: canViewListings },
    { label: operationalCopy.importFailures, value: attention.importFailures, href: "/admin/inventory", can: canViewListings },
    { label: operationalCopy.claims, value: attention.claimsPending, href: "/admin/inventory", can: canViewListings },
    { label: operationalCopy.duplicates, value: attention.duplicateReview, href: "/admin/inventory", can: canViewListings },
    { label: operationalCopy.users, value: attention.usersRequiringReview, href: "/admin/users", can: canViewUsers },
    { label: operationalCopy.moderation, value: attention.recentModerationActions, href: "/admin/audit", can: canViewAudit },
    { label: operationalCopy.alerts, value: attention.unreadOperationalAlerts, href: "/admin", can: true },
  ];

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold">{ui.admin.dashboard}</h1>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-[var(--line)] bg-white p-4"><p className="text-sm text-[var(--ink-2)]">{ui.admin.pending}</p><p className="text-2xl font-bold">{stats.pending}</p></div>
        <div className="rounded-xl border border-[var(--line)] bg-white p-4"><p className="text-sm text-[var(--ink-2)]">{ui.admin.approved}</p><p className="text-2xl font-bold">{stats.approved}</p></div>
        <div className="rounded-xl border border-[var(--line)] bg-white p-4"><p className="text-sm text-[var(--ink-2)]">{ui.admin.rejected}</p><p className="text-2xl font-bold">{stats.rejected}</p></div>
        <div className="rounded-xl border border-[var(--line)] bg-white p-4"><p className="text-sm text-[var(--ink-2)]">{ui.admin.sold}</p><p className="text-2xl font-bold">{stats.sold}</p></div>
        <div className="rounded-xl border border-[var(--line)] bg-white p-4"><p className="text-sm text-[var(--ink-2)]">{ui.admin.reports}</p><p className="text-2xl font-bold">{stats.reports}</p></div>
      </div>

      <section className="mt-6 rounded-3xl border border-[var(--line)] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-black">{operationalCopy.attention}</h2>
            <p className="text-sm text-[var(--ink-2)]">{operationalCopy.recent}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-[var(--ink-2)] sm:text-right">
            <span>{operationalCopy.listingsActivity}: {attention.listingsToday} / {attention.listingsSevenDays}</span>
            <span>{operationalCopy.contactActivity}: {attention.contactActionsToday} / {attention.contactActionsSevenDays}</span>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {attentionCards.filter((card) => card.can).map((card) => (
            <Link key={card.label} href={href(card.href)} className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-3 hover:border-[var(--accent)]">
              <p className="text-xs text-[var(--ink-2)]">{card.label}</p>
              <p className="mt-1 text-2xl font-black">{card.value}</p>
              <p className="mt-1 text-xs font-semibold text-[var(--accent)]">{operationalCopy.view}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link href={href("/admin/listings")} className="inline-block rounded-xl bg-[var(--ink-1)] px-4 py-2 text-sm font-semibold text-white">{ui.admin.listingApprovalQueue}</Link>
        {canViewPayments ? (
          <Link href={href("/admin/featured-payments")} className="inline-block rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900">
            {operationalCopy.featuredRequests} ({attention.pendingReview})
          </Link>
        ) : null}
        <Link href={href("/admin/inventory")} className="inline-block rounded-xl border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold">{locale === "fa" ? "موجودی و منابع" : locale === "ps" ? "موجودي او سرچینې" : "Inventory sources"}</Link>
        <Link href={href("/admin/demand")} className="inline-block rounded-xl border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold">{locale === "fa" ? "تقاضا و کمبود عرضه" : locale === "ps" ? "تقاضا او تشې" : "Demand gaps"}</Link>
        <Link href={href("/admin/network-readiness")} className="inline-block rounded-xl border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold">{locale === "fa" ? "آمادگی شبکه" : locale === "ps" ? "د شبکې چمتووالی" : "Network readiness"}</Link>
        <Link href={href("/admin/vehicle-3d")} className="inline-block rounded-xl border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold">{locale === "fa" ? "مدل‌های ۳بعدی موتر" : locale === "ps" ? "د موټر 3D موډلونه" : "Vehicle 3D"}</Link>
        {canViewSearch ? (
          <Link href={href("/admin/search")} className="inline-block rounded-xl border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold">{ui.admin.searchAdmin}</Link>
        ) : null}
        {canConfigurePayments ? (
          <Link href={href("/administrator/promotions")} className="inline-block rounded-xl border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold">
            {locale === "fa" ? "تنظیم اعلان ویژه" : locale === "ps" ? "ځانګړی اعلان تنظیم" : "Promotion controls"}
          </Link>
        ) : null}
        {canViewBusinessSellers ? (
          <Link href={href("/dashboard/professional-seller")} className="inline-block rounded-xl border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold">
            {locale === "fa" ? "فروشندگان حرفه‌ای" : locale === "ps" ? "مسلکي پلورونکي" : "Business sellers"}
          </Link>
        ) : null}
        <Link href={href("/admin/analytics")} className="inline-block rounded-xl border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold">{copy.analytics}</Link>
        <Link href={href("/admin/categories")} className="inline-block rounded-xl border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold">{ui.admin.categoryAdmin}</Link>
        <Link href={href("/admin/listing-schema")} className="inline-block rounded-xl border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold">{copy.schemaBuilder}</Link>
        <Link href={href("/admin/pages")} className="inline-block rounded-xl border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold">{copy.pages}</Link>
        <Link href={href("/admin/users")} className="inline-block rounded-xl border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold">{copy.users}</Link>
        <Link href={href("/admin/roles")} className="inline-block rounded-xl border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold">{copy.roles}</Link>
        <Link href={href("/admin/audit")} className="inline-block rounded-xl border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold">{copy.auditLog}</Link>
      </div>
    </main>
  );
}
