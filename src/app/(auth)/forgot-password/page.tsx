// FR8X-CON Forgot Password Page — Modernized Auth Container

"use client";

import { AuthCard } from "@/components/auth/AuthCard";

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-[var(--fr8x-bg)] dark:bg-gray-950 p-4 sm:p-6 transition-colors">
      <AuthCard initialTab="forgot" />
    </main>
  );
}
