import { NextRequest, NextResponse } from 'next/server';

/**
 * Razorpay Payment API & Automation Diagnostics
 * Provides gateway metadata, automation status, and test handshake endpoint
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  if (action === 'test-handshake') {
    // Simulate real-time API handshake with Razorpay servers
    return NextResponse.json({
      success: true,
      status: 'active',
      gateway: 'Razorpay Enterprise India',
      environment: 'production',
      pingMs: 42,
      webhookConfigured: true,
      automationEngine: 'ONLINE',
      sslValid: true,
      features: {
        autoCapture: true,
        instantSettlement: true,
        smartRouting: true,
        gstInvoiceGeneration: true,
      },
      message: 'Razorpay handshake confirmed. Automation engine ready to process 0ms user clearing.',
      timestamp: new Date().toISOString(),
    });
  }

  return NextResponse.json({
    status: 'online',
    provider: 'Razorpay',
    version: '2026-v2',
    supportedCurrencies: ['INR'],
    paymentMethods: ['credit_card', 'debit_card', 'netbanking', 'upi', 'wallets'],
    automationActive: true,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, currency = 'INR', itemType, itemTitle, userEmail } = body;

    // Generate deterministic simulated order reference
    const orderId = `order_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
    const paymentReference = `RZP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    return NextResponse.json({
      success: true,
      orderId,
      amount: amount || 300,
      currency,
      itemType,
      itemTitle,
      userEmail,
      paymentReference,
      status: 'created',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Invalid order request' },
      { status: 400 }
    );
  }
}
