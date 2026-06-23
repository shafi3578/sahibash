import { requireAdmin } from "@/lib/auth";
import { ListingCard } from "@/components/listing-card";
import {
  deleteListingAction,
  updateListingStatusAction,
} from "@/lib/actions/listings";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminListingsPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { data: listings } = await supabase
    .from("listings")
    .select("*, listing_images(*)")
    .in("status", ["pending", "rejected"])
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold">Listing Approval Queue</h1>
      <p className="mt-1 text-[var(--ink-2)]">Approve, reject, and delete listings.</p>
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {(listings ?? []).map((listing) => (
          <div key={listing.id} className="space-y-3 rounded-2xl border border-[var(--line)] bg-white p-4">
            <ListingCard listing={listing} showStatus />
            <div className="flex flex-wrap gap-2">
              <form action={async () => { "use server"; await updateListingStatusAction(listing.id, "approved"); }}>
                <button className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-white">Approve</button>
              </form>
              <form action={async () => { "use server"; await updateListingStatusAction(listing.id, "rejected"); }}>
                <button className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white">Reject</button>
              </form>
              <form action={async () => { "use server"; await deleteListingAction(listing.id); }}>
                <button className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white">Delete</button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
