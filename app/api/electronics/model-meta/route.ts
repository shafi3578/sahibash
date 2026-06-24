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
  const modelId = Number(searchParams.get("modelId") ?? 0);
  const categoryId = Number(searchParams.get("categoryId") ?? 0);

  if (!modelId || !categoryId) {
    return NextResponse.json({ specs: [], options: [], config: null });
  }

  const supabase = await createSupabaseServerClient();

  const [{ data: specs }, { data: options }, { data: config }] = await Promise.all([
    supabase
      .from("electronics_model_specs")
      .select("id, spec_key, spec_label, spec_value, spec_group")
      .eq("model_id", modelId)
      .eq("is_public", true)
      .order("spec_group", { ascending: true })
      .order("spec_label", { ascending: true }),
    supabase
      .from("electronics_model_options")
      .select("id, option_type, option_value")
      .eq("model_id", modelId)
      .order("option_type", { ascending: true })
      .order("sort_order", { ascending: true }),
    supabase
      .from("posting_category_config")
      .select("requires_images, min_images, max_images, recommended_images, allow_manual_model")
      .eq("electronics_category_id", categoryId)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle(),
  ]);

  return NextResponse.json({
    specs: specs ?? [],
    options: options ?? [],
    config: (config as PostingConfig | null) ?? null,
  });
}
