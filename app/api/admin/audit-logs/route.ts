import { NextRequest, NextResponse } from 'next/server';
import { authenticateGodfatherOperator } from '@/lib/auth-guard';

export async function GET(req: NextRequest) {
  const auth = authenticateGodfatherOperator(req);
  if (!auth.authenticated) {
    return auth.errorResponse!;
  }

  const { searchParams } = new URL(req.url);
  const targetType = searchParams.get('targetType');
  const targetId = searchParams.get('targetId');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);

  return NextResponse.json({
    status: 'success',
    filters: { targetType, targetId, limit },
    operatorUid: auth.operator!.uid,
    timestamp: new Date().toISOString(),
    immutableStore: 'Google Cloud Firestore (con-fr8x-audit-vault)',
  });
}
