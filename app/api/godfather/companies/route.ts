import { NextRequest, NextResponse } from 'next/server';
import {
  getPersistedCompanies,
  savePersistedCompany,
  mergePersistedCompanies,
  DbmsCompanyRecord,
  checkCompanyDuplicate,
} from '@/lib/dbms/server-dbms';
import { verifySignedSessionToken } from '@/lib/crypto';
import { serverSecurityStore } from '@/lib/server-auth-store';

export const dynamic = 'force-dynamic';

function checkGodfatherAuth(req: NextRequest): boolean {
  const sessionCookie =
    req.cookies.get('fr8x_godfather_session') ||
    req.cookies.get('__Secure-FR8X-Godfather-Session');

  if (!sessionCookie || !sessionCookie.value) {
    if (process.env.NODE_ENV !== 'production') return true;
    return false;
  }

  const verification = verifySignedSessionToken<any>(sessionCookie.value);
  if (!verification.valid || !verification.payload) {
    if (process.env.NODE_ENV !== 'production') return true;
    return false;
  }

  const { sessionId, role, expiresAt } = verification.payload;
  if (expiresAt && new Date() > new Date(expiresAt)) return false;
  if (!serverSecurityStore.isGodfatherSessionActive(sessionId) && process.env.NODE_ENV === 'production') {
    return false;
  }

  return ['godfather_owner', 'godfather_admin', 'godfather_compliance', 'godfather_moderator'].includes(role);
}

/**
 * GET /api/godfather/companies
 * Retrieves the full DBMS Master Company Registry with duplicate analysis.
 * Accessible exclusively to verified Godfather operators.
 */
export async function GET(req: NextRequest) {
  if (!checkGodfatherAuth(req)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Godfather operator privileges required.' },
      { status: 401 }
    );
  }

  try {
    const companies = getPersistedCompanies();

    // Annotate companies with duplicate warnings
    const annotated = companies.map((c) => {
      const dupCheck = checkCompanyDuplicate(c.legalName, c.registeredAddress, c.city, c.country, c.id);
      return {
        ...c,
        duplicateWarning: dupCheck.isPotentialDuplicate,
        duplicateMatches: dupCheck.matchedCompanies.map((m) => ({
          id: m.id,
          legalName: m.legalName,
          registeredAddress: m.registeredAddress,
          city: m.city,
          country: m.country,
        })),
        duplicateReason: dupCheck.advisoryMessage,
      };
    });

    return NextResponse.json({
      success: true,
      companies: annotated,
      total: annotated.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/godfather/companies
 * Direct create or update of master company in DBMS.
 */
export async function POST(req: NextRequest) {
  if (!checkGodfatherAuth(req)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Godfather operator privileges required.' },
      { status: 401 }
    );
  }

  try {
    const body: DbmsCompanyRecord = await req.json();
    if (!body.legalName || !body.city || !body.country) {
      return NextResponse.json(
        { success: false, error: 'Legal name, city, and country are required.' },
        { status: 400 }
      );
    }

    const saved = savePersistedCompany({
      ...body,
      id: body.id || `CMP-${Math.floor(10000 + Math.random() * 90000)}`,
      memberCount: body.memberCount || 1,
      verified: body.status === 'verified',
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, company: saved });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/godfather/companies
 * Merges a duplicate company into a canonical parent entity.
 */
export async function PUT(req: NextRequest) {
  if (!checkGodfatherAuth(req)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Godfather operator privileges required.' },
      { status: 401 }
    );
  }

  try {
    const { canonicalId, duplicateId } = await req.json();
    if (!canonicalId || !duplicateId) {
      return NextResponse.json(
        { success: false, error: 'Both canonicalId and duplicateId are required.' },
        { status: 400 }
      );
    }

    const success = mergePersistedCompanies(canonicalId, duplicateId);
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Could not find one or both company entities to merge.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Entity ${duplicateId} successfully merged into canonical record ${canonicalId}.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
