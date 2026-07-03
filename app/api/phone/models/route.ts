import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/phone/models?brandId=<id>&search=<query>
 * Fetch phone models for a specific brand with optional search
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId");
    const search = searchParams.get("search")?.toLowerCase();

    if (!brandId) {
      return NextResponse.json(
        { error: "brandId parameter is required" },
        { status: 400 }
      );
    }

    // Fetch models for this brand
    let query = supabase
      .from("phone_models")
      .select(
        `id, 
        model_name_en, 
        model_name_fa, 
        model_name_ps, 
        screen_size, 
        rear_camera_mp, 
        front_camera_mp, 
        operating_system, 
        release_year`
      )
      .eq("brand_id", brandId)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    const { data: models, error } = await query;

    if (error) {
      console.error("Error fetching phone models:", error);
      return NextResponse.json(
        { error: "Failed to fetch models" },
        { status: 500 }
      );
    }

    // Filter by search if provided
    let filtered = models || [];
    if (search) {
      filtered = filtered.filter((model) => {
        const nameEn = model.model_name_en.toLowerCase();
        const nameFa = (model.model_name_fa || "").toLowerCase();
        const namePs = (model.model_name_ps || "").toLowerCase();
        return nameEn.includes(search) || nameFa.includes(search) || namePs.includes(search);
      });
    }

    return NextResponse.json({
      success: true,
      data: filtered,
    });
  } catch (err) {
    console.error("Unexpected error in phone models API:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
