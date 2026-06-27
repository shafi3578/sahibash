import Link from "next/link";
import { redirect } from "next/navigation";
import { ListingCard } from "@/components/listing-card";
import {
  bumpListingAction,
  toggleListingFeaturedAction,
  toggleListingUrgentAction,
  updateListingStatusAction,
  deleteListingAction,
} from "@/lib/actions/listings";
import { getListingWithOwnerStats } from "@/lib/data/queries";
import { getCurrentUser } from "@/lib/auth";
import { getCurrentLocale } from "@/lib/i18n/server";
import { getUiTranslations } from "@/lib/i18n/ui";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ListingManagePage({ params }: PageProps) {
  const { id: listingId } = await params;
  const locale = await getCurrentLocale();
  const ui = getUiTranslations(locale);

  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(`/listings/${listingId}/manage`)}`);
  }

  const data = await getListingWithOwnerStats(listingId, user.id);

  if (!data) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-[var(--line)] bg-white p-6 text-center">
          <p className="text-[var(--ink-2)]">{ui.listingManage.notFoundOrUnauthorized}</p>
          <Link
            href="/dashboard/my-ads"
            className="mt-3 inline-block text-[var(--accent)] font-semibold"
          >
            {ui.listingManage.backToMyListings}
          </Link>
        </div>
      </main>
    );
  }

  const { listing, stats, priceHistory } = data;
  const expiresAt = new Date(listing.expires_at);
  const isExpired = expiresAt < new Date();

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">{listing.title}</h1>
        <Link
          href="/dashboard/my-ads"
          className="rounded-lg border border-[var(--line)] px-4 py-2 text-sm font-semibold hover:bg-[var(--surface-2)]"
        >
          {ui.listingManage.backToListings}
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Listing Preview */}
          <div className="rounded-lg border border-[var(--line)] bg-white p-4">
            <ListingCard listing={listing} />
          </div>

          {/* Status Badge */}
          <div className="flex gap-2">
            <span
              className={`rounded-full px-3 py-1 text-sm font-semibold text-white ${
                listing.status === "approved"
                  ? "bg-green-600"
                  : listing.status === "pending"
                  ? "bg-yellow-600"
                  : listing.status === "sold"
                  ? "bg-gray-600"
                  : listing.status === "expired"
                  ? "bg-red-600"
                  : "bg-orange-600"
              }`}
            >
              {listing.status === "approved"
                ? ui.admin.approved
                : listing.status === "pending"
                ? ui.admin.pending
                : listing.status === "sold"
                ? ui.admin.sold
                : listing.status === "rejected"
                ? ui.admin.rejected
                : listing.status === "expired"
                ? ui.listingManage.expired
                : listing.status.toUpperCase()}
            </span>
            {listing.featured && (
              <span className="rounded-full bg-blue-600 px-3 py-1 text-sm font-semibold text-white">
                {ui.listingManage.featured}
              </span>
            )}
            {listing.urgent && (
              <span className="rounded-full bg-red-500 px-3 py-1 text-sm font-semibold text-white">
                {ui.listingManage.urgent}
              </span>
            )}
          </div>

          {/* Statistics */}
          <div className="rounded-lg border border-[var(--line)] bg-white p-4">
            <h2 className="mb-4 font-display text-lg font-bold">{ui.listingManage.statistics}</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg bg-[var(--surface-2)] p-3 text-center">
                <div className="text-2xl font-bold text-[var(--accent)]">
                  {stats.viewsCount}
                </div>
                <div className="text-xs text-[var(--ink-2)]">{ui.listingManage.views}</div>
              </div>
              <div className="rounded-lg bg-[var(--surface-2)] p-3 text-center">
                <div className="text-2xl font-bold text-[var(--accent)]">
                  {stats.favoritesCount}
                </div>
                <div className="text-xs text-[var(--ink-2)]">{ui.listingManage.favorites}</div>
              </div>
              <div className="rounded-lg bg-[var(--surface-2)] p-3 text-center">
                <div className="text-2xl font-bold text-[var(--accent)]">
                  {stats.messagesCount}
                </div>
                <div className="text-xs text-[var(--ink-2)]">{ui.listingManage.messages}</div>
              </div>
            </div>
          </div>

          {/* Price History */}
          {priceHistory.length > 0 && (
            <div className="rounded-lg border border-[var(--line)] bg-white p-4">
              <h2 className="mb-4 font-display text-lg font-bold">{ui.listingManage.priceHistory}</h2>
              <div className="space-y-2">
                {priceHistory.map((entry, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between border-b border-[var(--line)] pb-2 last:border-0"
                  >
                    <div>
                      <div className="text-sm font-medium">
                        {entry.old_price} → {entry.new_price} {entry.currency}
                      </div>
                      <div className="text-xs text-[var(--ink-2)]">
                        {new Date(entry.changed_at).toLocaleDateString(locale === "fa" ? "fa-AF" : locale === "ps" ? "ps-AF" : "en-US")}
                        {entry.reason && ` • ${entry.reason}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-4">
          {/* Edit Listing */}
          <Link
            href={`/listings/${listingId}/edit`}
            className="block rounded-lg bg-[var(--accent)] px-4 py-3 text-center font-semibold text-white hover:opacity-90"
          >
            ✏️ {ui.listingManage.editListing}
          </Link>

          {/* Mark as Sold */}
          {listing.status !== "sold" && (
            <form
              action={async () => {
                "use server";
                await updateListingStatusAction(listingId, "sold");
              }}
            >
              <button
                type="submit"
                className="w-full rounded-lg bg-gray-600 px-4 py-3 font-semibold text-white hover:bg-gray-700"
              >
                ✓ {ui.listingManage.markAsSold}
              </button>
            </form>
          )}

          {/* Bump Listing */}
          {listing.status === "approved" && (
            <form
              action={async () => {
                "use server";
                await bumpListingAction(listingId);
              }}
            >
              <button
                type="submit"
                className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
              >
                ⬆ {ui.listingManage.bumpDate}
              </button>
            </form>
          )}

          {/* Featured Toggle */}
          {listing.status === "approved" && (
            <form
              action={async () => {
                "use server";
                await toggleListingFeaturedAction(listingId, !listing.featured);
              }}
            >
              <button
                type="submit"
                className={`w-full rounded-lg px-4 py-3 font-semibold text-white ${
                  listing.featured
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-amber-500 hover:bg-amber-600"
                }`}
              >
                ⭐ {listing.featured ? ui.listingManage.removeFeatured : ui.listingManage.makeFeatured}
              </button>
            </form>
          )}

          {/* Urgent Toggle */}
          {listing.status === "approved" && (
            <form
              action={async () => {
                "use server";
                await toggleListingUrgentAction(listingId, !listing.urgent);
              }}
            >
              <button
                type="submit"
                className={`w-full rounded-lg px-4 py-3 font-semibold text-white ${
                  listing.urgent
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-red-500 hover:bg-red-600"
                }`}
              >
                🔴 {listing.urgent ? ui.listingManage.removeUrgent : ui.listingManage.markUrgent}
              </button>
            </form>
          )}

          {/* Delete Listing */}
          <DeleteListingForm listingId={listingId} label={ui.listingManage.deleteListing} />

          {/* Expiration Info */}
          <div className="rounded-lg border border-[var(--line)] bg-white p-3">
            <div className="text-xs font-semibold text-[var(--ink-1)]">{ui.listingManage.expires}</div>
            <div className={`mt-1 text-sm font-bold ${isExpired ? "text-red-600" : "text-green-600"}`}>
              {expiresAt.toLocaleDateString(locale === "fa" ? "fa-AF" : locale === "ps" ? "ps-AF" : "en-US")}
            </div>
            {isExpired && (
              <div className="mt-2 text-xs text-red-600">{ui.listingManage.thisListingHasExpired}</div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function DeleteListingForm({ listingId, label }: { listingId: string; label: string }) {
  return (
    <form
      action={async () => {
        "use server";
        await deleteListingAction(listingId);
        redirect("/dashboard/my-ads");
      }}
    >
      <button
        type="submit"
        className="w-full rounded-lg bg-red-700 px-4 py-3 font-semibold text-white hover:bg-red-800"
      >
        🗑 {label}
      </button>
    </form>
  );
}
