import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { adminGetStatsAction } from "@/lib/actions/listings";

export default async function AdminPage() {
  await requireAdmin();
  const stats = await adminGetStatsAction();

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold">Admin Dashboard</h1>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-[var(--line)] bg-white p-4"><p className="text-sm text-[var(--ink-2)]">Pending</p><p className="text-2xl font-bold">{stats.pending}</p></div>
        <div className="rounded-xl border border-[var(--line)] bg-white p-4"><p className="text-sm text-[var(--ink-2)]">Approved</p><p className="text-2xl font-bold">{stats.approved}</p></div>
        <div className="rounded-xl border border-[var(--line)] bg-white p-4"><p className="text-sm text-[var(--ink-2)]">Rejected</p><p className="text-2xl font-bold">{stats.rejected}</p></div>
        <div className="rounded-xl border border-[var(--line)] bg-white p-4"><p className="text-sm text-[var(--ink-2)]">Sold</p><p className="text-2xl font-bold">{stats.sold}</p></div>
        <div className="rounded-xl border border-[var(--line)] bg-white p-4"><p className="text-sm text-[var(--ink-2)]">Reports</p><p className="text-2xl font-bold">{stats.reports}</p></div>
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/admin/listings" className="inline-block rounded-xl bg-[var(--ink-1)] px-4 py-2 text-sm font-semibold text-white">Listing Approval Queue</Link>
        <Link href="/admin/search" className="inline-block rounded-xl border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold">Search Admin</Link>
      </div>
    </main>
  );
}
