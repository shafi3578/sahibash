"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabasePublicServerClient } from "@/lib/supabase/public";
import { PUBLIC_CACHE_TAGS, revalidatePublicChromeCache } from "@/lib/cache/public-cache";
import { unstable_cache } from "next/cache";
import {
  normalizeSiteSettings,
  resolvePublicSiteSettings,
  resolveSiteSettingsVersionSnapshot,
  type SiteSettingsVersionRecord,
} from "@/lib/data/site-settings";

export async function saveSiteSettingsAction(formData: FormData) {
  const user = await requirePermission("settings.update");

  const supabase = await createSupabaseServerClient();
  const payload = normalizeSiteSettings({
    site_name: formData.get("site_name"),
    site_tagline: formData.get("site_tagline"),
    contact_email: formData.get("contact_email"),
    contact_phone: formData.get("contact_phone"),
    default_locale: formData.get("default_locale"),
    home_hero_title: formData.get("home_hero_title"),
    home_hero_subtitle: formData.get("home_hero_subtitle"),
    home_primary_cta_label: formData.get("home_primary_cta_label"),
    home_primary_cta_path: formData.get("home_primary_cta_path"),
    home_secondary_cta_label: formData.get("home_secondary_cta_label"),
    home_secondary_cta_path: formData.get("home_secondary_cta_path"),
    navigation_links: formData.get("navigation_links"),
    step_up_window_minutes: formData.get("step_up_window_minutes"),
  });
  const changeSummary = typeof formData.get("change_summary") === "string"
    ? formData.get("change_summary")?.toString().trim() ?? ""
    : "";

  const { data, error } = await supabase.rpc("save_site_settings", {
    payload,
    change_summary: changeSummary,
    editor_id: user.id,
  });

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to save site settings.");
  }

  await recordAuditEvent({
    adminUserId: user.id,
    action: "SETTING_CHANGED",
    entityType: "site_settings",
    entityId: "1",
    safeChanges: { ...payload, change_summary: changeSummary || null },
  });

  revalidatePublicChromeCache();
  revalidatePath("/administrator/settings");
  revalidatePath("/administrator");
  redirect("/administrator");
}

export async function restoreSiteSettingsVersionAction(formData: FormData) {
  const user = await requirePermission("settings.publish");
  const versionId = Number(formData.get("version_id"));
  const changeSummary = typeof formData.get("change_summary") === "string"
    ? formData.get("change_summary")?.toString().trim() ?? ""
    : "";

  if (!Number.isInteger(versionId) || versionId <= 0) {
    throw new Error("Invalid site settings version.");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("restore_site_settings_version", {
    version_row_id: versionId,
    change_summary: changeSummary,
    editor_id: user.id,
  });

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to restore site settings version.");
  }

  await recordAuditEvent({
    adminUserId: user.id,
    action: "CONFIGURATION_ROLLED_BACK",
    entityType: "site_settings_versions",
    entityId: String(versionId),
    safeChanges: { version_id: versionId, change_summary: changeSummary || null },
  });

  revalidatePublicChromeCache();
  revalidatePath("/administrator/settings");
  revalidatePath("/administrator");
  redirect("/administrator/settings");
}

const getCachedSiteSettingsRow = unstable_cache(
  async () => {
    const supabase = createSupabasePublicServerClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("id, site_name, site_tagline, contact_email, contact_phone, default_locale, home_hero_title, home_hero_subtitle, home_primary_cta_label, home_primary_cta_path, home_secondary_cta_label, home_secondary_cta_path, navigation_links, step_up_window_minutes, updated_at")
      .eq("id", 1)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  },
  ["sahibash-site-settings"],
  {
    revalidate: 3600,
    tags: [PUBLIC_CACHE_TAGS.siteSettings],
  }
);

export async function getSiteSettings() {
  const data = await getCachedSiteSettingsRow();

  if (!data) {
    return {
      ...resolvePublicSiteSettings(),
      updated_at: null,
    };
  }

  return {
    ...resolvePublicSiteSettings(data),
    updated_at: data.updated_at ?? null,
  };
}

export async function getSiteSettingsVersions(): Promise<SiteSettingsVersionRecord[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("site_settings_versions")
    .select("id, version_number, change_summary, settings_snapshot, created_by, created_at, published_at")
    .eq("site_settings_id", 1)
    .order("version_number", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((row) => {
    const snapshot = resolveSiteSettingsVersionSnapshot((row.settings_snapshot as Record<string, unknown>) ?? {});

    return {
      id: row.id,
      version_number: row.version_number,
      change_summary: row.change_summary ?? null,
      created_by: row.created_by ?? null,
      created_at: row.created_at,
      published_at: row.published_at ?? null,
      ...snapshot,
    };
  });
}
