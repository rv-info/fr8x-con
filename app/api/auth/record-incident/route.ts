import { NextRequest, NextResponse } from 'next/server';
import { serverSecurityStore } from '@/lib/server-auth-store';

/**
 * POST /api/auth/record-incident
 * Records security & compliance incidents such as digital terms acceptance,
 * clickwrap consent timestamps, and registration audit events.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      type = 'TERMS_DIGITALLY_ACCEPTED',
      userEmail,
      uid,
      company,
      details,
      severity = 'INFO',
      termsVersion = 'v3.2',
      plan,
      promotionalMode,
    } = body || {};

    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: 'User corporate email is required.' },
        { status: 400 }
      );
    }

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Browser Client';

    const eventDetails =
      details ||
      `Digitally signed and accepted FR8X Master Terms of Service (${termsVersion}) during corporate registration for ${company || 'Corporate Entity'}. Plan: ${plan || 'standard'} [Mode: ${promotionalMode || 'standard'}]. User-Agent: ${userAgent.slice(0, 80)}`;

    serverSecurityStore.addSecurityEvent({
      type: type as any,
      severity: severity as any,
      userEmail: String(userEmail).trim().toLowerCase(),
      uid,
      company: company ? String(company).trim() : undefined,
      details: eventDetails,
      ipAddress: ip,
    });

    return NextResponse.json({
      success: true,
      message: 'Incident recorded successfully in Godfather security stream.',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to record security incident.' },
      { status: 500 }
    );
  }
}
