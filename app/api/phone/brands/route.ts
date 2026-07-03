import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/phone/brands
 * Fetch all active phone brands for the posting flow
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: brands, error } = await supabase
      .from("phone_brands")
      .select("id, name_en, name_fa, name_ps, slug, logo_url")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching phone brands:", error);
      return NextResponse.json(
        { error: "Failed to fetch brands" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: brands || [],
    });
  } catch (err) {
    console.error("Unexpected error in phone brands API:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
