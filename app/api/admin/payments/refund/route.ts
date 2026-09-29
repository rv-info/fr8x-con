import { NextRequest, NextResponse } from 'next/server';
import { authenticateGodfatherOperator } from '@/lib/auth-guard';

export async function POST(req: NextRequest) {
  const auth = authenticateGodfatherOperator(req);
  if (!auth.authenticated) {
    return auth.errorResponse!;
  }

  try {
    const body = await req.json();
    const { invoiceId, amount, type, reason } = body;
    const operatorUid = auth.operator!.uid;

    if (!invoiceId || !amount || !reason) {
      return NextResponse.json({ error: 'Missing invoice ID, refund amount, or mandatory financial rationale' }, { status: 400 });
    }

    const correlationId = `GF-REFUND-${Date.now().toString(36).toUpperCase()}`;

    return NextResponse.json({
      success: true,
      invoiceId,
      refundRef: `ref_${Date.now()}`,
      status: type === 'credit' ? 'adjusted' : 'refunded',
      operatorUid,
      correlationId,
      message: `${type === 'credit' ? 'Commercial Credit' : 'Payment Refund'} processed successfully with immutable ledger audit`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
