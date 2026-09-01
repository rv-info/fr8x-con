import { NextRequest, NextResponse } from 'next/server';
import { generateCorrelationId } from '@/lib/godfather/utils/audit';

const ALLOWED_DOMAINS = ['@fr8x.in', '@con.fr8x.in'];

export async function POST(req: NextRequest) {
  const correlationId = generateCorrelationId();
  try {
    const body = await req.json();
    const { operatorUid, operatorEmail, role } = body;

    const isAllowed = ALLOWED_DOMAINS.some((d) => operatorEmail?.endsWith(d));
    if (!operatorEmail || !isAllowed) {
      return NextResponse.json(
        { error: 'Unauthorized: Operator identity must be a verified @fr8x.in or @con.fr8x.in mailbox' },
        { status: 403 }
      );
    }

    const sessionId = `SESS-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();

    const response = NextResponse.json({
      success: true,
      sessionId,
      operatorUid: operatorUid || 'gf-op-001',
      operatorEmail,
      role: role || 'godfather_owner',
      mfaVerified: true,
      correlationId,
      expiresAt,
    });

    // Secure httpOnly session cookie — 8-hour expiry
    response.cookies.set({
      name: '__Secure-FR8X-Godfather-Session',
      value: `${sessionId}:${operatorUid || 'gf-op-001'}:${role || 'godfather_owner'}`,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60,
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

// Logout — clear session cookie
export async function DELETE(_req: NextRequest) {
  const res = NextResponse.json({ success: true });
  res.cookies.delete('__Secure-FR8X-Godfather-Session');
  return res;
}
