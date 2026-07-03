import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/phone/fields?os=iOS
 * Fetch seller-selectable fields for a specific operating system
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const os = searchParams.get("os");

    if (!os || !["iOS", "Android", "HarmonyOS"].includes(os)) {
      return NextResponse.json(
        { error: "Valid os parameter is required (iOS, Android, or HarmonyOS)" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    const { data: fields, error } = await supabase
      .from("phone_selectable_fields")
      .select("*")
      .eq("applies_to_os", os)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching phone fields:", error);
      return NextResponse.json(
        { error: "Failed to fetch fields" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: fields || [],
    });
  } catch (err) {
    console.error("Unexpected error in phone fields API:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
