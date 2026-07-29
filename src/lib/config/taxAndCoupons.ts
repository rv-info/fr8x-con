// FR8X-CON Dynamic Tax Rules, Coupon Management & Invoice Configuration
"use client";

export interface CountryTaxConfig {
  countryCode: string;
  countryName: string;
  taxName: string; // e.g. GST, VAT, Sales Tax
  cgstRate: number; // e.g. 9%
  sgstRate: number; // e.g. 9%
  igstRate: number; // e.g. 18%
  vatRate: number;  // e.g. 20%
  salesTaxRate: number;
  isTaxEnabled: boolean;
}

export interface CouponRule {
  id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number; // e.g. 20 for 20% or 500 for ₹500
  validFrom: string;
  validUntil: string;
  maxUses: number;
  currentUses: number;
  firstTimeUserOnly: boolean;
  isReferral: boolean;
  isCorporate: boolean;
  isActive: boolean;
}

export interface InvoiceConfigurationDoc {
  companyLogo: string;
  companyName: string;
  gstNumber: string;
  panNumber: string;
  registeredAddress: string;
  invoicePrefix: string;
  invoiceNumberFormat: string;
  paymentTermsDays: number;
  termsAndConditions: string;
  footerText: string;
}

export const DEFAULT_TAX_CONFIGS: CountryTaxConfig[] = [
  {
    countryCode: "IN",
    countryName: "India",
    taxName: "GST (Goods & Services Tax)",
    cgstRate: 9,
    sgstRate: 9,
    igstRate: 18,
    vatRate: 0,
    salesTaxRate: 0,
    isTaxEnabled: true,
  },
  {
    countryCode: "AE",
    countryName: "United Arab Emirates",
    taxName: "VAT",
    cgstRate: 0,
    sgstRate: 0,
    igstRate: 0,
    vatRate: 5,
    salesTaxRate: 0,
    isTaxEnabled: true,
  },
  {
    countryCode: "GB",
    countryName: "United Kingdom",
    taxName: "VAT",
    cgstRate: 0,
    sgstRate: 0,
    igstRate: 0,
    vatRate: 20,
    salesTaxRate: 0,
    isTaxEnabled: true,
  },
  {
    countryCode: "US",
    countryName: "United States",
    taxName: "Sales Tax",
    cgstRate: 0,
    sgstRate: 0,
    igstRate: 0,
    vatRate: 0,
    salesTaxRate: 8.25,
    isTaxEnabled: true,
  },
];

export const DEFAULT_COUPONS: CouponRule[] = [
  {
    id: "cp_101",
    code: "WELCOME20",
    discountType: "percentage",
    discountValue: 20,
    validFrom: "2026-01-01",
    validUntil: "2026-12-31",
    maxUses: 500,
    currentUses: 42,
    firstTimeUserOnly: true,
    isReferral: false,
    isCorporate: false,
    isActive: true,
  },
  {
    id: "cp_102",
    code: "CORP500",
    discountType: "fixed",
    discountValue: 500,
    validFrom: "2026-06-01",
    validUntil: "2026-11-30",
    maxUses: 100,
    currentUses: 18,
    firstTimeUserOnly: false,
    isReferral: false,
    isCorporate: true,
    isActive: true,
  },
];

export const DEFAULT_INVOICE_CONFIG: InvoiceConfigurationDoc = {
  companyLogo: "/logo.png",
  companyName: "FR8X Logistics Technologies Pvt Ltd",
  gstNumber: "27AAACF8890A1Z2",
  panNumber: "AAACF8890A",
  registeredAddress: "Level 14, Commercial Tower 2, BKC, Mumbai 400051, India",
  invoicePrefix: "INV-2026-",
  invoiceNumberFormat: "PREFIX-YYYY-MM-XXXX",
  paymentTermsDays: 7,
  termsAndConditions: "Payment due within 7 days of invoice issue. All logistics charges subject to applicable GST/VAT rules.",
  footerText: "Thank you for choosing FR8X-CON — Enterprise Logistics Reverse-Auction Platform.",
};
