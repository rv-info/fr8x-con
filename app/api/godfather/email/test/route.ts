import { NextRequest, NextResponse } from 'next/server';
import { sendSystemEmail, checkSmtpHealth } from '@/lib/mailer';

/**
 * POST /api/godfather/email/test
 * Tests Zoho SMTP connectivity and dispatches a verification test email.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const recipient = body.recipient || 'tech@fr8x.in';

    const health = await checkSmtpHealth();

    const result = await sendSystemEmail({
      recipient,
      subject: `[FR8X TEST] Zoho Mail SMTP Diagnostic Check (${new Date().toLocaleTimeString('en-IN')})`,
      templateId: 'TMPL_SMTP_DIAGNOSTIC',
      templateName: 'Godfather SMTP Diagnostic Email',
      htmlBody: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 28px; background: #ffffff; color: #1e293b; border-radius: 12px; border: 1px solid #e2e8f0;">
          <div style="margin-bottom: 20px;">
            <span style="background: #2563eb; color: #ffffff; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: bold; letter-spacing: 0.05em;">FR8X SYSTEM EMAIL</span>
          </div>
          <h2 style="font-size: 20px; font-weight: 700; margin: 0 0 8px 0; color: #0f172a;">Zoho Mail SMTP Connected Successfully</h2>
          <p style="font-size: 14px; color: #475569; line-height: 1.5; margin: 0 0 20px 0;">
            This test confirmation verifies that your Zoho Mail SMTP dispatcher (<strong>${process.env.ZOHO_SMTP_USER || 'password@fr8x.in'}</strong>) is configured and successfully dispatching emails to <strong>${recipient}</strong>.
          </p>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px; font-size: 12px; font-family: monospace;">
            <div>Host: ${process.env.ZOHO_SMTP_HOST || 'smtp.zoho.in'}:${process.env.ZOHO_SMTP_PORT || 465}</div>
            <div>Sender: ${process.env.ZOHO_SMTP_USER || 'password@fr8x.in'}</div>
            <div>Timestamp: ${new Date().toISOString()}</div>
          </div>
          <p style="font-size: 12px; color: #94a3b8; margin: 0;">
            FR8X Platform Governance · CON.FR8X.IN
          </p>
        </div>
      `,
    });

    return NextResponse.json({
      success: result.success,
      health,
      result,
      recipient,
      smtpConfigured: Boolean(process.env.ZOHO_SMTP_PASSWORD),
      sender: process.env.ZOHO_SMTP_USER || 'password@fr8x.in',
      note: !process.env.ZOHO_SMTP_PASSWORD
        ? 'Zoho SMTP password is not yet configured in .env.local (ZOHO_SMTP_PASSWORD). Set your Zoho Mail App Password in .env.local for live outbound delivery.'
        : 'Dispatched via configured Zoho SMTP credentials.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'SMTP test execution failed' },
      { status: 500 }
    );
  }
}
