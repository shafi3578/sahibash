import { splitLocaleFromPath } from "@/lib/i18n/routing";

const ADMIN_WEB_PREFIXES = ["/admin", "/administrator"] as const;
const ADMIN_API_PREFIX = "/api/admin";
const ADMIN_CONTROL_HOSTS = new Set(["sahibash.com", "www.sahibash.com"]);
const LOCAL_DEVELOPMENT_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function isAdminWebPath(pathname: string) {
  const rawPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const { strippedPath } = splitLocaleFromPath(rawPath);
  return ADMIN_WEB_PREFIXES.some((prefix) => strippedPath === prefix || strippedPath.startsWith(`${prefix}/`));
}

export function isAdminApiPath(pathname: string) {
  const rawPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return rawPath === ADMIN_API_PREFIX || rawPath.startsWith(`${ADMIN_API_PREFIX}/`);
}

export function isAdminControlHost(hostname: string) {
  const normalizedHost = String(hostname || "").trim().toLowerCase().replace(/\.$/, "");
  if (ADMIN_CONTROL_HOSTS.has(normalizedHost)) return true;
  return process.env.NODE_ENV !== "production" && LOCAL_DEVELOPMENT_HOSTS.has(normalizedHost);
}

export function adminPath(path: string) {
  const rawPath = path.startsWith("/") ? path : `/${path}`;
  const { strippedPath } = splitLocaleFromPath(rawPath);
  return strippedPath;
}
