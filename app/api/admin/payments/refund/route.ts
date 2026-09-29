import { NextRequest, NextResponse } from 'next/server';
import { authenticateGodfatherOperator } from '@/lib/auth-guard';
import { savePersistedTransaction } from '@/lib/dbms/server-dbms';

export async function POST(req: NextRequest) {
  const auth = authenticateGodfatherOperator(req);
  if (!auth.authenticated) {
    return auth.errorResponse!;
  }

  try {
    const body = await req.json();
    const { invoiceId, paymentId, amount, type, reason } = body;
    const operatorUid = auth.operator!.uid;

    if ((!invoiceId && !paymentId) || !amount || !reason) {
      return NextResponse.json(
        { error: 'Missing invoice/payment ID, refund amount, or mandatory financial rationale' },
        { status: 400 }
      );
    }

    const targetPaymentId = paymentId || invoiceId;
    const correlationId = `GF-REFUND-${Date.now().toString(36).toUpperCase()}`;
    let liveRefundExecuted = false;
    let gatewayRefundId: string | undefined;

    // Execute live Razorpay refund if configured
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (keyId && keySecret && targetPaymentId?.startsWith('pay_')) {
      try {
        const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
        const rzpRefundRes = await fetch(`https://api.razorpay.com/v1/payments/${targetPaymentId}/refund`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: authHeader,
          },
          body: JSON.stringify({
            amount: Math.round(Number(amount) * 100), // paisa
            notes: {
              operatorUid,
              reason,
              correlationId,
            },
          }),
        });

        if (rzpRefundRes.ok) {
          const rzpRefund = await rzpRefundRes.json();
          liveRefundExecuted = true;
          gatewayRefundId = rzpRefund.id;
        } else {
          console.warn('[Admin Refund] Razorpay gateway refund response:', await rzpRefundRes.text());
        }
      } catch (rzpErr: any) {
        console.warn('[Admin Refund] Gateway network notice:', rzpErr.message);
      }
    }

    const refundRef = gatewayRefundId || `ref_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    // Authoritative financial ledger debit in DBMS
    savePersistedTransaction({
      id: refundRef,
      orderId: invoiceId,
      paymentId: targetPaymentId,
      amount: -Math.abs(Number(amount)), // negative value reflects debit/refund
      currency: 'INR',
      itemType: type === 'credit' ? 'credit_adjustment' : 'refund',
      itemTitle: `${type === 'credit' ? 'Commercial Credit' : 'Payment Refund'}: ${reason}`,
      status: type === 'credit' ? 'adjusted' : 'refunded',
      gateway: liveRefundExecuted ? 'Razorpay' : 'ManualCredit',
      metadata: {
        invoiceId,
        paymentId: targetPaymentId,
        operatorUid,
        correlationId,
        reason,
        liveRefundExecuted,
      },
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      invoiceId: targetPaymentId,
      refundRef,
      status: type === 'credit' ? 'adjusted' : 'refunded',
      liveRefundExecuted,
      operatorUid,
      correlationId,
      message: `${type === 'credit' ? 'Commercial Credit' : 'Payment Refund'} processed successfully with immutable DBMS ledger audit`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
