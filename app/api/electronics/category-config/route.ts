import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PostingConfig = {
  requires_images: boolean;
  min_images: number;
  max_images: number;
  recommended_images: string | null;
  allow_manual_model: boolean;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoryId = Number(searchParams.get("categoryId") ?? 0);

  if (!categoryId) {
    return NextResponse.json({ config: null });
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("posting_category_config")
    .select("requires_images, min_images, max_images, recommended_images, allow_manual_model")
    .eq("electronics_category_id", categoryId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ config: (data as PostingConfig | null) ?? null });
}
