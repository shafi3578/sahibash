"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeAfghanistanPhone } from "@/lib/inventory/normalization";
import { normalizeLocaleInput } from "@/lib/i18n/routing";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { consumeRateLimit } from "@/lib/security/rate-limit";

export type PhoneVerificationState = {
  status: "idle" | "sent" | "verified" | "error";
  code?: "invalid" | "unavailable" | "expired" | "rate_limited";
};

export async function updateAccountProfileAction(formData: FormData): Promise<{
  ok: boolean;
  message: string;
}> {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();

  const fullName = String(formData.get("full_name") ?? formData.get("fullName") ?? "")
    .trim()
    .replace(/\s+/g, " ");
  const phone = normalizeAfghanistanPhone(formData.get("phone"));
  const preferredLanguage = normalizeLocaleInput(String(formData.get("preferred_language") ?? ""));

  if (fullName.length < 2 || fullName.length > 80 || !/[\p{L}]/u.test(fullName)) {
    return { ok: false, message: "Enter a valid full name." };
  }

  if (!phone.normalized) {
    return { ok: false, message: "Enter a valid Afghanistan mobile number." };
  }

  const payload: Record<string, unknown> = {
    full_name: fullName,
    phone: phone.normalized,
    updated_at: new Date().toISOString(),
  };

  if (preferredLanguage) {
    payload.preferred_language = preferredLanguage;
  }

  const { error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", user.id);

  if (error) {
    return { ok: false, message: "Could not update your profile right now." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings/account");
  revalidatePath("/post-ad/create");

  return { ok: true, message: "Profile updated." };
}

export async function requestProfilePhoneVerificationAction(
  previous: PhoneVerificationState,
  formData: FormData,
): Promise<PhoneVerificationState> {
  void previous;
  void formData;
  const user = await requireUser();
  const rateLimit = await consumeRateLimit({ scope: "profile.phone_verification.request", userId: user.id, maxRequests: 3, windowSeconds: 60 * 60 });
  if (!rateLimit.allowed) return { status: "error", code: "rate_limited" };
  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("phone,phone_verification_status")
    .eq("id", user.id)
    .maybeSingle();
  const phone = normalizeAfghanistanPhone(profile?.phone).normalized;
  if (!phone) return { status: "error", code: "invalid" };
  if (profile?.phone_verification_status === "verified" && normalizeAfghanistanPhone(user.phone).normalized === phone) {
    return { status: "verified" };
  }
  const { error } = await supabase.auth.updateUser({ phone });
  if (error) return { status: "error", code: "unavailable" };
  try {
    await createSupabaseAdmin().from("profiles").update({ phone_verification_status: "pending" }).eq("id", user.id);
  } catch {
    // The Auth OTP was still sent; the verified write below remains authoritative.
  }
  return { status: "sent" };
}

export async function verifyProfilePhoneOtpAction(
  _previous: PhoneVerificationState,
  formData: FormData,
): Promise<PhoneVerificationState> {
  const user = await requireUser();
  const token = String(formData.get("token") ?? "").replace(/\D/g, "");
  if (!/^\d{6}$/.test(token)) return { status: "error", code: "invalid" };
  const rateLimit = await consumeRateLimit({ scope: "profile.phone_verification.verify", userId: user.id, maxRequests: 8, windowSeconds: 15 * 60 });
  if (!rateLimit.allowed) return { status: "error", code: "rate_limited" };
  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase.from("profiles").select("phone").eq("id", user.id).maybeSingle();
  const phone = normalizeAfghanistanPhone(profile?.phone).normalized;
  if (!phone) return { status: "error", code: "invalid" };
  const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: "phone_change" });
  const verifiedPhone = normalizeAfghanistanPhone(data.user?.phone).normalized;
  if (error || verifiedPhone !== phone || data.user?.id !== user.id) {
    return { status: "error", code: "expired" };
  }
  const { error: updateError } = await createSupabaseAdmin()
    .from("profiles")
    .update({ phone_verification_status: "verified", phone_verified_at: new Date().toISOString() })
    .eq("id", user.id)
    .eq("phone", phone);
  if (updateError) return { status: "error", code: "unavailable" };
  revalidatePath("/dashboard/settings/account");
  revalidatePath("/post-ad/create");
  return { status: "verified" };
}
