export type PermissionKey =
  | "categories.view"
  | "categories.create"
  | "categories.update"
  | "categories.archive"
  | "categories.publish"
  | "listing_fields.view"
  | "listing_fields.create"
  | "listing_fields.update"
  | "listing_fields.archive"
  | "listing_fields.publish"
  | "pages.view"
  | "pages.create"
  | "pages.update"
  | "pages.publish"
  | "listings.view"
  | "listings.moderate"
  | "listings.edit"
  | "listings.feature"
  | "listings.suspend"
  | "users.view"
  | "users.update"
  | "users.suspend"
  | "users.verify"
  | "translations.view"
  | "translations.update"
  | "translations.publish"
  | "search.view"
  | "search.manage"
  | "electronics.view"
  | "electronics.manage"
  | "admins.view"
  | "admins.create"
  | "admins.update"
  | "admins.disable"
  | "roles.view"
  | "roles.manage"
  | "settings.view"
  | "settings.update"
  | "settings.publish"
  | "audit_logs.view"
  | "configuration.rollback";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function hasAdminPermission(userId: string, permission: PermissionKey) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("has_admin_permission", {
    uid: userId,
    permission_key: permission,
  });

  if (error) {
    return false;
  }

  return data === true;
}
