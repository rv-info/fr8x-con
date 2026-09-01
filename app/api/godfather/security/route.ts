import { NextRequest, NextResponse } from 'next/server';
import { serverSecurityStore } from '@/lib/server-auth-store';

/**
 * GET /api/godfather/security
 * Returns live real security stats, blocked accounts, and security events.
 */
export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type') || 'summary';

  if (type === 'blocked') {
    return NextResponse.json({
      success: true,
      data: serverSecurityStore.getBlockedAccounts(),
      history: serverSecurityStore.getAllBlockedHistory(),
    });
  }

  if (type === 'events') {
    return NextResponse.json({
      success: true,
      data: serverSecurityStore.getSecurityEvents(),
    });
  }

  if (type === 'resets') {
    return NextResponse.json({
      success: true,
      data: serverSecurityStore.getPasswordResets(),
    });
  }

  const blocked = serverSecurityStore.getBlockedAccounts();
  const events = serverSecurityStore.getSecurityEvents();
  const resets = serverSecurityStore.getPasswordResets();

  return NextResponse.json({
    success: true,
    summary: {
      blockedAccountsCount: blocked.length,
      securityEventsCount: events.length,
      passwordResetsCount: resets.length,
      criticalEventsCount: events.filter((e) => e.severity === 'CRITICAL').length,
    },
    blockedAccounts: blocked,
    recentEvents: events.slice(0, 20),
  });
}

/**
 * POST /api/godfather/security
 * Handles high-privilege unblock operations with mandatory reason.
 */
export async function POST(req: NextRequest) {
  try {
    const { action, uid, unblockReason, adminName } = await req.json();

    if (action === 'UNBLOCK_ACCOUNT') {
      if (!uid || !unblockReason?.trim()) {
        return NextResponse.json(
          { success: false, error: 'User UID and mandatory unblock reason are required.' },
          { status: 400 }
        );
      }

      const result = serverSecurityStore.unblockAccount(
        uid,
        adminName || 'Godfather Administrator',
        unblockReason
      );

      if (!result.success) {
        return NextResponse.json({ success: false, error: result.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, message: result.message, record: result.record });
    }

    return NextResponse.json({ success: false, error: 'Unknown security action.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Security operation failed.' }, { status: 500 });
  }
}
