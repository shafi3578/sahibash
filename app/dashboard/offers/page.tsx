import { requireUser } from "@/lib/auth";
import { DashboardSection } from "@/components/dashboard-section";
import { getMyOffers } from "@/lib/data/queries";
import { updateOfferStatusAction } from "@/lib/actions/offers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/server";
import { getUiTranslations } from "@/lib/i18n/ui";
import { DASHBOARD_COPY } from "@/lib/i18n/dashboard-copy";
import { formatCurrencyAmount } from "@/lib/i18n/format";

export default async function OffersPage() {
  const user = await requireUser();
  const { locale } = await getDictionary();
  const ui = getUiTranslations(locale);
  const copy = DASHBOARD_COPY[locale];
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
      title={ui.dashboard.offers}
      description={ui.dashboard.offersDescription}
    >
      <div className="space-y-6">
        <section>
          <h2 className="mb-3 font-display text-xl font-bold">{copy.incomingOffers}</h2>
          {incoming.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface-2)] p-4 text-sm text-[var(--ink-2)]">{copy.noIncoming}</div>
          ) : (
            <div className="space-y-3">
              {incoming.map((offer) => (
                <div key={offer.id} className="rounded-xl border border-[var(--line)] bg-white p-4">
                  <p className="text-sm font-semibold">{copy.offer}: {formatCurrencyAmount(offer.offered_price, offer.currency, locale)}</p>
                  <p className="mt-1 text-xs text-[var(--ink-2)]">{copy.status}: {offer.status} • {copy.listing} {offer.listing_id.slice(0, 8)}</p>
                  {offer.buyer_note ? <p className="mt-2 text-sm">{copy.buyerNote}: {offer.buyer_note}</p> : null}
                  {offer.status === "pending" && (
                    <div className="mt-3 flex gap-2">
                      <form action={async () => { "use server"; await updateOfferStatusAction(offer.id, "accepted"); }}>
                        <button className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-white">{copy.accept}</button>
                      </form>
                      <form action={async () => { "use server"; await updateOfferStatusAction(offer.id, "rejected"); }}>
                        <button className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white">{copy.reject}</button>
                      </form>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 font-display text-xl font-bold">{copy.outgoingOffers}</h2>
          {outgoing.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface-2)] p-4 text-sm text-[var(--ink-2)]">{copy.noOutgoing}</div>
          ) : (
            <div className="space-y-3">
              {outgoing.map((offer) => (
                <div key={offer.id} className="rounded-xl border border-[var(--line)] bg-white p-4">
                  <p className="text-sm font-semibold">{copy.yourOffer}: {formatCurrencyAmount(offer.offered_price, offer.currency, locale)}</p>
                  <p className="mt-1 text-xs text-[var(--ink-2)]">{copy.status}: {offer.status} • {copy.listing} {offer.listing_id.slice(0, 8)}</p>
                  {offer.status === "accepted" ? (
                    <p className="mt-2 text-sm font-semibold text-green-700">{copy.accepted}</p>
                  ) : null}
                  {offer.status === "rejected" ? (
                    <p className="mt-2 text-sm font-semibold text-red-700">{copy.rejected}</p>
                  ) : null}
                  {offer.seller_response_note ? <p className="mt-2 text-sm">{copy.sellerResponse}: {offer.seller_response_note}</p> : null}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardSection>
  );
}
