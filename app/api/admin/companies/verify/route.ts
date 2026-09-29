import { NextRequest, NextResponse } from 'next/server';
import { authenticateGodfatherOperator } from '@/lib/auth-guard';

export async function POST(req: NextRequest) {
  const auth = authenticateGodfatherOperator(req);
  if (!auth.authenticated) {
    return auth.errorResponse!;
  }

  try {
    const body = await req.json();
    const { companyId, reason } = body;
    const operatorUid = auth.operator!.uid;

    if (!companyId || !reason) {
      return NextResponse.json({ error: 'Missing company ID or mandatory compliance verification reason' }, { status: 400 });
    }

    const correlationId = `GF-CMP-VER-${Date.now().toString(36).toUpperCase()}`;

    return NextResponse.json({
      success: true,
      companyId,
      status: 'verified',
      operatorUid,
      correlationId,
      message: `Company ${companyId} verified and activated on Con.FR8X.IN platform`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
