import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { companyId, reason, actionType, operatorUid } = body;

    if (!companyId || !reason) {
      return NextResponse.json({ error: 'Missing company ID or mandatory reason' }, { status: 400 });
    }

    const correlationId = `GF-CMP-REJ-${Date.now().toString(36).toUpperCase()}`;

    return NextResponse.json({
      success: true,
      companyId,
      status: actionType === 'additional_info' ? 'additional_info_required' : 'rejected',
      correlationId,
      message: `Company ${companyId} status updated to ${actionType || 'rejected'}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
