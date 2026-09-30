import { NextRequest, NextResponse } from 'next/server';
import { FirebaseSyncEngine } from '@/scripts/firebase-dbms-sync-engine';

export const dynamic = 'force-dynamic';

/**
 * GET /api/firebase/sync
 * Health-check & status of the Firebase connection.
 */
export async function GET(req: NextRequest) {
  try {
    const engine = new FirebaseSyncEngine();
    const result = await engine.runSync();
    return NextResponse.json({
      success: result.success,
      message: result.success ? 'Firebase Firestore DBMS is connected and synchronized.' : 'Firebase sync encountered issues.',
      diagnostics: result.diagnostics,
      authenticatedUid: result.authenticatedUid,
      documentsSynced: result.documentsSynced,
      errors: result.errors,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Firebase health check failed.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/firebase/sync
 * Triggers full authoritative DBMS to Firebase Firestore synchronization.
 */
export async function POST(req: NextRequest) {
  return GET(req);
}
