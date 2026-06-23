import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PriceHistoryPage({ params }: PageProps) {
  const { id: listingId } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createSupabaseServerClient();

  // Verify ownership
  const { data: listing } = await supabase
    .from("listings")
    .select("id, user_id, title")
    .eq("id", listingId)
    .single();

  if (!listing || listing.user_id !== user.id) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-[var(--line)] bg-white p-6 text-center">
          <p className="text-[var(--ink-2)]">Listing not found or unauthorized</p>
          <Link
            href="/dashboard/my-ads"
            className="mt-3 inline-block text-[var(--accent)] font-semibold"
          >
            Back to My Listings
          </Link>
        </div>
      </main>
    );
  }

  // Fetch price history
  const { data: priceHistory } = await supabase
    .from("listing_price_history")
    .select("*")
    .eq("listing_id", listingId)
    .order("changed_at", { ascending: false });

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Price History</h1>
          <p className="mt-1 text-[var(--ink-2)]">{listing.title}</p>
        </div>
        <Link
          href={`/listings/${listingId}/manage`}
          className="rounded-lg border border-[var(--line)] px-4 py-2 text-sm font-semibold hover:bg-[var(--surface-2)]"
        >
          Back to Listing
        </Link>
      </div>

      <div className="rounded-lg border border-[var(--line)] bg-white p-6">
        {!priceHistory || priceHistory.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[var(--ink-2)]">No price changes recorded yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--line)]">
                  <th className="pb-3 text-left text-sm font-semibold text-[var(--ink-1)]">
                    Date
                  </th>
                  <th className="pb-3 text-left text-sm font-semibold text-[var(--ink-1)]">
                    Old Price
                  </th>
                  <th className="pb-3 text-left text-sm font-semibold text-[var(--ink-1)]">
                    New Price
                  </th>
                  <th className="pb-3 text-left text-sm font-semibold text-[var(--ink-1)]">
                    Change
                  </th>
                  <th className="pb-3 text-left text-sm font-semibold text-[var(--ink-1)]">
                    Reason
                  </th>
                </tr>
              </thead>
              <tbody>
                {priceHistory.map((entry, idx) => {
                  const change = entry.new_price - entry.old_price;
                  const changePercent = ((change / entry.old_price) * 100).toFixed(1);

                  return (
                    <tr
                      key={idx}
                      className="border-b border-[var(--line)] last:border-0"
                    >
                      <td className="py-3 text-sm">
                        <div className="font-medium">
                          {new Date(entry.changed_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-[var(--ink-2)]">
                          {new Date(entry.changed_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>
                      <td className="py-3 text-sm font-medium">
                        {entry.old_price} {entry.currency}
                      </td>
                      <td className="py-3 text-sm font-medium">
                        {entry.new_price} {entry.currency}
                      </td>
                      <td className="py-3 text-sm">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            change > 0
                              ? "bg-green-100 text-green-700"
                              : change < 0
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {change > 0 ? "+" : ""}
                          {change} ({changePercent}%)
                        </span>
                      </td>
                      <td className="py-3 text-sm text-[var(--ink-2)]">
                        {entry.reason || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Statistics */}
            <div className="mt-8 grid gap-4 border-t border-[var(--line)] pt-6 sm:grid-cols-3">
              <div className="rounded-lg bg-[var(--surface-2)] p-4">
                <div className="text-xs font-semibold text-[var(--ink-2)] uppercase">
                  Original Price
                </div>
                <div className="mt-2 text-lg font-bold text-[var(--ink-1)]">
                  {priceHistory[priceHistory.length - 1]?.old_price}{" "}
                  {priceHistory[priceHistory.length - 1]?.currency}
                </div>
              </div>

              <div className="rounded-lg bg-[var(--surface-2)] p-4">
                <div className="text-xs font-semibold text-[var(--ink-2)] uppercase">
                  Current Price
                </div>
                <div className="mt-2 text-lg font-bold text-[var(--ink-1)]">
                  {priceHistory[0]?.new_price} {priceHistory[0]?.currency}
                </div>
              </div>

              <div className="rounded-lg bg-[var(--surface-2)] p-4">
                <div className="text-xs font-semibold text-[var(--ink-2)] uppercase">
                  Total Change
                </div>
                <div className="mt-2">
                  <div
                    className={`text-lg font-bold ${
                      (priceHistory[0]?.new_price ?? 0) -
                        (priceHistory[priceHistory.length - 1]?.old_price ?? 0) >
                      0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {(priceHistory[0]?.new_price ?? 0) -
                      (priceHistory[priceHistory.length - 1]?.old_price ?? 0) >
                    0
                      ? "+"
                      : ""}
                    {(priceHistory[0]?.new_price ?? 0) -
                      (priceHistory[priceHistory.length - 1]?.old_price ?? 0)}{" "}
                    {priceHistory[0]?.currency}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
