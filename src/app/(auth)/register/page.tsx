// FR8X-CON Register Page — Spec Page 2
// Requirement: Require users to first select their Business Vertical before revealing full registration fields
// Dynamically renders GodMODE-configured payment details & processes PayPal, UPI, Card & Bank via unified Payment Engine

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
import { processPayment, type PaymentMethod } from "@/lib/payments";
import { Button } from "@/components/ui/Button";
import { Briefcase, CheckCircle2 } from "lucide-react";

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

    // Listen for live updates if GodMODE changes payment details in another tab
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
  const [countryRegion, setCountryRegion] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedTier, setSelectedTier] = useState("trial");

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [upiId, setUpiId] = useState("");
  const [gstTaxId, setGstTaxId] = useState("");

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) {
      setError("Please select your Business Vertical first.");
      return;
    }
    if (!fullName || !workEmail || !password || !confirmPassword || !companyName || !countryRegion) {
      setError("Please fill in all required fields.");
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

      // Handle payment processing if basic tier is selected
      if (selectedTier === "basic") {
        await processPayment({
          userId: uid,
          userEmail: workEmail.trim(),
          amount: 1499,
          currency: paymentMethod === "paypal" ? "USD" : "INR",
          method: paymentMethod,
          membershipTier: "basic",
          description: `FR8X Basic Membership Subscription for ${companyName.trim()}`,
          metadata: { gstTaxId, upiId: paymentMethod === "upi" ? upiId : undefined },
        });
      }

      // Create user document
      await setDocument(COLLECTIONS.USERS, uid, {
        email: workEmail.trim(),
        role,
        isGodMode: false,
        companyId: null,
        membershipTier: selectedTier,
        status: "active",
        lastLoginAt: new Date(),
        createdAt: new Date(),
        createdBy: uid,
        updatedBy: uid,
        version: 1,
      });

      // Create profile document
      await setDocument(COLLECTIONS.PROFILES, uid, {
        userId: uid,
        fullName: fullName.trim(),
        designation: "",
        location: "",
        country: countryRegion.trim(),
        about: "",
        companyName: companyName.trim(),
        photoURL: null,
        verifiedBadge: selectedTier !== "trial",
        followers: [],
        following: [],
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
        awardsCount: 0,
        currentAuctions: [],
        completedAuctions: [],
        blacklistStatus: "clean",
        industryTags: selectedTags,
        serviceTags: [],
        workExperience: [],
        createdAt: new Date(),
        createdBy: uid,
        updatedBy: uid,
        version: 1,
      });

      router.push(ROUTES.FEEDS);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration failed.";
      if (message.includes("email-already-in-use")) {
        setError("This email is already registered.");
      } else {
        setError("Registration failed. Please try again.");
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
        <p className="text-body-sm text-foreground-secondary mb-1">Create an account</p>
        <h1 className="text-display-sm font-bold text-[var(--fr8x-jet)] mb-8">
          Create your account
        </h1>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-md bg-danger-light px-3 py-2 text-body-sm text-danger-dark">
            {error}
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
              Please choose your primary business vertical to reveal registration fields tailored to your industry.
            </p>
            <select
              id="reg-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="fr8x-input text-body-md font-medium border-2 border-[var(--fr8x-periwinkle)] focus:ring-2 focus:ring-[var(--fr8x-periwinkle)]"
              autoFocus
            >
              <option value="">Select your business vertical (e.g. Freight Forwarder, Shipping Line, CHA, Transporter...)</option>
              {USER_ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>

            {role && (
              <div className="flex items-center gap-2 pt-1 text-caption text-emerald-600 font-semibold">
                <CheckCircle2 className="h-4 w-4" />
                <span>Selected: {USER_ROLES.find((r) => r.value === role)?.label || role}</span>
              </div>
            )}
          </div>

          {/* ═══ STEP 2: REVEALED REGISTRATION FIELDS (Only displayed after vertical selection) ═══ */}
          {!role ? (
            <div className="p-8 text-center bg-white rounded-xl border border-dashed border-border">
              <p className="text-body-md font-medium text-foreground-secondary">
                Select your business vertical above to unlock remaining registration details.
              </p>
            </div>
          ) : (
            <>
              {/* Two-column form fields — Full width layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 w-full">
                <div>
                  <label htmlFor="reg-name" className="fr8x-label block mb-1.5">Full Name *</label>
                  <input id="reg-name" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="fr8x-input" required />
                </div>
                <div>
                  <label htmlFor="reg-email" className="fr8x-label block mb-1.5">Work Email *</label>
                  <input id="reg-email" type="email" value={workEmail} onChange={(e) => setWorkEmail(e.target.value)} className="fr8x-input" required />
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
                  <label htmlFor="reg-company" className="fr8x-label block mb-1.5">Company Name *</label>
                  <input id="reg-company" type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="fr8x-input" required />
                </div>
                <div>
                  <label htmlFor="reg-country" className="fr8x-label block mb-1.5">Country / Region *</label>
                  <input id="reg-country" type="text" value={countryRegion} onChange={(e) => setCountryRegion(e.target.value)} className="fr8x-input" required />
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
                          ? "bg-[var(--fr8x-periwinkle)] text-white border-[var(--fr8x-periwinkle)]"
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
                            ? "bg-[#56C5F0] text-white cursor-not-allowed"
                            : selectedTier === tier.id
                            ? "bg-[#56C5F0] text-white"
                            : "bg-[#56C5F0] text-white hover:bg-[#3ABFF0]"
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

              {/* Payment Section (Rendered dynamically with active GodMODE details) */}
              {selectedTier === "basic" && (
                <div className="space-y-4 p-5 bg-white rounded-xl border border-border w-full">
                  <p className="fr8x-label text-heading-sm">Select Payment Method</p>
                  
                  {/* Payment Method Toggle Buttons */}
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 cursor-pointer border px-4 py-2 rounded-md bg-[var(--fr8x-mist)]">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === "card"}
                        onChange={() => setPaymentMethod("card")}
                        className="accent-[var(--fr8x-periwinkle)]"
                      />
                      <span className="fr8x-label">Card</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer border px-4 py-2 rounded-md bg-[var(--fr8x-mist)]">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === "upi"}
                        onChange={() => setPaymentMethod("upi")}
                        className="accent-[var(--fr8x-periwinkle)]"
                      />
                      <span className="fr8x-label">UPI</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer border px-4 py-2 rounded-md bg-[var(--fr8x-mist)]">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === "paypal"}
                        onChange={() => setPaymentMethod("paypal")}
                        className="accent-[var(--fr8x-periwinkle)]"
                      />
                      <span className="fr8x-label">PayPal</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer border px-4 py-2 rounded-md bg-[var(--fr8x-mist)]">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === "bank"}
                        onChange={() => setPaymentMethod("bank")}
                        className="accent-[var(--fr8x-periwinkle)]"
                      />
                      <span className="fr8x-label">Bank Transfer</span>
                    </label>
                  </div>

                  {/* Card Inputs */}
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

                  {/* UPI */}
                  {paymentMethod === "upi" && (
                    <div className="space-y-3 pt-2">
                      <div className="p-3 bg-[var(--fr8x-mist)] rounded-md">
                        <p className="text-caption font-semibold text-[var(--fr8x-jet)]">Official FR8X UPI Address:</p>
                        <p className="text-body-sm font-bold text-[var(--fr8x-periwinkle)]">{godmodePaymentDetails.upiId}</p>
                        <p className="text-caption text-foreground-secondary">Merchant: {godmodePaymentDetails.vpaName}</p>
                      </div>
                      <div>
                        <label className="fr8x-label block mb-1.5">Your UPI ID (VPA)</label>
                        <input type="text" value={upiId} onChange={(e) => setUpiId(e.target.value)} className="fr8x-input" placeholder="name@upi" />
                      </div>
                    </div>
                  )}

                  {/* PayPal */}
                  {paymentMethod === "paypal" && (
                    <div className="space-y-3 pt-2">
                      <div className="p-3 bg-[var(--fr8x-mist)] rounded-md">
                        <p className="text-caption font-semibold text-[var(--fr8x-jet)]">Official FR8X PayPal Account:</p>
                        <p className="text-body-sm font-bold text-blue-600">{godmodePaymentDetails.paypalEmail}</p>
                        {godmodePaymentDetails.paypalLink && (
                          <a href={godmodePaymentDetails.paypalLink} target="_blank" rel="noreferrer" className="text-caption text-[var(--fr8x-periwinkle)] underline block mt-1">
                            Pay directly via PayPal link: {godmodePaymentDetails.paypalLink}
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Bank Transfer */}
                  {paymentMethod === "bank" && (
                    <div className="space-y-3 pt-2">
                      <div className="p-4 bg-[var(--fr8x-mist)] rounded-md space-y-1.5 text-body-sm text-[var(--fr8x-jet)]">
                        <p className="font-bold border-b border-border pb-1 text-[var(--fr8x-jet)]">Official FR8X Bank Transfer Details:</p>
                        <p><span className="font-semibold">Bank Name:</span> {godmodePaymentDetails.bankName}</p>
                        <p><span className="font-semibold">Account Name:</span> {godmodePaymentDetails.accountName}</p>
                        <p><span className="font-semibold">Account Number:</span> {godmodePaymentDetails.accountNumber}</p>
                        <p><span className="font-semibold">IFSC / SWIFT:</span> {godmodePaymentDetails.ifscSwift}</p>
                        <p><span className="font-semibold">Branch:</span> {godmodePaymentDetails.branchName}</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="fr8x-label block mb-1.5">GST / Tax ID</label>
                    <input type="text" value={gstTaxId} onChange={(e) => setGstTaxId(e.target.value)} className="fr8x-input" placeholder="29ABCDE1234F1Z5" />
                  </div>
                </div>
              )}

              {/* Payment Actions with Button-Level Loader */}
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  loadingText={selectedTier === "basic" ? "Processing Payment & Account..." : "Creating account..."}
                  className="flex-1 rounded-md bg-[#56C5F0] py-2.5 text-body-sm font-semibold text-white
                             transition-all duration-200 hover:bg-[#3ABFF0] active:scale-[0.98]"
                >
                  {selectedTier === "basic" ? "Confirm & Pay" : "Create Account"}
                </Button>
                {selectedTier === "basic" && (
                  <Button
                    type="button"
                    className="flex-1 rounded-md bg-[#56C5F0] py-2.5 text-body-sm font-semibold text-white
                               transition-all duration-200 hover:bg-[#3ABFF0] active:scale-[0.98]"
                  >
                    Autopay (Monthly)
                  </Button>
                )}
              </div>

              {/* GST invoice note */}
              {selectedTier === "basic" && (
                <p className="text-caption text-foreground-muted text-center">
                  [automatically the GST invoice cum receipt to be port to customer email id from support@fr8x.in to customer email id in PDF]
                </p>
              )}
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
      </div>
    </div>
  );
}
