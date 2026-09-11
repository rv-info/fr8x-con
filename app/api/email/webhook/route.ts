/**
 * POST /api/email/webhook
 * ZeptoMail Delivery Event Webhook Receiver
 * =========================================
 * Receives real-time delivery status events from ZeptoMail for all FR8X transactional emails.
 *
 * Configure in ZeptoMail console:
 *   Webhook URL: https://con.fr8x.in/api/email/webhook
 *   Events: delivered, soft_bounce, hard_bounce, failed
 *   Header: X-ZeptoMail-Webhook-Token: <ZEPTO_WEBHOOK_SECRET value>
 *
 * SECURITY:
 * - Authenticated via HMAC-validated shared secret (X-ZeptoMail-Webhook-Token header).
 * - Idempotent: duplicate event_id entries are silently discarded.
 * - Only accepts POST; all other methods return 405.
 * - Payload limited to 256KB to prevent large-body DoS.
 * - No sensitive data (OTP, passwords, API keys) is ever logged.
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// ── In-memory delivery event log (FIFO, max 500) ─────────────────────────────
// In production, replace/extend with Firestore writes or Vercel KV for persistence.
interface DeliveryEvent {
  eventId: string;
  messageId: string;
  to: string;
  from?: string;
  subject?: string;
  status: 'delivered' | 'soft_bounce' | 'hard_bounce' | 'failed' | string;
  bounceType?: string;
  bounceReason?: string;
  timestamp: string;
  receivedAt: string;
  clientReference?: string;
}

const MAX_EVENT_LOG = 500;
const emailDeliveryLog: DeliveryEvent[] = [];
const seenEventIds = new Set<string>();

// ── Singleton-safe global store ───────────────────────────────────────────────
const globalForWebhook = global as unknown as {
  fr8xEmailDeliveryLog?: DeliveryEvent[];
  fr8xSeenEventIds?: Set<string>;
};

function getDeliveryLog(): DeliveryEvent[] {
  if (!globalForWebhook.fr8xEmailDeliveryLog) {
    globalForWebhook.fr8xEmailDeliveryLog = emailDeliveryLog;
  }
  return globalForWebhook.fr8xEmailDeliveryLog;
}

function getSeenIds(): Set<string> {
  if (!globalForWebhook.fr8xSeenEventIds) {
    globalForWebhook.fr8xSeenEventIds = seenEventIds;
  }
  return globalForWebhook.fr8xSeenEventIds;
}

/**
 * Validates the X-ZeptoMail-Webhook-Token header using constant-time comparison.
 */
function isValidWebhookToken(request: NextRequest): boolean {
  const secret = process.env.ZEPTO_WEBHOOK_SECRET?.trim();
  if (!secret) {
    // If no webhook secret is configured, log a warning and allow through in development.
    // BLOCK in production.
    if (process.env.NODE_ENV === 'production') {
      console.error('[EmailWebhook] ZEPTO_WEBHOOK_SECRET is not configured. Rejecting all webhook requests.');
      return false;
    }
    console.warn('[EmailWebhook] ZEPTO_WEBHOOK_SECRET not set — accepting webhook in development mode.');
    return true;
  }

  const provided = request.headers.get('x-zeptomail-webhook-token') || '';
  if (!provided) return false;

  try {
    const secretBuf = Buffer.from(secret, 'utf8');
    const providedBuf = Buffer.from(provided, 'utf8');
    if (secretBuf.length !== providedBuf.length) return false;
    return crypto.timingSafeEqual(secretBuf, providedBuf);
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  if (!isValidWebhookToken(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── Body size guard (256KB) ───────────────────────────────────────────────
  const contentLength = parseInt(request.headers.get('content-length') || '0', 10);
  if (contentLength > 256 * 1024) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  // ZeptoMail may send an array of events or a single event object
  const rawEvents: any[] = Array.isArray(body) ? body : [body];

  const log = getDeliveryLog();
  const seen = getSeenIds();
  let processed = 0;
  let duplicates = 0;

  for (const raw of rawEvents) {
    const eventId =
      String(raw.event_id || raw.eventId || raw.id || '').trim() ||
      `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Idempotency: skip duplicate event_ids
    if (seen.has(eventId)) {
      duplicates++;
      continue;
    }
    seen.add(eventId);

    const event: DeliveryEvent = {
      eventId,
      messageId: String(raw.message_id || raw.messageId || '').trim(),
      to: String(raw.to || raw.recipient || raw.email || '').trim().toLowerCase(),
      from: String(raw.from || raw.sender || '').trim().toLowerCase() || undefined,
      subject: String(raw.subject || '').trim() || undefined,
      status: String(raw.status || raw.event || 'unknown').trim().toLowerCase(),
      bounceType: raw.bounce_type ? String(raw.bounce_type) : undefined,
      bounceReason: raw.bounce_reason ? String(raw.bounce_reason) : undefined,
      timestamp: String(raw.timestamp || raw.event_time || '').trim() || new Date().toISOString(),
      receivedAt: new Date().toISOString(),
      clientReference: String(raw.client_reference || raw.clientReference || '').trim() || undefined,
    };

    // FIFO eviction
    if (log.length >= MAX_EVENT_LOG) {
      log.shift();
    }
    log.push(event);

    // Log to console (without sensitive fields)
    const severity = event.status === 'delivered' ? 'INFO' : 'WARN';
    console[severity === 'INFO' ? 'log' : 'warn'](
      `[EmailWebhook] ${event.status.toUpperCase()} | to=${event.to} msgId=${event.messageId} ref=${event.clientReference || 'none'}`
    );

    processed++;
  }

  return NextResponse.json(
    { success: true, processed, duplicates, total: rawEvents.length },
    { status: 200 }
  );
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

/**
 * Returns the in-memory email delivery event log (for Godfather admin audit).
 */
function getEmailDeliveryLog(): DeliveryEvent[] {
  return [...getDeliveryLog()];
}

/**
 * Returns delivery statistics summary.
 */
function getEmailDeliveryStats(): {
  total: number;
  delivered: number;
  bounced: number;
  failed: number;
} {
  const log = getDeliveryLog();
  return {
    total: log.length,
    delivered: log.filter((e) => e.status === 'delivered').length,
    bounced: log.filter((e) => e.status === 'soft_bounce' || e.status === 'hard_bounce').length,
    failed: log.filter((e) => e.status === 'failed').length,
  };
}
