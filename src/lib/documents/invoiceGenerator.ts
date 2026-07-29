// FR8X-CON Invoice Generator
// GST-compliant invoice generation service.
// Stores invoices in Firestore `invoices` collection.
// Used exclusively from server-side contexts (API routes).
// NEVER import this from "use client" components.

import { COLLECTIONS } from "@/lib/utils/constants";

export type InvoiceLineItem = {
  description: string;
  hsn?: string;       // HSN/SAC code for GST
  quantity: number;
  unitPrice: number;  // in base currency (pre-tax)
  gstRate: number;    // e.g. 18 for 18%
  cgstRate?: number;  // for intra-state: half of gstRate
  sgstRate?: number;  // for intra-state: half of gstRate
  igstRate?: number;  // for inter-state: full gstRate
};

export type InvoiceParty = {
  name: string;
  email?: string;
  address?: string;
  gstin?: string;
  pan?: string;
  stateCode?: string; // Indian state code for CGST/SGST vs IGST
};

export type GenerateInvoiceParams = {
  invoiceNumber?: string;  // auto-generated if not provided
  transactionId: string;
  userId: string;
  userEmail: string;
  issuer: InvoiceParty;   // company/platform details
  recipient: InvoiceParty; // customer details
  lineItems: InvoiceLineItem[];
  currency: string;        // ISO currency code e.g. "INR", "USD"
  paymentMethod?: string;
  membershipTier?: string;
  notes?: string;
  isInterState?: boolean;  // determines CGST+SGST vs IGST (India)
};

export type InvoiceDoc = {
  id: string;
  invoiceNumber: string;
  transactionId: string;
  userId: string;
  userEmail: string;
  issuer: InvoiceParty;
  recipient: InvoiceParty;
  lineItems: InvoiceLineItem[];
  currency: string;
  subtotal: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalTax: number;
  grandTotal: number;
  paymentMethod?: string;
  membershipTier?: string;
  notes?: string;
  status: "generated" | "sent" | "cancelled";
  generatedAt: string;
  sentAt?: string;
  pdfUrl?: string;
};

/**
 * Generates a GST-compliant invoice number.
 * Format: FR8X-INV-{YEAR}{MONTH}-{SEQ}
 */
export function generateInvoiceNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const seq = Math.floor(Math.random() * 900000) + 100000;
  return `FR8X-INV-${year}${month}-${seq}`;
}

/**
 * Calculates totals for all line items with GST breakdown.
 */
function calculateTotals(
  lineItems: InvoiceLineItem[],
  isInterState: boolean
): {
  subtotal: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalTax: number;
  grandTotal: number;
  processedItems: InvoiceLineItem[];
} {
  let subtotal = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;

  const processedItems = lineItems.map((item) => {
    const lineSubtotal = item.quantity * item.unitPrice;
    subtotal += lineSubtotal;

    if (isInterState) {
      const igstAmount = (lineSubtotal * item.gstRate) / 100;
      totalIgst += igstAmount;
      return {
        ...item,
        igstRate: item.gstRate,
        cgstRate: 0,
        sgstRate: 0,
      };
    } else {
      const halfRate = item.gstRate / 2;
      const cgst = (lineSubtotal * halfRate) / 100;
      const sgst = (lineSubtotal * halfRate) / 100;
      totalCgst += cgst;
      totalSgst += sgst;
      return {
        ...item,
        cgstRate: halfRate,
        sgstRate: halfRate,
        igstRate: 0,
      };
    }
  });

  const totalTax = totalCgst + totalSgst + totalIgst;
  const grandTotal = subtotal + totalTax;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    totalCgst: Math.round(totalCgst * 100) / 100,
    totalSgst: Math.round(totalSgst * 100) / 100,
    totalIgst: Math.round(totalIgst * 100) / 100,
    totalTax: Math.round(totalTax * 100) / 100,
    grandTotal: Math.round(grandTotal * 100) / 100,
    processedItems,
  };
}

/**
 * Generates a GST-compliant invoice and stores it in Firestore.
 * Returns the generated InvoiceDoc.
 *
 * This runs server-side only (called from API routes with Admin SDK or
 * server actions). The Firestore write uses the admin SDK client passed in,
 * or falls back to the client SDK for non-sensitive writes.
 *
 * @param params  Invoice generation parameters
 * @param firestoreSet  A function matching `(collection, id, data) => Promise<void>`
 *                      — pass Firebase Admin's setDoc or the client setDocument helper
 */
export async function generateInvoice(
  params: GenerateInvoiceParams,
  firestoreSet: (
    collection: string,
    id: string,
    data: Record<string, unknown>
  ) => Promise<void>
): Promise<InvoiceDoc> {
  const invoiceNumber = params.invoiceNumber ?? generateInvoiceNumber();
  const id = `inv_${params.transactionId}`;
  const isInterState = params.isInterState ?? true; // default: IGST

  const {
    subtotal,
    totalCgst,
    totalSgst,
    totalIgst,
    totalTax,
    grandTotal,
    processedItems,
  } = calculateTotals(params.lineItems, isInterState);

  const invoice: InvoiceDoc = {
    id,
    invoiceNumber,
    transactionId: params.transactionId,
    userId: params.userId,
    userEmail: params.userEmail,
    issuer: params.issuer,
    recipient: params.recipient,
    lineItems: processedItems,
    currency: params.currency,
    subtotal,
    totalCgst,
    totalSgst,
    totalIgst,
    totalTax,
    grandTotal,
    paymentMethod: params.paymentMethod,
    membershipTier: params.membershipTier,
    notes: params.notes,
    status: "generated",
    generatedAt: new Date().toISOString(),
  };

  await firestoreSet(COLLECTIONS.INVOICES, id, invoice as unknown as Record<string, unknown>);

  return invoice;
}

/**
 * Renders a plain-text invoice summary (for email body).
 */
export function renderInvoiceText(invoice: InvoiceDoc): string {
  const lines = [
    `INVOICE — ${invoice.invoiceNumber}`,
    `Date: ${new Date(invoice.generatedAt).toLocaleDateString("en-IN")}`,
    ``,
    `FROM: ${invoice.issuer.name}${invoice.issuer.gstin ? ` | GSTIN: ${invoice.issuer.gstin}` : ""}`,
    `TO: ${invoice.recipient.name} <${invoice.recipient.email ?? ""}>`,
    invoice.recipient.gstin ? `Recipient GSTIN: ${invoice.recipient.gstin}` : "",
    ``,
    `ITEMS:`,
    ...invoice.lineItems.map(
      (item) =>
        `  - ${item.description}: ${item.quantity} x ${invoice.currency} ${item.unitPrice.toFixed(2)} = ${invoice.currency} ${(item.quantity * item.unitPrice).toFixed(2)}`
    ),
    ``,
    `Subtotal:   ${invoice.currency} ${invoice.subtotal.toFixed(2)}`,
    invoice.totalCgst > 0
      ? `CGST:       ${invoice.currency} ${invoice.totalCgst.toFixed(2)}`
      : "",
    invoice.totalSgst > 0
      ? `SGST:       ${invoice.currency} ${invoice.totalSgst.toFixed(2)}`
      : "",
    invoice.totalIgst > 0
      ? `IGST:       ${invoice.currency} ${invoice.totalIgst.toFixed(2)}`
      : "",
    `Tax Total:  ${invoice.currency} ${invoice.totalTax.toFixed(2)}`,
    `GRAND TOTAL: ${invoice.currency} ${invoice.grandTotal.toFixed(2)}`,
    ``,
    `Transaction ID: ${invoice.transactionId}`,
    invoice.notes ? `Notes: ${invoice.notes}` : "",
  ]
    .filter((l) => l !== "")
    .join("\n");

  return lines;
}
