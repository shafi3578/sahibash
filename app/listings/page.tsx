import { ListingCard } from "@/components/listing-card";
import { getApprovedListings } from "@/lib/data/queries";

export default async function ListingsPage() {
  const listings = await getApprovedListings();
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold">All Listings</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
      </div>
    </main>
  );
}
