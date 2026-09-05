import { NextRequest, NextResponse } from 'next/server';
import { generateCorrelationId } from '@/lib/godfather/utils/audit';
import { sendSystemEmail } from '@/lib/mailer';
import { EmailService } from '@/lib/email-service';
import { serverSecurityStore } from '@/lib/server-auth-store';

export async function POST(req: NextRequest) {
  const correlationId = generateCorrelationId();
  try {
    // Protected backend test mechanism: verify authorized admin/godfather session or dev environment
    const sessionCookie =
      req.cookies.get('fr8x_godfather_session')?.value ||
      req.cookies.get('__Secure-FR8X-Godfather-Session')?.value;
    const authHeader = req.headers.get('authorization');
    const adminKey = process.env.ADMIN_API_KEY || process.env.GODFATHER_ADMIN_KEY;
    const isDev = process.env.NODE_ENV === 'development';

    const body = await req.json().catch(() => ({}));
    const { recipient, templateId, reason, actorRole, actorUid, preferredProvider, testType } = body;

    const isAuthorized =
      (sessionCookie && serverSecurityStore.isGodfatherSessionActive(sessionCookie)) ||
      (adminKey && authHeader === `Bearer ${adminKey}`) ||
      actorRole === 'godfather_owner' ||
      actorRole === 'godfather_operations' ||
      isDev;

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Forbidden: Test email send is restricted to authorized Godfather administrators' },
        { status: 403 }
      );
    }

    const targetRecipient =
      recipient || process.env.TEST_EMAIL_RECIPIENT || process.env.DEVELOPMENT_TEST_EMAIL || 'tech@fr8x.in';

    if (!targetRecipient || !targetRecipient.includes('@')) {
      return NextResponse.json({ error: 'Valid recipient email is required' }, { status: 400 });
    }

    // Official ZeptoMail integration test mode (Subject: FR8X ZEPTOMAIL TEST, From: password@fr8x.in)
    if (testType === 'zeptomail' || templateId === 'TMPL_ZEPTOMAIL_TEST' || preferredProvider === 'Zoho_ZeptoMail') {
      const result = await EmailService.sendTestEmail({
        to: targetRecipient,
        correlationId,
      });

      return NextResponse.json({
        success: result.success,
        correlationId: result.correlationId,
        messageId: result.messageId,
        provider: result.provider,
        sender: 'password@fr8x.in',
        subject: 'FR8X ZEPTOMAIL TEST',
        recipient: targetRecipient,
        error: result.error,
      });
    }

    if (!reason || reason.trim().length < 5) {
      return NextResponse.json({ error: 'Mandatory operational reason is required for test send' }, { status: 400 });
    }

    const htmlBody = `
      <div style="font-family: sans-serif; padding: 24px; background: #0f172a; color: #f8fafc; border-radius: 8px; border: 1px solid #334155;">
        <h2 style="color: #38bdf8; margin-top: 0;">🧪 FR8X Zoho Diagnostic Test</h2>
        <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6;">
          This is an authorized diagnostic test email dispatched from the FR8X GODFATHER Super Admin console.
        </p>
        <div style="background: #1e293b; padding: 14px; border-radius: 6px; font-size: 12px; font-family: monospace; margin: 16px 0;">
          <div>Template ID: ${templateId || 'DIAGNOSTIC_TEST'}</div>
          <div>Authorized By: ${actorUid || 'Operator'} (${actorRole || 'godfather_owner'})</div>
          <div>Operational Reason: ${reason}</div>
          <div>Preferred Provider: ${preferredProvider || 'Auto'}</div>
          <div>Timestamp: ${new Date().toUTCString()}</div>
        </div>
        <div style="font-size: 11px; color: #64748b; border-top: 1px solid #334155; padding-top: 10px;">
          Correlation ID: ${correlationId} · Provider: ${preferredProvider === 'Zoho_ZeptoMail' ? 'Zoho ZeptoMail API v1.1' : 'Zoho Secure Mail'}
        </div>
      </div>
    `;

    const result = await sendSystemEmail({
      recipient: targetRecipient,
      subject: `[FR8X TEST] ${preferredProvider === 'Zoho_ZeptoMail' ? 'ZeptoMail' : 'Zoho Mail'} Diagnostic — ${correlationId}`,
      templateId: templateId || 'TMPL_DIAGNOSTIC_TEST',
      templateName: preferredProvider === 'Zoho_ZeptoMail' ? 'ZeptoMail Diagnostic Test' : 'Godfather SMTP Diagnostic Test',
      htmlBody,
      correlationId,
      actorUid,
      preferredProvider,
    });

    return NextResponse.json({
      success: result.success,
      correlationId,
      logId: result.logId,
      messageId: result.messageId,
      provider: result.provider,
      status: result.status,
      error: result.error,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to dispatch test email' },
      { status: 500 }
    );
  }
}
