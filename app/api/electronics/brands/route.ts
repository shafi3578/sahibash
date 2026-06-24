import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoryId = Number(searchParams.get("categoryId") ?? 0);

  if (!categoryId) {
    return NextResponse.json({ brands: [] });
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("electronics_brands")
    .select("id, name, slug, is_popular")
    .eq("category_id", categoryId)
    .eq("is_active", true)
    .order("is_popular", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  return NextResponse.json({ brands: data ?? [] });
}
