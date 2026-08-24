import type { PermissionKey } from "@/lib/authorization";

export type AuthenticatorAssuranceLevel = "aal1" | "aal2" | string | null | undefined;

const PRIVILEGED_READ_ONLY_PERMISSIONS = new Set<PermissionKey>([
  "roles.view",
  "admins.view",
  "users.view",
  "listings.view",
  "categories.view",
  "electronics.view",
  "audit_logs.view",
  "search.view",
  "pages.view",
]);

export function requiresPrivilegedMfa(permission: PermissionKey) {
  return !permission.endsWith(".view") && !PRIVILEGED_READ_ONLY_PERMISSIONS.has(permission);
}

export function hasVerifiedAuthenticatorAssurance(currentLevel: AuthenticatorAssuranceLevel) {
  return currentLevel === "aal2";
}

export function canUseAdminPermissionWithAssurance({
  permission,
  hasPermission,
  currentLevel,
}: {
  permission: PermissionKey;
  hasPermission: boolean;
  currentLevel: AuthenticatorAssuranceLevel;
}) {
  if (!hasPermission) return false;
  if (!requiresPrivilegedMfa(permission)) return true;
  return hasVerifiedAuthenticatorAssurance(currentLevel);
}
