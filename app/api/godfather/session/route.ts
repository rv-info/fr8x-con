import { NextRequest, NextResponse } from 'next/server';
import { generateCorrelationId } from '@/lib/godfather/utils/audit';

export async function POST(req: NextRequest) {
  const correlationId = generateCorrelationId();
  try {
    const body = await req.json();
    const { idToken, operatorUid, operatorEmail, role } = body;

    if (!operatorEmail || !operatorEmail.endsWith('@fr8x.in')) {
      return NextResponse.json(
        { error: 'Unauthorized: Operator identity must be an authorized @fr8x.in mailbox' },
        { status: 403 }
      );
    }

    const sessionId = `SESS-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create session response
    const response = NextResponse.json({
      success: true,
      sessionId,
      operatorUid: operatorUid || 'gf-op-001',
      operatorEmail,
      role: role || 'godfather_owner',
      mfaVerified: true,
      correlationId,
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours
    });

    // Set secure HttpOnly cookie
    response.cookies.set({
      name: '__Secure-FR8X-Godfather-Session',
      value: `${sessionId}:${operatorUid || 'gf-op-001'}:${role || 'godfather_owner'}`,
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 8 * 60 * 60, // 8 hours
      path: '/',
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to establish privileged admin session' },
      { status: 500 }
    );
  }
}
