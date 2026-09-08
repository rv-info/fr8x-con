import { NextRequest, NextResponse } from 'next/server';
import { generateCorrelationId } from '@/lib/godfather/utils/audit';
import { resendOperatorFirstLoginOtp } from '@/lib/godfather/operator-store';

export async function POST(req: NextRequest) {
  const correlationId = generateCorrelationId();
  try {
    const body = await req.json().catch(() => ({}));
    const { challengeToken } = body;

    if (!challengeToken) {
      return NextResponse.json(
        { error: 'Challenge token is required.', correlationId },
        { status: 400 }
      );
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const resendResult = await resendOperatorFirstLoginOtp(String(challengeToken), ip);

    if (!resendResult.success) {
      return NextResponse.json(
        { error: resendResult.error || 'Failed to resend verification code.', correlationId },
        { status: 429 }
      );
    }

    if (resendResult.emailPromise) {
      try {
        await resendResult.emailPromise;
      } catch (mailErr: any) {
        console.error('[GodfatherResendAPI] OTP email delivery error:', mailErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'New verification code dispatched to registered email.',
      expiresIn: resendResult.expiresIn || 300,
      correlationId,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'An error occurred while resending the verification code.', correlationId },
      { status: 500 }
    );
  }
}
