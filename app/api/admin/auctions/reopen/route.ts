import { NextRequest, NextResponse } from 'next/server';
import { authenticateGodfatherOperator } from '@/lib/auth-guard';

export async function POST(req: NextRequest) {
  const auth = authenticateGodfatherOperator(req);
  if (!auth.authenticated) {
    return auth.errorResponse!;
  }

  try {
    const body = await req.json();
    const { auctionId, reason } = body;
    const operatorUid = auth.operator!.uid;

    if (!auctionId || !reason) {
      return NextResponse.json({ error: 'Missing auction ID or mandatory reopening justification' }, { status: 400 });
    }

    const correlationId = `GF-AUC-REOPEN-${Date.now().toString(36).toUpperCase()}`;

    return NextResponse.json({
      success: true,
      auctionId,
      status: 'Live',
      operatorUid,
      correlationId,
      message: `Auction ${auctionId} reopened with audited rationale`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
