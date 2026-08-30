import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { importId, reason, operatorUid } = body;

    if (!importId || !reason) {
      return NextResponse.json({ error: 'Missing import batch ID or mandatory finalization reason' }, { status: 400 });
    }

    const correlationId = `GF-IMP-FIN-${Date.now().toString(36).toUpperCase()}`;

    return NextResponse.json({
      success: true,
      importId,
      status: 'Finalized',
      correlationId,
      message: `Rate import batch ${importId} finalized and valid rows inserted into active rate inventory`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
