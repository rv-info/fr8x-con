// FR8X-CON Unified Authentication Card — Production
// Tabs: Sign In | Sign Up | Reset Password
// Email OTP verification on sign-up.

"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { signInWithCustomToken } from "firebase/auth";
import { useAuth } from "@/providers/AuthProvider";
import {
  signInWithEmail,
  createAccountWithEmail,
  resetPassword,
  sendEmailOTP,
  verifyEmailOTP,
} from "@/lib/firebase/auth";
import { setDocument } from "@/lib/firebase/firestore";
import { firebaseAuth } from "@/lib/firebase/config";
import { ROUTES, COLLECTIONS, USER_ROLES } from "@/lib/utils/constants";
import { validateEnterpriseEmail } from "@/lib/config/enterpriseRegistrationPolicy";
import { Button } from "@/components/ui/Button";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Building2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  KeyRound,
  FileText,
  X,
} from "lucide-react";

export type AuthTab = "signin" | "signup" | "forgot";

interface AuthCardProps {
  initialTab?: AuthTab;
}

const OTP_RESEND_COOLDOWN = 60; // seconds

export function AuthCard({ initialTab = "signin" }: AuthCardProps) {
  const [activeTab, setActiveTab] = useState<AuthTab>(initialTab);
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  // Common UI State
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [globalSuccess, setGlobalSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password visibility
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showSignUpConfirm, setShowSignUpConfirm] = useState(false);

  // Terms & Conditions state
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Sign In state
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  // Sign Up state
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState("");
  const [signUpCompanyName, setSignUpCompanyName] = useState("");
  const [signUpRole, setSignUpRole] = useState("");

  // OTP verification state (post sign-up)
  const [otpStep, setOtpStep] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Forgot Password state
  const [forgotEmail, setForgotEmail] = useState("");

  // Password strength
  const getPasswordCriteria = (pass: string) => ({
    minLength: pass.length >= 8,
    hasUpper: /[A-Z]/.test(pass),
    hasLower: /[a-z]/.test(pass),
    hasNumber: /[0-9]/.test(pass),
    hasSpecial: /[^A-Za-z0-9]/.test(pass),
  });

  const criteria = getPasswordCriteria(signUpPassword);
  const strengthScore = Object.values(criteria).filter(Boolean).length;

  const handleTabChange = (tab: AuthTab) => {
    setActiveTab(tab);
    setGlobalError(null);
    setGlobalSuccess(null);
    setOtpStep(false);
  };

  // OTP input handlers
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpCode];
    newOtp[index] = value.slice(-1);
    setOtpCode(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpCode[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const startResendCooldown = () => {
    setResendCooldown(OTP_RESEND_COOLDOWN);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    setGlobalError(null);
    const result = await sendEmailOTP(otpEmail);
    if (result.success) {
      setGlobalSuccess("OTP resent to your email.");
      setOtpCode(["", "", "", "", "", ""]);
      startResendCooldown();
      setTimeout(() => setGlobalSuccess(null), 3000);
    } else {
      setGlobalError(result.error || "Failed to resend OTP.");
    }
  };

  // ── Sign In Submit ──
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail.trim() || !signInPassword.trim()) {
      setGlobalError("Please enter both email and password.");
      return;
    }
    setGlobalError(null);
    setGlobalSuccess(null);
    setIsSubmitting(true);
    try {
      await signInWithEmail(signInEmail.trim(), signInPassword);
      router.push(ROUTES.FEEDS);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed.";
      if (
        message.includes("user-not-found") ||
        message.includes("wrong-password") ||
        message.includes("invalid-credential") ||
        message.includes("INVALID_LOGIN_CREDENTIALS")
      ) {
        setGlobalError("Invalid email or password.");
      } else if (message.includes("too-many-requests")) {
        setGlobalError("Too many login attempts. Please try again later.");
      } else {
        setGlobalError("Login failed. Please check your credentials.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Sign Up Submit ──
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);
    setGlobalSuccess(null);

    if (!agreedToTerms) {
      setGlobalError("Please accept the Terms & Conditions to create an account.");
      return;
    }

    const emailValidation = validateEnterpriseEmail(signUpEmail.trim());
    if (!emailValidation.isValid) {
      setGlobalError(emailValidation.reason || "Please use your official company email.");
      return;
    }

    if (
      !signUpName.trim() ||
      !signUpEmail.trim() ||
      !signUpPassword ||
      !signUpConfirmPassword ||
      !signUpCompanyName.trim() ||
      !signUpRole
    ) {
      setGlobalError("Please complete all required fields.");
      return;
    }

    if (signUpPassword !== signUpConfirmPassword) {
      setGlobalError("Passwords do not match.");
      return;
    }

    if (strengthScore < 4) {
      setGlobalError("Password must meet at least 4 security requirements.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Create Firebase Auth user with User ID / Email + Password
      const credential = await createAccountWithEmail(
        signUpEmail.trim(),
        signUpPassword,
        signUpName.trim()
      );
      const uid = credential.user.uid;

      // Save user + profile records
      await setDocument(COLLECTIONS.USERS, uid, {
        uid,
        email: signUpEmail.trim(),
        role: signUpRole,
        companyName: signUpCompanyName.trim(),
        membershipTier: "trial",
        status: "active",
        emailVerified: true,
        isGodMode: false,
        createdAt: new Date().toISOString(),
        createdBy: uid,
        updatedBy: uid,
        version: 1,
      });

      await setDocument(COLLECTIONS.PROFILES, uid, {
        userId: uid,
        fullName: signUpName.trim(),
        companyName: signUpCompanyName.trim(),
        verifiedBadge: true,
        industryTags: [],
        createdAt: new Date().toISOString(),
        createdBy: uid,
        updatedBy: uid,
        version: 1,
      });

      // Dispatch welcome email silently
      fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: signUpEmail.trim(),
          type: "welcome",
          displayName: signUpName.trim(),
        }),
      }).catch(() => undefined);

      setGlobalSuccess("Account created successfully! Redirecting to your dashboard...");
      setTimeout(() => router.push(ROUTES.FEEDS), 1000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration failed.";
      if (message.includes("email-already-in-use")) {
        setGlobalError("An account with this email already exists. Try signing in.");
      } else {
        setGlobalError("Registration failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── OTP Verification Submit ──
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otpCode.join("");
    if (otpString.length !== 6) {
      setGlobalError("Please enter all 6 digits of your OTP.");
      return;
    }

    setGlobalError(null);
    setIsSubmitting(true);

    try {
      const result = await verifyEmailOTP(otpEmail, otpString);
      if (!result.success || !result.customToken) {
        setGlobalError(result.error || "Invalid or expired OTP.");
        return;
      }

      // Sign in with the custom token returned from server
      await signInWithCustomToken(firebaseAuth, result.customToken);

      // Mark profile as verified
      const user = firebaseAuth.currentUser;
      if (user) {
        await setDocument(COLLECTIONS.PROFILES, user.uid, { verifiedBadge: true }, true);
      }

      setGlobalSuccess("Email verified! Redirecting to your dashboard...");
      setTimeout(() => router.push(ROUTES.FEEDS), 800);
    } catch {
      setGlobalError("Verification failed. Please request a new OTP.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Forgot Password Submit ──
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setGlobalError("Please enter your email address.");
      return;
    }
    setGlobalError(null);
    setGlobalSuccess(null);
    setIsSubmitting(true);
    try {
      await resetPassword(forgotEmail.trim());
      setGlobalSuccess(`Password reset instructions sent to ${forgotEmail.trim()}`);
    } catch {
      setGlobalError("Failed to send reset email. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-lg transition-colors">
      {/* Brand Badge */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-[var(--fr8x-periwinkle)] flex items-center justify-center text-white font-extrabold text-sm shadow-sm">
            F8
          </div>
          <div>
            <span className="font-extrabold text-lg text-[var(--fr8x-jet)] tracking-wider">FR8X</span>
            <span className="font-semibold text-lg text-[var(--fr8x-jet)] tracking-wide">-CON</span>
          </div>
        </div>
        <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[var(--fr8x-mist)] text-[var(--fr8x-jet)] border border-slate-200">
          Enterprise B2B
        </span>
      </div>

      {/* OTP Verification Step — overlays tab content */}
      <AnimatePresence mode="wait">
        {otpStep ? (
          <motion.form
            key="otp"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleOtpSubmit}
            className="space-y-5"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <KeyRound className="h-5 w-5 text-[#253031]" />
                <h2 className="text-display-sm font-bold text-[var(--fr8x-jet)] dark:text-white">Verify Email</h2>
              </div>
              <p className="text-body-sm text-foreground-secondary dark:text-gray-400">
                Enter the 6-digit OTP sent to <span className="font-semibold text-[var(--fr8x-jet)] dark:text-white">{otpEmail}</span>
              </p>
            </div>

            {/* Alert */}
            <AnimatePresence mode="wait">
              {globalError && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="rounded-xl bg-danger-light dark:bg-danger/20 border border-danger/30 p-3.5 flex items-start gap-2.5 text-body-sm text-danger-dark dark:text-danger-light">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span>{globalError}</span>
                </motion.div>
              )}
              {globalSuccess && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-3.5 flex items-start gap-2.5 text-body-sm text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5 text-emerald-600" />
                  <span>{globalSuccess}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 6-digit OTP input */}
            <div className="flex gap-2 justify-center">
              {otpCode.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { otpRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="w-11 h-12 text-center text-lg font-bold border-2 border-border dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-[var(--fr8x-jet)] dark:text-white focus:border-[#56C5F0] focus:outline-none transition-colors"
                  aria-label={`OTP digit ${i + 1}`}
                />
              ))}
            </div>

            <Button
              type="submit"
              isLoading={isSubmitting}
              loadingText="Verifying..."
              className="fr8x-btn-primary w-full rounded-xl py-3 text-body-md font-bold"
            >
              Verify OTP & Access Dashboard
            </Button>

            <div className="flex items-center justify-between text-body-sm">
              <button
                type="button"
                onClick={() => { setOtpStep(false); setOtpCode(["","","","","",""]); setGlobalError(null); }}
                className="text-foreground-secondary hover:text-[var(--fr8x-jet)] dark:hover:text-white transition-colors"
              >
                ← Change email
              </button>
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={resendCooldown > 0}
                className="flex items-center gap-1 text-[#2B9ED6] hover:underline font-medium disabled:opacity-50 disabled:no-underline"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
              </button>
            </div>
          </motion.form>
        ) : (
          <>
            {/* Tabs Navigation */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-gray-100 dark:bg-gray-800/80 rounded-xl mb-6">
              {(["signin", "signup", "forgot"] as AuthTab[]).map((tab) => {
                const labels: Record<AuthTab, string> = { signin: "Sign In", signup: "Sign Up", forgot: "Reset" };
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => handleTabChange(tab)}
                    className={`py-2 text-body-sm font-semibold rounded-lg transition-all duration-200 ${
                      activeTab === tab
                        ? "bg-[#EDE6F2] text-[#253031] font-bold shadow-sm border border-[#EDE6F2]"
                        : "text-[#746D75] hover:text-[#253031]"
                    }`}
                    aria-selected={activeTab === tab}
                    role="tab"
                  >
                    {labels[tab]}
                  </button>
                );
              })}
            </div>

            {/* Inline Feedback */}
            <AnimatePresence mode="wait">
              {globalError && (
                <motion.div key="err" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  className="mb-5 rounded-xl bg-danger-light dark:bg-danger/20 border border-danger/30 p-3.5 flex items-start gap-2.5 text-body-sm text-danger-dark dark:text-danger-light">
                  <AlertCircle className="h-5 w-5 text-danger flex-shrink-0 mt-0.5" />
                  <span>{globalError}</span>
                </motion.div>
              )}
              {globalSuccess && (
                <motion.div key="ok" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  className="mb-5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-3.5 flex items-start gap-2.5 text-body-sm text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>{globalSuccess}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {/* ═══ SIGN IN ═══ */}
              {activeTab === "signin" && (
                <motion.form key="signin" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.2 }} onSubmit={handleSignInSubmit} className="space-y-4">
                  <div>
                    <h2 className="text-display-sm font-bold text-[var(--fr8x-jet)] dark:text-white">Welcome back</h2>
                    <p className="text-body-sm text-foreground-secondary dark:text-gray-400 mt-1">Access your verified logistics dashboard</p>
                  </div>

                  <div>
                    <label htmlFor="signin-email" className="fr8x-label block mb-1.5 dark:text-gray-300">Work Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted dark:text-gray-500" />
                      <input id="signin-email" type="email" value={signInEmail} onChange={(e) => setSignInEmail(e.target.value)}
                        className="fr8x-input pl-9 py-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        placeholder="you@company.com" autoComplete="email" required autoFocus />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="signin-password" className="fr8x-label block dark:text-gray-300">Password</label>
                      <button type="button" onClick={() => handleTabChange("forgot")}
                        className="text-body-sm text-[#746D75] hover:text-[#253031] underline font-medium">Forgot password?</button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted dark:text-gray-500" />
                      <input id="signin-password" type={showSignInPassword ? "text" : "password"} value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        className="fr8x-input pl-9 pr-10 py-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        placeholder="••••••••" autoComplete="current-password" required />
                      <button type="button" onClick={() => setShowSignInPassword(!showSignInPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground dark:text-gray-400 dark:hover:text-gray-200"
                        aria-label={showSignInPassword ? "Hide password" : "Show password"}>
                        {showSignInPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" isLoading={isSubmitting} loadingText="Signing In..."
                    className="fr8x-btn-primary w-full rounded-xl py-3 text-body-md font-bold mt-2">
                    Sign In to Dashboard
                  </Button>
                </motion.form>
              )}

              {/* ═══ SIGN UP ═══ */}
              {activeTab === "signup" && (
                <motion.form key="signup" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }} onSubmit={handleSignUpSubmit} className="space-y-4">
                  <div>
                    <h2 className="text-display-sm font-bold text-[var(--fr8x-jet)] dark:text-white">Create Account</h2>
                    <p className="text-body-sm text-foreground-secondary dark:text-gray-400 mt-1">Join the verified logistics network</p>
                  </div>

                  <div className="p-3 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/60 rounded-xl flex items-center gap-2.5 text-[11px] text-blue-950 dark:text-blue-200">
                    <ShieldCheck className="h-4 w-4 text-[#56C5F0] flex-shrink-0" />
                    <span>Official company domain email required. Email OTP verification will be sent.</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="signup-name" className="fr8x-label block mb-1 dark:text-gray-300">Full Name *</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted dark:text-gray-500" />
                        <input id="signup-name" type="text" value={signUpName} onChange={(e) => setSignUpName(e.target.value)}
                          className="fr8x-input pl-9 py-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white" placeholder="John Doe" required />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="signup-company" className="fr8x-label block mb-1 dark:text-gray-300">Company Name *</label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted dark:text-gray-500" />
                        <input id="signup-company" type="text" value={signUpCompanyName} onChange={(e) => setSignUpCompanyName(e.target.value)}
                          className="fr8x-input pl-9 py-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white" placeholder="Global Freight Ltd" required />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="signup-role" className="fr8x-label block mb-1 dark:text-gray-300">Business Vertical *</label>
                    <select id="signup-role" value={signUpRole} onChange={(e) => setSignUpRole(e.target.value)}
                      className="fr8x-input py-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white font-medium" required>
                      <option value="">Select Vertical</option>
                      {USER_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="signup-email" className="fr8x-label block mb-1 dark:text-gray-300">Official Work Email *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted dark:text-gray-500" />
                      <input id="signup-email" type="email" value={signUpEmail} onChange={(e) => setSignUpEmail(e.target.value)}
                        className="fr8x-input pl-9 py-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white" placeholder="name@company.com" required />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="signup-password" className="fr8x-label block mb-1 dark:text-gray-300">Password *</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted dark:text-gray-500" />
                      <input id="signup-password" type={showSignUpPassword ? "text" : "password"} value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        className="fr8x-input pl-9 pr-10 py-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white" placeholder="Create password" required />
                      <button type="button" onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground dark:text-gray-400"
                        aria-label={showSignUpPassword ? "Hide password" : "Show password"}>
                        {showSignUpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {signUpPassword.length > 0 && (
                      <div className="mt-2 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-border dark:border-gray-700/60">
                        <div className="flex items-center justify-between text-caption font-semibold mb-1.5">
                          <span className="text-foreground-secondary dark:text-gray-400">Strength:</span>
                          <span className={strengthScore <= 2 ? "text-danger" : strengthScore <= 3 ? "text-warning-dark dark:text-warning" : "text-emerald-600 dark:text-emerald-400"}>
                            {strengthScore <= 2 ? "Weak" : strengthScore <= 3 ? "Medium" : "Strong"}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex gap-0.5">
                          {[1,2,3,4].map((i) => (
                            <div key={i} className={`h-full flex-1 transition-all duration-300 rounded-full ${
                              strengthScore >= i
                                ? strengthScore <= 2 ? "bg-danger" : strengthScore <= 3 ? "bg-warning" : "bg-emerald-500"
                                : "bg-transparent"
                            }`} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="signup-confirm" className="fr8x-label block mb-1 dark:text-gray-300">Confirm Password *</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted dark:text-gray-500" />
                      <input id="signup-confirm" type={showSignUpConfirm ? "text" : "password"} value={signUpConfirmPassword}
                        onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                        className="fr8x-input pl-9 pr-10 py-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white" placeholder="Confirm password" required />
                      <button type="button" onClick={() => setShowSignUpConfirm(!showSignUpConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground dark:text-gray-400"
                        aria-label={showSignUpConfirm ? "Hide password" : "Show password"}>
                        {showSignUpConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Agree to Terms & Conditions Tick Box */}
                  <div className="flex items-start gap-2.5 pt-1">
                    <input
                      id="signup-terms"
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 dark:border-gray-700 text-[#56C5F0] focus:ring-[#56C5F0] cursor-pointer"
                      required
                    />
                    <label htmlFor="signup-terms" className="text-xs text-foreground-secondary dark:text-gray-400 cursor-pointer select-none">
                      I agree to the{" "}
                      <button
                        type="button"
                        onClick={() => setShowTermsModal(true)}
                        className="text-[#746D75] hover:text-[#253031] underline font-medium"
                      >
                        Terms &amp; Conditions
                      </button>{" "}
                      and B2B Platform Privacy Policy
                    </label>
                  </div>

                  <Button type="submit" isLoading={isSubmitting} loadingText="Creating Account..."
                    className="fr8x-btn-primary w-full rounded-xl py-3 text-body-md font-bold mt-2">
                    Create Account <ArrowRight className="inline h-4 w-4 ml-1" />
                  </Button>
                </motion.form>
              )}

              {/* ═══ FORGOT PASSWORD ═══ */}
              {activeTab === "forgot" && (
                <motion.form key="forgot" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.2 }} onSubmit={handleForgotSubmit} className="space-y-4">
                  <div>
                    <h2 className="text-display-sm font-bold text-[var(--fr8x-jet)] dark:text-white">Forgot Password?</h2>
                    <p className="text-body-sm text-foreground-secondary dark:text-gray-400 mt-1">
                      Enter your registered corporate email to receive a password reset link.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="forgot-email" className="fr8x-label block mb-1.5 dark:text-gray-300">Registered Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted dark:text-gray-500" />
                      <input id="forgot-email" type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)}
                        className="fr8x-input pl-9 py-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        placeholder="you@company.com" required autoFocus />
                    </div>
                  </div>

                  <Button type="submit" isLoading={isSubmitting} loadingText="Sending Reset Email..."
                    className="fr8x-btn-primary w-full rounded-xl py-3 text-body-md font-bold mt-2">
                    Send Password Reset Email
                  </Button>

                  <div className="pt-2 text-center">
                    <button type="button" onClick={() => handleTabChange("signin")}
                      className="text-body-sm text-[#746D75] hover:text-[#253031] underline font-medium">
                      ← Back to Sign In
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-border dark:border-gray-800 flex items-center justify-between text-caption text-foreground-secondary dark:text-gray-400">
        <span>&copy; {new Date().getFullYear()} FR8X-CON</span>
        <button
          type="button"
          onClick={() => setShowTermsModal(true)}
          className="hover:text-[var(--fr8x-jet)] dark:hover:text-white transition-colors underline"
        >
          Terms &amp; Conditions
        </button>
      </div>

      {/* Terms & Conditions Interactive Pop-Up Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 text-left">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl border border-border dark:border-gray-800 space-y-4">
            <div className="flex items-center justify-between border-b border-border dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#56C5F0]" />
                <h3 className="text-heading-md font-bold text-[var(--fr8x-jet)] dark:text-white">
                  FR8X-CON Terms &amp; Conditions
                </h3>
              </div>
              <button
                onClick={() => setShowTermsModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 text-xs text-foreground-secondary dark:text-gray-300 pr-2 leading-relaxed">
              <p className="font-semibold text-[var(--fr8x-jet)] dark:text-white">Effective Date: August 2026</p>
              
              <h4 className="font-bold text-slate-800 dark:text-slate-100">1. Enterprise B2B Platform Service Terms</h4>
              <p>FR8X-CON provides digital freight logistics networking, rate discovery, and auction capabilities for verified corporate logistics partners. Users agree to provide truthful corporate identity credentials.</p>

              <h4 className="font-bold text-slate-800 dark:text-slate-100">2. Data Confidentiality &amp; Privacy Policy</h4>
              <p>All ocean, air, and land freight quotations, bids, and communication threads shared on FR8X-CON are strictly protected under enterprise-grade encryption. Commercial rates will not be shared with unauthorized third parties.</p>

              <h4 className="font-bold text-slate-800 dark:text-slate-100">3. Freight Auction &amp; Procurement Guidelines</h4>
              <p>All bidding entities and logistics buyers must honor commitments made during live auction contracts and spot rate confirmations in accordance with international maritime freight regulations.</p>

              <h4 className="font-bold text-slate-800 dark:text-slate-100">4. User Account Credentials</h4>
              <p>You are responsible for maintaining the security of your User ID and Password. Shared or public logins without organization authorization are prohibited.</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border dark:border-gray-800">
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setAgreedToTerms(true);
                  setShowTermsModal(false);
                }}
                className="px-5 py-2 rounded-xl bg-[#56C5F0] hover:bg-[#3ABFF0] text-xs font-bold text-white shadow-md transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" /> I Agree &amp; Accept Terms
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
