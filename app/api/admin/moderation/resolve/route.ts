import { NextRequest, NextResponse } from 'next/server';
import { authenticateGodfatherOperator } from '@/lib/auth-guard';

export async function POST(req: NextRequest) {
  const auth = authenticateGodfatherOperator(req);
  if (!auth.authenticated) {
    return auth.errorResponse!;
  }

  try {
    const body = await req.json();
    const { reportId, action, reason } = body;
    const operatorUid = auth.operator!.uid;

    if (!reportId || !action || !reason) {
      return NextResponse.json({ error: 'Missing report ID, action, or resolution rationale' }, { status: 400 });
    }

    const correlationId = `GF-MOD-RES-${Date.now().toString(36).toUpperCase()}`;

    return NextResponse.json({
      success: true,
      reportId,
      actionTaken: action,
      operatorUid,
      correlationId,
      message: `Moderation report ${reportId} resolved with action [${action}]`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
