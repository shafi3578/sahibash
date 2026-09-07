"use server";

import { getCurrentUser } from "@/lib/auth";
import type { AppLocale } from "@/lib/i18n/translations";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export type SupportRequestState = {
  status: "idle" | "success" | "error";
  code?: "invalid" | "rate_limited" | "failed";
};

const SUBJECTS = new Set(["account", "listing", "safety", "payment", "technical", "other"]);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitSupportRequest(
  _previous: SupportRequestState,
  formData: FormData,
): Promise<SupportRequestState> {
  if (String(formData.get("company") ?? "").trim()) return { status: "success" };

  const user = await getCurrentUser();
  const requesterName = String(formData.get("name") ?? "").trim().slice(0, 100);
  const requesterEmail = String(user?.email ?? formData.get("email") ?? "").trim().toLowerCase().slice(0, 254);
  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").replace(/\r\n?/g, "\n").trim().slice(0, 3000);
  const requestedLocale = String(formData.get("locale") ?? "fa");
  const locale: AppLocale = requestedLocale === "en" || requestedLocale === "ps" ? requestedLocale : "fa";

  if (requesterName.length < 2 || !EMAIL_PATTERN.test(requesterEmail) || !SUBJECTS.has(subject) || message.length < 20) {
    return { status: "error", code: "invalid" };
  }

  const rateLimit = await consumeRateLimit({
    scope: "support.request",
    userId: user?.id ?? null,
    maxRequests: 5,
    windowSeconds: 60 * 60,
  });
  if (!rateLimit.allowed) return { status: "error", code: "rate_limited" };

  try {
    const supabase = createSupabaseAdmin();
    const { error } = await supabase.from("support_requests").insert({
      user_id: user?.id ?? null,
      requester_name: requesterName,
      requester_email: requesterEmail,
      subject,
      message,
      locale,
    });
    return error ? { status: "error", code: "failed" } : { status: "success" };
  } catch {
    return { status: "error", code: "failed" };
  }
}
