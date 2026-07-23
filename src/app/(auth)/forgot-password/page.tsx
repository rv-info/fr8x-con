// FR8X-CON Forgot Password Page

"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Loader2, ChevronLeft, Mail, CheckCircle } from "lucide-react";

import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/lib/validators/auth";
import { resetPassword } from "@/lib/firebase/auth";
import { ROUTES, APP_NAME } from "@/lib/utils/constants";

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await resetPassword(data.email);
      setIsSuccess(true);
    } catch (err: unknown) {
      const firebaseError = err as { code?: string };
      if (firebaseError.code === "auth/user-not-found") {
        setError("No account found with this email address.");
      } else {
        setError("Failed to send reset email. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6">
      <motion.div
        className="w-full max-w-[420px]"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Link
          href={ROUTES.LOGIN}
          className="inline-flex items-center gap-1 text-body-sm text-foreground-secondary hover:text-foreground transition-colors mb-8"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to login
        </Link>

        <h1 className="text-display-sm text-foreground">Reset your password</h1>
        <p className="mt-1.5 text-body-md text-foreground-secondary">
          Enter the email associated with your {APP_NAME} account and we&apos;ll send a reset link.
        </p>

        {isSuccess ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-8 rounded-lg border border-success/30 bg-success-light p-6 text-center"
          >
            <CheckCircle className="mx-auto h-10 w-10 text-success" />
            <h3 className="mt-3 text-heading-md text-foreground">Check your email</h3>
            <p className="mt-1 text-body-sm text-foreground-secondary">
              We&apos;ve sent a password reset link to your email address.
            </p>
            <Link
              href={ROUTES.LOGIN}
              className="mt-4 inline-block fr8x-btn-primary px-6 py-2.5"
            >
              Return to login
            </Link>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            {error && (
              <div className="rounded-md bg-danger-light border border-danger/20 p-3">
                <p className="text-body-sm text-danger-dark">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="fr8x-label">
                Email Address
              </label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  className={`fr8x-input pl-10 ${errors.email ? "border-danger" : ""}`}
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-caption text-danger">{errors.email.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full fr8x-btn-primary py-3 text-heading-sm flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
