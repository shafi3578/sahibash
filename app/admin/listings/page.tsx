import { requireAdmin } from "@/lib/auth";
import { ListingCard } from "@/components/listing-card";
import {
  deleteListingAction,
  updateListingStatusAction,
} from "@/lib/actions/listings";
import {
  adminFlagListingTranslationAction,
  adminUpdateListingTranslationAction,
} from "@/lib/actions/translations";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentLocale } from "@/lib/i18n/server";
import { getUiTranslations } from "@/lib/i18n/ui";

export default async function AdminListingsPage() {
  await requireAdmin();
  const locale = await getCurrentLocale();
  const ui = getUiTranslations(locale);
  const supabase = await createSupabaseServerClient();
  const { data: listings } = await supabase
    .from("listings")
    .select("*, listing_images(*), listing_translations(*)")
    .in("status", ["pending", "rejected"])
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold">{ui.admin.listingApprovalQueue}</h1>
      <p className="mt-1 text-[var(--ink-2)]">{ui.admin.approveRejectDelete}</p>
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {(listings ?? []).map((listing) => (
          <div key={listing.id} className="space-y-3 rounded-2xl border border-[var(--line)] bg-white p-4">
            <ListingCard listing={listing} showStatus />
            <div className="flex flex-wrap gap-2">
              <form action={async () => { "use server"; await updateListingStatusAction(listing.id, "approved"); }}>
                <button className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-white">{ui.admin.approve}</button>
              </form>
              <form action={async () => { "use server"; await updateListingStatusAction(listing.id, "rejected"); }}>
                <button className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white">{ui.admin.reject}</button>
              </form>
              <form action={async () => { "use server"; await deleteListingAction(listing.id); }}>
                <button className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white">{ui.admin.delete}</button>
              </form>
            </div>

            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
              <p className="text-sm font-semibold">{ui.admin.translations}</p>
              <p className="mt-1 text-xs text-[var(--ink-2)]">{ui.admin.original}: {listing.original_locale || "en"}</p>
              <p className="mt-1 text-xs text-[var(--ink-2)] line-clamp-2">{listing.original_title || listing.title}</p>

              {(listing.listing_translations ?? []).map((translation: any) => (
                <form key={translation.id} action={adminUpdateListingTranslationAction} className="mt-3 space-y-2 rounded-lg border border-[var(--line)] bg-white p-2">
                  <input type="hidden" name="listingId" value={listing.id} />
                  <input type="hidden" name="languageCode" value={translation.language_code} />
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold">{translation.language_code}</p>
                    <select name="translationStatus" defaultValue={translation.translation_status} className="rounded border border-[var(--line)] px-2 py-1 text-xs">
                      <option value="pending">pending</option>
                      <option value="completed">completed</option>
                      <option value="failed">failed</option>
                      <option value="stale">stale</option>
                      <option value="needs_review">needs_review</option>
                    </select>
                  </div>
                  <input name="title" defaultValue={translation.title} className="w-full rounded border border-[var(--line)] px-2 py-1 text-xs" />
                  <textarea name="description" defaultValue={translation.description} className="min-h-20 w-full rounded border border-[var(--line)] px-2 py-1 text-xs" />
                  <input name="translationQuality" defaultValue={translation.translation_quality || "manual"} className="w-full rounded border border-[var(--line)] px-2 py-1 text-xs" />
                  <div className="flex gap-2">
                    <button className="rounded bg-[var(--ink-1)] px-2 py-1 text-xs font-semibold text-white">{ui.admin.save}</button>
                    <button
                      formAction={adminFlagListingTranslationAction}
                      name="status"
                      value="needs_review"
                      className="rounded border border-[var(--line)] px-2 py-1 text-xs font-semibold"
                    >
                      {ui.admin.flag}
                    </button>
                  </div>
                </form>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
