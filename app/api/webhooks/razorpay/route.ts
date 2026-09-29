import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { recordIdempotentEventsBatchInDB } from '@/lib/firebase/firestore';
import { serverSecurityStore } from '@/lib/server-auth-store';
import { savePersistedTransaction } from '@/lib/dbms/server-dbms';
import { EmailService } from '@/lib/email-service';

/**
 * Razorpay Webhook Receiver
 * Handles incoming events: payment.captured, order.paid, payment.failed
 * Supports constant-time HMAC SHA256 signature verification, automatic plan entitlement
 * provisioning, authoritative Knox DBMS financial ledger recording, and transactional email dispatch.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();

    // Verify HMAC signature using constant-time comparison
    let isSignatureValid = false;
    if (signature && rawBody && webhookSecret) {
      try {
        const expectedSignature = crypto
          .createHmac('sha256', webhookSecret)
          .update(rawBody)
          .digest('hex');
        if (signature.length === expectedSignature.length) {
          isSignatureValid = crypto.timingSafeEqual(
            Buffer.from(signature, 'utf8'),
            Buffer.from(expectedSignature, 'utf8')
          );
        }
      } catch (err) {
        console.warn('[Razorpay Webhook] Signature computation error:', err);
      }
    }

    // Security Gate: If webhook secret is configured, strictly enforce signature verification across all environments
    if (webhookSecret && !isSignatureValid) {
      console.error('[Razorpay Webhook] Rejected: Invalid or missing x-razorpay-signature.');
      return NextResponse.json(
        { received: false, error: 'Unauthorized: Invalid webhook signature' },
        { status: 401 }
      );
    }

    // Production security guard: fail closed if secret is completely unconfigured in production
    if (process.env.NODE_ENV === 'production' && !webhookSecret) {
      console.error('[Razorpay Webhook] Rejected: RAZORPAY_WEBHOOK_SECRET is unconfigured in production environment.');
      return NextResponse.json(
        { received: false, error: 'Server Configuration Error: Webhook receiver disabled.' },
        { status: 500 }
      );
    }

    let payload: any = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      payload = { event: 'ping', test: true };
    }

    const event = payload.event || 'test.ping';
    const paymentEntity = payload.payload?.payment?.entity || {};
    const orderEntity = payload.payload?.order?.entity || {};

    const paymentId = paymentEntity.id || payload.id || `pay_${Date.now()}`;
    const orderId = paymentEntity.order_id || orderEntity.id || null;
    const amount = paymentEntity.amount
      ? paymentEntity.amount / 100
      : (orderEntity.amount ? orderEntity.amount / 100 : 0);
    const currency = paymentEntity.currency || orderEntity.currency || 'INR';
    const status = paymentEntity.status || (event === 'payment.failed' ? 'failed' : 'captured');

    const notes = paymentEntity.notes || orderEntity.notes || {};
    const userEmail = (notes.userEmail || notes.email || '').trim().toLowerCase();
    const userId = (notes.userId || notes.uid || '').trim();
    const planId = (notes.planId || notes.plan || '').trim().toLowerCase();
    const itemTitle = notes.itemTitle || (planId ? `${planId.toUpperCase()} Plan` : 'FR8X Subscription');
    const itemType = notes.itemType || 'subscription';

    console.log(`[Razorpay Webhook] Received event=${event}, paymentId=${paymentId}, amount=${amount}, planId=${planId}`);

    // 1. Authoritative Financial Transaction Persistence in Server DBMS
    try {
      savePersistedTransaction({
        id: `tx_${paymentId}`,
        orderId: orderId || undefined,
        paymentId,
        userId: userId || undefined,
        userEmail: userEmail || undefined,
        amount,
        currency,
        planId: planId || undefined,
        itemType,
        itemTitle,
        status: status === 'failed' ? 'failed' : 'captured',
        gateway: 'Razorpay',
        metadata: {
          eventId: payload.id,
          event,
          signatureVerified: Boolean(isSignatureValid),
          notes,
        },
        createdAt: new Date().toISOString(),
      });
    } catch (dbmsErr: any) {
      console.error('[Razorpay Webhook] Failed to persist transaction in DBMS:', dbmsErr.message);
    }

    // 2. Automatic User Plan Entitlement Provisioning (Finding PAY-02)
    const isPaymentSuccessful = event === 'payment.captured' || event === 'order.paid' || status === 'captured';
    if (isPaymentSuccessful) {
      const userIdentifier = userId || userEmail;
      if (userIdentifier && planId) {
        try {
          const upgradeRes = serverSecurityStore.updateUserPlan(userIdentifier, planId, {
            paymentReference: paymentId,
            upgradedBy: 'razorpay_webhook_automated',
          });
          if (upgradeRes.success) {
            console.info(`[Razorpay Webhook] Upgraded user ${userIdentifier} to plan '${planId}'`);
          } else {
            console.warn(`[Razorpay Webhook] Plan upgrade status: ${upgradeRes.error}`);
          }
        } catch (planErr: any) {
          console.error('[Razorpay Webhook] Plan upgrade exception:', planErr.message);
        }
      }

      // 3. Transactional Receipt Email Dispatch via ZeptoMail
      if (userEmail) {
        try {
          await EmailService.sendTransactionalEmail({
            type: 'SUPPORT_NOTIFICATION',
            to: userEmail,
            subject: `Payment Receipt: ${itemTitle} (${currency} ${amount})`,
            html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b;">
              <h2 style="color: #0f172a; margin-bottom: 8px;">FR8X Payment Confirmation</h2>
              <p style="color: #475569; font-size: 14px;">Your payment for <strong>${itemTitle}</strong> has been successfully verified.</p>
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                  <tr><td style="padding: 6px 0; color: #64748b;">Payment Reference:</td><td style="padding: 6px 0; font-family: monospace; font-weight: bold;">${paymentId}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748b;">Amount:</td><td style="padding: 6px 0; font-weight: bold;">${currency} ${amount.toFixed(2)}</td></tr>
                  ${planId ? `<tr><td style="padding: 6px 0; color: #64748b;">Subscription Plan:</td><td style="padding: 6px 0; text-transform: uppercase; font-weight: bold; color: #0284c7;">${planId}</td></tr>` : ''}
                  <tr><td style="padding: 6px 0; color: #64748b;">Status:</td><td style="padding: 6px 0; color: #16a34a; font-weight: bold;">PAID &amp; SETTLED</td></tr>
                </table>
              </div>
              <p style="font-size: 12px; color: #94a3b8;">This is an automated financial notification generated by FR8X Global Logistics Cloud.</p>
            </div>`,
            text: `FR8X Payment Confirmed: ${itemTitle} (${currency} ${amount}). Reference: ${paymentId}. Status: PAID.`,
            clientReference: paymentId,
          });
        } catch (emailErr: any) {
          console.warn('[Razorpay Webhook] Non-blocking receipt email dispatch notice:', emailErr.message);
        }
      }
    }

    // 4. Idempotent audit recording in Firestore
    try {
      await recordIdempotentEventsBatchInDB([
        {
          eventId: `rzp_evt_${payload.id || paymentId}`,
          eventType: status === 'failed' ? 'payment_failed' : 'payment_captured',
          actorId: userEmail || 'system',
          targetId: paymentId,
          targetType: 'razorpay_payment',
          sourceSurface: 'godfather',
          correlationId: `corr_rzp_${paymentId}`,
          rankingVersion: 'v2',
          timestamp: new Date().toISOString(),
          metadata: {
            paymentId,
            orderId,
            amount,
            status,
            planId,
            signatureVerified: Boolean(isSignatureValid),
          },
        },
      ]);
    } catch (auditErr: any) {
      console.warn('[Razorpay Webhook] Non-blocking audit recording notice:', auditErr?.message);
    }

    return NextResponse.json({
      received: true,
      event,
      paymentId,
      status,
      signatureVerified: isSignatureValid,
      planFulfilled: Boolean(isPaymentSuccessful && planId),
      timestamp: new Date().toISOString(),
      message: 'Razorpay webhook processed, entitled, and recorded in DBMS.',
    });
  } catch (error: any) {
    console.error('Error handling Razorpay webhook:', error);
    return NextResponse.json(
      { received: false, error: error?.message || 'Internal webhook error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    gateway: 'Razorpay Enterprise Payments',
    webhookEndpoint: '/api/webhooks/razorpay',
    methodsSupported: ['card', 'netbanking', 'upi', 'wallet', 'emi'],
    timestamp: new Date().toISOString(),
  });
}
