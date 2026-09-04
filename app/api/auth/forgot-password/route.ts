import { NextRequest, NextResponse } from 'next/server';
import { serverSecurityStore } from '@/lib/server-auth-store';

/**
 * POST /api/auth/forgot-password
 * Initiates password reset for FR8X user accounts.
 * Enforces strict anti-enumeration:
 * Always returns "If an account exists for this email address, password reset instructions have been sent."
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email } = body;

    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json(
        { success: false, error: 'Corporate email address is required.' },
        { status: 400 }
      );
    }

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    serverSecurityStore.requestPasswordReset(email.trim(), ip);

    return NextResponse.json({
      success: true,
      message: 'If an account exists for this email address, password reset instructions have been sent.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Forgot password request failed.' },
      { status: 500 }
    );
  }
}
