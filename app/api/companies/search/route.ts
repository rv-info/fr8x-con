import { NextRequest, NextResponse } from 'next/server';
import {
  searchPersistedCompanies,
  checkCompanyDuplicate,
} from '@/lib/dbms/server-dbms';
import { authenticateGodfatherOperator } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

function maskIdentifier(val?: string, visiblePrefix = 2, visibleSuffix = 2): string {
  if (!val || val.length <= visiblePrefix + visibleSuffix) return val || '';
  return `${val.substring(0, visiblePrefix)}****${val.slice(-visibleSuffix)}`;
}

/**
 * GET /api/companies/search
 * Public Search & Duplicate Advisory API for Master Companies
 * 
 * Features:
 * 1. Live typeahead search across registered entities in DBMS.
 * 2. Prominent location indication in search labels: "📍 City, State, Country · Street Address".
 * 3. Non-blocking duplicate detection returning advisory notices if a matching name or address is entered.
 * 4. PII protection: Masks GSTN, PAN, and corporate license numbers for unauthenticated public requests.
 */
export async function GET(req: NextRequest) {
  try {
    const gfAuth = authenticateGodfatherOperator(req);
    const isOperator = gfAuth.authenticated;

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const address = searchParams.get('address') || '';
    const city = searchParams.get('city') || '';
    const country = searchParams.get('country') || '';
    const excludeId = searchParams.get('excludeId') || '';

    let matchedList = searchPersistedCompanies(query);

    // Format companies with explicit location indications and masked identifiers
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
        gstn: isOperator ? (c.gstn || '') : maskIdentifier(c.gstn, 3, 2),
        pan: isOperator ? (c.pan || '') : maskIdentifier(c.pan, 2, 1),
        taxId: isOperator ? (c.taxId || '') : maskIdentifier(c.taxId, 2, 2),
        corporateRegNumber: isOperator ? (c.corporateRegNumber || '') : maskIdentifier(c.corporateRegNumber, 3, 2),
        tradeCustomsCode: isOperator ? (c.tradeCustomsCode || '') : maskIdentifier(c.tradeCustomsCode, 2, 1),
        logisticsLicenseNumber: isOperator ? (c.logisticsLicenseNumber || '') : maskIdentifier(c.logisticsLicenseNumber, 2, 1),
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
