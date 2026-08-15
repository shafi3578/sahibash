"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, requirePermission } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function asText(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function adminCreateRoleAction(formData: FormData) {
  await requirePermission("roles.manage");
  const supabase = await createSupabaseServerClient();
  const adminUser = await getCurrentUser();

  const name = asText(formData.get("name"));
  const description = asText(formData.get("description")) || null;
  if (!name) {
    return;
  }

  const { data, error } = await supabase
    .from("admin_roles")
    .insert({ name, description })
    .select("id")
    .single();

  if (error || !data) {
    return;
  }

  if (adminUser) {
    await recordAuditEvent({
      adminUserId: adminUser.id,
      action: "ROLE_UPDATED",
      entityType: "admin_role",
      entityId: String(data.id),
      safeChanges: { name, description },
    });
  }

  revalidatePath("/admin/roles");
}

export async function adminAssignUserRoleAction(formData: FormData) {
  await requirePermission("roles.manage");
  const supabase = await createSupabaseServerClient();
  const adminUser = await getCurrentUser();

  const userId = asText(formData.get("user_id"));
  const roleId = Number(asText(formData.get("role_id")) || "0");
  if (!userId || !Number.isFinite(roleId)) {
    return;
  }

  const { error } = await supabase
    .from("admin_user_roles")
    .upsert({ user_id: userId, role_id: roleId }, { onConflict: "user_id,role_id" });

  if (error) {
    return;
  }

  if (adminUser) {
    await recordAuditEvent({
      adminUserId: adminUser.id,
      action: "ROLE_UPDATED",
      entityType: "admin_user_role",
      entityId: userId,
      safeChanges: { user_id: userId, role_id: roleId },
    });
  }

  revalidatePath("/admin/roles");
}

export async function adminAssignPermissionToRoleAction(formData: FormData) {
  await requirePermission("roles.manage");
  const supabase = await createSupabaseServerClient();
  const adminUser = await getCurrentUser();

  const roleId = Number(asText(formData.get("role_id")) || "0");
  const permissionId = Number(asText(formData.get("permission_id")) || "0");
  if (!Number.isFinite(roleId) || !Number.isFinite(permissionId)) {
    return;
  }

  const { error } = await supabase
    .from("admin_role_permissions")
    .upsert({ role_id: roleId, permission_id: permissionId }, { onConflict: "role_id,permission_id" });

  if (error) {
    return;
  }

  if (adminUser) {
    await recordAuditEvent({
      adminUserId: adminUser.id,
      action: "ROLE_UPDATED",
      entityType: "admin_role_permission",
      entityId: String(roleId),
      safeChanges: { role_id: roleId, permission_id: permissionId },
    });
  }

  revalidatePath("/admin/roles");
}

export async function adminRemovePermissionFromRoleAction(formData: FormData) {
  await requirePermission("roles.manage");
  const supabase = await createSupabaseServerClient();
  const adminUser = await getCurrentUser();

  const roleId = Number(asText(formData.get("role_id")) || "0");
  const permissionId = Number(asText(formData.get("permission_id")) || "0");
  if (!Number.isFinite(roleId) || !Number.isFinite(permissionId)) {
    return;
  }

  const { error } = await supabase
    .from("admin_role_permissions")
    .delete()
    .eq("role_id", roleId)
    .eq("permission_id", permissionId);

  if (error) {
    return;
  }

  if (adminUser) {
    await recordAuditEvent({
      adminUserId: adminUser.id,
      action: "ROLE_UPDATED",
      entityType: "admin_role_permission",
      entityId: String(roleId),
      safeChanges: { removed_permission_id: permissionId, role_id: roleId },
    });
  }

  revalidatePath("/admin/roles");
}
