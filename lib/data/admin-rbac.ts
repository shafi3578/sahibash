import "server-only";

import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminRoleSummary = {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  permissions: Array<{ id: number; key: string; description: string | null }>;
  user_count: number;
};

export type AdminPermissionRow = {
  id: number;
  key: string;
  description: string | null;
};

export type AdminUserRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  created_at: string;
  assigned_roles: string[];
};

export type AuditLogRow = {
  id: number;
  admin_user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  safe_changes: Record<string, unknown> | null;
  created_at: string;
};

export type SuperAdminMfaReadinessRow = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  verified_factor_count: number;
  is_ready: boolean;
};

export type RoleSummaryInput = {
  roles: Array<{
    id: number | string;
    name: string;
    description: string | null;
    created_at: string;
    updated_at: string;
  }>;
  permissions: Array<{ id: number | string; key: string; description: string | null }>;
  rolePermissions: Array<{ role_id: number | string; permission_id: number | string }>;
  userAssignments: Array<{ role_id: number | string; user_id: string }>;
};

export function buildRoleSummaryRows(input: RoleSummaryInput): AdminRoleSummary[] {
  const permissionMap = new Map<number, { id: number; key: string; description: string | null }>();
  for (const permission of input.permissions) {
    permissionMap.set(Number(permission.id), {
      id: Number(permission.id),
      key: String(permission.key),
      description: permission.description ?? null,
    });
  }

  const permissionsByRole = new Map<number, Array<{ id: number; key: string; description: string | null }>>();
  for (const match of input.rolePermissions) {
    const permission = permissionMap.get(Number(match.permission_id));
    if (!permission) continue;
    const roleId = Number(match.role_id);
    const current = permissionsByRole.get(roleId) ?? [];
    current.push(permission);
    permissionsByRole.set(roleId, current);
  }

  const userCountByRole = new Map<number, number>();
  for (const assignment of input.userAssignments) {
    const roleId = Number(assignment.role_id);
    userCountByRole.set(roleId, (userCountByRole.get(roleId) ?? 0) + 1);
  }

  return input.roles.map((role) => ({
    id: Number(role.id),
    name: String(role.name),
    description: role.description ?? null,
    created_at: String(role.created_at),
    updated_at: String(role.updated_at),
    permissions: (permissionsByRole.get(Number(role.id)) ?? []).sort((a, b) => a.key.localeCompare(b.key)),
    user_count: userCountByRole.get(Number(role.id)) ?? 0,
  }));
}

export async function getAdminRoleRows(): Promise<AdminRoleSummary[]> {
  const supabase = await createSupabaseServerClient();

  const [{ data: roles }, { data: rolePermissions }, { data: userAssignments }, { data: permissions }] = await Promise.all([
    supabase
      .from("admin_roles")
      .select("id, name, description, created_at, updated_at")
      .order("name", { ascending: true }),
    supabase.from("admin_role_permissions").select("role_id, permission_id"),
    supabase.from("admin_user_roles").select("role_id, user_id"),
    supabase.from("admin_permissions").select("id, key, description"),
  ]);

  return buildRoleSummaryRows({
    roles: (roles ?? []).map((role) => ({
      id: Number(role.id),
      name: String(role.name),
      description: role.description ?? null,
      created_at: String(role.created_at),
      updated_at: String(role.updated_at),
    })),
    permissions: (permissions ?? []).map((permission) => ({
      id: Number(permission.id),
      key: String(permission.key),
      description: permission.description ?? null,
    })),
    rolePermissions: (rolePermissions ?? []).map((match) => ({
      role_id: Number(match.role_id),
      permission_id: Number(match.permission_id),
    })),
    userAssignments: (userAssignments ?? []).map((assignment) => ({
      role_id: Number(assignment.role_id),
      user_id: String(assignment.user_id),
    })),
  });
}

export async function getAdminPermissionRows(): Promise<AdminPermissionRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("admin_permissions")
    .select("id, key, description")
    .order("key", { ascending: true });

  if (error || !data) {
    return [];
  }

  return (data as AdminPermissionRow[]).map((row) => ({
    ...row,
    description: row.description ?? null,
  }));
}

export async function getAdminUserRows(): Promise<AdminUserRow[]> {
  const supabase = await createSupabaseServerClient();

  const [{ data: users }, { data: userRoles }, { data: roles }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, role, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("admin_user_roles").select("user_id, role_id"),
    supabase.from("admin_roles").select("id, name"),
  ]);

  const roleMap = new Map<number, string>();
  for (const role of roles ?? []) {
    roleMap.set(Number(role.id), String(role.name));
  }

  const rolesByUser = new Map<string, string[]>();
  for (const assignment of userRoles ?? []) {
    const roleName = roleMap.get(Number(assignment.role_id));
    if (!roleName) continue;
    const userId = String(assignment.user_id);
    const current = rolesByUser.get(userId) ?? [];
    current.push(roleName);
    rolesByUser.set(userId, current);
  }

  return (users ?? []).map((user) => ({
    id: String(user.id),
    full_name: user.full_name ?? null,
    email: user.email ?? null,
    role: String(user.role ?? "user"),
    created_at: String(user.created_at),
    assigned_roles: rolesByUser.get(String(user.id)) ?? [],
  }));
}

export async function getAuditLogRows(
  limit = 100,
  filters?: { action?: string; entityType?: string }
): Promise<AuditLogRow[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("audit_logs")
    .select("id, admin_user_id, action, entity_type, entity_id, safe_changes, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filters?.action) {
    query = query.eq("action", filters.action);
  }

  if (filters?.entityType) {
    query = query.eq("entity_type", filters.entityType);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return (data as AuditLogRow[]).map((row) => ({
    ...row,
    safe_changes: row.safe_changes ?? null,
  }));
}

export async function getSuperAdminMfaReadinessRows(): Promise<SuperAdminMfaReadinessRow[]> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return [];
  }

  const supabase = createSupabaseAdmin();
  const { data: superRole } = await supabase
    .from("admin_roles")
    .select("id")
    .eq("name", "super_administrator")
    .maybeSingle();

  if (!superRole?.id) {
    return [];
  }

  const { data: assignments } = await supabase
    .from("admin_user_roles")
    .select("user_id")
    .eq("role_id", superRole.id);

  const userIds = Array.from(new Set((assignments ?? []).map((row) => String(row.user_id)).filter(Boolean)));
  if (userIds.length === 0) {
    return [];
  }

  const [{ data: profiles }, { data: factors }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds),
    supabase
      .schema("auth")
      .from("mfa_factors")
      .select("user_id, status")
      .in("user_id", userIds)
      .eq("status", "verified"),
  ]);

  const profileById = new Map(
    (profiles ?? []).map((profile) => [
      String(profile.id),
      {
        email: profile.email ?? null,
        full_name: profile.full_name ?? null,
      },
    ])
  );
  const factorCountByUser = new Map<string, number>();

  for (const factor of factors ?? []) {
    const userId = String(factor.user_id ?? "");
    if (!userId) continue;
    factorCountByUser.set(userId, (factorCountByUser.get(userId) ?? 0) + 1);
  }

  return userIds
    .map((userId) => {
      const verifiedFactorCount = factorCountByUser.get(userId) ?? 0;
      const profile = profileById.get(userId);

      return {
        user_id: userId,
        email: profile?.email ?? null,
        full_name: profile?.full_name ?? null,
        verified_factor_count: verifiedFactorCount,
        is_ready: verifiedFactorCount > 0,
      };
    })
    .sort((a, b) => Number(a.is_ready) - Number(b.is_ready) || (a.email ?? a.user_id).localeCompare(b.email ?? b.user_id));
}
