import { NextRequest, NextResponse } from 'next/server';
import { serverSecurityStore } from '@/lib/server-auth-store';

export async function POST(req: NextRequest) {
  try {
    const { challengeToken } = await req.json().catch(() => ({}));

    if (!challengeToken) {
      return NextResponse.json(
        { success: false, error: 'Challenge token is required.' },
        { status: 400 }
      );
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const resendResult = serverSecurityStore.resendUserFirstLoginOtp(String(challengeToken), ip);

    if (!resendResult.success) {
      return NextResponse.json(
        { success: false, error: resendResult.error || 'Failed to resend code.' },
        { status: 429 }
      );
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
