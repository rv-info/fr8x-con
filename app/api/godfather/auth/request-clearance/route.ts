import { NextRequest, NextResponse } from 'next/server';
import { generateCorrelationId } from '@/lib/godfather/utils/audit';
import { checkRateLimit } from '@/lib/crypto';
import { sendSecurityAlertEmail } from '@/lib/mailer';

export async function POST(req: NextRequest) {
  const correlationId = generateCorrelationId();
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

  try {
    const body = await req.json().catch(() => ({}));
    const { email, justification } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'A valid email address is required.', correlationId },
        { status: 400 }
      );
    }

    if (!justification || typeof justification !== 'string' || justification.trim().length < 10) {
      return NextResponse.json(
        { error: 'Please provide a clear operational justification (minimum 10 characters).', correlationId },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const rateKey = `clearance::${cleanEmail}`;
    const rateCheck = checkRateLimit(rateKey);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Too many clearance requests submitted. Please wait ${rateCheck.retryAfterSeconds} seconds before trying again.`,
          correlationId,
        },
        { status: 429 }
      );
    }

    const ticketId = `CLR-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Dispatch security clearance notice to tech@fr8x.in / security mailbox
    try {
      await sendSecurityAlertEmail(
        `GODFATHER Clearance Request [${ticketId}] from ${cleanEmail}`,
        `A clearance request for the FR8X Sovereign Control Plane was submitted.\n\nTicket: ${ticketId}\nApplicant: ${cleanEmail}\nIP: ${ip}\nJustification:\n${justification.trim()}`,
        correlationId,
        ip
      );
    } catch (mailErr: any) {
      console.warn('[ClearanceRequest] Email notification warning:', mailErr.message);
    }

    return NextResponse.json({
      success: true,
      ticketId,
      message: 'Clearance request submitted successfully. Routed to tech@fr8x.in.',
      correlationId,
    });
  } catch (err: any) {
    console.error('[ClearanceRequest] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Failed to process clearance request.', correlationId },
      { status: 500 }
    );
  }
}
