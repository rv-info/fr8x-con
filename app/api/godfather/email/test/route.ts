import { NextRequest, NextResponse } from 'next/server';
import { sendSystemEmail, getEmailHealth } from '@/lib/mailer';

export const dynamic = 'force-dynamic';

/**
 * POST /api/godfather/email/test
 * Tests production ZeptoMail REST API connectivity and dispatches a verification test email.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const recipient = body.recipient || 'tech@fr8x.in';
    const preferredProvider = (body.provider as 'Zoho_ZeptoMail' | 'Zoho_SMTP' | 'Zoho_Flow' | undefined) || 'Zoho_ZeptoMail';

    const health = await getEmailHealth();

    const isSmtpTest = preferredProvider === 'Zoho_SMTP';
    const providerTitle = isSmtpTest ? 'Zoho Mail SMTP (Legacy)' : 'Zoho ZeptoMail REST API';

    const result = await sendSystemEmail({
      recipient,
      subject: `[FR8X TEST] ${providerTitle} Diagnostic Check (${new Date().toLocaleTimeString('en-IN')})`,
      templateId: isSmtpTest ? 'TMPL_SMTP_DIAGNOSTIC' : 'TMPL_ZEPTOMAIL_DIAGNOSTIC',
      templateName: isSmtpTest ? 'Godfather SMTP Diagnostic Email' : 'Godfather ZeptoMail Diagnostic Email',
      preferredProvider,
      htmlBody: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 28px; background: #ffffff; color: #1e293b; border-radius: 12px; border: 1px solid #e2e8f0;">
          <div style="margin-bottom: 20px;">
            <span style="background: #2563eb; color: #ffffff; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: bold; letter-spacing: 0.05em;">FR8X SYSTEM EMAIL</span>
          </div>
          <h2 style="font-size: 20px; font-weight: 700; margin: 0 0 8px 0; color: #0f172a;">${providerTitle} Connected Successfully</h2>
          <p style="font-size: 14px; color: #475569; line-height: 1.5; margin: 0 0 20px 0;">
            This test confirmation verifies that your ${providerTitle} dispatcher (<strong>password@fr8x.in</strong>) is configured and successfully dispatching emails to <strong>${recipient}</strong>.
          </p>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px; font-size: 12px; font-family: monospace;">
            <div>Provider: ${isSmtpTest ? 'Zoho SMTP (Legacy Isolated)' : 'Zoho ZeptoMail (REST API v1.1)'}</div>
            <div>Endpoint: ${health.zeptoMailEndpoint || 'https://api.zeptomail.in/v1.1/email'}</div>
            <div>Agent: ${health.agent} (${health.agentAlias})</div>
            <div>Sender Identity: password@fr8x.in</div>
            <div>Bounce Address: ${health.bounceAddress || 'N/A'}</div>
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
      provider: result.provider,
      zeptoMailConfigured: health.zeptoMailConfigured,
      sender: 'password@fr8x.in',
      note: result.error
        ? `Dispatch error: ${result.error}`
        : `Successfully processed via ${result.provider}.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Email test execution failed' },
      { status: 500 }
    );
  }
}
