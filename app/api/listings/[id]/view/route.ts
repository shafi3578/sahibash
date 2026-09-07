import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) return NextResponse.json({ ok: false }, { status: 400 });

  const user = await getCurrentUser();
  const rateLimit = await consumeRateLimit({ scope: `listing.view.${id}`, userId: user?.id ?? null, maxRequests: 60, windowSeconds: 24 * 60 * 60 });
  if (!rateLimit.allowed) return NextResponse.json({ ok: false }, { status: 429 });

  try {
    const supabase = createSupabaseAdmin();
    const { data: listing } = await supabase.from("listings").select("id,user_id,status,expires_at").eq("id", id).maybeSingle();
    if (!listing || listing.status !== "approved" || new Date(listing.expires_at).getTime() <= Date.now() || listing.user_id === user?.id) {
      return NextResponse.json({ ok: true, counted: false });
    }

    if (user) {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count } = await supabase.from("listing_views").select("id", { count: "exact", head: true }).eq("listing_id", id).eq("viewer_user_id", user.id).gte("viewed_at", since);
      if ((count ?? 0) > 0) return NextResponse.json({ ok: true, counted: false });
    }

    const { error } = await supabase.from("listing_views").insert({ listing_id: id, viewer_user_id: user?.id ?? null, viewer_ip: null, user_agent: null });
    return NextResponse.json({ ok: !error, counted: !error }, { status: error ? 500 : 200 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
