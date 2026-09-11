import { NextRequest, NextResponse } from 'next/server';
import { serverSecurityStore } from '@/lib/server-auth-store';
import { otpStore } from '@/lib/otp-store';
import { verifySignedSessionToken } from '@/lib/crypto';

export async function POST(req: NextRequest) {
  try {
    const { challengeToken } = await req.json().catch(() => ({}));

    if (!challengeToken) {
      return NextResponse.json(
        { success: false, error: 'Challenge token is required.' },
        { status: 400 }
      );
    }

    const tokenCheck = verifySignedSessionToken<{
      challengeId: string;
      email: string;
      type: string;
    }>(String(challengeToken));

    if (!tokenCheck.valid || !tokenCheck.payload?.email) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired authentication challenge.' },
        { status: 401 }
      );
    }

    const cleanEmail = tokenCheck.payload.email.toLowerCase();

    // Distributed 60-second cooldown check (Vercel KV / Redis / in-memory)
    const cd = await otpStore.checkCooldown(`first_login:${cleanEmail}`, 60);
    if (cd.inCooldown) {
      return NextResponse.json(
        {
          success: false,
          error: `Please wait ${cd.waitSeconds} second(s) before requesting another verification code.`,
        },
        { status: 429 }
      );
    }

    // Distributed 3-per-25h send rate check
    const rate = await otpStore.recordOtpSend(cleanEmail, 3, 25 * 3600);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Verification code requests are temporarily restricted. Please try again later or contact support.',
        },
        { status: 429 }
      );
    }

    await otpStore.recordCooldown(`first_login:${cleanEmail}`, 60);

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const resendResult = serverSecurityStore.resendUserFirstLoginOtp(String(challengeToken), ip);

    if (!resendResult.success) {
      return NextResponse.json(
        { success: false, error: resendResult.error || 'Failed to resend code.' },
        { status: 429 }
      );
    }

    if (resendResult.emailPromise) {
      try {
        await resendResult.emailPromise;
      } catch (err: any) {
        console.error('[ResendFirstLoginOtpAPI] OTP email delivery error:', err.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'New verification code dispatched.',
      expiresIn: resendResult.expiresIn || 15,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Resend service error.' },
      { status: 500 }
    );
  }
}
