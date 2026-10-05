import { NextRequest, NextResponse } from 'next/server';
import { searchCompanies } from '@/lib/db/companies';
import { authenticateGodfatherOperator } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

function maskIdentifier(val?: string | null, visiblePrefix = 2, visibleSuffix = 2): string {
  if (!val || val.length <= visiblePrefix + visibleSuffix) return val || '';
  return `${val.substring(0, visiblePrefix)}****${val.slice(-visibleSuffix)}`;
}

export async function GET(req: NextRequest) {
  try {
    const gfAuth = authenticateGodfatherOperator(req);
    const isOperator = gfAuth.authenticated;

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';

    const matchedList = await searchCompanies(query);

    // Format companies with explicit location indications and masked identifiers
    const formattedCompanies = matchedList.map((c) => {
      const statePart = c.state ? `${c.state}, ` : '';
      const locationLabel = `${c.city || ''}, ${statePart}${c.country || 'India'}`;
      const addressSnippet = c.address ? ` · ${c.address}` : '';
      const searchLabel = `${c.legal_name || c.name} — 📍 ${locationLabel}${addressSnippet}`;

      return {
        id: c.id,
        legalName: c.legal_name || c.name,
        tradeName: c.name || c.legal_name,
        country: c.country,
        state: c.state || '',
        city: c.city,
        postalCode: c.postal_code || '',
        registeredAddress: c.address,
        locationLabel,
        searchLabel,
        gstn: isOperator ? (c.gstin || '') : maskIdentifier(c.gstin, 3, 2),
        pan: isOperator ? (c.pan || '') : maskIdentifier(c.pan, 2, 1),
        cin: isOperator ? (c.cin || '') : maskIdentifier(c.cin, 3, 2),
        status: c.status || 'verified',
        verified: c.is_verified,
        memberCount: 1,
      };
    });

    return NextResponse.json({
      success: true,
      companies: formattedCompanies,
      totalCount: formattedCompanies.length,
    });
  } catch (error: any) {
    console.error('[API /api/companies/search] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to search companies' },
      { status: 500 }
    );
  }
}
