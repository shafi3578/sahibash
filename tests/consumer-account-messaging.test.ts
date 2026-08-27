import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ACCOUNT_NAV_ITEMS,
  buildLoginRedirectHref,
  isActiveAccountPath,
  localizeAccountPath,
  stripLocaleAndQuery,
} from "@/lib/account/navigation";
import { adminPath, isAdminWebPath } from "@/lib/admin/routing";
import {
  buildMessageThreads,
  isUuid,
  isValidMessageBody,
  normalizeMessageBody,
} from "@/lib/messages/threading";
import type { Message } from "@/types/database";
import { notificationDestination } from "@/lib/notifications/destination";

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

test("consumer account navigation has no admin entry points", () => {
  const hrefs = ACCOUNT_NAV_ITEMS.map((item) => item.href);
  assert.ok(hrefs.includes("/dashboard/safety"));
  assert.ok(hrefs.includes("/dashboard/settings"));
  assert.equal(hrefs.some((href) => href.startsWith("/admin") || href.startsWith("/administrator")), false);
});

test("social safety actions and messaging enforce block boundaries", () => {
  const social = readFileSync(join(process.cwd(), "lib", "actions", "social.ts"), "utf8");
  const messages = readFileSync(join(process.cwd(), "lib", "actions", "messages.ts"), "utf8");
  const boundaryMigration = readFileSync(join(process.cwd(), "supabase", "migrations", "20260826212316_enforce_social_block_boundaries.sql"), "utf8");
  assert.match(social, /followUserAction/);
  assert.match(social, /blockUserAction/);
  assert.match(social, /user_blocks/);
  assert.match(messages, /user_blocks/);
  assert.match(boundaryMigration, /before insert on public\.messages/);
  assert.match(boundaryMigration, /before insert on public\.user_follows/);
  assert.match(boundaryMigration, /security definer/);
  assert.match(boundaryMigration, /revoke all on function public\.enforce_message_block_boundary/);
});

test("public seller profiles and notification center are localized account surfaces", () => {
  const seller = readFileSync(join(process.cwd(), "app", "sellers", "[id]", "page.tsx"), "utf8");
  const notifications = readFileSync(join(process.cwd(), "app", "dashboard", "notifications", "page.tsx"), "utf8");
  const header = readFileSync(join(process.cwd(), "components", "auth-aware-header-actions.tsx"), "utf8");
  const messageActions = readFileSync(join(process.cwd(), "lib", "actions", "messages.ts"), "utf8");
  const notificationWriter = readFileSync(join(process.cwd(), "lib", "notifications", "create.ts"), "utf8");
  const messagesPage = readFileSync(join(process.cwd(), "app", "dashboard", "messages", "page.tsx"), "utf8");
  const blockedUsers = readFileSync(join(process.cwd(), "app", "dashboard", "settings", "blocked-users", "page.tsx"), "utf8");
  const blockButton = readFileSync(join(process.cwd(), "components", "social", "block-user-button.tsx"), "utf8");
  assert.match(seller, /status", "approved"/);
  assert.match(seller, /createSupabaseAdmin/);
  assert.doesNotMatch(seller, /contact_phone|latitude|longitude|address_text/);
  assert.match(seller, /followUserAction/);
  assert.match(seller, /BlockUserButton/);
  assert.match(blockButton, /blockUserAction/);
  assert.match(notifications, /markAllNotificationsReadAction/);
  assert.match(header, /dashboard\/notifications/);
  assert.match(header, /postgres_changes/);
  assert.match(messageActions, /createAccountNotification/);
  assert.match(notificationWriter, /createSupabaseAdmin/);
  assert.match(notificationWriter, /new_messages/);
  assert.match(notifications, /openNotificationAction/);
  assert.match(notifications, /bg-red-600/);
  assert.match(messagesPage, /sentBySeller \? "mr-auto/);
  assert.match(messagesPage, /"ml-auto bg-\[var\(--ink-1\)\]/);
  assert.match(blockedUsers, /unblockUserFormAction/);
});

test("notification destinations preserve message, offer, follower and listing context", () => {
  assert.equal(
    notificationDestination({ listing_id: "listing", sender_user_id: "sender", offer_id: "offer" }),
    "/dashboard/messages?listing=listing&participant=sender",
  );
  assert.equal(notificationDestination({ listing_id: "listing", offer_id: "offer" }), "/dashboard/offers");
  assert.equal(notificationDestination({ follower_user_id: "seller" }), "/sellers/seller");
  assert.equal(notificationDestination({ listing_id: "listing" }), "/listings/listing");
});

test("favorites, offers and follows create account notifications after successful writes", () => {
  const favorites = readFileSync(join(process.cwd(), "lib", "actions", "favorites.ts"), "utf8");
  const offers = readFileSync(join(process.cwd(), "lib", "actions", "offers.ts"), "utf8");
  const social = readFileSync(join(process.cwd(), "lib", "actions", "social.ts"), "utf8");
  const notificationActions = readFileSync(join(process.cwd(), "lib", "actions", "notifications.ts"), "utf8");
  assert.match(favorites, /createAccountNotification/);
  assert.match(offers, /type: "listing_offer"/);
  assert.match(social, /createAccountNotification/);
  assert.match(notificationActions, /\.eq\("user_id", user\.id\)/);
  assert.match(notificationActions, /notificationDestination/);
});

test("admin routes stay web-only and are stripped from localized consumer paths", () => {
  assert.equal(isAdminWebPath("/admin"), true);
  assert.equal(isAdminWebPath("/admin/listings"), true);
  assert.equal(isAdminWebPath("/fa/admin/listings"), true);
  assert.equal(isAdminWebPath("/ps/administrator/settings"), true);
  assert.equal(isAdminWebPath("/dashboard/admin"), false);
  assert.equal(adminPath("/fa/admin/listings"), "/admin/listings");
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

test("localized catch-all exposes account subpages without embedding admin pages", () => {
  const source = readFileSync(join(process.cwd(), "app", "[locale]", "[...slug]", "page.tsx"), "utf8");
  assert.match(source, /DashboardSettingsLanguagePage/);
  assert.match(source, /DashboardSettingsNotificationsPage/);
  assert.match(source, /DashboardSettingsAccountPage/);
  assert.match(source, /DashboardSafetyPage/);
  assert.doesNotMatch(source, /@\/app\/admin\//);
  assert.doesNotMatch(source, /@\/app\/administrator\//);
});

test("consumer header and messages keep settings and moderation in the right places", () => {
  const headerSource = readFileSync(join(process.cwd(), "components", "site-header.tsx"), "utf8");
  const messagesSource = readFileSync(join(process.cwd(), "app", "dashboard", "messages", "page.tsx"), "utf8");
  const reportSource = readFileSync(join(process.cwd(), "lib", "actions", "reports.ts"), "utf8");

  assert.doesNotMatch(headerSource, /LanguageSwitcher/);
  assert.doesNotMatch(headerSource, /admin|administrator/i);
  assert.match(messagesSource, /ThreadListingCard/);
  assert.match(messagesSource, /reportConversationAction/);
  assert.match(reportSource, /reporter_user_id/);
  assert.doesNotMatch(reportSource, /(^|\n)\s*user_id:\s*user\.id/);
});
