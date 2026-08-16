import type { AppLocale } from "@/lib/i18n/translations";

export const PATH_LOCALES = ["en", "fa", "ps"] as const;

export function normalizeLocaleInput(value: string | null | undefined): AppLocale | null {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === "fa-af") return "fa";
  if (normalized === "ps-af") return "ps";
  if ((PATH_LOCALES as readonly string[]).includes(normalized)) {
    return normalized as AppLocale;
  }
  return null;
}

export function splitLocaleFromPath(pathname: string): {
  locale: AppLocale | null;
  strippedPath: string;
} {
  const rawPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const segments = rawPath.split("/").filter(Boolean);
  const first = segments[0]?.toLowerCase();
  const locale = normalizeLocaleInput(first);

  if (!locale) {
    return {
      locale: null,
      strippedPath: rawPath,
    };
  }

  const remaining = segments.slice(1).join("/");
  return {
    locale,
    strippedPath: remaining ? `/${remaining}` : "/",
  };
}

export function localizePath(pathWithOptionalQuery: string, locale: AppLocale): string {
  const normalized = pathWithOptionalQuery.startsWith("/")
    ? pathWithOptionalQuery
    : `/${pathWithOptionalQuery}`;

  const [pathname, query] = normalized.split("?");
  const { strippedPath } = splitLocaleFromPath(pathname || "/");

  const localizedPathname = strippedPath === "/"
    ? `/${locale}`
    : `/${locale}${strippedPath}`;

  return query ? `${localizedPathname}?${query}` : localizedPathname;
}
