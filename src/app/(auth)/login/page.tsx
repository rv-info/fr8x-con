// FR8X-CON Login Page — Modernized Auth Container
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { ROUTES } from "@/lib/utils/constants";
import { AuthCard } from "@/components/auth/AuthCard";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(ROUTES.FEEDS);
    }
  }, [isLoading, isAuthenticated, router]);

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-[var(--fr8x-bg)] dark:bg-gray-950 p-4 sm:p-6 transition-colors">
      <AuthCard initialTab="signin" />
    </main>
  );
}
