// FR8X-CON Payment Webhook Handler — Production
// Verifies webhook signature from Razorpay. Sets transaction status via Admin SDK.
// Never updates payment status from client side.

import { NextRequest, NextResponse } from "next/server";
import * as crypto from "crypto";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

const RAZORPAY_WEBHOOK_SECRET =
  process.env.RAZORPAY_WEBHOOK_SECRET || "";

function verifyRazorpaySignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  if (!secret) return false;
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(expectedSig, "hex"),
    Buffer.from(signature, "hex")
  );
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";

    // Verify Razorpay webhook signature
    if (RAZORPAY_WEBHOOK_SECRET) {
      if (!verifyRazorpaySignature(rawBody, signature, RAZORPAY_WEBHOOK_SECRET)) {
        return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;

    if (!paymentEntity?.id) {
      return NextResponse.json({ received: true });
    }

    const razorpayPaymentId = paymentEntity.id;
    const razorpayOrderId = paymentEntity.order_id;
    const amount = Math.round(paymentEntity.amount / 100); // Convert paise to INR
    const currency = paymentEntity.currency;
    const status = event === "payment.captured" ? "success" :
                   event === "payment.failed" ? "failed" : "pending";

    // Find transaction by gatewayReference (orderId)
    const txQuery = await adminDb
      .collection("transactions")
      .where("gatewayReference", "==", razorpayOrderId)
      .limit(1)
      .get();

    if (txQuery.empty) {
      // Log unmatched webhook for investigation
      await adminDb.collection("audit").add({
        type: "webhook_unmatched",
        event,
        razorpayPaymentId,
        razorpayOrderId,
        timestamp: FieldValue.serverTimestamp(),
      });
      return NextResponse.json({ received: true });
    }

    const txDoc = txQuery.docs[0];
    const txData = txDoc.data();

    // Update transaction status
    await txDoc.ref.update({
      status,
      razorpayPaymentId,
      amount,
      currency,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // If payment succeeded, trigger invoice generation
    if (status === "success") {
      await generateInvoice({
        transactionId: txDoc.id,
        userId: txData.userId,
        userEmail: txData.userEmail,
        amount,
        currency,
        membershipTier: txData.membershipTier,
        razorpayPaymentId,
      });
    }

    return NextResponse.json({ received: true, status });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

interface InvoiceParams {
  transactionId: string;
  userId: string;
  userEmail: string;
  amount: number;
  currency: string;
  membershipTier?: string;
  razorpayPaymentId: string;
}

async function generateInvoice(params: InvoiceParams): Promise<void> {
  const invoiceNumber = `FR8X-INV-${Date.now()}`;
  const gstRate = 0.18; // 18% GST
  const baseAmount = Math.round(params.amount / (1 + gstRate));
  const gstAmount = params.amount - baseAmount;

  const invoice = {
    invoiceNumber,
    transactionId: params.transactionId,
    userId: params.userId,
    userEmail: params.userEmail,
    amount: params.amount,
    baseAmount,
    gstAmount,
    gstRate: 18,
    currency: params.currency,
    membershipTier: params.membershipTier || "basic",
    razorpayPaymentId: params.razorpayPaymentId,
    status: "paid",
    issuedAt: FieldValue.serverTimestamp(),
    dueDate: null,
  };

  await adminDb.collection("invoices").doc(invoiceNumber).set(invoice);

  // Dispatch invoice email notification
  try {
    const origin = process.env.NEXT_PUBLIC_APP_URL || "https://fr8x.in";
    await fetch(`${origin}/api/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: params.userEmail,
        type: "welcome", // TODO: add dedicated invoice email type
        displayName: params.userEmail,
      }),
    });
  } catch {
    // Invoice email failure should not block webhook processing
  }
}
