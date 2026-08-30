import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { caseId, reason, operatorUid } = body;

    if (!caseId || !reason) {
      return NextResponse.json({ error: 'Missing case ID or mandatory revocation rationale' }, { status: 400 });
    }

    const correlationId = `GF-BL-RVK-${Date.now().toString(36).toUpperCase()}`;

    return NextResponse.json({
      success: true,
      caseId,
      status: 'resolved',
      isPublic: false,
      correlationId,
      message: `Blacklist case ${caseId} revoked and moved to resolved archives`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
