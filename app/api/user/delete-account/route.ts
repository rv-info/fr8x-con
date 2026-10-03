import { NextRequest, NextResponse } from 'next/server';
import { serverSecurityStore } from '@/lib/server-auth-store';
import { authenticateUserSession, authenticateGodfatherOperator } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

/**
 * POST /api/user/delete-account
 * Handles user account deactivation & deletion on FR8X:
 * - action === 'schedule_5_days': Schedules account deletion in 5 days (grace period).
 * - action === 'cancel_deletion': Cancels scheduled 5-day deletion and restores active state.
 * - action === 'permanent': Permanently deletes the account immediately.
 */
export async function POST(req: NextRequest) {
  const userAuth = authenticateUserSession(req, { allowUnverified: true });
  const gfAuth = authenticateGodfatherOperator(req);

  if (!userAuth.authenticated && !gfAuth.authenticated) {
    return (userAuth.errorResponse || gfAuth.errorResponse)!;
  }

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action as 'schedule_5_days' | 'cancel_deletion' | 'permanent';
    const reason = body.reason || 'User requested account closure';

    const targetUid = (gfAuth.authenticated && body.uid) ? body.uid : (userAuth.user?.uid || body.uid);
    if (!targetUid) {
      return NextResponse.json({ success: false, error: 'User identifier required.' }, { status: 400 });
    }

    if (action === 'schedule_5_days') {
      const result = serverSecurityStore.scheduleAccountDeletion(targetUid, reason);
      if (!result.success || !result.user) {
        return NextResponse.json({ success: false, error: result.error || 'Failed to schedule deletion.' }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        action: 'schedule_5_days',
        message: 'Account deactivation successful. Deletion is scheduled in 5 days.',
        deletionScheduledAt: result.user.deletionScheduledAt,
        deletionEffectiveAt: result.user.deletionEffectiveAt,
        user: {
          uid: result.user.uid,
          status: result.user.status,
          deletionScheduledAt: result.user.deletionScheduledAt,
          deletionEffectiveAt: result.user.deletionEffectiveAt,
          deletionType: result.user.deletionType,
        },
      });
    }

    if (action === 'cancel_deletion') {
      const result = serverSecurityStore.cancelAccountDeletion(targetUid);
      if (!result.success || !result.user) {
        return NextResponse.json({ success: false, error: result.error || 'Failed to cancel deletion.' }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        action: 'cancel_deletion',
        message: 'Scheduled deletion has been cancelled. Account is now active.',
        user: {
          uid: result.user.uid,
          status: result.user.status,
        },
      });
    }

    if (action === 'permanent') {
      const result = serverSecurityStore.permanentlyDeleteAccount(targetUid, reason);
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error || 'Failed to permanently delete account.' }, { status: 400 });
      }

      const res = NextResponse.json({
        success: true,
        action: 'permanent',
        message: 'Account has been permanently and irreversibly purged from FR8X.',
      });

      // Clear all session cookies
      res.cookies.delete('fr8x_session');
      res.cookies.delete('__Secure-FR8X-Session');
      res.cookies.delete('fr8x_active_user_uid');

      return res;
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Must be schedule_5_days, cancel_deletion, or permanent.' },
      { status: 400 }
    );
  } catch (err: any) {
    console.error('[API/User/DeleteAccount] Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal account deletion error.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  // Support standard REST DELETE for immediate purge
  const body = await req.json().catch(() => ({ action: 'permanent' }));
  const reqWithAction = new NextRequest(req.url, {
    method: 'POST',
    headers: req.headers,
    body: JSON.stringify({ ...body, action: body.action || 'permanent' }),
  });
  return POST(reqWithAction);
}
