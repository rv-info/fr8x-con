// FR8X-CON Login Page — Spec Page 1
// "login" header, "Welcome back", email/password, "Launch!" button

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { signInWithEmail } from "@/lib/firebase/auth";
import { ROUTES } from "@/lib/utils/constants";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect if already authenticated
  if (!isLoading && isAuthenticated) {
    router.replace(ROUTES.FEEDS);
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await signInWithEmail(email.trim(), password);
      router.push(ROUTES.FEEDS);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Login failed. Please try again.";
      if (message.includes("user-not-found") || message.includes("wrong-password") || message.includes("invalid-credential")) {
        setError("Invalid email or password.");
      } else if (message.includes("too-many-requests")) {
        setError("Too many attempts. Please try again later.");
      } else if (message.includes("invalid-email")) {
        setError("Please enter a valid email address.");
      } else {
        setError("Login failed. Please check your credentials.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[var(--fr8x-bg)] p-4">
      <div className="w-full max-w-md bg-white border border-border rounded-xl p-8 shadow-card">
        {/* Header */}
        <p className="text-body-sm text-[var(--fr8x-jet)] mb-6">login</p>

        {/* Title */}
        <h1 className="text-display-sm font-bold text-[var(--fr8x-jet)] mb-1">
          Welcome back
        </h1>
        <p className="text-body-sm text-foreground-secondary mb-8">
          Sign in to your verified logistics network account
        </p>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-md bg-danger-light px-3 py-2 text-body-sm text-danger-dark">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label htmlFor="login-email" className="fr8x-label block mb-1.5">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="fr8x-input"
              placeholder="you@company.com"
              autoComplete="email"
              autoFocus
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="login-password" className="fr8x-label block mb-1.5">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="fr8x-input"
              placeholder=""
              autoComplete="current-password"
            />
            <div className="mt-1.5 text-right">
              <Link
                href={ROUTES.FORGOT_PASSWORD}
                className="text-body-sm text-[var(--fr8x-jet)] underline hover:text-[var(--fr8x-periwinkle)] transition-colors"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          {/* Launch Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-[#56C5F0] py-2.5 text-body-sm font-semibold text-white
                       transition-all duration-200 hover:bg-[#3ABFF0] active:scale-[0.98]
                       disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {isSubmitting ? "Signing in..." : "Launch!"}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-5 flex items-center justify-between text-body-sm">
          <p className="text-[var(--fr8x-jet)]">
            New to FR8X-CON?{" "}
            <Link
              href={ROUTES.REGISTER}
              className="font-medium underline hover:text-[var(--fr8x-periwinkle)] transition-colors"
            >
              Create an account
            </Link>
          </p>
          <Link
            href={ROUTES.TERMS}
            className="text-foreground-secondary hover:text-[var(--fr8x-jet)] transition-colors"
          >
            Terms and conditions*
          </Link>
        </div>
      </div>
    </div>
  );
}
