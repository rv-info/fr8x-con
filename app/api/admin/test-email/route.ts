import { NextRequest, NextResponse } from 'next/server';
import { serverSecurityStore } from '@/lib/server-auth-store';
import { isValidEmailAddress } from '@/lib/email-service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/test-email
 * GET  /api/admin/test-email
 *
 * Dedicated, secure server-side diagnostic test endpoint for FR8X ZeptoMail integration.
 * Strictly adheres to Section 11 diagnostic specifications:
 * - Requires authenticated administrator authorization or dev environment
 * - Accepts a test recipient (defaults to password@fr8x.in)
 * - Uses FR8X_PRODUCTION Agent
 * - Uses password@fr8x.in sender identity
 * - Sends a simple test message via server-side ZeptoMail REST API
 * - Never returns API keys, SMTP passwords, or Firebase credentials
 * - Returns only safe provider status information
 */
async function handleTestEmail(req: NextRequest) {
  try {
    // 1. Authenticate Request: Admin API key, Godfather session, or Dev environment
    const authHeader = req.headers.get('authorization');
    const adminKey = process.env.ADMIN_API_KEY || process.env.GODFATHER_ADMIN_KEY;
    const sessionCookie =
      req.cookies.get('fr8x_godfather_session')?.value ||
      req.cookies.get('__Secure-FR8X-Godfather-Session')?.value;
    const isDev = process.env.NODE_ENV === 'development';

    const isAuthorized =
      (adminKey && authHeader === `Bearer ${adminKey}`) ||
      (sessionCookie && serverSecurityStore.isGodfatherSessionActive(sessionCookie)) ||
      isDev;

    if (!isAuthorized) {
      return NextResponse.json(
        {
          success: false,
          provider: 'zeptomail',
          status: 403,
          errorCategory: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 2. Parse target recipient
    let recipient = 'password@fr8x.in';
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      if (body.recipient && typeof body.recipient === 'string') {
        recipient = body.recipient.trim();
      }
    } else {
      const paramRecipient = req.nextUrl.searchParams.get('recipient');
      if (paramRecipient) {
        recipient = paramRecipient.trim();
      }
    }

    if (!isValidEmailAddress(recipient)) {
      return NextResponse.json(
        {
          success: false,
          provider: 'zeptomail',
          status: 400,
          errorCategory: 'REQUEST_VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    // 3. Verify server-side ZeptoMail API key configuration
    const apiKey = (
      process.env.ZEPTO_MAIL_API_KEY ||
      process.env.ZOHO_ZEPTOMAIL_TOKEN ||
      ''
    ).trim();

    if (!apiKey || apiKey === 'undefined' || apiKey.length < 5) {
      return NextResponse.json(
        {
          success: false,
          provider: 'zeptomail',
          status: 500,
          errorCategory: 'ENVIRONMENT_VARIABLE_MISSING',
        },
        { status: 500 }
      );
    }

    // 4. Resolve official ZeptoMail endpoint (India DC for FR8X_PRODUCTION)
    const endpoint =
      process.env.ZEPTO_MAIL_API_URL?.trim() ||
      process.env.ZEPTO_MAIL_URL?.trim() ||
      process.env.ZOHO_ZEPTOMAIL_URL?.trim() ||
      'https://api.zeptomail.in/v1.1/email';

    const cleanToken = apiKey.replace(/^zoho-enczapikey\s+/i, '').trim();
    const authHeaderVal = `Zoho-enczapikey ${cleanToken}`;

    const payload = {
      from: {
        address: 'password@fr8x.in',
        name: 'FR8X Security',
      },
      to: [
        {
          email_address: {
            address: recipient,
            name: 'FR8X Test Recipient',
          },
        },
      ],
      subject: 'FR8X ZEPTOMAIL TEST',
      htmlbody: '<div style="font-family:sans-serif;padding:16px;"><h3>FR8X ZeptoMail Diagnostic Test</h3><p>FR8X ZeptoMail integration test successful.</p><p style="color:#666;font-size:12px;">Agent: FR8X_PRODUCTION | Sender: password@fr8x.in</p></div>',
      textbody: 'FR8X ZeptoMail integration test successful. Agent: FR8X_PRODUCTION | Sender: password@fr8x.in',
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    let res: Response;
    try {
      res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: authHeaderVal,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (networkErr: any) {
      clearTimeout(timeoutId);
      return NextResponse.json(
        {
          success: false,
          provider: 'zeptomail',
          status: 504,
          errorCategory: 'NETWORK_ERROR',
        },
        { status: 504 }
      );
    }

    const resData = await res.json().catch(() => ({}));

    if (res.ok) {
      const messageId =
        resData?.data?.[0]?.message_id ||
        resData?.data?.[0]?.id ||
        resData?.request_id ||
        'zepto-test-ok';

      return NextResponse.json({
        success: true,
        provider: 'zeptomail',
        status: res.status,
        messageId,
      });
    }

    // Map error status to safe errorCategory
    let errorCategory = 'ZEPTOMAIL_PROVIDER_ERROR';
    if (res.status === 401) {
      errorCategory = 'AUTHENTICATION_FAILED';
    } else if (res.status === 400) {
      errorCategory = 'REQUEST_VALIDATION_ERROR';
    } else if (res.status === 404) {
      errorCategory = 'INVALID_ENDPOINT';
    } else if (res.status === 429) {
      errorCategory = 'RATE_LIMITED';
    }

    return NextResponse.json(
      {
        success: false,
        provider: 'zeptomail',
        status: res.status,
        errorCategory,
      },
      { status: res.status }
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        provider: 'zeptomail',
        status: 500,
        errorCategory: 'APPLICATION_LOGIC_ERROR',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return handleTestEmail(req);
}

export async function GET(req: NextRequest) {
  return handleTestEmail(req);
}
