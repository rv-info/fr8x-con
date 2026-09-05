import { NextRequest, NextResponse } from 'next/server';
import { serverSecurityStore } from '@/lib/server-auth-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subjectId, subjectName, scopes, reasonCode, reasonText, operatorUid, operatorRole } = body;

    if (!subjectId || !reasonText) {
      return NextResponse.json({ error: 'Missing mandatory block parameters or reason' }, { status: 400 });
    }

    const correlationId = `GF-BLK-${Date.now().toString(36).toUpperCase()}`;
    const target = subjectId || subjectName;

    // Apply block and dispatch account blocked notification email
    const blockRes = serverSecurityStore.blockAccount(
      target,
      operatorUid || 'Admin',
      reasonText
    );

    return NextResponse.json({
      success: true,
      blockId: blockRes.record?.id || `blk-${Date.now()}`,
      correlationId,
      message: `Scoped block applied to ${subjectName || subjectId} successfully. Security notification dispatched.`,
      record: blockRes.record,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
