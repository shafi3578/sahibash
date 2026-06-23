import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { ListingCard } from "@/components/listing-card";
import { DashboardSection } from "@/components/dashboard-section";
import {
  deleteListingAction,
  updateListingStatusAction,
  uploadListingImageFormAction,
} from "@/lib/actions/listings";
import { getMyListings } from "@/lib/data/queries";

type SearchParams = {
  tab?: "active" | "inactive";
  q?: string;
};

function formatDate(dateValue: string | null | undefined) {
  if (!dateValue) return "-";
  const d = new Date(dateValue);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleDateString("en-GB");
}

function getStatusLabel(status: string) {
  if (status === "pending") return "Under Review";
  return status;
}

export default async function MyAdsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireUser();
  const listings = await getMyListings(user.id);
  const params = await searchParams;

  const activeTab = params.tab === "inactive" ? "inactive" : "active";
  const searchTerm = (params.q ?? "").trim().toLowerCase();

  const filtered = listings.filter((listing) => {
    const isActiveStatus = listing.status === "approved";
    const tabMatch = activeTab === "active" ? isActiveStatus : !isActiveStatus;

    if (!tabMatch) return false;

    if (!searchTerm) return true;

    return (
      listing.title.toLowerCase().includes(searchTerm) ||
      listing.id.toLowerCase().includes(searchTerm)
    );
  });

  return (
    <DashboardSection
      currentPath="/dashboard/my-ads"
      title="My Listings"
      description="Manage active/inactive listings, status, media, and performance."
    >
      <form className="mb-4 grid gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3 sm:grid-cols-[1fr_auto]">
        <input type="hidden" name="tab" value={activeTab} />
        <input
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Search my listings by title or listing ID"
          className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg bg-[var(--ink-1)] px-4 py-2 text-sm font-semibold text-white"
        >
          Search
        </button>
      </form>

      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href={`/dashboard/my-ads?tab=active${params.q ? `&q=${encodeURIComponent(params.q)}` : ""}`}
          className={
            activeTab === "active"
              ? "rounded-lg bg-[var(--ink-1)] px-3 py-1.5 text-sm font-semibold text-white"
              : "rounded-lg border border-[var(--line)] bg-white px-3 py-1.5 text-sm font-semibold"
          }
        >
          Active Listings
        </Link>
        <Link
          href={`/dashboard/my-ads?tab=inactive${params.q ? `&q=${encodeURIComponent(params.q)}` : ""}`}
          className={
            activeTab === "inactive"
              ? "rounded-lg bg-[var(--ink-1)] px-3 py-1.5 text-sm font-semibold text-white"
              : "rounded-lg border border-[var(--line)] bg-white px-3 py-1.5 text-sm font-semibold"
          }
        >
          Inactive Listings
        </Link>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {filtered.map((listing) => (
          <div
            key={listing.id}
            className="space-y-3 rounded-2xl border border-[var(--line)] bg-white p-4"
          >
            <ListingCard listing={listing} showStatus />

            <div className="grid grid-cols-2 gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3 text-xs text-[var(--ink-2)] sm:grid-cols-4">
              <p>
                ID
                <span className="mt-1 block font-semibold text-[var(--ink-1)]">{listing.id.slice(0, 8)}</span>
              </p>
              <p>
                Views
                <span className="mt-1 block font-semibold text-[var(--ink-1)]">{listing.views_count}</span>
              </p>
              <p>
                Favorites
                <span className="mt-1 block font-semibold text-[var(--ink-1)]">{listing.favorites_count}</span>
              </p>
              <p>
                Messages
                <span className="mt-1 block font-semibold text-[var(--ink-1)]">{listing.messages_count}</span>
              </p>
              <p>
                Status
                <span className="mt-1 block font-semibold text-[var(--ink-1)]">{getStatusLabel(listing.status)}</span>
              </p>
              <p>
                Expiry
                <span className="mt-1 block font-semibold text-[var(--ink-1)]">{formatDate(listing.expires_at)}</span>
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <form
                action={async () => {
                  "use server";
                  await updateListingStatusAction(listing.id, "sold");
                }}
              >
                <button className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-sm font-semibold">
                  Mark as Sold
                </button>
              </form>
              <form
                action={async () => {
                  "use server";
                  await deleteListingAction(listing.id);
                }}
              >
                <button className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white">
                  Delete
                </button>
              </form>
            </div>

            <form
              action={uploadListingImageFormAction}
              className="flex flex-wrap items-center gap-2"
            >
              <input type="hidden" name="listingId" value={listing.id} />
              <input name="image" type="file" accept="image/*" required className="text-sm" />
              <button className="rounded-lg bg-[var(--ink-1)] px-3 py-1.5 text-sm font-semibold text-white">
                Upload Image
              </button>
            </form>
          </div>
        ))}
      </div>
    </DashboardSection>
  );
}
