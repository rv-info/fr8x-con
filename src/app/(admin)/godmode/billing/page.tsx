"use client";

// FR8X-CON GodMode Billing & Plans Page — Spec Page 11
// Admin configures PayPal, Bank Account, and UPI details that are dynamically displayed to General Users on payment screens

import { useState, useEffect } from "react";
import { CreditCard, DollarSign, Building2, QrCode, Save, CheckCircle } from "lucide-react";
import {
  getGodModePaymentDetails,
  DEFAULT_GODMODE_PAYMENT_DETAILS,
  type GodModePaymentDetails,
} from "@/lib/utils/payment";

export default function GodModeBillingPage() {
  const [details, setDetails] = useState<GodModePaymentDetails>(DEFAULT_GODMODE_PAYMENT_DETAILS);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setDetails(getGodModePaymentDetails());
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem("fr8x_godmode_payment_details", JSON.stringify(details));
      // Dispatch custom event to notify open user tabs
      window.dispatchEvent(new Event("fr8x_payment_details_updated"));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save payment details:", err);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-full">
      <div>
        <h1 className="text-display-sm font-bold text-[var(--fr8x-jet)]">Billing & Plans</h1>
        <p className="text-body-sm text-foreground-secondary mt-1">
          Manage platform pricing tiers and update PayPal, Bank Transfer, and UPI payment details for General Users
        </p>
      </div>

      {/* GODMODE PAYMENT DETAILS UPDATE SECTION */}
      <div className="fr8x-card p-6 bg-white border-2 border-[var(--fr8x-periwinkle)] space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="text-heading-lg font-bold text-[var(--fr8x-jet)] flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-[var(--fr8x-periwinkle)]" />
              GodMODE Payment Gateway & Bank/UPI Configuration
            </h2>
            <p className="text-caption text-foreground-secondary mt-0.5">
              These details will be dynamically rendered on the General User Registration & Checkout pages for direct payments
            </p>
          </div>
          {savedSuccess && (
            <span className="fr8x-badge-active flex items-center gap-1 py-1 px-3 text-caption font-semibold">
              <CheckCircle className="h-3.5 w-3.5" /> Saved & Updated Live!
            </span>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* PayPal Section */}
          <div className="p-4 bg-[var(--fr8x-mist)] rounded-lg space-y-4">
            <h3 className="text-heading-sm font-semibold text-[var(--fr8x-jet)] flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
              PayPal Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="fr8x-label block mb-1">PayPal Email / Merchant ID</label>
                <input
                  type="email"
                  value={details.paypalEmail}
                  onChange={(e) => setDetails({ ...details, paypalEmail: e.target.value })}
                  className="fr8x-input"
                  placeholder="paypal@company.com"
                />
              </div>
              <div>
                <label className="fr8x-label block mb-1">PayPal Payment Link</label>
                <input
                  type="text"
                  value={details.paypalLink}
                  onChange={(e) => setDetails({ ...details, paypalLink: e.target.value })}
                  className="fr8x-input"
                  placeholder="https://paypal.me/yourcompany"
                />
              </div>
            </div>
          </div>

          {/* Bank Account Details Section */}
          <div className="p-4 bg-[var(--fr8x-mist)] rounded-lg space-y-4">
            <h3 className="text-heading-sm font-semibold text-[var(--fr8x-jet)] flex items-center gap-2">
              <Building2 className="h-4 w-4 text-emerald-600" />
              Direct Bank Transfer Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="fr8x-label block mb-1">Bank Name</label>
                <input
                  type="text"
                  value={details.bankName}
                  onChange={(e) => setDetails({ ...details, bankName: e.target.value })}
                  className="fr8x-input"
                />
              </div>
              <div>
                <label className="fr8x-label block mb-1">Account Holder Name</label>
                <input
                  type="text"
                  value={details.accountName}
                  onChange={(e) => setDetails({ ...details, accountName: e.target.value })}
                  className="fr8x-input"
                />
              </div>
              <div>
                <label className="fr8x-label block mb-1">Account Number</label>
                <input
                  type="text"
                  value={details.accountNumber}
                  onChange={(e) => setDetails({ ...details, accountNumber: e.target.value })}
                  className="fr8x-input"
                />
              </div>
              <div>
                <label className="fr8x-label block mb-1">IFSC Code / SWIFT Code</label>
                <input
                  type="text"
                  value={details.ifscSwift}
                  onChange={(e) => setDetails({ ...details, ifscSwift: e.target.value })}
                  className="fr8x-input"
                />
              </div>
              <div className="md:col-span-2">
                <label className="fr8x-label block mb-1">Branch Location & City</label>
                <input
                  type="text"
                  value={details.branchName}
                  onChange={(e) => setDetails({ ...details, branchName: e.target.value })}
                  className="fr8x-input"
                />
              </div>
            </div>
          </div>

          {/* UPI Details Section */}
          <div className="p-4 bg-[var(--fr8x-mist)] rounded-lg space-y-4">
            <h3 className="text-heading-sm font-semibold text-[var(--fr8x-jet)] flex items-center gap-2">
              <QrCode className="h-4 w-4 text-purple-600" />
              UPI & VPA Payment Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="fr8x-label block mb-1">UPI ID / VPA Address</label>
                <input
                  type="text"
                  value={details.upiId}
                  onChange={(e) => setDetails({ ...details, upiId: e.target.value })}
                  className="fr8x-input"
                  placeholder="company@upi"
                />
              </div>
              <div>
                <label className="fr8x-label block mb-1">UPI Verified Merchant Name</label>
                <input
                  type="text"
                  value={details.vpaName}
                  onChange={(e) => setDetails({ ...details, vpaName: e.target.value })}
                  className="fr8x-input"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="fr8x-btn-primary bg-[#56C5F0] hover:bg-[#3ABFF0] px-8 py-2.5 font-bold flex items-center gap-2"
            >
              <Save className="h-4 w-4" /> Save & Broadcast Payment Details
            </button>
          </div>
        </form>
      </div>

      {/* Plan Tiers Preview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="fr8x-card p-5 bg-white space-y-3">
          <h3 className="text-heading-sm font-bold text-[var(--fr8x-jet)]">Trail Tier</h3>
          <p className="text-display-sm font-bold text-[var(--fr8x-jet)]">₹0 <span className="text-body-sm text-foreground-secondary">/ 2 days</span></p>
          <ul className="text-caption text-foreground-secondary space-y-1">
            <li>• Verified badge</li>
            <li>• RFQ posting</li>
            <li>• 0 saved searches</li>
          </ul>
        </div>

        <div className="fr8x-card p-5 bg-white space-y-3 border-2 border-[var(--fr8x-periwinkle)]">
          <h3 className="text-heading-sm font-bold text-[var(--fr8x-jet)]">Basic Tier</h3>
          <p className="text-display-sm font-bold text-[var(--fr8x-jet)]">₹1,499 <span className="text-body-sm text-foreground-secondary">/ mo</span></p>
          <p className="text-heading-md font-bold text-[var(--fr8x-jet)]">US$25 <span className="text-body-sm text-foreground-secondary">/ mo</span></p>
          <ul className="text-caption text-foreground-secondary space-y-1">
            <li>• Verified badge</li>
            <li>• Bidding and rates posting</li>
            <li>• Unlimited rates search and requests</li>
          </ul>
        </div>

        <div className="fr8x-card p-5 bg-white space-y-3">
          <h3 className="text-heading-sm font-bold text-[var(--fr8x-jet)]">Premium Tier</h3>
          <p className="text-display-sm font-bold text-[var(--fr8x-jet)]">Custom</p>
          <p className="text-caption text-[var(--fr8x-periwinkle)] font-medium">(Introducing Shortly)</p>
          <ul className="text-caption text-foreground-secondary space-y-1">
            <li>• Multi-seat access</li>
            <li>• Dedicated account manager</li>
            <li>• API integration</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
