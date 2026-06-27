import { requireUser } from "@/lib/auth";
import { ListingCard } from "@/components/listing-card";
import { DashboardSection } from "@/components/dashboard-section";
import { toggleFavoriteAction } from "@/lib/actions/favorites";
import { getMyFavoriteListings } from "@/lib/data/queries";
import { getCurrentLocale } from "@/lib/i18n/server";
import { getUiTranslations } from "@/lib/i18n/ui";

export default async function FavoritesPage() {
  const user = await requireUser();
  const locale = await getCurrentLocale();
  const ui = getUiTranslations(locale);
  const listings = await getMyFavoriteListings(user.id);

  return (
    <DashboardSection
      currentPath="/dashboard/favorites"
      title={ui.dashboard.favoriteListings}
      description={ui.dashboard.favoriteListingsDescription}
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
                {ui.dashboard.removeFavorite}
              </button>
            </form>
          </div>
        ))}
      </div>
    </DashboardSection>
  );
}
