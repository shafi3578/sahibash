import { splitLocaleFromPath } from "@/lib/i18n/routing";

const ADMIN_WEB_PREFIXES = ["/admin", "/administrator"] as const;

export function isAdminWebPath(pathname: string) {
  const rawPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const { strippedPath } = splitLocaleFromPath(rawPath);
  return ADMIN_WEB_PREFIXES.some((prefix) => strippedPath === prefix || strippedPath.startsWith(`${prefix}/`));
}

export function adminPath(path: string) {
  const rawPath = path.startsWith("/") ? path : `/${path}`;
  const { strippedPath } = splitLocaleFromPath(rawPath);
  return strippedPath;
}
