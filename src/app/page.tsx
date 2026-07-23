// FR8X-CON Root Page
// Redirects to /login or /feeds based on auth state

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { ROUTES } from "@/lib/utils/constants";

export default function RootPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace(ROUTES.LOGIN);
    } else if (user?.isGodMode) {
      router.replace(ROUTES.GODMODE);
    } else {
      router.replace(ROUTES.FEEDS);
    }
  }, [isAuthenticated, isLoading, user, router]);

  // Show loading while determining redirect
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-500" />
        <p className="text-body-md text-foreground-secondary">Loading FR8X-CON...</p>
      </div>
    </div>
  );
}
