import { NextResponse } from "next/server";
import { normalizeListingSchemaConfig } from "@/lib/listing-schema-config";
import { createSupabasePublicServerClient } from "@/lib/supabase/public";

export async function GET(request: Request) {
  const categoryNodeId = Number(new URL(request.url).searchParams.get("categoryNodeId"));
  if (!Number.isInteger(categoryNodeId) || categoryNodeId <= 0) {
    return NextResponse.json({ ok: false, error: "invalid_category" }, { status: 400 });
  }

  const supabase = createSupabasePublicServerClient();
  const [{ data: node, error: nodeError }, { data: schema, error: schemaError }] = await Promise.all([
    supabase
      .from("category_nodes")
      .select("id,is_active")
      .eq("id", categoryNodeId)
      .eq("is_active", true)
      .maybeSingle(),
    supabase
      .from("listing_schema_versions")
      .select("version,config")
      .eq("category_node_id", categoryNodeId)
      .eq("status", "published")
      .maybeSingle(),
  ]);

  if (nodeError || schemaError || !node || !schema) {
    return NextResponse.json({ ok: false, error: "schema_unavailable" }, { status: 404 });
  }

  try {
    return NextResponse.json(
      { ok: true, version: schema.version, config: normalizeListingSchemaConfig(schema.config) },
      { headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=3600" } },
    );
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_schema" }, { status: 422 });
  }
}
