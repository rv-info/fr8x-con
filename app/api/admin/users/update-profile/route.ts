import { NextRequest, NextResponse } from 'next/server';
import { authenticateGodfatherOperator } from '@/lib/auth-guard';
import { serverSecurityStore } from '@/lib/server-auth-store';

export async function POST(req: NextRequest) {
  const auth = authenticateGodfatherOperator(req);
  if (!auth.authenticated) {
    return auth.errorResponse!;
  }

  try {
    const body = await req.json();
    const { uid, changes, reason } = body;
    const operatorUid = auth.operator!.uid;

    if (!uid || !changes || !reason) {
      return NextResponse.json({ error: 'Missing user UID, change payload, or mandatory reason' }, { status: 400 });
    }

    // Strip protected fields from being modified via basic profile corrections
    const { passwordHash: _p, salt: _s, ...cleanChanges } = changes;
    const updateResult = serverSecurityStore.updateUserProfile(uid, cleanChanges);

    const correlationId = `GF-USR-CORR-${Date.now().toString(36).toUpperCase()}`;

    return NextResponse.json({
      success: updateResult.success,
      uid,
      operatorUid,
      correlationId,
      message: 'Audited user profile correction applied successfully',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
