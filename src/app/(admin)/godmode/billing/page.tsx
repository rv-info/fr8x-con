// FR8X-CON GodMode Enterprise Billing, Subscription & Payment Control Center
"use client";

import { useState, useEffect, useRef } from "react";
import {
  CreditCard,
  DollarSign,
  Building2,
  QrCode,
  Save,
  CheckCircle,
  Activity,
  Download,
  Plus,
  RefreshCw,
  FileSpreadsheet,
  Ticket,
  Percent,
  FileText,
  ShieldCheck,
  Eye,
  Trash2,
  Sliders,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import {
  getGodModePaymentDetails,
  DEFAULT_GODMODE_PAYMENT_DETAILS,
  type GodModePaymentDetails,
} from "@/lib/utils/payment";
import {
  getStoredSubscriptionPlans,
  saveSubscriptionPlans,
  type SubscriptionPlan,
} from "@/lib/config/subscriptionPlans";
import {
  INITIAL_GATEWAY_HEALTH,
  SAMPLE_TRANSACTIONS,
  type PaymentGatewayHealth,
  type PaymentTransactionRecord,
} from "@/lib/payments/paymentGatewayAdapter";
import {
  renderQrToCanvas,
  downloadUpiQrPng,
  generateUpiUri,
} from "@/lib/payments/upiQrGenerator";
import {
  DEFAULT_TAX_CONFIGS,
  DEFAULT_COUPONS,
  DEFAULT_INVOICE_CONFIG,
  type CountryTaxConfig,
  type CouponRule,
  type InvoiceConfigurationDoc,
} from "@/lib/config/taxAndCoupons";
import { logAuditAction } from "@/lib/utils/auditLogger";

export default function GodModeBillingPage() {
  // 1. Payment Gateway Details State
  const [details, setDetails] = useState<GodModePaymentDetails>(DEFAULT_GODMODE_PAYMENT_DETAILS);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // 2. Subscription Plans State
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("basic");

  // 3. Payment Gateway Health & Transactions State
  const [healthMap, setHealthMap] = useState<Record<string, PaymentGatewayHealth>>(INITIAL_GATEWAY_HEALTH);
  const [transactions, setTransactions] = useState<PaymentTransactionRecord[]>(SAMPLE_TRANSACTIONS);
  const [txFilterGateway, setTxFilterGateway] = useState<string>("all");

  // 4. Tax, Coupons, Invoice State
  const [taxes, setTaxes] = useState<CountryTaxConfig[]>(DEFAULT_TAX_CONFIGS);
  const [coupons, setCoupons] = useState<CouponRule[]>(DEFAULT_COUPONS);
  const [invoiceConfig, setInvoiceConfig] = useState<InvoiceConfigurationDoc>(DEFAULT_INVOICE_CONFIG);

  // Coupon Creation Form
  const [showAddCoupon, setShowAddCoupon] = useState(false);
  const [newCouponCode, setNewCouponCode] = useState("");
  const [newCouponValue, setNewCouponValue] = useState("10");
  const [newCouponType, setNewCouponType] = useState<"percentage" | "fixed">("percentage");

  // UPI QR Canvas Ref
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showQrPreviewModal, setShowQrPreviewModal] = useState(false);

  useEffect(() => {
    setDetails(getGodModePaymentDetails());
    setPlans(getStoredSubscriptionPlans());
  }, []);

  // Render QR Canvas when UPI ID or Merchant Name changes
  useEffect(() => {
    if (qrCanvasRef.current && details.upiId) {
      const uri = generateUpiUri(details.upiId, details.vpaName || "FR8X Enterprise");
      renderQrToCanvas(qrCanvasRef.current, uri, 180);
    }
  }, [details.upiId, details.vpaName, showQrPreviewModal]);

  const handleSavePaymentDetails = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem("fr8x_godmode_payment_details", JSON.stringify(details));
      window.dispatchEvent(new Event("fr8x_payment_details_updated"));

      logAuditAction({
        action: "UPDATE_PAYMENT_CONFIG",
        module: "Billing & Gateways",
        details: `GodMode updated PayPal (${details.paypalEmail}) and UPI (${details.upiId}) configurations.`,
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save payment details:", err);
    }
  };

  const handleSavePlans = () => {
    saveSubscriptionPlans(plans);
    logAuditAction({
      action: "UPDATE_SUBSCRIPTION_PLANS",
      module: "Subscription Plans",
      details: "GodMode updated enterprise subscription tier pricing & usage limits.",
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handlePlanLimitChange = (planId: string, key: keyof SubscriptionPlan, value: any) => {
    setPlans((prev) =>
      prev.map((p) => (p.id === planId ? { ...p, [key]: value } : p))
    );
  };

  const handleAddCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim()) return;

    const newCoupon: CouponRule = {
      id: `cp_${Date.now()}`,
      code: newCouponCode.trim().toUpperCase(),
      discountType: newCouponType,
      discountValue: parseFloat(newCouponValue) || 0,
      validFrom: "2026-01-01",
      validUntil: "2026-12-31",
      maxUses: 250,
      currentUses: 0,
      firstTimeUserOnly: false,
      isReferral: false,
      isCorporate: false,
      isActive: true,
    };

    setCoupons([newCoupon, ...coupons]);
    setNewCouponCode("");
    setShowAddCoupon(false);
  };

  const handleExportTransactionsCSV = () => {
    const headers = ["InvoiceNo,User,Company,Plan,Amount,Currency,Tax,Gateway,TxID,Status,Date"];
    const rows = transactions.map(
      (t) =>
        `${t.invoiceNumber},"${t.userName}","${t.companyName}",${t.planName},${t.amount},${t.currency},${t.taxAmount},${t.gateway},${t.transactionId},${t.status},${t.paymentDate}`
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `FR8X_Transactions_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[0];

  const filteredTx = transactions.filter((t) => {
    if (txFilterGateway === "all") return true;
    return t.gateway === txFilterGateway;
  });

  return (
    <div className="space-y-6 w-full max-w-full pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-[var(--fr8x-periwinkle)]" />
            <h1 className="text-display-sm font-bold text-[var(--fr8x-jet)]">
              Enterprise Billing & Subscription Control Center
            </h1>
          </div>
          <p className="text-body-sm text-foreground-secondary mt-1">
            Configure subscription tiers, payment gateways, live UPI QR generation, webhook health, taxes, coupons, and invoices.
          </p>
        </div>

        {savedSuccess && (
          <div className="fr8x-badge-active flex items-center gap-1 py-1.5 px-3 text-caption font-bold shadow-xs">
            <CheckCircle className="h-4 w-4" /> Configuration Saved Live!
          </div>
        )}
      </div>

      {/* ═══ SECTION 1: SUBSCRIPTION PLANS MANAGEMENT ═══ */}
      <div className="fr8x-card p-6 bg-white space-y-6 border-l-4 border-l-[var(--fr8x-periwinkle)]">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="text-heading-md font-bold text-[var(--fr8x-jet)] flex items-center gap-2">
              <Sliders className="h-5 w-5 text-[var(--fr8x-periwinkle)]" />
              1. Dynamic Subscription Plans & Feature Limits
            </h2>
            <p className="text-caption text-foreground-secondary mt-0.5">
              Edit pricing tiers, quotas, and feature flags dynamically without redeploying code
            </p>
          </div>
          <button
            onClick={handleSavePlans}
            className="fr8x-btn-primary bg-[#56C5F0] hover:bg-[#3ABFF0] px-4 py-1.5 text-caption font-bold flex items-center gap-1.5"
          >
            <Save className="h-3.5 w-3.5" /> Save Subscription Config
          </button>
        </div>

        {/* Tier Selector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {plans.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPlanId(p.id)}
              className={`px-3.5 py-1.5 rounded-lg text-body-sm font-bold transition-all whitespace-nowrap border ${
                selectedPlanId === p.id
                  ? "bg-[var(--fr8x-periwinkle)] text-white border-[var(--fr8x-periwinkle)] shadow-xs"
                  : "bg-slate-50 text-[var(--fr8x-jet)] border-slate-200 hover:bg-slate-100"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Selected Tier Editor Form */}
        {selectedPlan && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-heading-sm font-bold text-[var(--fr8x-jet)]">
                Editing: {selectedPlan.name} Settings
              </h3>
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedPlan.isActive}
                  onChange={(e) => handlePlanLimitChange(selectedPlan.id, "isActive", e.target.checked)}
                  className="accent-[var(--fr8x-periwinkle)]"
                />
                Active Tier
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-body-sm">
              <div>
                <label className="fr8x-label block mb-1 text-xs">Monthly Price (INR ₹)</label>
                <input
                  type="number"
                  value={selectedPlan.monthlyPriceINR}
                  onChange={(e) => handlePlanLimitChange(selectedPlan.id, "monthlyPriceINR", parseFloat(e.target.value) || 0)}
                  className="fr8x-input font-bold"
                />
              </div>

              <div>
                <label className="fr8x-label block mb-1 text-xs">Monthly Price (USD $)</label>
                <input
                  type="number"
                  value={selectedPlan.monthlyPriceUSD}
                  onChange={(e) => handlePlanLimitChange(selectedPlan.id, "monthlyPriceUSD", parseFloat(e.target.value) || 0)}
                  className="fr8x-input font-bold"
                />
              </div>

              <div>
                <label className="fr8x-label block mb-1 text-xs">Trial Duration (Days)</label>
                <input
                  type="number"
                  value={selectedPlan.trialDurationDays}
                  onChange={(e) => handlePlanLimitChange(selectedPlan.id, "trialDurationDays", parseInt(e.target.value) || 0)}
                  className="fr8x-input"
                />
              </div>

              <div>
                <label className="fr8x-label block mb-1 text-xs">Max Users Per Org (-1 = Unlimited)</label>
                <input
                  type="number"
                  value={selectedPlan.maxUsers}
                  onChange={(e) => handlePlanLimitChange(selectedPlan.id, "maxUsers", parseInt(e.target.value) || 0)}
                  className="fr8x-input"
                />
              </div>

              <div>
                <label className="fr8x-label block mb-1 text-xs">Storage Limit (MB)</label>
                <input
                  type="number"
                  value={selectedPlan.storageLimitMB}
                  onChange={(e) => handlePlanLimitChange(selectedPlan.id, "storageLimitMB", parseInt(e.target.value) || 0)}
                  className="fr8x-input"
                />
              </div>

              <div>
                <label className="fr8x-label block mb-1 text-xs">Reverse Auctions Limit</label>
                <input
                  type="number"
                  value={selectedPlan.reverseAuctionsLimit}
                  onChange={(e) => handlePlanLimitChange(selectedPlan.id, "reverseAuctionsLimit", parseInt(e.target.value) || 0)}
                  className="fr8x-input"
                />
              </div>

              <div>
                <label className="fr8x-label block mb-1 text-xs">Rate Posting Limit</label>
                <input
                  type="number"
                  value={selectedPlan.ratePostingLimit}
                  onChange={(e) => handlePlanLimitChange(selectedPlan.id, "ratePostingLimit", parseInt(e.target.value) || 0)}
                  className="fr8x-input"
                />
              </div>

              <div>
                <label className="fr8x-label block mb-1 text-xs">Logistics Jobs Limit</label>
                <input
                  type="number"
                  value={selectedPlan.jobsLimit}
                  onChange={(e) => handlePlanLimitChange(selectedPlan.id, "jobsLimit", parseInt(e.target.value) || 0)}
                  className="fr8x-input"
                />
              </div>
            </div>

            {/* Feature Flags Toggles */}
            <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 text-caption">
              <label className="flex items-center gap-2 cursor-pointer font-semibold">
                <input
                  type="checkbox"
                  checked={selectedPlan.messagingAccess}
                  onChange={(e) => handlePlanLimitChange(selectedPlan.id, "messagingAccess", e.target.checked)}
                />
                Messaging Access
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-semibold">
                <input
                  type="checkbox"
                  checked={selectedPlan.adAccess}
                  onChange={(e) => handlePlanLimitChange(selectedPlan.id, "adAccess", e.target.checked)}
                />
                Advertisement Access
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-semibold">
                <input
                  type="checkbox"
                  checked={selectedPlan.apiAccess}
                  onChange={(e) => handlePlanLimitChange(selectedPlan.id, "apiAccess", e.target.checked)}
                />
                API Access
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-semibold">
                <input
                  type="checkbox"
                  checked={selectedPlan.aiFeatures}
                  onChange={(e) => handlePlanLimitChange(selectedPlan.id, "aiFeatures", e.target.checked)}
                />
                AI Features
              </label>
            </div>
          </div>
        )}
      </div>

      {/* ═══ SECTION 2: PAYMENT GATEWAYS & UPI QR GENERATOR ═══ */}
      <div className="fr8x-card p-6 bg-white space-y-6 border-l-4 border-l-purple-600">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="text-heading-md font-bold text-[var(--fr8x-jet)] flex items-center gap-2">
              <QrCode className="h-5 w-5 text-purple-600" />
              2. Payment Gateways Setup & Live UPI QR Code Generator
            </h2>
            <p className="text-caption text-foreground-secondary mt-0.5">
              Provider-independent configuration supporting PayPal, Direct Bank Transfer, and auto-generated UPI QR Codes
            </p>
          </div>
        </div>

        <form onSubmit={handleSavePaymentDetails} className="space-y-5">
          {/* PayPal */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-left">
            <h3 className="text-body-md font-bold text-[var(--fr8x-jet)] flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-600" /> PayPal Integration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-body-sm">
              <div>
                <label className="fr8x-label block mb-1 text-xs">PayPal Merchant Email</label>
                <input
                  type="email"
                  value={details.paypalEmail}
                  onChange={(e) => setDetails({ ...details, paypalEmail: e.target.value })}
                  className="fr8x-input font-mono"
                  placeholder="paypal@company.com"
                />
              </div>
              <div>
                <label className="fr8x-label block mb-1 text-xs">PayPal Payment Link</label>
                <input
                  type="text"
                  value={details.paypalLink}
                  onChange={(e) => setDetails({ ...details, paypalLink: e.target.value })}
                  className="fr8x-input font-mono"
                  placeholder="https://paypal.me/yourcompany"
                />
              </div>
              <div>
                <label className="fr8x-label block mb-1 text-xs">Environment Mode</label>
                <select className="fr8x-input font-medium text-xs">
                  <option value="live">Live / Production</option>
                  <option value="sandbox">Sandbox / Testing</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bank Transfer */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-left">
            <h3 className="text-body-md font-bold text-[var(--fr8x-jet)] flex items-center gap-2">
              <Building2 className="h-4 w-4 text-emerald-600" /> Direct Bank Transfer (SWIFT / IBAN)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-body-sm">
              <div>
                <label className="fr8x-label block mb-1 text-xs">Bank Name</label>
                <input
                  type="text"
                  value={details.bankName}
                  onChange={(e) => setDetails({ ...details, bankName: e.target.value })}
                  className="fr8x-input"
                />
              </div>
              <div>
                <label className="fr8x-label block mb-1 text-xs">Account Holder Name</label>
                <input
                  type="text"
                  value={details.accountName}
                  onChange={(e) => setDetails({ ...details, accountName: e.target.value })}
                  className="fr8x-input"
                />
              </div>
              <div>
                <label className="fr8x-label block mb-1 text-xs">Account Number</label>
                <input
                  type="text"
                  value={details.accountNumber}
                  onChange={(e) => setDetails({ ...details, accountNumber: e.target.value })}
                  className="fr8x-input font-mono"
                />
              </div>
              <div>
                <label className="fr8x-label block mb-1 text-xs">IFSC / SWIFT Code</label>
                <input
                  type="text"
                  value={details.ifscSwift}
                  onChange={(e) => setDetails({ ...details, ifscSwift: e.target.value })}
                  className="fr8x-input font-mono"
                />
              </div>
              <div className="md:col-span-2">
                <label className="fr8x-label block mb-1 text-xs">Branch Address & Country</label>
                <input
                  type="text"
                  value={details.branchName}
                  onChange={(e) => setDetails({ ...details, branchName: e.target.value })}
                  className="fr8x-input"
                />
              </div>
            </div>
          </div>

          {/* UPI Setup & QR Generator */}
          <div className="p-4 bg-purple-50/50 border border-purple-200 rounded-xl space-y-4 text-left">
            <div className="flex items-center justify-between">
              <h3 className="text-body-md font-bold text-purple-950 flex items-center gap-2">
                <QrCode className="h-4 w-4 text-purple-600" /> UPI Configuration & Open-Source QR Generator
              </h3>
              <span className="text-[10px] bg-purple-100 text-purple-900 font-bold px-2 py-0.5 rounded">
                Auto-Regenerates Live
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-body-sm items-center">
              <div>
                <label className="fr8x-label block mb-1 text-xs">UPI ID / VPA Address *</label>
                <input
                  type="text"
                  value={details.upiId}
                  onChange={(e) => setDetails({ ...details, upiId: e.target.value })}
                  className="fr8x-input font-mono font-bold text-purple-900 bg-white"
                  placeholder="company@upi"
                  required
                />
              </div>

              <div>
                <label className="fr8x-label block mb-1 text-xs">UPI Merchant Name</label>
                <input
                  type="text"
                  value={details.vpaName}
                  onChange={(e) => setDetails({ ...details, vpaName: e.target.value })}
                  className="fr8x-input bg-white"
                  placeholder="FR8X Enterprise"
                />
              </div>

              {/* QR Preview & Actions */}
              <div className="flex items-center gap-3 pt-2 sm:pt-0">
                <div className="p-1.5 bg-white border border-purple-200 rounded-lg shadow-2xs">
                  <canvas ref={qrCanvasRef} className="w-16 h-16" />
                </div>

                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => downloadUpiQrPng(details.upiId, details.vpaName)}
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-caption font-bold flex items-center gap-1 shadow-2xs"
                  >
                    <Download className="h-3 w-3" /> Download PNG
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowQrPreviewModal(true)}
                    className="px-3 py-1 bg-white border border-purple-300 text-purple-900 rounded text-caption font-bold flex items-center gap-1 hover:bg-purple-50"
                  >
                    <Eye className="h-3 w-3" /> Preview Large
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="fr8x-btn-primary bg-[#56C5F0] hover:bg-[#3ABFF0] px-6 py-2.5 font-bold flex items-center gap-2"
            >
              <Save className="h-4 w-4" /> Save & Broadcast Payment Setup
            </button>
          </div>
        </form>
      </div>

      {/* ═══ SECTION 3: PAYMENT HEALTH MONITORING ═══ */}
      <div className="fr8x-card p-6 bg-white space-y-4 border-l-4 border-l-emerald-500 text-left">
        <h2 className="text-heading-md font-bold text-[var(--fr8x-jet)] flex items-center gap-2">
          <Activity className="h-5 w-5 text-emerald-600" />
          3. Payment Gateway Webhook & Provider Health Dashboard
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.values(healthMap).map((h) => (
            <div key={h.providerId} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[11px] text-[var(--fr8x-jet)]">{h.name}</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[8px] font-bold uppercase ${
                    h.isConnected ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {h.isConnected ? "Connected" : "Inactive"}
                </span>
              </div>
              <p className="text-[10px] text-foreground-secondary">{h.statusMessage}</p>
              <div className="text-[9px] text-foreground-muted flex justify-between pt-1 border-t border-slate-200">
                <span>Pending Events: {h.pendingEventsCount}</span>
                <span className="font-mono">{h.environment}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ SECTION 4: PAYMENT HISTORY & TRANSACTIONS ═══ */}
      <div className="fr8x-card overflow-hidden text-left bg-white">
        <div className="px-6 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-heading-md font-bold text-[var(--fr8x-jet)]">4. Payment & Invoice History</h2>
            <p className="text-caption text-foreground-secondary">Audit all processed transactions, gateway logs, and tax invoices</p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={txFilterGateway}
              onChange={(e) => setTxFilterGateway(e.target.value)}
              className="fr8x-input py-1 px-2 text-xs w-36"
            >
              <option value="all">All Gateways</option>
              <option value="upi">UPI</option>
              <option value="paypal">PayPal</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>

            <button
              onClick={handleExportTransactionsCSV}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-caption font-bold flex items-center gap-1 border border-slate-300"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" /> Export CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="fr8x-table text-[11px]">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>User / Company</th>
                <th>Plan Tier</th>
                <th>Amount</th>
                <th>Tax</th>
                <th>Gateway</th>
                <th>Transaction ID</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredTx.map((t) => (
                <tr key={t.id}>
                  <td className="font-mono font-bold">{t.invoiceNumber}</td>
                  <td>
                    <p className="font-bold text-[var(--fr8x-jet)]">{t.userName}</p>
                    <p className="text-foreground-muted text-[9px]">{t.companyName}</p>
                  </td>
                  <td>{t.planName}</td>
                  <td className="font-bold text-emerald-700">{t.currency === "INR" ? `₹${t.amount}` : `$${t.amount}`}</td>
                  <td>{t.taxAmount > 0 ? `₹${t.taxAmount}` : "Exempt"}</td>
                  <td className="capitalize font-mono">{t.gateway}</td>
                  <td className="font-mono text-caption">{t.transactionId}</td>
                  <td>
                    <span className={t.status === "completed" ? "fr8x-badge-active" : "fr8x-badge-pending"}>
                      {t.status}
                    </span>
                  </td>
                  <td className="text-foreground-muted">{new Date(t.paymentDate).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══ SECTION 5: TAXATION & COUPONS ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
        {/* Country Taxation */}
        <div className="fr8x-card p-5 bg-white space-y-4">
          <h2 className="text-heading-sm font-bold text-[var(--fr8x-jet)] flex items-center gap-2 border-b border-border pb-2">
            <Percent className="h-4 w-4 text-emerald-600" /> 5. Country Taxation Rules (GST / VAT)
          </h2>
          <div className="space-y-2">
            {taxes.map((t) => (
              <div key={t.countryCode} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-body-sm">
                <div>
                  <p className="font-bold text-[var(--fr8x-jet)]">{t.countryName} ({t.taxName})</p>
                  <p className="text-caption text-foreground-secondary">
                    {t.countryCode === "IN" ? `CGST ${t.cgstRate}% + SGST ${t.sgstRate}% (IGST ${t.igstRate}%)` : `Rate: ${t.vatRate || t.salesTaxRate}%`}
                  </p>
                </div>
                <span className="fr8x-badge-active">Active</span>
              </div>
            ))}
          </div>
        </div>

        {/* Coupons Administration */}
        <div className="fr8x-card p-5 bg-white space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h2 className="text-heading-sm font-bold text-[var(--fr8x-jet)] flex items-center gap-2">
              <Ticket className="h-4 w-4 text-purple-600" /> 6. Coupon Administration
            </h2>
            <button onClick={() => setShowAddCoupon(!showAddCoupon)} className="fr8x-btn-secondary text-[10px] py-1 px-2 flex items-center gap-1">
              <Plus className="h-3 w-3" /> New Coupon
            </button>
          </div>

          {showAddCoupon && (
            <form onSubmit={handleAddCoupon} className="p-3 bg-purple-50 border border-purple-200 rounded-lg space-y-2 text-[11px]">
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="CODE (e.g. SAVE20)"
                  value={newCouponCode}
                  onChange={(e) => setNewCouponCode(e.target.value)}
                  className="fr8x-input uppercase font-bold"
                  required
                />
                <input
                  type="number"
                  placeholder="Value"
                  value={newCouponValue}
                  onChange={(e) => setNewCouponValue(e.target.value)}
                  className="fr8x-input"
                />
                <select value={newCouponType} onChange={(e) => setNewCouponType(e.target.value as any)} className="fr8x-input">
                  <option value="percentage">% Percentage</option>
                  <option value="fixed">₹ Fixed Amount</option>
                </select>
              </div>
              <button type="submit" className="fr8x-btn-primary bg-purple-600 text-white w-full py-1 text-[10px]">Create Coupon</button>
            </form>
          )}

          <div className="space-y-2">
            {coupons.map((c) => (
              <div key={c.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-body-sm">
                <div>
                  <p className="font-mono font-bold text-purple-900">{c.code}</p>
                  <p className="text-caption text-foreground-secondary">
                    {c.discountType === "percentage" ? `${c.discountValue}% Off` : `₹${c.discountValue} Off`} • Uses: {c.currentUses}/{c.maxUses}
                  </p>
                </div>
                <span className="fr8x-badge-active">Active</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* QR Large Preview Modal */}
      {showQrPreviewModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center space-y-4 shadow-2xl">
            <h3 className="text-heading-md font-bold text-[var(--fr8x-jet)]">UPI Payment QR Preview</h3>
            <p className="text-caption text-foreground-secondary">Scan with PhonePe, Google Pay, Paytm, or BHIM</p>
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 flex items-center justify-center">
              <canvas ref={qrCanvasRef} className="w-48 h-48" />
            </div>
            <p className="font-mono font-bold text-purple-900 text-body-sm">{details.upiId}</p>
            <button
              onClick={() => setShowQrPreviewModal(false)}
              className="fr8x-btn-secondary w-full py-2 text-body-sm"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
