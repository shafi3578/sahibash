import test from "node:test";
import assert from "node:assert/strict";
import {
  buildLoginRedirectHref,
  isActiveAccountPath,
  localizeAccountPath,
  stripLocaleAndQuery,
} from "@/lib/account/navigation";
import {
  buildMessageThreads,
  isUuid,
  isValidMessageBody,
  normalizeMessageBody,
} from "@/lib/messages/threading";
import type { Message } from "@/types/database";

function message(overrides: Partial<Message>): Message {
  const base: Message = {
    id: "11111111-1111-4111-8111-111111111111",
    listing_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    sender_user_id: "22222222-2222-4222-8222-222222222222",
    recipient_user_id: "33333333-3333-4333-8333-333333333333",
    body: "hello",
    status: "sent",
    read_at: null,
    deleted_by_sender: false,
    deleted_by_recipient: false,
    created_at: "2026-08-24T08:00:00.000Z",
  };

  return { ...base, ...overrides };
}

test("account navigation localizes dashboard links and detects active localized paths", () => {
  assert.equal(localizeAccountPath("/dashboard/messages", "fa"), "/fa/dashboard/messages");
  assert.equal(localizeAccountPath("/dashboard/settings", "ps"), "/ps/dashboard/settings");
  assert.equal(stripLocaleAndQuery("/en/dashboard/messages?compose=1"), "/dashboard/messages");
  assert.equal(isActiveAccountPath("/fa/dashboard/messages?thread=abc", "/dashboard/messages"), true);
  assert.equal(isActiveAccountPath("/ps/dashboard/settings", "/dashboard/messages"), false);
});

test("login redirect helper keeps account redirects separate from posting intent", () => {
  assert.equal(
    buildLoginRedirectHref({ targetPath: "/dashboard/messages", locale: "en" }),
    "/en/login?redirect=%2Fen%2Fdashboard%2Fmessages",
  );
  assert.equal(
    buildLoginRedirectHref({ targetPath: "/post-ad/create?posting=sell", locale: "fa", reason: "post" }),
    "/fa/login?redirect=%2Ffa%2Fpost-ad%2Fcreate%3Fposting%3Dsell&reason=post",
  );
});

test("message body validation normalizes whitespace and enforces useful bounds", () => {
  assert.equal(normalizeMessageBody("  Salam\n\n  sahib   "), "Salam sahib");
  assert.equal(isValidMessageBody("a"), false);
  assert.equal(isValidMessageBody("valid message"), true);
  assert.equal(isValidMessageBody("x".repeat(4001)), false);
  assert.equal(isUuid("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"), true);
  assert.equal(isUuid("not-a-uuid"), false);
});

test("message threads group by listing and participant with unread counts", () => {
  const currentUserId = "33333333-3333-4333-8333-333333333333";
  const otherUserId = "22222222-2222-4222-8222-222222222222";
  const secondUserId = "44444444-4444-4444-8444-444444444444";
  const listingId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

  const threads = buildMessageThreads(
    [
      message({
        id: "11111111-1111-4111-8111-111111111111",
        sender_user_id: otherUserId,
        recipient_user_id: currentUserId,
        created_at: "2026-08-24T08:00:00.000Z",
      }),
      message({
        id: "11111111-1111-4111-8111-111111111112",
        sender_user_id: currentUserId,
        recipient_user_id: otherUserId,
        created_at: "2026-08-24T08:05:00.000Z",
      }),
      message({
        id: "11111111-1111-4111-8111-111111111113",
        sender_user_id: secondUserId,
        recipient_user_id: currentUserId,
        created_at: "2026-08-24T09:00:00.000Z",
      }),
    ],
    currentUserId,
  );

  assert.equal(threads.length, 2);
  assert.equal(threads[0].participantId, secondUserId);
  assert.equal(threads[0].unreadIncomingCount, 1);
  assert.equal(threads[1].listingId, listingId);
  assert.equal(threads[1].participantId, otherUserId);
  assert.equal(threads[1].messages.length, 2);
  assert.equal(threads[1].latestUnreadIncomingId, "11111111-1111-4111-8111-111111111111");
});
