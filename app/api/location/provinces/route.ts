import { NextResponse } from "next/server";
import { getPublicProvinces } from "@/lib/location/reference-data";

const LOCATION_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
  "CDN-Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
};

/**
 * GET /api/location/provinces
 * Returns active Afghanistan provinces from the public location reference cache.
 */
export async function GET() {
  try {
    const provinces = await getPublicProvinces();

    return NextResponse.json(
      { success: true, data: provinces },
      { headers: LOCATION_CACHE_HEADERS }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch provinces" },
      { status: 500 }
    );
  }
}
