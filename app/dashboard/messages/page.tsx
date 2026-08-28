import Image from "next/image";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { DashboardSection } from "@/components/dashboard-section";
import { getMyMessageThreads } from "@/lib/data/queries";
import { replyMessageAction } from "@/lib/actions/messages";
import { reportConversationAction } from "@/lib/actions/reports";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getCurrentLocale } from "@/lib/i18n/server";
import { getUiTranslations } from "@/lib/i18n/ui";
import { formatCurrencyAmount, formatDate } from "@/lib/i18n/format";
import { localizePath } from "@/lib/i18n/routing";
import { USER_COPY } from "@/lib/i18n/user-copy";
import { buildMessageThreads, type MessageThread } from "@/lib/messages/threading";
import type { AppLocale } from "@/lib/i18n/translations";

type RawSearchParams =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

type MessageListingContext = {
  id: string;
  user_id: string | null;
  title: string | null;
  price: number | null;
  currency: string | null;
  status: string | null;
  province: string | null;
  district: string | null;
  listing_images?: Array<{
    public_url?: string | null;
    image_url?: string | null;
    is_primary?: boolean | null;
    sort_order?: number | null;
  }>;
};

const MESSAGE_COPY: Record<AppLocale, {
  conversation: string;
  selected: string;
  buyer: string;
  seller: string;
  listingUnavailable: string;
  viewListing: string;
  reportConversation: string;
  reportHelp: string;
  reportPlaceholder: string;
  submitReport: string;
  safetyNote: string;
  lastMessage: string;
}> = {
  en: {
    conversation: "Conversation",
    selected: "Selected thread",
    buyer: "Buyer",
    seller: "Seller",
    listingUnavailable: "Listing context is unavailable or removed.",
    viewListing: "View listing",
    reportConversation: "Report conversation",
    reportHelp: "Use this only for suspicious, abusive, or unsafe messages. Sahibash moderation can review the listing and conversation context.",
    reportPlaceholder: "Tell us what happened",
    submitReport: "Send report",
    safetyNote: "Never share verification codes or send advance payment before checking the item and seller safely.",
    lastMessage: "Last message",
  },
  fa: {
    conversation: "گفتگو",
    selected: "گفتگوی انتخاب‌شده",
    buyer: "خریدار",
    seller: "فروشنده",
    listingUnavailable: "معلومات اعلان در دسترس نیست یا حذف شده است.",
    viewListing: "دیدن اعلان",
    reportConversation: "گزارش گفتگو",
    reportHelp: "فقط برای پیام‌های مشکوک، توهین‌آمیز یا ناامن استفاده کنید. تیم صاحبش می‌تواند اعلان و زمینه گفتگو را بررسی کند.",
    reportPlaceholder: "بنویسید چه اتفاقی افتاد",
    submitReport: "فرستادن گزارش",
    safetyNote: "کدهای تأیید را شریک نسازید و پیش از بررسی امن جنس و فروشنده، پیش‌پرداخت نفرستید.",
    lastMessage: "آخرین پیام",
  },
  ps: {
    conversation: "خبرې اترې",
    selected: "ټاکل شوې خبرې",
    buyer: "پېرودونکی",
    seller: "پلورونکی",
    listingUnavailable: "د اعلان معلومات نشته یا لرې شوي دي.",
    viewListing: "اعلان وګورئ",
    reportConversation: "خبرې راپور کړئ",
    reportHelp: "یوازې د شکمنو، سپکوونکو یا ناامنو پیغامونو لپاره یې وکاروئ. د صاحبش ټیم اعلان او د خبرو زمینه کتلای شي.",
    reportPlaceholder: "موږ ته ووایئ څه پېښ شول",
    submitReport: "راپور ولېږئ",
    safetyNote: "د تأیید کوډونه مه شریکوئ او د توکي او پلورونکي له خوندي کتنې مخکې مخکې پیسې مه لېږئ.",
    lastMessage: "وروستی پیغام",
  },
};

function pickFirst(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function getListingImage(listing?: MessageListingContext) {
  const images = [...(listing?.listing_images ?? [])];
  images.sort(
    (a, b) =>
      Number(Boolean(b.is_primary)) - Number(Boolean(a.is_primary)) ||
      Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0),
  );
  return images[0]?.image_url ?? images[0]?.public_url ?? null;
}

function getParticipantRole({
  listing,
  thread,
  currentUserId,
  locale,
}: {
  listing?: MessageListingContext;
  thread: MessageThread;
  currentUserId: string;
  locale: AppLocale;
}) {
  const copy = MESSAGE_COPY[locale];
  if (listing?.user_id === currentUserId) return copy.buyer;
  if (listing?.user_id === thread.participantId) return copy.seller;
  return copy.conversation;
}

function getStatusLabel(status: string | null | undefined, locale: AppLocale) {
  if (!status) return "";
  const labels = USER_COPY[locale].statuses;
  return labels[status as keyof typeof labels] ?? status;
}

function ThreadListingCard({
  listing,
  locale,
}: {
  listing?: MessageListingContext;
  locale: AppLocale;
}) {
  const copy = MESSAGE_COPY[locale];
  const image = getListingImage(listing);

  if (!listing) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--surface-2)] p-4 text-sm text-[var(--ink-2)]">
        {copy.listingUnavailable}
      </div>
    );
  }

  const location = [listing.province, listing.district].filter(Boolean).join(" · ");
  const price = formatCurrencyAmount(Number(listing.price ?? 0), listing.currency ?? "AFN", locale);

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface-2)]">
      <div className="flex gap-3 p-3">
        <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-white">
          {image ? (
            <Image src={image} alt={listing.title ?? copy.viewListing} fill className="object-cover" sizes="96px" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-[var(--ink-2)]">S</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="line-clamp-2 text-sm font-bold text-[var(--ink-1)]">{listing.title}</h2>
          <p className="mt-1 text-sm font-bold text-[var(--accent)]">{price}</p>
          {location ? <p className="mt-1 line-clamp-1 text-xs text-[var(--ink-2)]">{location}</p> : null}
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-2)]">
            {getStatusLabel(listing.status, locale)}
          </p>
        </div>
      </div>
      <Link
        href={localizePath(`/listings/${listing.id}`, locale)}
        className="block border-t border-[var(--line)] bg-white px-3 py-2 text-center text-xs font-bold text-[var(--ink-1)]"
      >
        {copy.viewListing}
      </Link>
    </div>
  );
}

export default async function MessagesPage({
  searchParams = {},
}: {
  searchParams?: RawSearchParams;
}) {
  const user = await requireUser();
  const locale = await getCurrentLocale();
  const ui = getUiTranslations(locale);
  const messageCopy = MESSAGE_COPY[locale];
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdmin();
  const resolvedSearchParams = await searchParams;

  const threads = buildMessageThreads(await getMyMessageThreads(user.id), user.id);
  const listingIds = Array.from(new Set(threads.map((thread) => thread.listingId)));
  const selectedListingId = pickFirst(resolvedSearchParams.listing);
  const selectedParticipantId = pickFirst(resolvedSearchParams.participant);
  const selectedThread =
    threads.find((thread) => thread.listingId === selectedListingId && thread.participantId === selectedParticipantId) ??
    threads[0] ??
    null;

  const { data: listingRows } = listingIds.length > 0
    ? await admin
        .from("listings")
        .select("id,user_id,title,price,currency,status,province,district,listing_images(public_url,image_url,is_primary,sort_order)")
        .in("id", listingIds)
        .eq("status", "approved")
    : { data: [] };
  const listingMap = new Map(
    ((listingRows as MessageListingContext[] | null) ?? []).map((listing) => [listing.id, listing]),
  );

  const selectedUnreadMessageIds = selectedThread
    ? selectedThread.messages
        .filter((msg) => msg.recipient_user_id === user.id && msg.status === "sent")
        .map((msg) => msg.id)
    : [];

  if (selectedUnreadMessageIds.length > 0) {
    await supabase
      .from("messages")
      .update({ status: "read", read_at: new Date().toISOString() })
      .in("id", selectedUnreadMessageIds);
  }

  return (
    <DashboardSection
      currentPath="/dashboard/messages"
      title={ui.dashboard.messages}
      description={ui.dashboard.messagesDescription}
    >
      {threads.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface-2)] p-5">
          <p className="font-semibold text-[var(--ink-1)]">{ui.dashboard.noMessagesYet}</p>
          <p className="mt-1 text-sm text-[var(--ink-2)]">
            {ui.dashboard.messageThreadsAppear}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(260px,340px)_1fr]">
          <div className="space-y-2 xl:max-h-[720px] xl:overflow-y-auto xl:pe-1">
            {threads.map((thread) => {
              const listing = listingMap.get(thread.listingId);
              const active = selectedThread?.listingId === thread.listingId && selectedThread?.participantId === thread.participantId;
              const latestMessage = thread.messages[thread.messages.length - 1];
              const role = getParticipantRole({ listing, thread, currentUserId: user.id, locale });
              const href = localizePath(`/dashboard/messages?listing=${thread.listingId}&participant=${thread.participantId}`, locale);

              return (
                <Link
                  key={`${thread.listingId}:${thread.participantId}`}
                  href={href}
                  className={
                    active
                      ? "block rounded-2xl border border-[var(--ink-1)] bg-[var(--ink-1)] p-3 text-white shadow-sm"
                      : "block rounded-2xl border border-[var(--line)] bg-white p-3 shadow-sm hover:border-[var(--ink-1)]"
                  }
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className={`text-xs font-bold uppercase tracking-wide ${active ? "text-white/70" : "text-[var(--ink-2)]"}`}>
                        {role} · {thread.participantId.slice(0, 8)}
                      </p>
                      <h2 className="mt-1 line-clamp-2 text-sm font-bold">{listing?.title ?? `${ui.dashboard.listingId}: ${thread.listingId.slice(0, 8)}`}</h2>
                    </div>
                    {thread.unreadIncomingCount > 0 ? (
                      <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-bold ${active ? "bg-white text-[var(--ink-1)]" : "bg-red-100 text-red-700"}`}>
                        {thread.unreadIncomingCount}
                      </span>
                    ) : null}
                  </div>
                  {latestMessage ? (
                    <p className={`mt-2 line-clamp-2 text-xs ${active ? "text-white/80" : "text-[var(--ink-2)]"}`}>
                      {messageCopy.lastMessage}: {latestMessage.body}
                    </p>
                  ) : null}
                  <p className={`mt-2 text-[11px] ${active ? "text-white/65" : "text-[var(--ink-2)]"}`}>
                    {formatDate(thread.lastAt, locale, { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </Link>
              );
            })}
          </div>

          {selectedThread ? (
            <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-3 sm:p-4">
              <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
                <aside className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink-2)]">{messageCopy.selected}</p>
                  <ThreadListingCard listing={listingMap.get(selectedThread.listingId)} locale={locale} />
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs leading-6 text-amber-900">
                    {messageCopy.safetyNote}
                  </div>
                </aside>

                <div className="min-w-0">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink-2)]">{messageCopy.conversation}</p>
                      <h2 className="font-display text-xl font-bold text-[var(--ink-1)]">
                        {getParticipantRole({ listing: listingMap.get(selectedThread.listingId), thread: selectedThread, currentUserId: user.id, locale })}
                      </h2>
                    </div>
                    {selectedThread.unreadIncomingCount > 0 ? (
                      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                        {ui.dashboard.newReply} ({selectedThread.unreadIncomingCount})
                      </span>
                    ) : null}
                  </div>

                  <div className="max-h-[560px] space-y-2 overflow-y-auto rounded-2xl bg-white p-3">
                    {selectedThread.messages.map((msg) => {
                      const mine = msg.sender_user_id === user.id;
                      const sellerUserId = listingMap.get(selectedThread.listingId)?.user_id;
                      const sentBySeller = msg.sender_user_id === sellerUserId;
                      const isLatestUnreadIncoming = msg.id === selectedThread.latestUnreadIncomingId;
                      return (
                        <div
                          key={msg.id}
                          dir="auto"
                          className={`max-w-[86%] rounded-2xl px-3 py-2 text-sm shadow-sm ${sentBySeller ? "mr-auto bg-[var(--surface-2)] text-[var(--ink-1)]" : "ml-auto bg-[var(--ink-1)] text-white"} ${isLatestUnreadIncoming ? "ring-2 ring-red-300" : ""}`}
                        >
                          {!mine && isLatestUnreadIncoming ? (
                            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-red-700">{ui.dashboard.newSellerReply}</p>
                          ) : null}
                          <p className="whitespace-pre-wrap leading-6">{msg.body}</p>
                          <p className={`mt-1 text-[10px] ${sentBySeller ? "text-[var(--ink-2)]" : "text-white/80"}`}>
                            {formatDate(msg.created_at, locale, { dateStyle: "medium", timeStyle: "short" })}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <form action={replyMessageAction} className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                    <input type="hidden" name="listingId" value={selectedThread.listingId} />
                    <input type="hidden" name="recipientUserId" value={selectedThread.participantId} />
                    <input
                      name="body"
                      required
                      minLength={2}
                      maxLength={4000}
                      placeholder={ui.dashboard.typeReply}
                      className="min-h-12 rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm"
                    />
                    <button className="min-h-12 rounded-xl bg-[var(--ink-1)] px-5 text-sm font-bold text-white">{ui.dashboard.reply}</button>
                  </form>

                  <form action={reportConversationAction} className="mt-4 rounded-2xl border border-[var(--line)] bg-white p-3">
                    <input type="hidden" name="listingId" value={selectedThread.listingId} />
                    <input type="hidden" name="participantUserId" value={selectedThread.participantId} />
                    <p className="text-sm font-bold text-[var(--ink-1)]">{messageCopy.reportConversation}</p>
                    <p className="mt-1 text-xs leading-5 text-[var(--ink-2)]">{messageCopy.reportHelp}</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                      <input
                        name="details"
                        maxLength={500}
                        placeholder={messageCopy.reportPlaceholder}
                        className="min-h-11 rounded-xl border border-[var(--line)] px-3 text-sm"
                      />
                      <button className="min-h-11 rounded-xl border border-[var(--line)] px-4 text-sm font-bold text-[var(--ink-1)]">
                        {messageCopy.submitReport}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </section>
          ) : null}
        </div>
      )}
    </DashboardSection>
  );
}
