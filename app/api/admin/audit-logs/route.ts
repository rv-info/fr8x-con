import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetType = searchParams.get('targetType');
  const targetId = searchParams.get('targetId');
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  return NextResponse.json({
    status: 'success',
    filters: { targetType, targetId, limit },
    timestamp: new Date().toISOString(),
    immutableStore: 'Google Cloud Firestore (con-fr8x-audit-vault)',
  });
}
