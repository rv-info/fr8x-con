import { NextRequest, NextResponse } from 'next/server';
import { serverSecurityStore } from '@/lib/server-auth-store';

/**
 * POST /api/auth/reset-password
 * Handles both:
 * 1. Dispatching Password Reset OTP to registered corporate email.
 * 2. Verifying OTP and resetting the password to unlock the account.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, action, otp, newPassword } = body;

    if (!email || !email.trim()) {
      return NextResponse.json(
        { success: false, error: 'Corporate email address is required.' },
        { status: 400 }
      );
    }

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

    // Verify OTP & Reset Password action
    if (action === 'verify_and_reset') {
      if (!otp || !otp.trim()) {
        return NextResponse.json(
          { success: false, error: '6-digit verification OTP is required.' },
          { status: 400 }
        );
      }
      if (!newPassword || newPassword.trim().length < 6) {
        return NextResponse.json(
          { success: false, error: 'New password must be at least 6 characters long.' },
          { status: 400 }
        );
      }

      const result = serverSecurityStore.verifyAndResetPassword(
        email.trim(),
        otp.trim(),
        newPassword.trim(),
        ip
      );

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: result.message,
        user: result.user ? {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          company: result.user.company,
        } : undefined,
      });
    }

    // Default: Request password reset OTP dispatch
    const result = serverSecurityStore.requestPasswordReset(email.trim(), ip);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Password reset request failed.' },
      { status: 500 }
    );
  }
}
