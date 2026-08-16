import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { updateSession } from "@/lib/supabase/middleware";
import { LOCALE_COOKIE } from "@/lib/i18n/server";
import { localizePath, normalizeLocaleInput, splitLocaleFromPath } from "@/lib/i18n/routing";
import { getSupabaseEnv, hasSupabaseEnv } from "@/lib/supabase/env";
import { isPostAdPath, isProtectedPostingPath } from "@/lib/auth/protected-routes";

const EXCLUDED_PATH_PREFIXES = ["/api", "/_next", "/favicon.ico", "/robots.txt", "/sitemap.xml"];

export function isProxyExcludedPath(pathname: string) {
  if (pathname === "/locale") {
    return true;
  }
  if (EXCLUDED_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }
  return /\.[a-z0-9]+$/i.test(pathname);
}

export function resolveProxyPath(requestUrl: string, nextPathname: string) {
  const originalPathname = new URL(requestUrl).pathname;
  const { locale: pathLocale, strippedPath } = splitLocaleFromPath(originalPathname);
  const effectivePathname = pathLocale ? strippedPath : nextPathname;

  return {
    originalPathname,
    effectivePathname,
    pathLocale,
    strippedPath,
  };
}

export function resolveBrowserLocale(acceptLanguage: string | null) {
  const requested = String(acceptLanguage ?? "").toLowerCase();
  for (const token of requested.split(",")) {
    const language = token.trim().split(";")[0];
    const locale = normalizeLocaleInput(language) ?? normalizeLocaleInput(language.split("-")[0]);
    if (locale) return locale;
  }
  return "en" as const;
}

export async function proxy(request: NextRequest) {
  const { search } = request.nextUrl;
  const { originalPathname, effectivePathname, pathLocale, strippedPath } = resolveProxyPath(request.url, request.nextUrl.pathname);

  if (isProxyExcludedPath(effectivePathname)) {
    return updateSession(request);
  }

  if (!pathLocale) {
    const cookieLocale = normalizeLocaleInput(request.cookies.get(LOCALE_COOKIE)?.value);
    const preferredLocale = cookieLocale ?? resolveBrowserLocale(request.headers.get("accept-language"));
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = localizePath(originalPathname, preferredLocale);
    redirectUrl.search = search;
    return NextResponse.redirect(redirectUrl);
  }

  const cookieLocale = normalizeLocaleInput(request.cookies.get(LOCALE_COOKIE)?.value);
  const activeLocale = pathLocale ?? cookieLocale ?? "fa";

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-sahibash-locale", activeLocale);
  requestHeaders.set("x-sahibash-path", `${originalPathname}${search}`);

  if (isProtectedPostingPath(strippedPath) && hasSupabaseEnv()) {
    const authResponse = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    const { url, anonKey } = getSupabaseEnv();
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            authResponse.cookies.set(name, value, options);
          });
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = localizePath("/login", activeLocale);
      loginUrl.searchParams.set("redirect", localizePath(`${strippedPath}${search || ""}`, activeLocale));
      if (isPostAdPath(strippedPath)) {
        loginUrl.searchParams.set("reason", "post");
      }
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set("x-sahibash-locale", activeLocale);

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
