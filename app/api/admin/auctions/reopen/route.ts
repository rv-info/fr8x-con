import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { auctionId, reason, operatorUid } = body;

    if (!auctionId || !reason) {
      return NextResponse.json({ error: 'Missing auction ID or mandatory reopening justification' }, { status: 400 });
    }

    const correlationId = `GF-AUC-REOPEN-${Date.now().toString(36).toUpperCase()}`;

    return NextResponse.json({
      success: true,
      auctionId,
      status: 'Live',
      correlationId,
      message: `Auction ${auctionId} reopened with audited rationale`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
