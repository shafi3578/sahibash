import type { Message } from "@/types/database";

export type MessageThread = {
  listingId: string;
  participantId: string;
  messages: Message[];
  unreadIncomingCount: number;
  latestUnreadIncomingId: string | null;
  lastAt: string;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string) {
  return UUID_PATTERN.test(value);
}

export function normalizeMessageBody(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

export function isValidMessageBody(body: string) {
  const normalized = normalizeMessageBody(body);
  return normalized.length >= 2 && normalized.length <= 4000;
}

export function buildMessageThreads(messages: Message[], currentUserId: string): MessageThread[] {
  const grouped = new Map<string, Message[]>();

  for (const msg of messages) {
    if (!msg.listing_id || !msg.sender_user_id || !msg.recipient_user_id) {
      continue;
    }
    if (msg.sender_user_id !== currentUserId && msg.recipient_user_id !== currentUserId) {
      continue;
    }

    const otherId = msg.sender_user_id === currentUserId ? msg.recipient_user_id : msg.sender_user_id;
    const key = `${msg.listing_id}:${otherId}`;
    const list = grouped.get(key) ?? [];
    list.push(msg);
    grouped.set(key, list);
  }

  return Array.from(grouped.entries())
    .map(([key, list]) => {
      const [listingId, participantId] = key.split(":");
      const sorted = [...list].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
      const unreadIncoming = sorted.filter(
        (msg) => msg.recipient_user_id === currentUserId && msg.status === "sent",
      );
      const fallbackLastAt = new Date(0).toISOString();

      return {
        listingId,
        participantId,
        messages: sorted,
        unreadIncomingCount: unreadIncoming.length,
        latestUnreadIncomingId: unreadIncoming[unreadIncoming.length - 1]?.id ?? null,
        lastAt: sorted[sorted.length - 1]?.created_at ?? fallbackLastAt,
      };
    })
    .sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());
}
