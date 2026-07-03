import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/location/areas?province_id=<id>&district_id=<id>&popular=true
 * Returns areas for a specific province/district
 * Can filter by popular areas
 */
export async function GET(request: NextRequest) {
  try {
    const provinceId = request.nextUrl.searchParams.get('province_id');
    const districtId = request.nextUrl.searchParams.get('district_id');
    const popularOnly = request.nextUrl.searchParams.get('popular') === 'true';

    if (!provinceId) {
      return NextResponse.json(
        { success: false, error: 'province_id parameter is required' },
        { status: 400 }
      );
    }

    // This would connect to Supabase in production
    // Query: select all areas for province, optionally filter by district and popularity

    const areas = [
      {
        id: '1',
        province_id: provinceId,
        district_id: districtId || null,
        slug: 'area-1',
        name_en: 'Area 1',
        name_fa: 'منطقه اول',
        name_ps: 'سیمه یک',
        aliases: [],
        is_popular: true,
        is_approved: true,
      },
      // ... more areas (populated from database)
    ];

    return NextResponse.json({
      success: true,
      data: areas,
      province_id: provinceId,
      district_id: districtId,
      popular_only: popularOnly,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch areas' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/location/areas
 * Submit a custom area for admin approval
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { province_id, district_id, name_en, name_fa, name_ps, user_id } = body;

    // Validate required fields
    if (!province_id || !name_en) {
      return NextResponse.json(
        { success: false, error: 'province_id and name_en are required' },
        { status: 400 }
      );
    }

    // In production, insert into Supabase
    // const { data, error } = await supabase
    //   .from('areas')
    //   .insert({
    //     province_id,
    //     district_id: district_id || null,
    //     name_en,
    //     name_fa,
    //     name_ps,
    //     aliases: [],
    //     is_popular: false,
    //     is_approved: false,
    //     submitted_by_user_id: user_id,
    //     submitted_at: new Date(),
    //   })
    //   .select()
    //   .single();

    return NextResponse.json({
      success: true,
      message: 'Area submitted for approval',
      area: {
        id: 'temp-id',
        province_id,
        district_id: district_id || null,
        name_en,
        name_fa,
        name_ps,
        is_approved: false,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to submit area' },
      { status: 500 }
    );
  }
}
