// FR8X-CON Enterprise Business Register Page — Spec Page 2
// Enforces Enterprise Corporate Email Policy (blocks public Gmail, Yahoo, Hotmail, disposable emails)
// Requires Business Vertical selection to dynamically determine remaining registration fields.

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createAccountWithEmail } from "@/lib/firebase/auth";
import { setDocument } from "@/lib/firebase/firestore";
import {
  ROUTES,
  INDUSTRY_TAGS,
  USER_ROLES,
  MEMBERSHIP_TIERS,
  COLLECTIONS,
} from "@/lib/utils/constants";
import {
  getGodModePaymentDetails,
  DEFAULT_GODMODE_PAYMENT_DETAILS,
  type GodModePaymentDetails,
} from "@/lib/utils/payment";
import { validateEnterpriseEmail } from "@/lib/config/enterpriseRegistrationPolicy";
import { processPayment, type PaymentMethod } from "@/lib/payments";
import { Button } from "@/components/ui/Button";
import { Briefcase, CheckCircle2, ShieldCheck, AlertCircle, FileText, X } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Business Vertical requirement state
  const [role, setRole] = useState("");

  // GodMode-configured payment details state
  const [godmodePaymentDetails, setGodmodePaymentDetails] =
    useState<GodModePaymentDetails>(DEFAULT_GODMODE_PAYMENT_DETAILS);

  useEffect(() => {
    setGodmodePaymentDetails(getGodModePaymentDetails());
    const handleUpdate = () => {
      setGodmodePaymentDetails(getGodModePaymentDetails());
    };
    window.addEventListener("fr8x_payment_details_updated", handleUpdate);
    return () => window.removeEventListener("fr8x_payment_details_updated", handleUpdate);
  }, []);

  // Form state
  const [fullName, setFullName] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyRegistrationNumber, setCompanyRegistrationNumber] = useState("");
  const [gstTaxId, setGstTaxId] = useState("");
  const [countryRegion, setCountryRegion] = useState("India");
  const [stateCity, setStateCity] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedTier, setSelectedTier] = useState("trial");

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [upiId, setUpiId] = useState("");

  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      setError("Please agree to the Terms & Conditions before creating an enterprise account.");
      return;
    }
    if (!role) {
      setError("Please select your Business Vertical first.");
      return;
    }

    // Enforce Enterprise Corporate Email Policy
    const emailValidation = validateEnterpriseEmail(workEmail);
    if (!emailValidation.isValid) {
      setError(emailValidation.reason || "Please use your official company corporate email.");
      return;
    }

    if (
      !fullName ||
      !workEmail ||
      !password ||
      !confirmPassword ||
      !companyName ||
      !companyRegistrationNumber ||
      !countryRegion ||
      !stateCity ||
      !contactNumber ||
      !companyAddress
    ) {
      setError("Please fill in all required enterprise registration fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const credential = await createAccountWithEmail(workEmail.trim(), password, fullName.trim());
      const uid = credential.user.uid;

      // Process payment if basic tier is selected
      if (selectedTier === "basic") {
        const metadata: Record<string, unknown> = {};
        if (gstTaxId) metadata.gstTaxId = gstTaxId;
        if (paymentMethod === "upi" && upiId) metadata.upiId = upiId;

        await processPayment({
          userId: uid,
          userEmail: workEmail.trim(),
          amount: 1499,
          currency: paymentMethod === "paypal" ? "USD" : "INR",
          method: paymentMethod,
          membershipTier: "basic",
          description: `FR8X Enterprise Membership Subscription for ${companyName.trim()}`,
          metadata,
        });
      }

      // Create user document with enterprise metadata
      await setDocument(COLLECTIONS.USERS, uid, {
        uid,
        email: workEmail.trim(),
        fullName: fullName.trim(),
        displayName: fullName.trim(),
        role,
        isGodMode: false,
        companyName: companyName.trim(),
        companyRegistrationNumber: companyRegistrationNumber.trim(),
        gstTaxId: gstTaxId.trim(),
        contactNumber: contactNumber.trim(),
        companyAddress: companyAddress.trim(),
        companyWebsite: companyWebsite.trim(),
        membershipTier: selectedTier,
        status: "active",
        emailVerified: true,
        lastLoginAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        createdBy: uid,
        updatedBy: uid,
        version: 1,
      });

      // Create profile document
      await setDocument(COLLECTIONS.PROFILES, uid, {
        userId: uid,
        fullName: fullName.trim(),
        designation: USER_ROLES.find((r) => r.value === role)?.label || role,
        location: `${stateCity}, ${countryRegion}`,
        country: countryRegion.trim(),
        about: `Verified Enterprise ${USER_ROLES.find((r) => r.value === role)?.label || role}`,
        companyName: companyName.trim(),
        companyWebsite: companyWebsite.trim(),
        photoURL: null,
        verifiedBadge: true,
        followers: [],
        following: [],
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
        awardsCount: 0,
        currentAuctions: [],
        completedAuctions: [],
        blacklistStatus: "clean",
        industryTags: selectedTags.length > 0 ? selectedTags : ["Freight Forwarding", "Ocean Freight"],
        serviceTags: [],
        workExperience: [],
        createdAt: new Date().toISOString(),
        createdBy: uid,
        updatedBy: uid,
        version: 1,
      });

      // Trigger Welcome Email via /api/send-email (Zoho SMTP)
      fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: workEmail.trim(),
          type: "welcome",
          displayName: fullName.trim(),
        }),
      }).catch((emailErr) => {
        console.warn("Welcome email dispatch warning:", emailErr);
      });

      router.push(ROUTES.FEEDS);
    } catch (err: unknown) {
      console.error("Enterprise registration error details:", err);
      const message = err instanceof Error ? err.message : String(err);

      if (message.includes("email-already-in-use")) {
        setError("This corporate email is already registered. Please sign in.");
      } else {
        setError(message || "Registration failed. Please verify your company details.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[var(--fr8x-bg)] py-8 px-4 lg:px-8">
      <div className="w-full max-w-full">
        {/* Header */}
        <p className="text-body-sm text-[var(--fr8x-jet)] mb-2">register</p>
        <p className="text-body-sm text-foreground-secondary mb-1">Enterprise Business Account</p>
        <h1 className="text-display-sm font-bold text-[var(--fr8x-jet)] mb-4">
          Verified Enterprise Registration
        </h1>

        {/* Enterprise Policy Notice */}
        <div className="mb-6 p-3.5 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3 text-[11px] text-blue-950">
          <ShieldCheck className="h-5 w-5 text-[var(--fr8x-periwinkle)] flex-shrink-0" />
          <div>
            <strong className="font-semibold block">Enterprise B2B Verification Policy:</strong>
            <span>Public/free email providers (Gmail, Yahoo, Outlook, Hotmail, etc.) are prohibited. Only verified company domain emails are accepted.</span>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 rounded-md bg-danger-light border border-danger/30 p-3.5 flex items-start gap-2.5 text-body-sm text-danger-dark">
            <AlertCircle className="h-5 w-5 text-danger flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Registration Rejected</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8 w-full">
          {/* ═══ STEP 1: BUSINESS VERTICAL SELECTION ═══ */}
          <div className="w-full bg-white p-6 rounded-xl border-2 border-[var(--fr8x-periwinkle)] shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-[var(--fr8x-periwinkle)]" />
              <label htmlFor="reg-role" className="fr8x-label text-heading-sm font-bold text-[var(--fr8x-jet)] block">
                Select Your Business Vertical *
              </label>
            </div>
            <p className="text-body-sm text-foreground-secondary">
              Please choose your primary business vertical to reveal registration fields tailored to your enterprise profile.
            </p>
            <select
              id="reg-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="fr8x-input text-body-md font-medium border-2 border-[var(--fr8x-periwinkle)] focus:ring-2 focus:ring-[var(--fr8x-periwinkle)]"
              autoFocus
            >
              <option value="">Select business vertical (e.g. Freight Forwarder, Shipping Line/MLO, NVOCC, CHA, Transporter...)</option>
              {USER_ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>

            {role && (
              <div className="flex items-center gap-2 pt-1 text-caption text-emerald-600 font-semibold">
                <CheckCircle2 className="h-4 w-4" />
                <span>Selected Vertical: {USER_ROLES.find((r) => r.value === role)?.label || role}</span>
              </div>
            )}
          </div>

          {/* ═══ STEP 2: REVEALED ENTERPRISE FORM FIELDS ═══ */}
          {!role ? (
            <div className="p-8 text-center bg-white rounded-xl border border-dashed border-border">
              <p className="text-body-md font-medium text-foreground-secondary">
                Select your business vertical above to unlock corporate registration fields.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 w-full">
                <div>
                  <label htmlFor="reg-name" className="fr8x-label block mb-1.5">Full Name *</label>
                  <input id="reg-name" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="fr8x-input" placeholder="John Doe" required />
                </div>
                <div>
                  <label htmlFor="reg-email" className="fr8x-label block mb-1.5">Official Business Email (@company.com) *</label>
                  <input id="reg-email" type="email" value={workEmail} onChange={(e) => setWorkEmail(e.target.value)} className="fr8x-input font-medium" placeholder="name@yourcompany.com" required />
                </div>
                <div>
                  <label htmlFor="reg-password" className="fr8x-label block mb-1.5">Password *</label>
                  <input id="reg-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="fr8x-input" required />
                </div>
                <div>
                  <label htmlFor="reg-confirm" className="fr8x-label block mb-1.5">Confirm Password *</label>
                  <input id="reg-confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="fr8x-input" required />
                </div>
                <div>
                  <label htmlFor="reg-company" className="fr8x-label block mb-1.5">Registered Company Name *</label>
                  <input id="reg-company" type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="fr8x-input" placeholder="Enterprise Logistics Ltd" required />
                </div>
                <div>
                  <label htmlFor="reg-cin" className="fr8x-label block mb-1.5">Company Registration No. / CIN / License *</label>
                  <input id="reg-cin" type="text" value={companyRegistrationNumber} onChange={(e) => setCompanyRegistrationNumber(e.target.value)} className="fr8x-input" placeholder="CIN123456789" required />
                </div>
                <div>
                  <label htmlFor="reg-contact" className="fr8x-label block mb-1.5">Official Contact Phone Number *</label>
                  <input id="reg-contact" type="text" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} className="fr8x-input" placeholder="+91 98765 43210" required />
                </div>
                <div>
                  <label htmlFor="reg-gst" className="fr8x-label block mb-1.5">GST / Tax ID Number</label>
                  <input id="reg-gst" type="text" value={gstTaxId} onChange={(e) => setGstTaxId(e.target.value)} className="fr8x-input" placeholder="29ABCDE1234F1Z5" />
                </div>
                <div>
                  <label htmlFor="reg-country" className="fr8x-label block mb-1.5">Country / Region *</label>
                  <input id="reg-country" type="text" value={countryRegion} onChange={(e) => setCountryRegion(e.target.value)} className="fr8x-input" required />
                </div>
                <div>
                  <label htmlFor="reg-state-city" className="fr8x-label block mb-1.5">State & City *</label>
                  <input id="reg-state-city" type="text" value={stateCity} onChange={(e) => setStateCity(e.target.value)} className="fr8x-input" placeholder="Maharashtra, Mumbai" required />
                </div>
                <div>
                  <label htmlFor="reg-address" className="fr8x-label block mb-1.5">Registered Corporate Address *</label>
                  <input id="reg-address" type="text" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} className="fr8x-input" placeholder="Suite 401, Logistics Hub" required />
                </div>
                <div>
                  <label htmlFor="reg-website" className="fr8x-label block mb-1.5">Company Website (Optional)</label>
                  <input id="reg-website" type="url" value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)} className="fr8x-input" placeholder="https://www.yourcompany.com" />
                </div>
              </div>

              {/* Industry & Service Tags */}
              <div className="w-full">
                <p className="fr8x-label mb-3">Industry & Service Tags (select multiple)</p>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRY_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`rounded-md px-3 py-1.5 text-body-sm border transition-colors ${
                        selectedTags.includes(tag)
                          ? "bg-[var(--fr8x-periwinkle)] text-[#253031] font-bold border-[#746D75]"
                          : "bg-background-card text-[var(--fr8x-jet)] border-[var(--fr8x-lavender)] hover:bg-[var(--fr8x-mist)]"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Membership Tiers */}
              <div className="w-full">
                <p className="fr8x-label mb-4">MEMBERSHIP</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                  {MEMBERSHIP_TIERS.map((tier) => (
                    <div
                      key={tier.id}
                      className={`rounded-lg border p-5 text-center cursor-pointer transition-all ${
                        selectedTier === tier.id
                          ? "border-[var(--fr8x-periwinkle)] bg-[var(--fr8x-mist)]"
                          : "border-border bg-background-card hover:border-[var(--fr8x-lavender)]"
                      } ${tier.comingSoon ? "opacity-75" : ""}`}
                      onClick={() => !tier.comingSoon && setSelectedTier(tier.id)}
                    >
                      <h3 className="text-heading-sm font-semibold text-[var(--fr8x-jet)] mb-3">
                        {tier.name}
                      </h3>

                      {tier.priceINR !== null ? (
                        <>
                          <p className="text-display-sm font-bold text-[var(--fr8x-jet)]">
                            ₹{tier.priceINR?.toLocaleString() ?? 0}
                            <span className="text-body-sm font-normal text-foreground-secondary">
                              /{tier.period}
                            </span>
                          </p>
                          {tier.priceUSD !== null && tier.priceUSD > 0 && (
                            <p className="text-heading-md font-semibold text-[var(--fr8x-jet)] mt-1">
                              US${tier.priceUSD}
                              <span className="text-body-sm font-normal text-foreground-secondary">
                                /{tier.period}
                              </span>
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-display-sm font-bold text-[var(--fr8x-jet)]">
                          {tier.label}
                        </p>
                      )}

                      <ul className="mt-3 space-y-1">
                        {tier.features.map((f) => (
                          <li key={f} className="text-caption text-foreground-secondary">{f}</li>
                        ))}
                      </ul>

                      <button
                        type="button"
                        className={`mt-4 w-full rounded-md py-2 text-body-sm font-medium transition-colors ${
                          tier.comingSoon
                            ? "bg-[#EDE6F2] text-[#253031] opacity-60 cursor-not-allowed border border-[#746D75]"
                            : selectedTier === tier.id
                            ? "bg-[#EDE6F2] text-[#253031] font-bold border border-[#253031]"
                            : "bg-[#EDE6F2] text-[#253031] hover:opacity-90 border border-[#746D75]"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!tier.comingSoon) setSelectedTier(tier.id);
                        }}
                        disabled={tier.comingSoon}
                      >
                        {tier.comingSoon ? "(Introducing Shortly)" : "Select"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Section */}
              {selectedTier === "basic" && (
                <div className="space-y-4 p-5 bg-white rounded-xl border border-border w-full">
                  <p className="fr8x-label text-heading-sm">Select Payment Method</p>
                  
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 cursor-pointer border px-4 py-2 rounded-md bg-[var(--fr8x-mist)]">
                      <input type="radio" name="payment" checked={paymentMethod === "card"} onChange={() => setPaymentMethod("card")} className="accent-[var(--fr8x-periwinkle)]" />
                      <span className="fr8x-label">Card</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer border px-4 py-2 rounded-md bg-[var(--fr8x-mist)]">
                      <input type="radio" name="payment" checked={paymentMethod === "upi"} onChange={() => setPaymentMethod("upi")} className="accent-[var(--fr8x-periwinkle)]" />
                      <span className="fr8x-label">UPI</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer border px-4 py-2 rounded-md bg-[var(--fr8x-mist)]">
                      <input type="radio" name="payment" checked={paymentMethod === "paypal"} onChange={() => setPaymentMethod("paypal")} className="accent-[var(--fr8x-periwinkle)]" />
                      <span className="fr8x-label">PayPal</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer border px-4 py-2 rounded-md bg-[var(--fr8x-mist)]">
                      <input type="radio" name="payment" checked={paymentMethod === "bank"} onChange={() => setPaymentMethod("bank")} className="accent-[var(--fr8x-periwinkle)]" />
                      <span className="fr8x-label">Bank Transfer</span>
                    </label>
                  </div>

                  {paymentMethod === "card" && (
                    <div className="space-y-4 pt-2">
                      <div>
                        <label className="fr8x-label block mb-1.5">Card Number</label>
                        <input type="text" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} className="fr8x-input" placeholder="1234 5678 9012 3456" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="fr8x-label block mb-1.5">Expiry</label>
                          <input type="text" value={expiry} onChange={(e) => setExpiry(e.target.value)} className="fr8x-input" placeholder="MM/YY" />
                        </div>
                        <div>
                          <label className="fr8x-label block mb-1.5">CVV</label>
                          <input type="text" value={cvv} onChange={(e) => setCvv(e.target.value)} className="fr8x-input" placeholder="123" />
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === "upi" && (
                    <div className="space-y-3 pt-2">
                      <div className="p-3 bg-[var(--fr8x-mist)] rounded-md">
                        <p className="text-caption font-semibold text-[var(--fr8x-jet)]">Official FR8X UPI Address:</p>
                        <p className="text-body-sm font-bold text-[var(--fr8x-periwinkle)]">{godmodePaymentDetails.upiId}</p>
                      </div>
                      <div>
                        <label className="fr8x-label block mb-1.5">Your UPI ID (VPA)</label>
                        <input type="text" value={upiId} onChange={(e) => setUpiId(e.target.value)} className="fr8x-input" placeholder="name@upi" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Agree to Terms & Conditions Tick Box */}
              <div className="flex items-start gap-2.5 pt-2">
                <input
                  id="reg-terms"
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-[#56C5F0] focus:ring-[#56C5F0] cursor-pointer"
                  required
                />
                <label htmlFor="reg-terms" className="text-xs text-foreground-secondary cursor-pointer select-none">
                  I agree to the{" "}
                  <button
                    type="button"
                    onClick={() => setShowTermsModal(true)}
                    className="text-[#2B9ED6] hover:underline font-semibold"
                  >
                    Terms &amp; Conditions
                  </button>{" "}
                  and B2B Enterprise Policy
                </label>
              </div>

              {/* Payment Actions */}
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  loadingText="Verifying Enterprise Domain..."
                  className="fr8x-btn-primary flex-1 rounded-md py-2.5 text-body-sm font-bold"
                >
                  Create Verified Enterprise Account
                </Button>
              </div>
            </>
          )}

          {/* Footer link to sign in */}
          <div className="text-center text-body-sm text-foreground-secondary pt-2">
            Already have an account?{" "}
            <Link href={ROUTES.LOGIN} className="font-medium text-[var(--fr8x-jet)] underline hover:text-[var(--fr8x-periwinkle)] transition-colors">
              Sign in
            </Link>
          </div>
        </form>

        {/* Terms & Conditions Interactive Pop-Up Modal */}
        {showTermsModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 text-left">
            <div className="bg-white rounded-2xl p-6 w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl border border-border space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#56C5F0]" />
                  <h3 className="text-heading-md font-bold text-[var(--fr8x-jet)]">
                    FR8X-CON Enterprise Terms &amp; Conditions
                  </h3>
                </div>
                <button
                  onClick={() => setShowTermsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 text-xs text-foreground-secondary pr-2 leading-relaxed">
                <p className="font-semibold text-[var(--fr8x-jet)]">Effective Date: August 2026</p>
                
                <h4 className="font-bold text-slate-800">1. Enterprise B2B Platform Service Terms</h4>
                <p>FR8X-CON provides digital freight logistics networking, rate discovery, and auction capabilities for verified corporate logistics partners. Users agree to provide truthful corporate identity credentials.</p>

                <h4 className="font-bold text-slate-800">2. Data Confidentiality &amp; Privacy Policy</h4>
                <p>All ocean, air, and land freight quotations, bids, and communication threads shared on FR8X-CON are strictly protected under enterprise-grade encryption. Commercial rates will not be shared with unauthorized third parties.</p>

                <h4 className="font-bold text-slate-800">3. Freight Auction &amp; Procurement Guidelines</h4>
                <p>All bidding entities and logistics buyers must honor commitments made during live auction contracts and spot rate confirmations in accordance with international maritime freight regulations.</p>

                <h4 className="font-bold text-slate-800">4. User Account Credentials</h4>
                <p>You are responsible for maintaining the security of your User ID and Password. Shared or public logins without organization authorization are prohibited.</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowTermsModal(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700 transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAgreedToTerms(true);
                    setShowTermsModal(false);
                  }}
                  className="fr8x-btn-primary text-xs font-bold flex items-center gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4 text-[#253031]" /> I Agree &amp; Accept Terms
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
