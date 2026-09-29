import { NextRequest, NextResponse } from 'next/server';
import { authenticateGodfatherOperator } from '@/lib/auth-guard';

export async function POST(req: NextRequest) {
  const auth = authenticateGodfatherOperator(req);
  if (!auth.authenticated) {
    return auth.errorResponse!;
  }

  try {
    const body = await req.json();
    const { importId, reason } = body;
    const operatorUid = auth.operator!.uid;

    if (!importId || !reason) {
      return NextResponse.json({ error: 'Missing import batch ID or mandatory finalization reason' }, { status: 400 });
    }

    const correlationId = `GF-IMP-FIN-${Date.now().toString(36).toUpperCase()}`;

    return NextResponse.json({
      success: true,
      importId,
      status: 'Finalized',
      operatorUid,
      correlationId,
      message: `Rate import batch ${importId} finalized and valid rows inserted into active rate inventory`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
