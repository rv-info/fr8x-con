import { NextRequest, NextResponse } from 'next/server';
import {
  searchPersistedCompanies,
  checkCompanyDuplicate,
  getPersistedCompanies,
} from '@/lib/dbms/server-dbms';

export const dynamic = 'force-dynamic';

/**
 * GET /api/companies/search
 * Public Search & Duplicate Advisory API for Master Companies
 * 
 * Features:
 * 1. Live typeahead search across registered entities in DBMS.
 * 2. Prominent location indication in search labels: "📍 City, State, Country · Street Address".
 * 3. Non-blocking duplicate detection returning advisory notices if a matching name or address is entered.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const address = searchParams.get('address') || '';
    const city = searchParams.get('city') || '';
    const country = searchParams.get('country') || '';
    const excludeId = searchParams.get('excludeId') || '';

    let matchedList = searchPersistedCompanies(query);

    // Format companies with explicit location indications
    const formattedCompanies = matchedList.map((c) => {
      const statePart = c.state ? `${c.state}, ` : '';
      const locationLabel = `${c.city}, ${statePart}${c.country}`;
      const addressSnippet = c.registeredAddress ? ` · ${c.registeredAddress}` : '';
      const searchLabel = `${c.legalName} — 📍 ${locationLabel}${addressSnippet}`;

      return {
        id: c.id,
        legalName: c.legalName,
        tradeName: c.tradeName || c.legalName,
        country: c.country,
        state: c.state || '',
        city: c.city,
        postalCode: c.postalCode || '',
        registeredAddress: c.registeredAddress,
        locationLabel,
        searchLabel,
        gstn: c.gstn || '',
        pan: c.pan || '',
        taxId: c.taxId || '',
        corporateRegNumber: c.corporateRegNumber || '',
        tradeCustomsCode: c.tradeCustomsCode || '',
        logisticsLicenseNumber: c.logisticsLicenseNumber || '',
        status: c.status,
        verified: c.verified,
        memberCount: c.memberCount || 1,
      };
    });

    // Run duplicate advisory check
    const duplicateAdvisory = checkCompanyDuplicate(
      query,
      address,
      city,
      country,
      excludeId
    );

    return NextResponse.json({
      success: true,
      companies: formattedCompanies,
      totalCount: formattedCompanies.length,
      duplicateAdvisory,
    });
  } catch (error: any) {
    console.error('[API /api/companies/search] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to search companies' },
      { status: 500 }
    );
  }
}
