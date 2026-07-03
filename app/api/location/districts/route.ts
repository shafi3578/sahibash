import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/location/districts?province_id=<id>
 * Returns districts for a specific province
 */
export async function GET(request: NextRequest) {
  try {
    const provinceId = request.nextUrl.searchParams.get('province_id');

    if (!provinceId) {
      return NextResponse.json(
        { success: false, error: 'province_id parameter is required' },
        { status: 400 }
      );
    }

    // This would connect to Supabase in production
    // For now, return structured response format
    // In production, replace with actual Supabase query:
    // const { data, error } = await supabase
    //   .from('districts')
    //   .select('*')
    //   .eq('province_id', provinceId)
    //   .eq('is_active', true)
    //   .order('sort_order', { ascending: true });

    const districts = [
      {
        id: '1',
        province_id: provinceId,
        slug: 'district-1',
        name_en: 'District 1',
        name_fa: 'ناحیه اول',
        name_ps: 'ولسوالی یک',
        aliases: [],
        sort_order: 1,
        is_active: true,
      },
      // ... more districts (populated from database)
    ];

    return NextResponse.json({
      success: true,
      data: districts,
      province_id: provinceId,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch districts' },
      { status: 500 }
    );
  }
}
