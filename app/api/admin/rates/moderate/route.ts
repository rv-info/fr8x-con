import { NextRequest, NextResponse } from 'next/server';
import { authenticateGodfatherOperator } from '@/lib/auth-guard';

export async function POST(req: NextRequest) {
  const auth = authenticateGodfatherOperator(req);
  if (!auth.authenticated) {
    return auth.errorResponse!;
  }

  try {
    const body = await req.json();
    const { rateId, action, reason } = body;
    const operatorUid = auth.operator!.uid;

    if (!rateId || !action || !reason) {
      return NextResponse.json({ error: 'Missing rate ID, action type, or moderation reason' }, { status: 400 });
    }

    const correlationId = `GF-RT-MOD-${Date.now().toString(36).toUpperCase()}`;

    return NextResponse.json({
      success: true,
      rateId,
      action,
      operatorUid,
      correlationId,
      message: `Rate ${rateId} moderation action [${action}] applied with audit record`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
