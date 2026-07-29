// FR8X-CON Dashboard Layout
// Main authenticated layout with sidebar + topnav + currency ticker

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { ROUTES } from "@/lib/utils/constants";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { CurrencyTicker } from "@/components/layout/CurrencyTicker";

import { FloatingChat } from "@/components/chat/FloatingChat";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(ROUTES.LOGIN);
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-500" />
          <p className="text-body-md text-foreground-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background relative">
      {/* Currency Ticker Strip */}
      <CurrencyTicker />

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - hidden on mobile, shown on lg+ */}
        <Sidebar />

        {/* Content column */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top Navigation */}
          <TopNav />

          {/* Page content */}
          <main className="flex-1 overflow-y-auto">
            <div className="fr8x-container py-2">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Floating Chat Launcher (Every Page) */}
      <FloatingChat />
    </div>
  );
}
