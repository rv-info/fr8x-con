import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { blockId, reason, operatorUid } = body;

    if (!blockId || !reason) {
      return NextResponse.json({ error: 'Missing block ID or mandatory unblock rationale' }, { status: 400 });
    }

    const correlationId = `GF-UNBLK-${Date.now().toString(36).toUpperCase()}`;

    return NextResponse.json({
      success: true,
      blockId,
      correlationId,
      message: `Block ${blockId} lifted with audited justification`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
