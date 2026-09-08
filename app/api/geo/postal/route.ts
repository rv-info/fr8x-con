import { NextRequest, NextResponse } from 'next/server';
import { lookupPostalCode } from '@/lib/geo/city-service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const country = searchParams.get('country') || '';
    const code = searchParams.get('code') || '';
    const city = searchParams.get('city') || '';

    const target = code || city;
    if (!target) {
      return NextResponse.json(
        { success: false, error: 'Either "code" or "city" query parameter is required.' },
        { status: 400 }
      );
    }

    const result = await lookupPostalCode(country, target);
    return NextResponse.json({
      success: true,
      query: { country, code, city },
      data: result,
    });
  } catch (error) {
    console.error('[API /api/geo/postal] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to lookup postal code' },
      { status: 500 }
    );
  }
}
