import { NextResponse } from "next/server";
import {
  SUPPORTED_LOCALES,
  type AppLocale,
} from "@/lib/i18n/translations";
import { LOCALE_COOKIE } from "@/lib/i18n/server";
import { localizePath, normalizeLocaleInput, splitLocaleFromPath } from "@/lib/i18n/routing";

function isSupportedLocale(value: string): value is AppLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

function resolveRedirectTarget(request: Request): URL {
  const requestUrl = new URL(request.url);
  const referer = request.headers.get("referer");

  if (!referer) {
    return new URL("/", requestUrl.origin);
  }

  try {
    const refererUrl = new URL(referer);
    if (refererUrl.origin === requestUrl.origin) {
      return refererUrl;
    }
  } catch {
    // Ignore malformed referrer and fallback to home.
  }

  return new URL("/", requestUrl.origin);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const localeParam = normalizeLocaleInput(requestUrl.searchParams.get("locale"));
  const locale: AppLocale = localeParam && isSupportedLocale(localeParam) ? localeParam : "fa";

  const target = resolveRedirectTarget(request);
  const { strippedPath } = splitLocaleFromPath(target.pathname);
  target.pathname = localizePath(strippedPath, locale);

  const response = NextResponse.redirect(target);
  response.cookies.set({
    name: LOCALE_COOKIE,
    value: locale,
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  return response;
}
