import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { reportId, targetType, targetId, action, reason, operatorUid } = body;

    if (!reportId || !action || !reason) {
      return NextResponse.json({ error: 'Missing report ID, action, or resolution rationale' }, { status: 400 });
    }

    const correlationId = `GF-MOD-RES-${Date.now().toString(36).toUpperCase()}`;

    return NextResponse.json({
      success: true,
      reportId,
      actionTaken: action,
      correlationId,
      message: `Moderation report ${reportId} resolved with action [${action}]`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
