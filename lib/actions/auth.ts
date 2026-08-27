"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeAfghanistanPhone } from "@/lib/inventory/normalization";
import { localizePath, normalizeLocaleInput } from "@/lib/i18n/routing";

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { ok: false, message: error.message };
  }

  redirect("/");
}

export async function signUpAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? formData.get("full_name") ?? "").trim().replace(/\s+/g, " ");
  const phone = normalizeAfghanistanPhone(formData.get("phone") ?? formData.get("mobilePhone"));
  const preferredLanguage = normalizeLocaleInput(String(formData.get("preferred_language") ?? formData.get("locale") ?? "fa")) ?? "fa";

  if (fullName.length < 2 || fullName.length > 80) {
    return { ok: false, message: "Enter a valid full name." };
  }

  if (!phone.normalized) {
    return { ok: false, message: "Enter a valid Afghanistan mobile number." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone: phone.normalized,
        preferred_language: preferredLanguage,
      },
    },
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, message: "Account created. Check your email for verification link." };
}

export async function signOutAction(formData: FormData) {
  const locale = normalizeLocaleInput(String(formData.get("locale") ?? "en")) ?? "en";
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut({ scope: "local" });

  if (error) {
    throw new Error("Unable to log out. Please try again.");
  }

  redirect(localizePath("/", locale));
}

export async function resetPasswordAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const supabase = await createSupabaseServerClient();

  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/reset-password`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  if (error) {
    return;
  }
}

export async function updatePasswordAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return;
  }
}
