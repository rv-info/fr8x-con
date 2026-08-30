import { NextRequest, NextResponse } from 'next/server';
import { generateCorrelationId } from '@/lib/godfather/utils/audit';
import { sendSystemEmail } from '@/lib/mailer';

export async function POST(req: NextRequest) {
  const correlationId = generateCorrelationId();
  try {
    const body = await req.json();
    const { recipient, templateId, reason, actorRole, actorUid } = body;

    if (!recipient || !recipient.includes('@')) {
      return NextResponse.json({ error: 'Valid recipient email is required' }, { status: 400 });
    }

    if (!reason || reason.trim().length < 5) {
      return NextResponse.json({ error: 'Mandatory operational reason is required for test send' }, { status: 400 });
    }

    // Role check: restricted to godfather_owner or godfather_operations
    if (actorRole && actorRole !== 'godfather_owner' && actorRole !== 'godfather_operations') {
      return NextResponse.json(
        { error: 'Forbidden: Test email send is restricted to godfather_owner and godfather_operations' },
        { status: 403 }
      );
    }

    const htmlBody = `
      <div style="font-family: sans-serif; padding: 24px; background: #0f172a; color: #f8fafc; border-radius: 8px; border: 1px solid #334155;">
        <h2 style="color: #38bdf8; margin-top: 0;">🧪 FR8X Zoho SMTP Diagnostic Test</h2>
        <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6;">
          This is an authorized diagnostic test email dispatched from the FR8X GODFATHER Super Admin console.
        </p>
        <div style="background: #1e293b; padding: 14px; border-radius: 6px; font-size: 12px; font-family: monospace; margin: 16px 0;">
          <div>Template ID: ${templateId || 'DIAGNOSTIC_TEST'}</div>
          <div>Authorized By: ${actorUid || 'Operator'} (${actorRole || 'godfather_owner'})</div>
          <div>Operational Reason: ${reason}</div>
          <div>Timestamp: ${new Date().toUTCString()}</div>
        </div>
        <div style="font-size: 11px; color: #64748b; border-top: 1px solid #334155; padding-top: 10px;">
          Correlation ID: ${correlationId} · Provider: Zoho Secure Mail
        </div>
      </div>
    `;

    const result = await sendSystemEmail({
      recipient,
      subject: `[FR8X TEST] Zoho Mail Diagnostic Verification — ${correlationId}`,
      templateId: templateId || 'TMPL_DIAGNOSTIC_TEST',
      templateName: 'Godfather SMTP Diagnostic Test',
      htmlBody,
      correlationId,
      actorUid,
    });

    return NextResponse.json({
      success: result.success,
      correlationId,
      logId: result.logId,
      messageId: result.messageId,
      provider: result.provider,
      status: result.status,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to dispatch test email' },
      { status: 500 }
    );
  }
}
