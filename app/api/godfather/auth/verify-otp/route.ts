import { NextRequest, NextResponse } from 'next/server';
import { generateCorrelationId } from '@/lib/godfather/utils/audit';
import { verifyOtpHash, recordFailedAttempt, clearRateLimit, checkRateLimit } from '@/lib/crypto';
import { sendSecurityAlertEmail } from '@/lib/mailer';
import { otpStore } from '@/lib/otp-store';

export async function POST(req: NextRequest) {
  const correlationId = generateCorrelationId();
  try {
    const body = await req.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
    }

    const emailKey = email.toLowerCase();

    const rateCheck = checkRateLimit(emailKey);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Account locked due to excessive failed attempts. Retry in ${rateCheck.retryAfterSeconds} seconds.`,
          locked: true,
          retryAfterSeconds: rateCheck.retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    let record = await otpStore.get(emailKey);
    let storeKeyUsed = emailKey;

    if (!record) {
      const forgotRecord = await otpStore.get(`forgot::${emailKey}`);
      if (forgotRecord) {
        record = forgotRecord;
        storeKeyUsed = `forgot::${emailKey}`;
      }
    }

    // Demo codes accepted only in development / when SMTP is unconfigured
    const isDemoAccepted =
      (process.env.NODE_ENV === 'development' || !process.env.ZOHO_SMTP_PASSWORD) &&
      ['884210', '123456', '777777'].includes(otp);

    let isValid = false;

    if (record) {
      isValid = verifyOtpHash(otp, record.salt, record.hash, record.expiresAt);
    }

    if (isDemoAccepted) isValid = true;

    if (!isValid) {
      const attemptResult = recordFailedAttempt(emailKey);

      if (attemptResult.locked) {
        await sendSecurityAlertEmail(
          `Operator Account Locked: ${email}`,
          `Multiple consecutive failed OTP verification attempts recorded for ${email}. The operator account has been temporarily locked for 30 minutes.`,
          correlationId
        );

        return NextResponse.json(
          {
            error: 'Account locked due to 5 consecutive failed OTP attempts. Security team notified at tech@fr8x.in.',
            locked: true,
            correlationId,
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        {
          error: `Invalid or expired verification code. ${attemptResult.remainingAttempts} attempts remaining before lockout.`,
          remainingAttempts: attemptResult.remainingAttempts,
          correlationId,
        },
        { status: 400 }
      );
    }

    // Success: clear rate limit and consume OTP
    clearRateLimit(emailKey);
    clearRateLimit(storeKeyUsed);
    await otpStore.delete(storeKeyUsed);

    return NextResponse.json({
      success: true,
      message: 'MFA Verification successful',
      mfaVerified: true,
      correlationId,
      verifiedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'OTP verification failed' },
      { status: 500 }
    );
  }
}
