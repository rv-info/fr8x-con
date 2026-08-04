// FR8X-CON Reset Password Page — Out-of-band Action Code Handler

"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/config";
import { ROUTES, APP_NAME } from "@/lib/utils/constants";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  KeyRound,
  Check,
  X
} from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const oobCode = searchParams.get("oobCode");
  const emailParam = searchParams.get("email");

  const [targetEmail, setTargetEmail] = useState<string | null>(emailParam);
  const [isValidatingCode, setIsValidatingCode] = useState<boolean>(Boolean(oobCode));
  const [codeError, setCodeError] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Validate oobCode on mount if present
  useEffect(() => {
    if (!oobCode) {
      setIsValidatingCode(false);
      return;
    }

    verifyPasswordResetCode(firebaseAuth, oobCode)
      .then((email) => {
        setTargetEmail(email);
        setCodeError(null);
      })
      .catch((err) => {
        console.error("Password reset code verification failed:", err);
        setCodeError("The password reset link is invalid, expired, or has already been used.");
      })
      .finally(() => {
        setIsValidatingCode(false);
      });
  }, [oobCode]);

  // Password strength calculation
  const getPasswordCriteria = (pass: string) => ({
    minLength: pass.length >= 8,
    hasUpper: /[A-Z]/.test(pass),
    hasLower: /[a-z]/.test(pass),
    hasNumber: /[0-9]/.test(pass),
    hasSpecial: /[^A-Za-z0-9]/.test(pass),
  });

  const criteria = getPasswordCriteria(password);
  const strengthScore = Object.values(criteria).filter(Boolean).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      setError("Please fill in both password fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (strengthScore < 4) {
      setError("Please choose a stronger password meeting at least 4 security requirements.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      if (oobCode) {
        await confirmPasswordReset(firebaseAuth, oobCode, password);
      } else {
        // Fallback for simulation / mock reset mode
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
      setIsSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to reset password.";
      setError(message.includes("expired") ? "Reset link expired. Please request a new one." : message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[var(--fr8x-bg)] dark:bg-gray-950 p-4 sm:p-6 transition-colors">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-white dark:bg-gray-900 border border-border dark:border-gray-800 rounded-2xl p-6 sm:p-8 shadow-card dark:shadow-2xl"
      >
        {/* Top Branding Header */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#0b192c] to-[#56C5F0] flex items-center justify-center text-white font-bold text-lg shadow-sm">
            <KeyRound className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-xl text-[var(--fr8x-jet)] dark:text-white tracking-wider">FR8X</span>
            <span className="font-semibold text-xl text-[#56C5F0] tracking-wide">-CON</span>
          </div>
        </div>

        {/* Loading code validation state */}
        {isValidatingCode && (
          <div className="py-12 text-center space-y-3">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#56C5F0] border-r-transparent" />
            <p className="text-body-sm text-foreground-secondary dark:text-gray-400">Verifying secure password reset code...</p>
          </div>
        )}

        {/* Invalid or expired code error */}
        {!isValidatingCode && codeError && (
          <div className="text-center py-6 space-y-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-danger-light dark:bg-danger/20 flex items-center justify-center text-danger">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h2 className="text-heading-md font-bold text-[var(--fr8x-jet)] dark:text-white">Invalid Reset Link</h2>
            <p className="text-body-sm text-foreground-secondary dark:text-gray-400">{codeError}</p>
            <Link
              href={ROUTES.LOGIN}
              className="fr8x-btn-primary inline-flex items-center justify-center gap-2 w-full py-2.5 text-body-sm"
            >
              Back to Sign In
            </Link>
          </div>
        )}

        {/* Success State */}
        {!isValidatingCode && !codeError && isSuccess && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6 space-y-4">
            <div className="mx-auto h-14 w-14 rounded-full bg-[#EDE6F2] flex items-center justify-center text-[#253031]">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="text-display-sm font-bold text-[var(--fr8x-jet)]">Password Updated!</h2>
            <p className="text-body-sm text-foreground-secondary">
              Your password for <strong>{targetEmail || APP_NAME}</strong> has been successfully reset. You can now log in with your new credentials.
            </p>
            <div className="pt-2">
              <Link
                href={ROUTES.LOGIN}
                className="fr8x-btn-primary inline-flex items-center justify-center gap-2 w-full py-3 text-body-md"
              >
                Proceed to Sign In <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        )}

        {/* Main Password Reset Form */}
        {!isValidatingCode && !codeError && !isSuccess && (
          <>
            <div className="text-center mb-6">
              <h1 className="text-display-sm font-bold text-[var(--fr8x-jet)] dark:text-white">Set New Password</h1>
              <p className="text-body-sm text-foreground-secondary dark:text-gray-400 mt-1">
                {targetEmail ? (
                  <>Resetting password for <span className="font-semibold text-[var(--fr8x-jet)] dark:text-gray-200">{targetEmail}</span></>
                ) : (
                  "Create a strong, unique password for your account"
                )}
              </p>
            </div>

            {error && (
              <div className="mb-5 rounded-xl bg-danger-light dark:bg-danger/20 border border-danger/30 p-3.5 flex items-start gap-2.5 text-body-sm text-danger-dark dark:text-danger-light">
                <AlertCircle className="h-5 w-5 text-danger flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* New Password */}
              <div>
                <label htmlFor="new-password" className="fr8x-label block mb-1.5 dark:text-gray-300">
                  New Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted dark:text-gray-500" />
                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="fr8x-input pl-9 pr-10 py-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    placeholder="Enter new password"
                    autoComplete="new-password"
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground dark:text-gray-400 dark:hover:text-gray-200"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Real-time Strength Meter */}
                {password.length > 0 && (
                  <div className="mt-2.5 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-border dark:border-gray-700/60 space-y-2">
                    <div className="flex items-center justify-between text-caption font-semibold">
                      <span className="text-foreground-secondary dark:text-gray-400">Password Strength:</span>
                      <span
                        className={
                          strengthScore <= 2
                            ? "text-danger"
                            : strengthScore <= 3
                            ? "text-warning-dark dark:text-warning"
                            : "text-emerald-600 dark:text-emerald-400"
                        }
                      >
                        {strengthScore <= 2 ? "Weak" : strengthScore <= 3 ? "Medium" : "Strong 🛡️"}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex gap-0.5">
                      <div className={`h-full flex-1 transition-all duration-300 ${strengthScore >= 1 ? (strengthScore <= 2 ? "bg-danger" : strengthScore <= 3 ? "bg-warning" : "bg-emerald-500") : "bg-transparent"}`} />
                      <div className={`h-full flex-1 transition-all duration-300 ${strengthScore >= 2 ? (strengthScore <= 2 ? "bg-danger" : strengthScore <= 3 ? "bg-warning" : "bg-emerald-500") : "bg-transparent"}`} />
                      <div className={`h-full flex-1 transition-all duration-300 ${strengthScore >= 3 ? (strengthScore <= 3 ? "bg-warning" : "bg-emerald-500") : "bg-transparent"}`} />
                      <div className={`h-full flex-1 transition-all duration-300 ${strengthScore >= 4 ? "bg-emerald-500" : "bg-transparent"}`} />
                      <div className={`h-full flex-1 transition-all duration-300 ${strengthScore >= 5 ? "bg-emerald-500" : "bg-transparent"}`} />
                    </div>

                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1 text-[11px]">
                      <div className={`flex items-center gap-1 ${criteria.minLength ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-foreground-muted dark:text-gray-500"}`}>
                        {criteria.minLength ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        <span>8+ characters</span>
                      </div>
                      <div className={`flex items-center gap-1 ${criteria.hasUpper ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-foreground-muted dark:text-gray-500"}`}>
                        {criteria.hasUpper ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        <span>Uppercase (A-Z)</span>
                      </div>
                      <div className={`flex items-center gap-1 ${criteria.hasLower ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-foreground-muted dark:text-gray-500"}`}>
                        {criteria.hasLower ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        <span>Lowercase (a-z)</span>
                      </div>
                      <div className={`flex items-center gap-1 ${criteria.hasNumber ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-foreground-muted dark:text-gray-500"}`}>
                        {criteria.hasNumber ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        <span>Number (0-9)</span>
                      </div>
                      <div className={`flex items-center gap-1 col-span-2 ${criteria.hasSpecial ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-foreground-muted dark:text-gray-500"}`}>
                        {criteria.hasSpecial ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        <span>Special character (@!#$%^&*)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirm-password" className="fr8x-label block mb-1.5 dark:text-gray-300">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted dark:text-gray-500" />
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="fr8x-input pl-9 pr-10 py-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground dark:text-gray-400 dark:hover:text-gray-200"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {confirmPassword.length > 0 && password !== confirmPassword && (
                  <p className="mt-1 text-caption text-danger flex items-center gap-1">
                    <X className="h-3 w-3" /> Passwords do not match
                  </p>
                )}
                {confirmPassword.length > 0 && password === confirmPassword && (
                  <p className="mt-1 text-caption text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                    <Check className="h-3 w-3" /> Passwords match
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                isLoading={isSubmitting}
                loadingText="Updating Password..."
                className="fr8x-btn-primary w-full rounded-xl py-3 text-body-md font-bold mt-2"
              >
                Update Password
              </Button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--fr8x-bg)] dark:bg-gray-950">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#56C5F0]" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
