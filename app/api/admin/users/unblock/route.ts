import { NextRequest, NextResponse } from 'next/server';
import { serverSecurityStore } from '@/lib/server-auth-store';
import { authenticateGodfatherOperator } from '@/lib/auth-guard';

export async function POST(req: NextRequest) {
  const auth = authenticateGodfatherOperator(req);
  if (!auth.authenticated) {
    return auth.errorResponse!;
  }

  try {
    const body = await req.json();
    const { blockId, reason } = body;
    const operatorUid = auth.operator!.uid;

    if (!blockId || !reason) {
      return NextResponse.json({ error: 'Missing block ID or mandatory unblock rationale' }, { status: 400 });
    }

    const correlationId = `GF-UNBLK-${Date.now().toString(36).toUpperCase()}`;

    // Lift block in security store
    const unblockRes = serverSecurityStore.unblockAccount(
      blockId,
      operatorUid || 'Admin',
      reason
    );

    return NextResponse.json({
      success: true,
      blockId,
      correlationId,
      message: unblockRes.message || `Block ${blockId} lifted with audited justification`,
      record: unblockRes.record,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
