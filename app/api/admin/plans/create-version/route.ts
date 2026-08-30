import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { plan, planName, monthlyPrice, currency, countryScope, taxPolicy, reason, operatorUid } = body;

    if (!plan || monthlyPrice === undefined || !reason) {
      return NextResponse.json({ error: 'Missing mandatory plan pricing parameters or justification' }, { status: 400 });
    }

    const planVersionId = `PV-${plan.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    const correlationId = `GF-PLN-VER-${Date.now().toString(36).toUpperCase()}`;

    return NextResponse.json({
      success: true,
      planVersionId,
      correlationId,
      message: `Versioned plan ${planName || plan} created with effective date`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
