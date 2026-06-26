import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { LOCALE_COOKIE } from "@/lib/i18n/server";
import { localizePath, normalizeLocaleInput, splitLocaleFromPath } from "@/lib/i18n/routing";

const EXCLUDED_PATH_PREFIXES = ["/api", "/_next", "/favicon.ico", "/robots.txt", "/sitemap.xml"];

function isExcludedPath(pathname: string) {
  if (EXCLUDED_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }
  return /\.[a-z0-9]+$/i.test(pathname);
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isExcludedPath(pathname)) {
    return updateSession(request);
  }

  const { locale: pathLocale, strippedPath } = splitLocaleFromPath(pathname);

  if (!pathLocale) {
    const cookieLocale = normalizeLocaleInput(request.cookies.get(LOCALE_COOKIE)?.value);
    const preferredLocale = cookieLocale ?? "fa";
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = localizePath(pathname, preferredLocale);
    redirectUrl.search = search;
    return NextResponse.redirect(redirectUrl);
  }

  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = strippedPath;
  rewriteUrl.search = search;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-sahibash-locale", pathLocale);

  const response = NextResponse.rewrite(rewriteUrl, {
    request: {
      headers: requestHeaders,
    },
  });

  response.cookies.set({
    name: LOCALE_COOKIE,
    value: pathLocale,
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  return updateSession(request, response);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
