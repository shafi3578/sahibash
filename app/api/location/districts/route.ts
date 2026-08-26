import { NextRequest, NextResponse } from "next/server";
import { getPublicDistricts } from "@/lib/location/reference-data";

const LOCATION_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
  "CDN-Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
};

function toPositiveInt(value: string | null) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

/**
 * GET /api/location/districts?province_id=<id>
 * Returns active districts for a province from the public location reference cache.
 */
export async function GET(request: NextRequest) {
  try {
    const provinceId = toPositiveInt(request.nextUrl.searchParams.get("province_id"));

    if (!provinceId) {
      return NextResponse.json(
        { success: false, error: "province_id parameter is required" },
        { status: 400 }
      );
    }

    const districts = await getPublicDistricts(provinceId);

    return NextResponse.json(
      { success: true, data: districts, province_id: provinceId },
      { headers: LOCATION_CACHE_HEADERS }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch districts" },
      { status: 500 }
    );
  }
}
