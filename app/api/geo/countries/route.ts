import { NextResponse } from 'next/server';
import { getAllCountries } from '@/lib/geo/city-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const countries = getAllCountries();
    return NextResponse.json({
      success: true,
      count: countries.length,
      countries,
    });
  } catch (error) {
    console.error('[API /api/geo/countries] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve countries' },
      { status: 500 }
    );
  }
}
