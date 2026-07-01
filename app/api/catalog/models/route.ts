import { NextRequest, NextResponse } from "next/server";
import type { ModelListResponse, ModelDetailResponse } from "@/lib/catalog/types";

/**
 * GET /api/catalog/models?category=phones&brandId=apple
 * Lazy-load models for a specific brand
 */
export async function GET(req: NextRequest): Promise<NextResponse<ModelListResponse>> {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const brandId = searchParams.get("brandId");

    if (!category || !brandId) {
      return NextResponse.json(
        { success: false, data: [], error: "Missing category or brandId parameter" },
        { status: 400 }
      );
    }

    let models: any[] = [];

    if (category === "phones") {
      // Dynamically import brand-specific models
      try {
        const brandCatalog = await import(`@/lib/data/catalogs/phones/${brandId}`);
        models = brandCatalog.MODELS || [];
      } catch {
        // Brand catalog not found or not yet created
        models = [];
      }
    } else if (category === "vehicles") {
      try {
        const brandCatalog = await import(`@/lib/data/catalogs/vehicles/${brandId}`);
        models = brandCatalog.MODELS || [];
      } catch {
        models = [];
      }
    } else if (category === "laptops") {
      try {
        const brandCatalog = await import(`@/lib/data/catalogs/laptops/${brandId}`);
        models = brandCatalog.MODELS || [];
      } catch {
        models = [];
      }
    }

    return NextResponse.json({ success: true, data: models });
  } catch (error) {
    console.error("Error loading catalog models:", error);
    return NextResponse.json(
      { success: false, data: [], error: "Failed to load models" },
      { status: 500 }
    );
  }
}
