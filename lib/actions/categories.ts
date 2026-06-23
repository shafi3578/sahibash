"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export async function joinCategoryWaitlistAction(input: {
  categorySlug: string;
  email?: string;
}): Promise<{ ok: boolean; message: string }> {
  const supabase = await createSupabaseServerClient();
  const user = await getCurrentUser();

  const normalizedSlug = input.categorySlug.trim().toLowerCase();
  const normalizedEmail = (input.email ?? user?.email ?? "").trim().toLowerCase();

  if (!normalizedSlug) {
    return { ok: false, message: "Category is required." };
  }

  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return { ok: false, message: "Please enter a valid email address." };
  }

  const lifecycleCategory = await supabase
    .from("categories")
    .select("id, name, is_active, is_coming_soon")
    .eq("slug", normalizedSlug)
    .maybeSingle();

  let category: { id: number; name: string; is_active: boolean; is_coming_soon: boolean } | null = null;

  if (!lifecycleCategory.error && lifecycleCategory.data) {
    const row = lifecycleCategory.data as Record<string, unknown>;
    category = {
      id: Number(row.id),
      name: String(row.name),
      is_active: Boolean(row.is_active),
      is_coming_soon: Boolean(row.is_coming_soon),
    };
  } else {
    const fallbackCategory = await supabase
      .from("categories")
      .select("id, name, is_active")
      .eq("slug", normalizedSlug)
      .maybeSingle();

    if (fallbackCategory.error || !fallbackCategory.data) {
      return { ok: false, message: "Category not found." };
    }

    const row = fallbackCategory.data as Record<string, unknown>;
    category = {
      id: Number(row.id),
      name: String(row.name),
      is_active: Boolean(row.is_active),
      is_coming_soon: true,
    };
  }

  if (!category.is_active) {
    return { ok: false, message: "Category is not available." };
  }

  if (!category.is_coming_soon) {
    return { ok: false, message: "This category is already available." };
  }

  if (user?.id) {
    const { data: existingByUser } = await supabase
      .from("category_waitlists")
      .select("id")
      .eq("category_id", category.id)
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (existingByUser) {
      return { ok: true, message: "You are already on the waitlist for this category." };
    }
  }

  const { data: existingByEmail } = await supabase
    .from("category_waitlists")
    .select("id")
    .eq("category_id", category.id)
    .eq("email", normalizedEmail)
    .limit(1)
    .maybeSingle();

  if (existingByEmail) {
    return { ok: true, message: "You are already on the waitlist for this category." };
  }

  const { error } = await supabase
    .from("category_waitlists")
    .insert({
      category_id: category.id,
      user_id: user?.id ?? null,
      email: normalizedEmail,
    });

  if (error) {
    return { ok: false, message: "Could not join waitlist right now. Please try again." };
  }

  return {
    ok: true,
    message: `You are on the waitlist for ${category.name}. We will notify you when it launches.`,
  };
}
