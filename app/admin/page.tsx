import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { adminGetStatsAction } from "@/lib/actions/listings";
import { getCurrentLocale } from "@/lib/i18n/server";
import { getUiTranslations } from "@/lib/i18n/ui";
import { localizePath } from "@/lib/i18n/routing";

export default async function AdminPage() {
  await requireAdmin();
  const locale = await getCurrentLocale();
  const ui = getUiTranslations(locale);
  const stats = await adminGetStatsAction();
  const href = (path: string) => localizePath(path, locale);

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
      <div className="mt-6 flex flex-wrap gap-2">
        <Link href={href("/admin/listings")} className="inline-block rounded-xl bg-[var(--ink-1)] px-4 py-2 text-sm font-semibold text-white">{ui.admin.listingApprovalQueue}</Link>
        <Link href={href("/admin/search")} className="inline-block rounded-xl border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold">{ui.admin.searchAdmin}</Link>
        <Link href={href("/admin/categories")} className="inline-block rounded-xl border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold">{ui.admin.categoryAdmin}</Link>
      </div>
    </main>
  );
}
