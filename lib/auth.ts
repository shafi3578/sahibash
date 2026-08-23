import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentLocale } from "@/lib/i18n/server";
import { localizePath, normalizeLocaleInput } from "@/lib/i18n/routing";
import { requiresStepUpAuth } from "@/lib/auth/step-up";
import type { PermissionKey } from "@/lib/authorization";
import { isPostAdPath } from "@/lib/auth/protected-routes";
import { buildLoginRedirectHref, stripLocaleAndQuery } from "@/lib/account/navigation";

type UserRole = "user" | "admin";

type ProfileRow = {
  role: UserRole;
};

async function getCurrentPath() {
  try {
    const headerStore = await headers();
    const requestPath =
      headerStore.get("x-sahibash-path") ??
      headerStore.get("x-invoke-path") ??
      headerStore.get("x-path") ??
      null;

    if (requestPath) {
      return requestPath;
    }

    const requestUrl =
      headerStore.get("x-forwarded-url") ??
      headerStore.get("x-url") ??
      headerStore.get("referer");

    if (requestUrl) {
      try {
        const url = new URL(requestUrl, "http://localhost");
        return `${url.pathname}${url.search}`;
      } catch {
        // Ignore malformed URL values and fall back to the fallback path.
      }
    }

    return null;
  } catch {
    return null;
  }
}

function buildLoginRedirectPath(pathname: string | null, locale: string) {
  const normalizedLocale = normalizeLocaleInput(locale) ?? "fa";
  const targetPath = pathname && pathname !== "/" ? pathname : "/dashboard";
  const strippedTarget = stripLocaleAndQuery(targetPath);
  return buildLoginRedirectHref({
    targetPath,
    locale: normalizedLocale,
    reason: isPostAdPath(strippedTarget) ? "post" : undefined,
  });
}

async function redirectToAccount(reason?: "security") {
  const locale = await getCurrentLocale();
  redirect(localizePath(reason ? `/dashboard?reason=${reason}` : "/dashboard", locale));
}

export async function getCurrentUser() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

export async function getCurrentUserProfile() {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || !data) return null;
  return data as ProfileRow;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    const locale = await getCurrentLocale();
    const pathname = await getCurrentPath();
    redirect(buildLoginRedirectPath(pathname, locale));
  }
  return user;
}

async function getConfiguredStepUpWindowMinutes() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("step_up_window_minutes")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    return 15;
  }

  const parsed = Number((data as { step_up_window_minutes?: unknown }).step_up_window_minutes ?? 15);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 15;
}

export async function requirePermission(permission: PermissionKey) {
  const user = await requireUser();
  const stepUpWindowMinutes = await getConfiguredStepUpWindowMinutes();
  if (requiresStepUpAuth(user as Parameters<typeof requiresStepUpAuth>[0], stepUpWindowMinutes * 60 * 1000)) {
    await redirectToAccount("security");
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("has_admin_permission", {
    uid: user.id,
    permission_key: permission,
  });

  if (error || data !== true) {
    await redirectToAccount();
  }

  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  const stepUpWindowMinutes = await getConfiguredStepUpWindowMinutes();
  if (requiresStepUpAuth(user as Parameters<typeof requiresStepUpAuth>[0], stepUpWindowMinutes * 60 * 1000)) {
    await redirectToAccount("security");
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("is_admin", {
    uid: user.id,
  });

  if (error || data !== true) {
    await redirectToAccount();
  }

  return user;
}

export async function requireSuperAdministrator() {
  const user = await requireUser();
  const stepUpWindowMinutes = await getConfiguredStepUpWindowMinutes();
  if (requiresStepUpAuth(user as Parameters<typeof requiresStepUpAuth>[0], stepUpWindowMinutes * 60 * 1000)) {
    await redirectToAccount("security");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("is_super_administrator", {
    uid: user.id,
  });

  if (error || data !== true) {
    await redirectToAccount();
  }

  return user;
}
