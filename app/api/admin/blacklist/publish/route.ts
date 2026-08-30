import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { caseId, companyName, reason, stepUpToken, operatorUid } = body;

    if (!caseId || !reason) {
      return NextResponse.json({ error: 'Missing blacklist case ID or publication justification' }, { status: 400 });
    }

    const correlationId = `GF-BL-PUB-${Date.now().toString(36).toUpperCase()}`;

    return NextResponse.json({
      success: true,
      caseId,
      status: 'active',
      isPublic: true,
      correlationId,
      message: `Blacklist case ${caseId} published to Public Blacklist registry`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
