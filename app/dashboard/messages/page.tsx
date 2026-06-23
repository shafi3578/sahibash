import { requireUser } from "@/lib/auth";
import { DashboardSection } from "@/components/dashboard-section";
import { getMyMessageThreads } from "@/lib/data/queries";
import { replyMessageAction } from "@/lib/actions/messages";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function MessagesPage() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  await supabase
    .from("messages")
    .update({ status: "read", read_at: new Date().toISOString() })
    .eq("recipient_user_id", user.id)
    .eq("status", "sent");

  const messages = await getMyMessageThreads(user.id);

  const grouped = new Map<string, typeof messages>();
  for (const msg of messages) {
    const otherId = msg.sender_user_id === user.id ? msg.recipient_user_id : msg.sender_user_id;
    const key = `${msg.listing_id}:${otherId}`;
    const list = grouped.get(key) ?? [];
    list.push(msg);
    grouped.set(key, list);
  }

  const threads = Array.from(grouped.entries()).map(([key, list]) => {
    const [listingId, participantId] = key.split(":");
    const sorted = [...list].sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const unreadIncoming = sorted.filter(
      (msg) => msg.recipient_user_id === user.id && msg.status === "sent"
    );
    const latestUnreadIncomingId = unreadIncoming[unreadIncoming.length - 1]?.id ?? null;

    return {
      listingId,
      participantId,
      messages: sorted,
      unreadIncomingCount: unreadIncoming.length,
      latestUnreadIncomingId,
      lastAt: sorted[sorted.length - 1]?.created_at,
    };
  }).sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());

  return (
    <DashboardSection
      currentPath="/dashboard/messages"
      title="Messages"
      description="View conversations with buyers and sellers for your listings."
    >
      {threads.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface-2)] p-5">
          <p className="font-semibold text-[var(--ink-1)]">No messages yet</p>
          <p className="mt-1 text-sm text-[var(--ink-2)]">
            Message threads will appear here when users contact you.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {threads.map((thread) => (
            <div key={`${thread.listingId}:${thread.participantId}`} className="rounded-xl border border-[var(--line)] bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-[var(--ink-2)]">Listing ID: {thread.listingId.slice(0, 8)} • Participant: {thread.participantId.slice(0, 8)}</p>
                {thread.unreadIncomingCount > 0 ? (
                  <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                    New reply ({thread.unreadIncomingCount})
                  </span>
                ) : null}
              </div>
              <div className="mt-3 space-y-2">
                {thread.messages.map((msg) => {
                  const mine = msg.sender_user_id === user.id;
                  const isLatestUnreadIncoming = msg.id === thread.latestUnreadIncomingId;
                  return (
                    <div key={msg.id} className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${mine ? "ml-auto bg-[var(--ink-1)] text-white" : "bg-[var(--surface-2)] text-[var(--ink-1)]"} ${isLatestUnreadIncoming ? "ring-2 ring-red-300" : ""}`}>
                      {!mine && isLatestUnreadIncoming ? (
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-red-700">New seller reply</p>
                      ) : null}
                      <p>{msg.body}</p>
                      <p className={`mt-1 text-[10px] ${mine ? "text-white/80" : "text-[var(--ink-2)]"}`}>
                        {new Date(msg.created_at).toLocaleString()}
                      </p>
                    </div>
                  );
                })}
              </div>
              <form action={replyMessageAction} className="mt-3 flex flex-wrap gap-2">
                <input type="hidden" name="listingId" value={thread.listingId} />
                <input type="hidden" name="recipientUserId" value={thread.participantId} />
                <input name="body" required placeholder="Type your reply..." className="flex-1 rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm" />
                <button className="rounded-lg bg-[var(--ink-1)] px-4 py-2 text-sm font-semibold text-white">Reply</button>
              </form>
            </div>
          ))}
        </div>
      )}
    </DashboardSection>
  );
}
