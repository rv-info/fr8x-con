// FR8X-CON Modern Unified Authentication Card (Sign In, Sign Up, Forgot Password)

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/providers/AuthProvider";
import { signInWithEmail, createAccountWithEmail, resetPassword } from "@/lib/firebase/auth";
import { setDocument } from "@/lib/firebase/firestore";
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
  Loader2,
  Check,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck
} from "lucide-react";

export type AuthTab = "signin" | "signup" | "forgot";

interface AuthCardProps {
  initialTab?: AuthTab;
}

export function AuthCard({ initialTab = "signin" }: AuthCardProps) {
  const [activeTab, setActiveTab] = useState<AuthTab>(initialTab);
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  // Common UI State
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [globalSuccess, setGlobalSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password visibility state
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showSignUpConfirm, setShowSignUpConfirm] = useState(false);

  // --- 1. Sign In Form State ---
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  // --- 2. Sign Up Form State ---
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState("");
  const [signUpCompanyName, setSignUpCompanyName] = useState("");
  const [signUpRole, setSignUpRole] = useState("");

  // --- 3. Forgot Password Form State ---
  const [forgotEmail, setForgotEmail] = useState("");

  // Password strength logic for Sign Up
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
  };

  // --- Submit Handlers ---
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
      const message = err instanceof Error ? err.message : "Login failed. Please check credentials.";
      if (message.includes("user-not-found") || message.includes("wrong-password") || message.includes("invalid-credential")) {
        setGlobalError("Invalid email or password.");
      } else if (message.includes("too-many-requests")) {
        setGlobalError("Too many login attempts. Please try again later.");
      } else {
        setGlobalError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);
    setGlobalSuccess(null);

    // Email validation
    const emailValidation = validateEnterpriseEmail(signUpEmail.trim());
    if (!emailValidation.isValid) {
      setGlobalError(emailValidation.reason || "Please use your official company email.");
      return;
    }

    if (!signUpName.trim() || !signUpEmail.trim() || !signUpPassword || !signUpConfirmPassword || !signUpCompanyName.trim() || !signUpRole) {
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
      // Create Firebase Auth user
      const credential = await createAccountWithEmail(
        signUpEmail.trim(),
        signUpPassword,
        signUpName.trim()
      );
      const uid = credential.user.uid;

      // Save user record
      await setDocument(COLLECTIONS.USERS, uid, {
        email: signUpEmail.trim(),
        role: signUpRole,
        companyName: signUpCompanyName.trim(),
        membershipTier: "trial",
        status: "active",
        createdAt: new Date().toISOString(),
        createdBy: uid,
        updatedBy: uid,
        version: 1,
      });

      // Save profile record
      await setDocument(COLLECTIONS.PROFILES, uid, {
        userId: uid,
        fullName: signUpName.trim(),
        companyName: signUpCompanyName.trim(),
        verifiedBadge: true,
        industryTags: ["Freight Forwarding", "Logistics"],
        createdAt: new Date().toISOString(),
        createdBy: uid,
        updatedBy: uid,
        version: 1,
      });

      // Send Welcome email via /api/send-email (Zoho SMTP)
      fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: signUpEmail.trim(),
          type: "welcome",
          displayName: signUpName.trim(),
        }),
      }).catch((emailErr) => {
        console.warn("Welcome email dispatch failed silently:", emailErr);
      });

      setGlobalSuccess("Account created successfully! Welcome email sent.");
      setTimeout(() => {
        router.push(ROUTES.FEEDS);
      }, 1000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration failed.";
      if (message.includes("email-already-in-use")) {
        setGlobalError("An account with this email already exists. Try signing in.");
      } else {
        setGlobalError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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
      // Dispatches reset link via /api/send-email (Zoho SMTP)
      await resetPassword(forgotEmail.trim());
      setGlobalSuccess(`Password reset instructions sent via email to ${forgotEmail.trim()}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send password reset email.";
      setGlobalError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-lg bg-white dark:bg-gray-900 border border-border dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-xl dark:shadow-2xl transition-colors">
      {/* Brand Badge */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#0b192c] to-[#56C5F0] flex items-center justify-center text-white font-extrabold text-sm shadow-sm">
            F8
          </div>
          <div>
            <span className="font-extrabold text-lg text-[var(--fr8x-jet)] dark:text-white tracking-wider">FR8X</span>
            <span className="font-semibold text-lg text-[#56C5F0] tracking-wide">-CON</span>
          </div>
        </div>
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[var(--fr8x-mist)] dark:bg-gray-800 text-[var(--fr8x-jet)] dark:text-gray-300">
          Enterprise B2B
        </span>
      </div>

      {/* Tabs Navigation */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-gray-100 dark:bg-gray-800/80 rounded-xl mb-6">
        <button
          type="button"
          onClick={() => handleTabChange("signin")}
          className={`py-2 text-body-sm font-semibold rounded-lg transition-all duration-200 ${
            activeTab === "signin"
              ? "bg-white dark:bg-gray-900 text-[var(--fr8x-jet)] dark:text-white shadow-sm"
              : "text-foreground-secondary dark:text-gray-400 hover:text-[var(--fr8x-jet)] dark:hover:text-white"
          }`}
          aria-selected={activeTab === "signin"}
          role="tab"
        >
          Sign In
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("signup")}
          className={`py-2 text-body-sm font-semibold rounded-lg transition-all duration-200 ${
            activeTab === "signup"
              ? "bg-white dark:bg-gray-900 text-[var(--fr8x-jet)] dark:text-white shadow-sm"
              : "text-foreground-secondary dark:text-gray-400 hover:text-[var(--fr8x-jet)] dark:hover:text-white"
          }`}
          aria-selected={activeTab === "signup"}
          role="tab"
        >
          Sign Up
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("forgot")}
          className={`py-2 text-body-sm font-semibold rounded-lg transition-all duration-200 ${
            activeTab === "forgot"
              ? "bg-white dark:bg-gray-900 text-[var(--fr8x-jet)] dark:text-white shadow-sm"
              : "text-foreground-secondary dark:text-gray-400 hover:text-[var(--fr8x-jet)] dark:hover:text-white"
          }`}
          aria-selected={activeTab === "forgot"}
          role="tab"
        >
          Reset Password
        </button>
      </div>

      {/* Inline Feedback Alerts */}
      <AnimatePresence mode="wait">
        {globalError && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mb-5 rounded-xl bg-danger-light dark:bg-danger/20 border border-danger/30 p-3.5 flex items-start gap-2.5 text-body-sm text-danger-dark dark:text-danger-light"
          >
            <AlertCircle className="h-5 w-5 text-danger flex-shrink-0 mt-0.5" />
            <span>{globalError}</span>
          </motion.div>
        )}

        {globalSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mb-5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-3.5 flex items-start gap-2.5 text-body-sm text-emerald-800 dark:text-emerald-300"
          >
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <span>{globalSuccess}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Content Switcher with Motion */}
      <AnimatePresence mode="wait">
        {/* ═══ VIEW 1: SIGN IN ═══ */}
        {activeTab === "signin" && (
          <motion.form
            key="signin"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSignInSubmit}
            className="space-y-4"
          >
            <div>
              <h2 className="text-display-sm font-bold text-[var(--fr8x-jet)] dark:text-white">Welcome back</h2>
              <p className="text-body-sm text-foreground-secondary dark:text-gray-400 mt-1">
                Access your verified logistics dashboard
              </p>
            </div>

            <div>
              <label htmlFor="signin-email" className="fr8x-label block mb-1.5 dark:text-gray-300">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted dark:text-gray-500" />
                <input
                  id="signin-email"
                  type="email"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  className="fr8x-input pl-9 py-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  placeholder="you@company.com"
                  autoComplete="email"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="signin-password" className="fr8x-label block dark:text-gray-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => handleTabChange("forgot")}
                  className="text-body-sm text-[#2B9ED6] hover:underline font-medium"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted dark:text-gray-500" />
                <input
                  id="signin-password"
                  type={showSignInPassword ? "text" : "password"}
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  className="fr8x-input pl-9 pr-10 py-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowSignInPassword(!showSignInPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground dark:text-gray-400 dark:hover:text-gray-200"
                  aria-label={showSignInPassword ? "Hide password" : "Show password"}
                >
                  {showSignInPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              isLoading={isSubmitting}
              loadingText="Signing In..."
              className="w-full rounded-xl bg-[#56C5F0] py-3 text-body-md font-semibold text-white
                         transition-all duration-200 hover:bg-[#3ABFF0] active:scale-[0.98] mt-2 shadow-md hover:shadow-lg"
            >
              Sign In to Dashboard
            </Button>

            {/* Quick Demo Fill */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setSignInEmail("user@fr8x.in");
                  setSignInPassword("User@123456");
                }}
                className="text-caption text-foreground-secondary dark:text-gray-400 hover:text-[var(--fr8x-jet)] dark:hover:text-white underline transition-colors"
              >
                Fill Demo Credentials (User Angle)
              </button>
            </div>
          </motion.form>
        )}

        {/* ═══ VIEW 2: SIGN UP ═══ */}
        {activeTab === "signup" && (
          <motion.form
            key="signup"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSignUpSubmit}
            className="space-y-4"
          >
            <div>
              <h2 className="text-display-sm font-bold text-[var(--fr8x-jet)] dark:text-white">Create Account</h2>
              <p className="text-body-sm text-foreground-secondary dark:text-gray-400 mt-1">
                Join the verified logistics network
              </p>
            </div>

            {/* Policy Notice */}
            <div className="p-3 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/60 rounded-xl flex items-center gap-2.5 text-[11px] text-blue-950 dark:text-blue-200">
              <ShieldCheck className="h-4 w-4 text-[#56C5F0] flex-shrink-0" />
              <span>Official company domain email required (@yourcompany.com).</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="signup-name" className="fr8x-label block mb-1 dark:text-gray-300">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted dark:text-gray-500" />
                  <input
                    id="signup-name"
                    type="text"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    className="fr8x-input pl-9 py-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="signup-company" className="fr8x-label block mb-1 dark:text-gray-300">
                  Company Name *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted dark:text-gray-500" />
                  <input
                    id="signup-company"
                    type="text"
                    value={signUpCompanyName}
                    onChange={(e) => setSignUpCompanyName(e.target.value)}
                    className="fr8x-input pl-9 py-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    placeholder="Global Freight Ltd"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="signup-role" className="fr8x-label block mb-1 dark:text-gray-300">
                Business Vertical *
              </label>
              <select
                id="signup-role"
                value={signUpRole}
                onChange={(e) => setSignUpRole(e.target.value)}
                className="fr8x-input py-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white font-medium"
                required
              >
                <option value="">Select Vertical (e.g. Freight Forwarder, Shipping Line)</option>
                {USER_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="signup-email" className="fr8x-label block mb-1 dark:text-gray-300">
                Official Work Email (@company.com) *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted dark:text-gray-500" />
                <input
                  id="signup-email"
                  type="email"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  className="fr8x-input pl-9 py-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            {/* Password Field + Strength Indicator */}
            <div>
              <label htmlFor="signup-password" className="fr8x-label block mb-1 dark:text-gray-300">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted dark:text-gray-500" />
                <input
                  id="signup-password"
                  type={showSignUpPassword ? "text" : "password"}
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  className="fr8x-input pl-9 pr-10 py-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  placeholder="Create password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground dark:text-gray-400 dark:hover:text-gray-200"
                  aria-label={showSignUpPassword ? "Hide password" : "Show password"}
                >
                  {showSignUpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Password Strength Meter */}
              {signUpPassword.length > 0 && (
                <div className="mt-2 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-border dark:border-gray-700/60 space-y-1.5">
                  <div className="flex items-center justify-between text-caption font-semibold">
                    <span className="text-foreground-secondary dark:text-gray-400">Strength:</span>
                    <span
                      className={
                        strengthScore <= 2
                          ? "text-danger"
                          : strengthScore <= 3
                          ? "text-warning-dark dark:text-warning"
                          : "text-emerald-600 dark:text-emerald-400"
                      }
                    >
                      {strengthScore <= 2 ? "Weak" : strengthScore <= 3 ? "Medium" : "Strong"}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex gap-0.5">
                    <div className={`h-full flex-1 transition-all duration-300 ${strengthScore >= 1 ? (strengthScore <= 2 ? "bg-danger" : strengthScore <= 3 ? "bg-warning" : "bg-emerald-500") : "bg-transparent"}`} />
                    <div className={`h-full flex-1 transition-all duration-300 ${strengthScore >= 2 ? (strengthScore <= 2 ? "bg-danger" : strengthScore <= 3 ? "bg-warning" : "bg-emerald-500") : "bg-transparent"}`} />
                    <div className={`h-full flex-1 transition-all duration-300 ${strengthScore >= 3 ? (strengthScore <= 3 ? "bg-warning" : "bg-emerald-500") : "bg-transparent"}`} />
                    <div className={`h-full flex-1 transition-all duration-300 ${strengthScore >= 4 ? "bg-emerald-500" : "bg-transparent"}`} />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="signup-confirm" className="fr8x-label block mb-1 dark:text-gray-300">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted dark:text-gray-500" />
                <input
                  id="signup-confirm"
                  type={showSignUpConfirm ? "text" : "password"}
                  value={signUpConfirmPassword}
                  onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                  className="fr8x-input pl-9 pr-10 py-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  placeholder="Confirm password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowSignUpConfirm(!showSignUpConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground dark:text-gray-400 dark:hover:text-gray-200"
                  aria-label={showSignUpConfirm ? "Hide password" : "Show password"}
                >
                  {showSignUpConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              isLoading={isSubmitting}
              loadingText="Creating Enterprise Account..."
              className="w-full rounded-xl bg-[#56C5F0] py-3 text-body-md font-semibold text-white
                         transition-all duration-200 hover:bg-[#3ABFF0] active:scale-[0.98] mt-2 shadow-md hover:shadow-lg"
            >
              Create Account & Send Welcome Email
            </Button>
          </motion.form>
        )}

        {/* ═══ VIEW 3: FORGOT PASSWORD ═══ */}
        {activeTab === "forgot" && (
          <motion.form
            key="forgot"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleForgotSubmit}
            className="space-y-4"
          >
            <div>
              <h2 className="text-display-sm font-bold text-[var(--fr8x-jet)] dark:text-white">Forgot Password?</h2>
              <p className="text-body-sm text-foreground-secondary dark:text-gray-400 mt-1">
                Enter your registered corporate email to receive a password reset link via Zoho SMTP.
              </p>
            </div>

            <div>
              <label htmlFor="forgot-email" className="fr8x-label block mb-1.5 dark:text-gray-300">
                Registered Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted dark:text-gray-500" />
                <input
                  id="forgot-email"
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="fr8x-input pl-9 py-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  placeholder="you@company.com"
                  required
                  autoFocus
                />
              </div>
            </div>

            <Button
              type="submit"
              isLoading={isSubmitting}
              loadingText="Sending Reset Email..."
              className="w-full rounded-xl bg-[#56C5F0] py-3 text-body-md font-semibold text-white
                         transition-all duration-200 hover:bg-[#3ABFF0] active:scale-[0.98] mt-2 shadow-md hover:shadow-lg"
            >
              Send Password Reset Email
            </Button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => handleTabChange("signin")}
                className="text-body-sm text-[#2B9ED6] hover:underline font-medium"
              >
                &larr; Back to Sign In
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Card Footer Terms */}
      <div className="mt-8 pt-4 border-t border-border dark:border-gray-800 flex items-center justify-between text-caption text-foreground-secondary dark:text-gray-400">
        <span>&copy; {new Date().getFullYear()} FR8X-CON</span>
        <Link href={ROUTES.TERMS} className="hover:text-[var(--fr8x-jet)] dark:hover:text-white transition-colors underline">
          Terms & Conditions
        </Link>
      </div>
    </div>
  );
}
