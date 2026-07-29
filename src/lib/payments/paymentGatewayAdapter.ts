// FR8X-CON Provider-Independent Payment Architecture & Webhook Health Monitor
"use client";

export type PaymentProviderId =
  | "paypal"
  | "bank_transfer"
  | "upi"
  | "razorpay"
  | "stripe"
  | "payu"
  | "phonepe"
  | "wise"
  | "adyen";

export interface PaymentGatewayHealth {
  providerId: PaymentProviderId;
  name: string;
  isConnected: boolean;
  isActive: boolean;
  lastSuccessTimestamp?: string;
  lastFailureTimestamp?: string;
  lastRetryTimestamp?: string;
  pendingEventsCount: number;
  environment: "live" | "sandbox";
  statusMessage: string;
}

export interface PaymentTransactionRecord {
  id: string;
  invoiceNumber: string;
  userId: string;
  userName: string;
  companyName: string;
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  taxAmount: number;
  gateway: PaymentProviderId;
  transactionId: string;
  status: "completed" | "pending" | "failed" | "refunded" | "chargeback";
  refundStatus?: "none" | "partial" | "full";
  chargebackStatus?: "none" | "under_review" | "resolved";
  paymentDate: string;
}

export const SAMPLE_TRANSACTIONS: PaymentTransactionRecord[] = [
  {
    id: "tx_901",
    invoiceNumber: "INV-2026-0812",
    userId: "usr_apex_01",
    userName: "Rajat Rai",
    companyName: "Apex Global Logistics",
    planId: "basic",
    planName: "Basic Tier",
    amount: 1499,
    currency: "INR",
    taxAmount: 269.82,
    gateway: "upi",
    transactionId: "UPI-REF-992018",
    status: "completed",
    paymentDate: "2026-07-28T14:20:00Z",
  },
  {
    id: "tx_902",
    invoiceNumber: "INV-2026-0813",
    userId: "usr_mlo_02",
    userName: "John Smith",
    companyName: "Trans-Border Line Inc",
    planId: "professional",
    planName: "Professional Tier",
    amount: 75,
    currency: "USD",
    taxAmount: 0,
    gateway: "paypal",
    transactionId: "PAYPAL-TX-8829103",
    status: "completed",
    paymentDate: "2026-07-27T09:15:00Z",
  },
  {
    id: "tx_903",
    invoiceNumber: "INV-2026-0814",
    userId: "usr_nvocc_03",
    userName: "Amit Verma",
    companyName: "NVOCC Direct Services",
    planId: "basic",
    planName: "Basic Tier",
    amount: 1499,
    currency: "INR",
    taxAmount: 269.82,
    gateway: "bank_transfer",
    transactionId: "NEFT-IMPS-7761029",
    status: "pending",
    paymentDate: "2026-07-29T10:00:00Z",
  },
];

export const INITIAL_GATEWAY_HEALTH: Record<PaymentProviderId, PaymentGatewayHealth> = {
  paypal: {
    providerId: "paypal",
    name: "PayPal Global",
    isConnected: true,
    isActive: true,
    lastSuccessTimestamp: new Date(Date.now() - 3600000).toISOString(),
    lastFailureTimestamp: undefined,
    pendingEventsCount: 0,
    environment: "sandbox",
    statusMessage: "Connected & Receiving Webhooks",
  },
  bank_transfer: {
    providerId: "bank_transfer",
    name: "Direct Bank Transfer",
    isConnected: true,
    isActive: true,
    lastSuccessTimestamp: new Date(Date.now() - 7200000).toISOString(),
    pendingEventsCount: 1,
    environment: "live",
    statusMessage: "Manual Verification Queue Active",
  },
  upi: {
    providerId: "upi",
    name: "UPI / VPA Instant Payment",
    isConnected: true,
    isActive: true,
    lastSuccessTimestamp: new Date(Date.now() - 1800000).toISOString(),
    pendingEventsCount: 0,
    environment: "live",
    statusMessage: "QR & Auto-Reconcile Ready",
  },
  razorpay: {
    providerId: "razorpay",
    name: "Razorpay (Future Adapter)",
    isConnected: false,
    isActive: false,
    pendingEventsCount: 0,
    environment: "sandbox",
    statusMessage: "Adapter Ready for API Key",
  },
  stripe: {
    providerId: "stripe",
    name: "Stripe Enterprise (Future Adapter)",
    isConnected: false,
    isActive: false,
    pendingEventsCount: 0,
    environment: "sandbox",
    statusMessage: "Adapter Contract Defined",
  },
  payu: {
    providerId: "payu",
    name: "PayU India (Future Adapter)",
    isConnected: false,
    isActive: false,
    pendingEventsCount: 0,
    environment: "sandbox",
    statusMessage: "Standby Mode",
  },
  phonepe: {
    providerId: "phonepe",
    name: "PhonePe Business (Future Adapter)",
    isConnected: false,
    isActive: false,
    pendingEventsCount: 0,
    environment: "sandbox",
    statusMessage: "Standby Mode",
  },
  wise: {
    providerId: "wise",
    name: "Wise B2B Wire (Future Adapter)",
    isConnected: false,
    isActive: false,
    pendingEventsCount: 0,
    environment: "sandbox",
    statusMessage: "Standby Mode",
  },
  adyen: {
    providerId: "adyen",
    name: "Adyen Global (Future Adapter)",
    isConnected: false,
    isActive: false,
    pendingEventsCount: 0,
    environment: "sandbox",
    statusMessage: "Standby Mode",
  },
};
