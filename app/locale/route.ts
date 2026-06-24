import { NextResponse } from "next/server";
import {
  SUPPORTED_LOCALES,
  type AppLocale,
} from "@/lib/i18n/translations";
import { LOCALE_COOKIE } from "@/lib/i18n/server";

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
  const localeParam = requestUrl.searchParams.get("locale")?.trim().toLowerCase();
  const locale: AppLocale = localeParam && isSupportedLocale(localeParam) ? localeParam : "en";

  const response = NextResponse.redirect(resolveRedirectTarget(request));
  response.cookies.set({
    name: LOCALE_COOKIE,
    value: locale,
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  return response;
}
