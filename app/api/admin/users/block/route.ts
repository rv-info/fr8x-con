import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subjectId, subjectName, scopes, reasonCode, reasonText, operatorUid, operatorRole } = body;

    if (!subjectId || !scopes || !reasonCode || !reasonText) {
      return NextResponse.json({ error: 'Missing mandatory block parameters or reason' }, { status: 400 });
    }

    const correlationId = `GF-BLK-${Date.now().toString(36).toUpperCase()}`;

    return NextResponse.json({
      success: true,
      blockId: `blk-${Date.now()}`,
      correlationId,
      message: `Scoped block [${scopes.join(', ')}] applied to ${subjectName} successfully`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
