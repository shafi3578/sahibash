import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv, hasSupabaseEnv } from "@/lib/supabase/env";

function hasSupabaseAuthCookie(request: NextRequest) {
  return request.cookies.getAll().some((cookie) =>
    cookie.value &&
    cookie.name.startsWith("sb-") &&
    cookie.name.includes("auth-token")
  );
}

export async function updateSession(
  request: NextRequest,
  response: NextResponse = NextResponse.next({ request })
) {

  if (!hasSupabaseEnv()) {
    return response;
  }

  if (!hasSupabaseAuthCookie(request)) {
    return response;
  }

  const { url, anonKey } = getSupabaseEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  await supabase.auth.getUser();
  return response;
}
