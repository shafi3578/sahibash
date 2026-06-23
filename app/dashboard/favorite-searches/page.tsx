import { requireUser } from "@/lib/auth";
import { DashboardSection } from "@/components/dashboard-section";

export default async function FavoriteSearchesPage() {
  await requireUser();

  return (
    <DashboardSection
      currentPath="/dashboard/favorite-searches"
      title="Favorite Searches"
      description="Save search filters and enable notifications for matching new listings."
    >
      <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface-2)] p-5">
        <p className="font-semibold text-[var(--ink-1)]">No saved searches yet</p>
        <p className="mt-1 text-sm text-[var(--ink-2)]">
          Search presets will appear here after you save a search from the listings page.
        </p>
      </div>
    </DashboardSection>
  );
}
