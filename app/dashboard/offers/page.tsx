import { requireUser } from "@/lib/auth";
import { DashboardSection } from "@/components/dashboard-section";
import { getMyOffers } from "@/lib/data/queries";
import { updateOfferStatusAction } from "@/lib/actions/offers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function OffersPage() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  await Promise.all([
    supabase
      .from("offers")
      .update({ seller_seen_at: new Date().toISOString() })
      .eq("seller_user_id", user.id)
      .eq("status", "pending")
      .is("seller_seen_at", null),
    supabase
      .from("offers")
      .update({ buyer_seen_at: new Date().toISOString() })
      .eq("buyer_user_id", user.id)
      .in("status", ["accepted", "rejected"])
      .is("buyer_seen_at", null),
  ]);

  const { incoming, outgoing } = await getMyOffers(user.id);

  return (
    <DashboardSection
      currentPath="/dashboard/offers"
      title="Offers"
      description="Review minimum-offer interactions and negotiate with buyers."
    >
      <div className="space-y-6">
        <section>
          <h2 className="mb-3 font-display text-xl font-bold">Incoming Offers</h2>
          {incoming.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface-2)] p-4 text-sm text-[var(--ink-2)]">No incoming offers yet.</div>
          ) : (
            <div className="space-y-3">
              {incoming.map((offer) => (
                <div key={offer.id} className="rounded-xl border border-[var(--line)] bg-white p-4">
                  <p className="text-sm font-semibold">Offer: {new Intl.NumberFormat("en-US").format(offer.offered_price)} {offer.currency}</p>
                  <p className="mt-1 text-xs text-[var(--ink-2)]">Status: {offer.status} • Listing {offer.listing_id.slice(0, 8)}</p>
                  {offer.buyer_note ? <p className="mt-2 text-sm">Buyer note: {offer.buyer_note}</p> : null}
                  {offer.status === "pending" && (
                    <div className="mt-3 flex gap-2">
                      <form action={async () => { "use server"; await updateOfferStatusAction(offer.id, "accepted"); }}>
                        <button className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-white">Accept</button>
                      </form>
                      <form action={async () => { "use server"; await updateOfferStatusAction(offer.id, "rejected"); }}>
                        <button className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white">Reject</button>
                      </form>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 font-display text-xl font-bold">Outgoing Offers</h2>
          {outgoing.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface-2)] p-4 text-sm text-[var(--ink-2)]">No outgoing offers yet.</div>
          ) : (
            <div className="space-y-3">
              {outgoing.map((offer) => (
                <div key={offer.id} className="rounded-xl border border-[var(--line)] bg-white p-4">
                  <p className="text-sm font-semibold">Your offer: {new Intl.NumberFormat("en-US").format(offer.offered_price)} {offer.currency}</p>
                  <p className="mt-1 text-xs text-[var(--ink-2)]">Status: {offer.status} • Listing {offer.listing_id.slice(0, 8)}</p>
                  {offer.status === "accepted" ? (
                    <p className="mt-2 text-sm font-semibold text-green-700">Seller accepted your offer.</p>
                  ) : null}
                  {offer.status === "rejected" ? (
                    <p className="mt-2 text-sm font-semibold text-red-700">Seller rejected your offer.</p>
                  ) : null}
                  {offer.seller_response_note ? <p className="mt-2 text-sm">Seller response: {offer.seller_response_note}</p> : null}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardSection>
  );
}
