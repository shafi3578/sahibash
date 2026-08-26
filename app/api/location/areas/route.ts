import { NextRequest, NextResponse } from "next/server";
import { getPublicAreas } from "@/lib/location/reference-data";

const LOCATION_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
  "CDN-Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
};

function toPositiveInt(value: string | null) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

/**
 * GET /api/location/areas?province_id=<id>&district_id=<id>&popular=true
 * Returns active areas from the public location reference cache.
 */
export async function GET(request: NextRequest) {
  try {
    const provinceId = toPositiveInt(request.nextUrl.searchParams.get("province_id"));
    const districtId = toPositiveInt(request.nextUrl.searchParams.get("district_id"));
    const popularOnly = request.nextUrl.searchParams.get("popular") === "true";

    if (!provinceId) {
      return NextResponse.json(
        { success: false, error: "province_id parameter is required" },
        { status: 400 }
      );
    }

    const areas = await getPublicAreas(provinceId, districtId, popularOnly);

    return NextResponse.json(
      {
        success: true,
        data: areas,
        province_id: provinceId,
        district_id: districtId,
        popular_only: popularOnly,
      },
      { headers: LOCATION_CACHE_HEADERS }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch areas" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/location/areas
 * Submit a custom area for admin approval.
 *
 * Kept as the existing lightweight acknowledgement path; approval persistence
 * belongs to the moderation workflow and is intentionally not expanded in this
 * performance-only pass.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { province_id, district_id, name_en, name_fa, name_ps } = body;

    if (!province_id || !name_en) {
      return NextResponse.json(
        { success: false, error: "province_id and name_en are required" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Area submitted for approval",
      area: {
        id: "temp-id",
        province_id,
        district_id: district_id || null,
        name_en,
        name_fa,
        name_ps,
        is_approved: false,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to submit area" },
      { status: 500 }
    );
  }
}
