import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { operatorUid, otp, actionName } = body;

    if (!operatorUid) {
      return NextResponse.json({ error: 'Missing operator UID' }, { status: 400 });
    }

    // SECURITY: Step-up OTP is read from GODFATHER_STEP_UP_OTP env var — never hard-coded in source.
    // Set this in .env.local (dev) or Vercel / deployment secrets (prod).
    const allowedOtp = process.env.GODFATHER_STEP_UP_OTP?.trim();
    if (!allowedOtp || otp !== allowedOtp) {
      return NextResponse.json(
        {
          error: 'Step-up verification failed: Invalid MFA / Hardware token code',
          stepUpVerified: false,
        },
        { status: 401 }
      );
    }

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const correlationId = `GF-STP-${Date.now().toString(36).toUpperCase()}`;

    return NextResponse.json({
      success: true,
      stepUpVerified: true,
      expiresAt,
      actionName,
      correlationId,
      message: 'Privileged step-up authorization granted for 15 minutes',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
