import { NextRequest, NextResponse } from 'next/server';
import { authenticateGodfatherOperator } from '@/lib/auth-guard';

export async function POST(req: NextRequest) {
  const auth = authenticateGodfatherOperator(req);
  if (!auth.authenticated) {
    return auth.errorResponse!;
  }

  try {
    const body = await req.json();
    const { plan, planName, monthlyPrice, currency, countryScope, taxPolicy, reason } = body;
    const operatorUid = auth.operator!.uid;

    if (!plan || monthlyPrice === undefined || !reason) {
      return NextResponse.json({ error: 'Missing mandatory plan pricing parameters or justification' }, { status: 400 });
    }

    const planVersionId = `PV-${plan.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    const correlationId = `GF-PLN-VER-${Date.now().toString(36).toUpperCase()}`;

    return NextResponse.json({
      success: true,
      planVersionId,
      operatorUid,
      correlationId,
      message: `Versioned plan ${planName || plan} created with effective date`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
