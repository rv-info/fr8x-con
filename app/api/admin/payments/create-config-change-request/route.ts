import { NextRequest, NextResponse } from 'next/server';
import { authenticateGodfatherOperator } from '@/lib/auth-guard';

export async function POST(req: NextRequest) {
  const auth = authenticateGodfatherOperator(req);
  if (!auth.authenticated) {
    return auth.errorResponse!;
  }

  try {
    const body = await req.json();
    const { configId, provider, changeDetails, reason } = body;
    const operatorUid = auth.operator!.uid;

    if (!configId || !changeDetails || !reason) {
      return NextResponse.json({ error: 'Missing config ID, change parameters, or reason' }, { status: 400 });
    }

    const requestId = `REQ-${Date.now().toString(36).toUpperCase()}`;
    const correlationId = `GF-PAY-REQ-${Date.now().toString(36).toUpperCase()}`;

    return NextResponse.json({
      success: true,
      requestId,
      approvalStatus: 'pending_second_approver',
      operatorUid,
      correlationId,
      message: `Two-person approval request ${requestId} created for payment provider ${provider || configId}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
