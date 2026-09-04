import { NextRequest, NextResponse } from 'next/server';
import { serverSecurityStore } from '@/lib/server-auth-store';

/**
 * POST /api/auth/reset-password
 * Handles:
 * 1. Initiating password reset (OTP & URL token dispatched to registered corporate email).
 * 2. Token-based reset (/reset-password/<token> with newPassword & confirmPassword).
 * 3. OTP-based reset (email, 6-digit OTP, newPassword).
 *
 * Security Policies:
 * - Anti-enumeration: returns generic message regardless of whether email exists.
 * - Single-use token and OTP invalidation upon completion.
 * - Minimum password length and strength enforcement.
 * - Password changed confirmation email dispatched from password@fr8x.in.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, action, token, otp, newPassword, confirmPassword } = body;
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';

    // 1. Reset via Cryptographic URL Token (from email link /reset-password/<token>)
    if (token || action === 'verify_token') {
      if (!token || !String(token).trim()) {
        return NextResponse.json(
          { success: false, error: 'Password reset token is required.' },
          { status: 400 }
        );
      }
      if (!newPassword || String(newPassword).trim().length < 8) {
        return NextResponse.json(
          { success: false, error: 'New password must be at least 8 characters long.' },
          { status: 400 }
        );
      }
      if (confirmPassword && newPassword !== confirmPassword) {
        return NextResponse.json(
          { success: false, error: 'New password and confirmation do not match.' },
          { status: 400 }
        );
      }

      const result = serverSecurityStore.verifyAndResetPasswordByToken({
        token: String(token).trim(),
        newPassword: String(newPassword).trim(),
        confirmPassword: confirmPassword ? String(confirmPassword).trim() : undefined,
        ip,
      });

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: result.message || 'Password successfully updated.',
        user: result.user
          ? {
              uid: result.user.uid,
              email: result.user.email,
              displayName: result.user.displayName,
              company: result.user.company,
            }
          : undefined,
      });
    }

    // 2. Reset via 6-digit OTP Code
    if (action === 'verify_and_reset' || otp) {
      if (!email || !String(email).trim()) {
        return NextResponse.json(
          { success: false, error: 'Corporate email address is required.' },
          { status: 400 }
        );
      }
      if (!otp || !String(otp).trim()) {
        return NextResponse.json(
          { success: false, error: '6-digit verification code is required.' },
          { status: 400 }
        );
      }
      if (!newPassword || String(newPassword).trim().length < 8) {
        return NextResponse.json(
          { success: false, error: 'New password must be at least 8 characters long.' },
          { status: 400 }
        );
      }

      const result = serverSecurityStore.verifyAndResetPassword(
        String(email).trim(),
        String(otp).trim(),
        String(newPassword).trim(),
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
        message: result.message || 'Password successfully updated.',
        user: result.user
          ? {
              uid: result.user.uid,
              email: result.user.email,
              displayName: result.user.displayName,
              company: result.user.company,
            }
          : undefined,
      });
    }

    // 3. Request Password Reset Instructions (Default)
    if (!email || !String(email).trim()) {
      return NextResponse.json(
        { success: false, error: 'Corporate email address is required.' },
        { status: 400 }
      );
    }

    const result = serverSecurityStore.requestPasswordReset(String(email).trim(), ip);
    return NextResponse.json({
      success: true,
      message:
        'If an account exists for this email address, password reset instructions have been sent.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Password reset request failed.' },
      { status: 500 }
    );
  }
}
