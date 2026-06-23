import { requireUser } from "@/lib/auth";
import { ListingCard } from "@/components/listing-card";
import { DashboardSection } from "@/components/dashboard-section";
import { toggleFavoriteAction } from "@/lib/actions/favorites";
import { getMyFavoriteListings } from "@/lib/data/queries";

export default async function FavoritesPage() {
  const user = await requireUser();
  const listings = await getMyFavoriteListings(user.id);

  return (
    <DashboardSection
      currentPath="/dashboard/favorites"
      title="Favorite Listings"
      description="Your saved listings appear here."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {listings.map((listing) => (
          <div key={listing.id} className="space-y-2">
            <ListingCard listing={listing} />
            <form
              action={async () => {
                "use server";
                await toggleFavoriteAction(listing.id);
              }}
            >
              <button className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm font-semibold">
                Remove Favorite
              </button>
            </form>
          </div>
        ))}
      </div>
    </DashboardSection>
  );
}
