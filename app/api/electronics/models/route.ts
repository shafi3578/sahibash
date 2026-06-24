import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const brandId = Number(searchParams.get("brandId") ?? 0);

  if (!brandId) {
    return NextResponse.json({ models: [] });
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("electronics_models")
    .select("id, name, slug, release_year, is_popular")
    .eq("brand_id", brandId)
    .eq("is_active", true)
    .order("is_popular", { ascending: false })
    .order("release_year", { ascending: false })
    .order("name", { ascending: true });

  return NextResponse.json({ models: data ?? [] });
}
