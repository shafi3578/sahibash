import { ListingCard } from "@/components/listing-card";
import { getApprovedListings } from "@/lib/data/queries";
import { getDictionary } from "@/lib/i18n/server";
import { getUiTranslations } from "@/lib/i18n/ui";

export default async function ListingsPage() {
  const { locale } = await getDictionary();
  const ui = getUiTranslations(locale);
  const listings = await getApprovedListings({ locale });
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold">{ui.listingsPage.allListings}</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
      </div>
    </main>
  );
}
