import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { normalizeListingSchemaConfig } from "@/lib/listing-schema-config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  await requirePermission("listings.view");
  const categoryNodeId = Number(new URL(request.url).searchParams.get("categoryNodeId"));
  if (!Number.isInteger(categoryNodeId) || categoryNodeId <= 0) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("listing_schema_versions")
    .select("version,config")
    .eq("category_node_id", categoryNodeId)
    .eq("status", "published")
    .maybeSingle();
  if (error || !data) return NextResponse.json({ ok: false }, { status: 404 });

  try {
    return NextResponse.json(
      { ok: true, version: data.version, config: normalizeListingSchemaConfig(data.config) },
      { headers: { "cache-control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json({ ok: false }, { status: 422 });
  }
}
