import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/location/provinces
 * Returns all provinces
 */
export async function GET(request: NextRequest) {
  try {
    // This would connect to Supabase in production
    // For now, return structured response format
    // In production, replace with actual Supabase query
    const provinces = [
      {
        id: '1',
        slug: 'kabul',
        name_en: 'Kabul',
        name_fa: 'کابل',
        name_ps: 'کابل',
        aliases: ['Kabul City'],
        sort_order: 1,
        is_active: true,
      },
      // ... more provinces (populated from database)
    ];

    return NextResponse.json({
      success: true,
      data: provinces,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch provinces' },
      { status: 500 }
    );
  }
}
