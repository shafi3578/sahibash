import type { AppLocale } from "@/lib/i18n/translations";
import { localizePath, splitLocaleFromPath } from "@/lib/i18n/routing";

export type AccountNavKey =
  | "myListings"
  | "favoriteListings"
  | "favoriteSearches"
  | "messages"
  | "questionsAnswers"
  | "offers"
  | "accountInformation"
  | "accountSecurity"
  | "settings"
  | "safety"
  | "helpCenter"
  | "privacyTerms";

export type AccountNavItem = {
  key: AccountNavKey;
  href: string;
  badge?: "messages" | "offers";
};

export const ACCOUNT_NAV_ITEMS = [
  { key: "myListings", href: "/dashboard/my-ads" },
  { key: "favoriteListings", href: "/dashboard/favorites" },
  { key: "favoriteSearches", href: "/dashboard/favorite-searches" },
  { key: "messages", href: "/dashboard/messages", badge: "messages" },
  { key: "questionsAnswers", href: "/dashboard/questions" },
  { key: "offers", href: "/dashboard/offers", badge: "offers" },
  { key: "accountInformation", href: "/dashboard/account-information" },
  { key: "accountSecurity", href: "/dashboard/account-security" },
  { key: "settings", href: "/dashboard/settings" },
  { key: "safety", href: "/dashboard/safety" },
  { key: "helpCenter", href: "/dashboard/help" },
  { key: "privacyTerms", href: "/dashboard/privacy" },
] as const satisfies readonly AccountNavItem[];

export function stripLocaleAndQuery(path: string): string {
  const [pathname] = String(path || "/").split("?");
  return splitLocaleFromPath(pathname || "/").strippedPath;
}

export function isActiveAccountPath(currentPath: string, itemHref: string): boolean {
  return stripLocaleAndQuery(currentPath) === stripLocaleAndQuery(itemHref);
}

export function localizeAccountPath(path: string, locale: AppLocale): string {
  return localizePath(path, locale);
}

export function buildLoginRedirectHref({
  targetPath,
  locale,
  reason,
}: {
  targetPath: string;
  locale: AppLocale;
  reason?: "post";
}) {
  const loginPath = localizePath("/login", locale);
  const redirectTarget = localizePath(targetPath, locale);
  const params = new URLSearchParams({ redirect: redirectTarget });
  if (reason) {
    params.set("reason", reason);
  }
  return `${loginPath}?${params.toString()}`;
}
