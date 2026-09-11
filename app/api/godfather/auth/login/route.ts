import { NextRequest, NextResponse } from 'next/server';
import { generateCorrelationId } from '@/lib/godfather/utils/audit';
import {
  getAuthorizedOperatorEmail,
  authenticateOperatorCredentials,
} from '@/lib/godfather/operator-store';
import { createSignedSessionToken, generateSecureToken } from '@/lib/crypto';
import { serverSecurityStore } from '@/lib/server-auth-store';

export async function POST(req: NextRequest) {
  const correlationId = generateCorrelationId();
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const normEmail = String(email).trim().toLowerCase();
    const authorizedEmail = getAuthorizedOperatorEmail();

    if (normEmail !== authorizedEmail) {
      return NextResponse.json(
        { error: 'Unable to sign in. Please check your credentials.' },
        { status: 401 }
      );
    }

    const authResult = await authenticateOperatorCredentials(String(password), ip);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || 'Unable to sign in. Please check your credentials.' },
        { status: authResult.isLocked ? 403 : 401 }
      );
    }

    if (authResult.firstLoginRequired) {
      if (authResult.emailPromise) {
        try {
          await authResult.emailPromise;
        } catch (mailErr: any) {
          console.error('[GodfatherAuthAPI] OTP email delivery error:', mailErr.message);
        }
      }

      return NextResponse.json({
        success: true,
        firstLoginRequired: true,
        challengeToken: authResult.challengeToken,
        email: authorizedEmail,
        expiresIn: authResult.expiresIn || 15,
        correlationId,
      });
    }

    const sessionId = `SESS-${Date.now()}-${generateSecureToken(8).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();

    // Register active session in server security store
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
      message: 'Authentication successful',
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
      { error: 'Authentication processing error' },
      { status: 500 }
    );
  }
}
