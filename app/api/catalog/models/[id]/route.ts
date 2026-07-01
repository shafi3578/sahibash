import { NextRequest, NextResponse } from "next/server";
import type { ModelDetailResponse } from "@/lib/catalog/types";

/**
 * GET /api/catalog/models/[id]?category=phones&brandId=apple
 * Get detailed spec info for a specific model
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ModelDetailResponse>> {
  try {
    const { id: modelId } = await params;
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const brandId = searchParams.get("brandId");

    if (!category || !brandId || !modelId) {
      return NextResponse.json(
        { success: false, data: null, error: "Missing required parameters" },
        { status: 400 }
      );
    }

    let model: any = null;

    if (category === "phones") {
      try {
        const brandCatalog = await import(`@/lib/data/catalogs/phones/${brandId}`);
        const models = brandCatalog.MODELS || [];
        model = models.find((m: any) => m.id === modelId);
      } catch {
        // Brand catalog not found
      }
    } else if (category === "vehicles") {
      try {
        const brandCatalog = await import(`@/lib/data/catalogs/vehicles/${brandId}`);
        const models = brandCatalog.MODELS || [];
        model = models.find((m: any) => m.id === modelId);
      } catch {
        // Brand catalog not found
      }
    } else if (category === "laptops") {
      try {
        const brandCatalog = await import(`@/lib/data/catalogs/laptops/${brandId}`);
        const models = brandCatalog.MODELS || [];
        model = models.find((m: any) => m.id === modelId);
      } catch {
        // Brand catalog not found
      }
    }

    return NextResponse.json({ success: true, data: model });
  } catch (error) {
    console.error("Error loading model details:", error);
    return NextResponse.json(
      { success: false, data: null, error: "Failed to load model details" },
      { status: 500 }
    );
  }
}
