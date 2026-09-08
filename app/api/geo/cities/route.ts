import { NextRequest, NextResponse } from 'next/server';
import { getCitiesByCountry, searchCitiesGlobal } from '@/lib/geo/city-service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const country = searchParams.get('country') || '';
    const query = searchParams.get('query') || '';
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.min(Math.max(1, parseInt(limitParam, 10) || 50), 500) : 100;

    if (country) {
      const cities = getCitiesByCountry(country, query, limit);
      return NextResponse.json({
        success: true,
        country,
        count: cities.length,
        cities,
      });
    }

    if (query && query.trim().length >= 2) {
      const cities = searchCitiesGlobal(query, limit);
      return NextResponse.json({
        success: true,
        query,
        count: cities.length,
        cities,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Either "country" parameter or "query" (minimum 2 chars) must be provided.',
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('[API /api/geo/cities] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search cities' },
      { status: 500 }
    );
  }
}
