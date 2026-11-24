import { NextRequest, NextResponse } from 'next/server';
import { authenticateUserSession, authenticateGodfatherOperator } from '@/lib/auth-guard';
import {
  verifyBillingQuote,
  BillingQuote,
  AUTHORITATIVE_CATALOG,
} from '@/lib/billing/billing-engine';
import {
  evaluateEntitlement,
} from '@/lib/billing/free-access-manager';
import { saveTransaction } from '@/lib/db/transactions';
import { getDbClient } from '@/lib/supabase/server';

export const maxDuration = 10;

/**
 * POST /api/billing/checkout
 * Unified checkout endpoint for all chargeable services (subscriptions, jobs, ads, auctions).
 * If user/service has Free Entitlement: instantly waives fees and activates service directly.
 * If paid: verifies locked quote and initiates payment order.
 */
export async function POST(req: NextRequest) {
  const userAuth = authenticateUserSession(req);
  const gfAuth = authenticateGodfatherOperator(req);

  if (!userAuth.authenticated && !gfAuth.authenticated) {
    return (userAuth.errorResponse || gfAuth.errorResponse)!;
  }

  const callerUid = userAuth.user?.uid || gfAuth.operator?.uid || 'guest';
  const callerEmail = userAuth.user?.email || gfAuth.operator?.email || 'guest@fr8x.in';
  const callerRole = userAuth.user?.role || gfAuth.operator?.role || 'user';
  const callerCompanyId = userAuth.user?.companyId || null;

  try {
    const body = await req.json();
    const {
      serviceType = 'subscription',
      catalogKey,
      quote,
      itemDetails,
    } = body;

    // 1. Authoritative Server Entitlement Evaluation
    const entitlement = evaluateEntitlement({
      userId: callerUid,
      companyId: callerCompanyId,
      userRole: callerRole,
      serviceType,
    });

    // 2. CASE A: 100% FREE ENTITLEMENT (Godfather Sovereign Bypass)
    if (entitlement.isFree) {
      const orderId = `free_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const paymentId = `pay_waived_${Date.now()}`;

      // Save Transaction in Supabase DB with waived_promotional status
      const tx = await saveTransaction({
        order_id: orderId,
        payment_id: paymentId,
        user_id: callerUid,
        user_email: callerEmail,
        amount: 0,
        currency: quote?.targetCurrency || 'INR',
        plan_id: catalogKey || 'complimentary_access',
        item_type: serviceType,
        item_title: quote?.itemTitle || itemDetails?.title || 'FR8X Service',
        status: 'waived_promotional',
        gateway: 'FreeAccessEngine',
        raw_payload: {
          entitlement,
          itemDetails,
          activatedAt: new Date().toISOString(),
          waivedReason: entitlement.reason,
        },
      });

      // Handle service-specific direct activations
      if (serviceType === 'job' && itemDetails?.jobId) {
        try {
          const supabase = getDbClient();
          await supabase
            .from('jobs')
            .update({ status: 'active', payment_status: 'waived_promotional' })
            .eq('id', itemDetails.jobId);
        } catch (e) {
          console.warn('[checkout] Could not update job status directly in DB:', e);
        }
      }

      return NextResponse.json({
        success: true,
        isFree: true,
        paymentStatus: 'waived_promotional',
        paymentMethod: 'promotional_bypass',
        orderId,
        paymentId,
        transactionId: tx.id,
        message: 'Complimentary Access Granted — No Payment Required.',
        entitlement,
      });
    }

    // 3. CASE B: CHARGEABLE PAYMENT CHECKOUT
    if (!quote) {
      return NextResponse.json(
        { success: false, error: 'A valid BillingQuote is required for chargeable checkout.' },
        { status: 400 }
      );
    }

    // Verify quote signature and 15-minute TTL
    const verification = verifyBillingQuote(quote as BillingQuote);
    if (!verification.valid) {
      return NextResponse.json(
        { success: false, error: verification.reason || 'Invalid or expired quote.' },
        { status: 400 }
      );
    }

    // Generate Order via Razorpay Adapter or Fallback Engine
    const orderId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || 'rzp_live_fr8x_ind';

    // Record created transaction in Supabase
    const tx = await saveTransaction({
      order_id: orderId,
      user_id: callerUid,
      user_email: callerEmail,
      amount: quote.finalAmount,
      currency: quote.targetCurrency,
      plan_id: quote.itemId || catalogKey,
      item_type: quote.serviceType,
      item_title: quote.itemTitle,
      status: 'created',
      gateway: 'Razorpay',
      raw_payload: {
        quote,
        itemDetails,
        basePriceINR: quote.basePriceINR,
        exchangeRate: quote.exchangeRate,
        minorUnits: quote.minorUnits,
        createdAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      isFree: false,
      orderId,
      keyId,
      amount: quote.minorUnits,
      currency: quote.targetCurrency,
      displayAmount: quote.finalAmount,
      quote,
      transactionId: tx.id,
    });
  } catch (err: any) {
    console.error('[lib/billing/checkout] Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Checkout failed.' },
      { status: 500 }
    );
  }
}
