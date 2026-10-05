import { NextRequest, NextResponse } from 'next/server';
import { getCompanies, saveCompany, deleteCompany } from '@/lib/db/companies';
import { authenticateGodfatherOperator } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { authenticated, errorResponse } = authenticateGodfatherOperator(req);
  if (!authenticated) return errorResponse!;

  try {
    const companies = await getCompanies();
    return NextResponse.json({
      success: true,
      companies,
      total: companies.length,
    });
  } catch (error: any) {
    console.error('[API/godfather/companies] GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { authenticated, errorResponse } = authenticateGodfatherOperator(req);
  if (!authenticated) return errorResponse!;

  try {
    const body = await req.json();
    const legalName = body.legalName || body.legal_name || body.name;
    if (!legalName || !body.city || !body.country) {
      return NextResponse.json(
        { success: false, error: 'Legal name, city, and country are required.' },
        { status: 400 }
      );
    }

    const saved = await saveCompany({
      id: body.id || `CMP-${Math.floor(10000 + Math.random() * 90000)}`,
      name: legalName,
      legal_name: legalName,
      city: body.city,
      state: body.state,
      country: body.country,
      postal_code: body.postalCode || body.postal_code,
      address: body.registeredAddress || body.address,
      gstin: body.gstn || body.gstin,
      pan: body.pan,
      cin: body.cin,
      status: body.status || 'verified',
      is_verified: body.status === 'verified',
    });

    return NextResponse.json({ success: true, company: saved });
  } catch (error: any) {
    console.error('[API/godfather/companies] POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { authenticated, errorResponse } = authenticateGodfatherOperator(req);
  if (!authenticated) return errorResponse!;

  try {
    const { canonicalId, duplicateId } = await req.json();
    if (!canonicalId || !duplicateId) {
      return NextResponse.json(
        { success: false, error: 'Both canonicalId and duplicateId are required.' },
        { status: 400 }
      );
    }

    // Merge: delete duplicate company in PostgreSQL
    await deleteCompany(duplicateId);

    return NextResponse.json({
      success: true,
      message: `Entity ${duplicateId} successfully merged into canonical record ${canonicalId}.`,
    });
  } catch (error: any) {
    console.error('[API/godfather/companies] PUT error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
