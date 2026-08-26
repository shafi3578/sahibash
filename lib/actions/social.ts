"use server";

import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { consumeRateLimit } from "@/lib/security/rate-limit";

function validUserId(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function followUserAction(userId: string) {
  const user = await requireUser();
  if (!validUserId(userId) || userId === user.id) return { ok: false as const, message: "Invalid user" };
  const limit = await consumeRateLimit({ scope: "social.follow", userId: user.id, maxRequests: 30, windowSeconds: 3600 });
  if (!limit.allowed) return { ok: false as const, message: "Too many requests" };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("user_follows").insert({ follower_user_id: user.id, following_user_id: userId });
  return error && error.code !== "23505" ? { ok: false as const, message: "Could not follow" } : { ok: true as const };
}

export async function unfollowUserAction(userId: string) {
  const user = await requireUser();
  if (!validUserId(userId) || userId === user.id) return { ok: false as const, message: "Invalid user" };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("user_follows").delete().eq("follower_user_id", user.id).eq("following_user_id", userId);
  return error ? { ok: false as const, message: "Could not unfollow" } : { ok: true as const };
}

export async function blockUserAction(userId: string) {
  const user = await requireUser();
  if (!validUserId(userId) || userId === user.id) return { ok: false as const, message: "Invalid user" };
  const limit = await consumeRateLimit({ scope: "social.block", userId: user.id, maxRequests: 20, windowSeconds: 3600 });
  if (!limit.allowed) return { ok: false as const, message: "Too many requests" };
  const supabase = await createSupabaseServerClient();
  await supabase.from("user_follows").delete().or(`and(follower_user_id.eq.${user.id},following_user_id.eq.${userId}),and(follower_user_id.eq.${userId},following_user_id.eq.${user.id})`);
  const { error } = await supabase.from("user_blocks").insert({ blocker_user_id: user.id, blocked_user_id: userId });
  return error && error.code !== "23505" ? { ok: false as const, message: "Could not block" } : { ok: true as const };
}

export async function unblockUserAction(userId: string) {
  const user = await requireUser();
  if (!validUserId(userId) || userId === user.id) return { ok: false as const, message: "Invalid user" };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("user_blocks").delete().eq("blocker_user_id", user.id).eq("blocked_user_id", userId);
  return error ? { ok: false as const, message: "Could not unblock" } : { ok: true as const };
}
