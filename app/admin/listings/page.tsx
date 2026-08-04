import { requirePermission } from "@/lib/auth";
import { ListingCard } from "@/components/listing-card";
import {
  deleteListingAction,
  updateListingStatusAction,
} from "@/lib/actions/listings";
import {
  getModerationEntries,
  saveModerationEntryAction,
} from "@/lib/actions/moderation-workflow";
import {
  adminFlagListingTranslationAction,
  adminUpdateListingTranslationAction,
} from "@/lib/actions/translations";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentLocale } from "@/lib/i18n/server";
import { getUiTranslations } from "@/lib/i18n/ui";

type ListingTranslationItem = {
  id: string;
  language_code: string;
  translation_status: "pending" | "completed" | "failed" | "stale" | "needs_review";
  title: string;
  description: string;
  translation_quality: string | null;
};

export default async function AdminListingsPage() {
  await requirePermission("listings.view");
  const locale = await getCurrentLocale();
  const ui = getUiTranslations(locale);
  const moderationEntries = await getModerationEntries();
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

      <section className="mt-6 rounded-2xl border border-[var(--line)] bg-white p-4">
        <h2 className="font-display text-xl font-bold">Moderation workflow</h2>
        <p className="mt-1 text-sm text-[var(--ink-2)]">Track review notes and moderation state for listings and other content.</p>

        <form action={saveModerationEntryAction} className="mt-4 grid gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4 md:grid-cols-2">
          <label className="text-sm font-semibold">
            Entity type
            <input name="entity_type" defaultValue="listing" className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
          </label>
          <label className="text-sm font-semibold">
            Entity id
            <input name="entity_id" type="number" className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
          </label>
          <label className="text-sm font-semibold">
            Status
            <select name="status" defaultValue="pending" className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2">
              <option value="pending">pending</option>
              <option value="approved">approved</option>
              <option value="rejected">rejected</option>
            </select>
          </label>
          <label className="text-sm font-semibold md:col-span-2">
            Summary
            <textarea name="summary" className="mt-1 min-h-20 w-full rounded-xl border border-[var(--line)] px-3 py-2" />
          </label>
          <div className="md:col-span-2">
            <button type="submit" className="rounded-xl bg-[var(--ink-1)] px-4 py-2 text-sm font-semibold text-white">Save entry</button>
          </div>
        </form>

        <div className="mt-5 space-y-3">
          {moderationEntries.map((entry) => (
            <div key={entry.id} className="rounded-xl border border-[var(--line)] bg-white p-3">
              <p className="text-sm font-semibold">{entry.entity_type} #{entry.entity_id}</p>
              <p className="text-xs text-[var(--ink-2)]">{entry.status} · {entry.summary}</p>
            </div>
          ))}
        </div>
      </section>

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

              {(listing.listing_translations ?? []).map((translation: ListingTranslationItem) => (
                <form key={translation.id} action={adminUpdateListingTranslationAction} className="mt-3 space-y-2 rounded-lg border border-[var(--line)] bg-white p-2">
                  <input type="hidden" name="listingId" value={listing.id} />
                  <input type="hidden" name="languageCode" value={translation.language_code} />
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold">{translation.language_code}</p>
                    <select name="translationStatus" defaultValue={translation.translation_status} className="rounded border border-[var(--line)] px-2 py-1 text-xs">
                      <option value="pending">{ui.admin.pending}</option>
                      <option value="completed">{ui.admin.completedStatus}</option>
                      <option value="failed">{ui.admin.failedStatus}</option>
                      <option value="stale">{ui.admin.staleStatus}</option>
                      <option value="needs_review">{ui.admin.needsReviewStatus}</option>
                    </select>
                  </div>
                  <input name="title" defaultValue={translation.title} className="w-full rounded border border-[var(--line)] px-2 py-1 text-xs" />
                  <textarea name="description" defaultValue={translation.description} className="min-h-20 w-full rounded border border-[var(--line)] px-2 py-1 text-xs" />
                  <input name="translationQuality" defaultValue={translation.translation_quality || "manual"} className="w-full rounded border border-[var(--line)] px-2 py-1 text-xs" />
                  <div className="flex gap-2">
                    <button type="submit" className="rounded bg-[var(--ink-1)] px-2 py-1 text-xs font-semibold text-white">
                      {ui.admin.save}
                    </button>
                    <button
                      type="submit"
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
