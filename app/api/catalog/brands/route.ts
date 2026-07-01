import { NextRequest, NextResponse } from "next/server";
import type { BrandListResponse } from "@/lib/catalog/types";

/**
 * GET /api/catalog/brands?category=phones&subcategory=mobile-phones
 * Lazy-load available brands for a category
 */
export async function GET(req: NextRequest): Promise<NextResponse<BrandListResponse>> {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const subcategory = searchParams.get("subcategory");

    if (!category) {
      return NextResponse.json(
        { success: false, data: [], error: "Missing category parameter" },
        { status: 400 }
      );
    }

    // Import catalog dynamically based on category
    let brands: any[] = [];

    if (category === "phones") {
      // Import phone brands
      const phonesCatalog = await import("@/lib/data/catalogs/phones");
      brands = phonesCatalog.PHONE_BRANDS || [];
    } else if (category === "vehicles") {
      const vehiclesCatalog = await import("@/lib/data/catalogs/vehicles");
      brands = vehiclesCatalog.VEHICLE_BRANDS || [];
    } else if (category === "laptops") {
      const laptopsCatalog = await import("@/lib/data/catalogs/laptops");
      brands = laptopsCatalog.LAPTOP_BRANDS || [];
    } else if (category === "tv") {
      const tvCatalog = await import("@/lib/data/catalogs/tv");
      brands = tvCatalog.TV_BRANDS || [];
    } else {
      return NextResponse.json({ success: false, data: [], error: "Unknown category" }, { status: 400 });
    }

    // Filter by active status
    const activeBrands = brands.filter((b) => b.active !== false);

    return NextResponse.json({ success: true, data: activeBrands });
  } catch (error) {
    console.error("Error loading catalog brands:", error);
    return NextResponse.json(
      { success: false, data: [], error: "Failed to load brands" },
      { status: 500 }
    );
  }
}
