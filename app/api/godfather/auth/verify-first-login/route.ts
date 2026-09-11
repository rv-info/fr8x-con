import { NextRequest, NextResponse } from 'next/server';
import { generateCorrelationId } from '@/lib/godfather/utils/audit';
import {
  getAuthorizedOperatorEmail,
  verifyOperatorFirstLoginOtp,
} from '@/lib/godfather/operator-store';
import { createSignedSessionToken, generateSecureToken } from '@/lib/crypto';
import { serverSecurityStore } from '@/lib/server-auth-store';

export async function POST(req: NextRequest) {
  const correlationId = generateCorrelationId();
  try {
    const body = await req.json().catch(() => ({}));
    const { challengeToken, otp } = body;

    if (!challengeToken || !otp) {
      return NextResponse.json(
        { error: 'Challenge token and verification code are required.', correlationId },
        { status: 400 }
      );
    }

    const verifyResult = verifyOperatorFirstLoginOtp(String(challengeToken), String(otp));
    if (!verifyResult.success) {
      return NextResponse.json(
        { error: verifyResult.error || 'Verification failed.', correlationId },
        { status: 400 }
      );
    }

    // Upon successful OTP verification, create full sovereign operator session
    const authorizedEmail = getAuthorizedOperatorEmail();
    const sessionId = `SESS-${Date.now()}-${generateSecureToken(8).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();

    serverSecurityStore.registerGodfatherSession(sessionId);

    const sessionPayload = {
      sessionId,
      uid: 'gf-op-godfather',
      email: authorizedEmail,
      role: 'godfather_owner',
      issuedAt: Date.now(),
      expiresAt,
    };

    const signedSessionToken = createSignedSessionToken(sessionPayload);

    const response = NextResponse.json({
      success: true,
      message: 'First-time authentication verified. Session created.',
      sessionId,
      operator: {
        uid: 'gf-op-godfather',
        email: authorizedEmail,
        displayName: 'Chief Administrator',
        role: 'godfather_owner',
      },
      correlationId,
      expiresAt,
    });

    const isHttps = req.nextUrl.protocol === 'https:' && process.env.NODE_ENV === 'production';

    // SECURITY: SameSite=Strict for Godfather cookie — panel is never accessed via external link.
    response.cookies.set({
      name: 'fr8x_godfather_session',
      value: signedSessionToken,
      httpOnly: true,
      secure: isHttps,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 12,
    });

    if (isHttps) {
      response.cookies.set({
        name: '__Secure-FR8X-Godfather-Session',
        value: signedSessionToken,
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 12,
      });
    }

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: 'An error occurred during first-login verification.', correlationId },
      { status: 500 }
    );
  }
}
