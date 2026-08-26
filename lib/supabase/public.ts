import "server-only";

import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabase/env";

/**
 * Anonymous server-side client for public, cacheable reads.
 *
 * This deliberately does not read request cookies or persist sessions, so it is
 * safe to use inside shared public-data caches. It still uses the anon role and
 * Supabase RLS; never use it for owner/admin/private reads.
 */
export const createSupabasePublicServerClient = cache(() => {
  const { url, anonKey } = getSupabaseEnv();

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
    global: {
      headers: {
        "x-application-name": "sahibash-public-cache",
      },
    },
  });
});
