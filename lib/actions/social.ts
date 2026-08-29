"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { createAccountNotification } from "@/lib/notifications/create";
import { getCurrentLocale } from "@/lib/i18n/server";
import { localizePath } from "@/lib/i18n/routing";

const FOLLOW_NOTIFICATION_COPY = {
  en: { title: "New follower", body: "Someone started following your seller profile." },
  fa: { title: "دنبال‌کنندهٔ تازه", body: "یک نفر صفحهٔ فروشندگی شما را دنبال کرد." },
  ps: { title: "نوی تعقیبوونکی", body: "یو کس ستاسو د پلورونکي پاڼه تعقیب کړه." },
} as const;

function validUserId(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function revalidateSellerRelationshipPaths(userId: string) {
  const locale = await getCurrentLocale();
  revalidatePath(`/sellers/${userId}`);
  revalidatePath(localizePath(`/sellers/${userId}`, locale));
  revalidatePath("/dashboard/settings/blocked-users");
  revalidatePath(localizePath("/dashboard/settings/blocked-users", locale));
}

export async function followUserAction(userId: string) {
  const user = await requireUser();
  if (!validUserId(userId) || userId === user.id) return { ok: false as const, message: "Invalid user" };
  const limit = await consumeRateLimit({ scope: "social.follow", userId: user.id, maxRequests: 30, windowSeconds: 3600 });
  if (!limit.allowed) return { ok: false as const, message: "Too many requests" };
  const supabase = await createSupabaseServerClient();
  const { data: blockedRows } = await supabase
    .from("user_blocks")
    .select("blocker_user_id")
    .or(`and(blocker_user_id.eq.${user.id},blocked_user_id.eq.${userId}),and(blocker_user_id.eq.${userId},blocked_user_id.eq.${user.id})`)
    .limit(1);
  if (blockedRows && blockedRows.length > 0) return { ok: false as const, message: "Follow unavailable" };
  const { error } = await supabase.from("user_follows").insert({ follower_user_id: user.id, following_user_id: userId });
  if (error && error.code !== "23505") return { ok: false as const, message: "Could not follow" };
  if (!error) {
    await createAccountNotification({
      userId,
      type: "system",
      copy: FOLLOW_NOTIFICATION_COPY,
      payload: { follower_user_id: user.id },
    });
  }
  await revalidateSellerRelationshipPaths(userId);
  return { ok: true as const };
}

export async function unfollowUserAction(userId: string) {
  const user = await requireUser();
  if (!validUserId(userId) || userId === user.id) return { ok: false as const, message: "Invalid user" };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("user_follows").delete().eq("follower_user_id", user.id).eq("following_user_id", userId);
  if (error) return { ok: false as const, message: "Could not unfollow" };
  await revalidateSellerRelationshipPaths(userId);
  return { ok: true as const };
}

export async function blockUserAction(userId: string) {
  const user = await requireUser();
  if (!validUserId(userId) || userId === user.id) return { ok: false as const, message: "Invalid user" };
  const limit = await consumeRateLimit({ scope: "social.block", userId: user.id, maxRequests: 20, windowSeconds: 3600 });
  if (!limit.allowed) return { ok: false as const, message: "Too many requests" };
  const supabase = await createSupabaseServerClient();
  await supabase.from("user_follows").delete().or(`and(follower_user_id.eq.${user.id},following_user_id.eq.${userId}),and(follower_user_id.eq.${userId},following_user_id.eq.${user.id})`);
  const { error } = await supabase.from("user_blocks").insert({ blocker_user_id: user.id, blocked_user_id: userId });
  if (error && error.code !== "23505") return { ok: false as const, message: "Could not block" };
  await revalidateSellerRelationshipPaths(userId);
  return { ok: true as const };
}

export async function unblockUserAction(userId: string) {
  const user = await requireUser();
  if (!validUserId(userId) || userId === user.id) return { ok: false as const, message: "Invalid user" };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("user_blocks").delete().eq("blocker_user_id", user.id).eq("blocked_user_id", userId);
  if (error) return { ok: false as const, message: "Could not unblock" };
  await revalidateSellerRelationshipPaths(userId);
  return { ok: true as const };
}

export async function unblockUserFormAction(formData: FormData) {
  await unblockUserAction(String(formData.get("userId") ?? ""));
}
