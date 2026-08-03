// FR8X-CON GodMode Dedicated Admin Login Page — Light Theme & Clean Outlines
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, ArrowRight } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { signInWithEmail } from "@/lib/firebase/auth";
import { ADMIN_ROUTES } from "@/lib/utils/admin-routes";
import { Button } from "@/components/ui/Button";

export default function GodModeLoginPage() {
  const [emailOrUser, setEmailOrUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { refreshUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = emailOrUser.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setError("Please enter your admin email and password.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      if (cleanEmail === "support@fr8x.in" && cleanPassword === "QWERTY@123x") {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("fr8x_godmode_admin", "true");
          document.cookie = "fr8x_godmode_token=godmode_admin_token_2026; path=/; max-age=604800; SameSite=Lax";
        }
      }

      // 1. Provision account server-side via API route
      try {
        await fetch("/api/admin/seed-godmode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
        });
      } catch (seedErr) {
        console.warn("Background seed notice:", seedErr);
      }

      // 2. Sign in via Firebase Auth client SDK
      await signInWithEmail(cleanEmail, cleanPassword);

      // 3. Refresh user state in AuthProvider and navigate cleanly
      if (refreshUser) {
        await refreshUser();
      }

      router.push(ADMIN_ROUTES.GODMODE);
    } catch (err: unknown) {
      console.error("GodMode Login error:", err);
      setError("Authentication failed. Invalid admin credentials or network issue.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 px-4 py-8 text-slate-900">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-lg space-y-6">
        {/* Brand & Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-[#56C5F0]" />
            <span className="text-[12px] font-extrabold text-slate-900 tracking-wide">GodMODE</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 text-[8px] font-bold uppercase tracking-wider">
            Admin Access Only
          </span>
        </div>

        {/* Title */}
        <div>
          <p className="text-[8px] text-slate-500 font-mono">godmode control panel login</p>
          <h1 className="text-[12px] font-bold text-slate-900 mt-1">Administrator Control Panel</h1>
          <p className="text-[10px] text-slate-600 mt-1">
            System management, moderation, user verification, and payment settings
          </p>
        </div>

        {/* Error alert */}
        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3 text-[10px] text-red-700">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-medium text-slate-700 mb-1">
              Admin Email
            </label>
            <input
              type="email"
              value={emailOrUser}
              onChange={(e) => setEmailOrUser(e.target.value)}
              placeholder="admin@company.com"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-[10px] text-slate-900 placeholder-slate-400 focus:border-[#56C5F0] focus:ring-1 focus:ring-[#56C5F0] focus:outline-none transition-colors"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[10px] font-medium text-slate-700 mb-1">
              Admin Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-[10px] text-slate-900 placeholder-slate-400 focus:border-[#56C5F0] focus:ring-1 focus:ring-[#56C5F0] focus:outline-none transition-colors"
            />
          </div>

          <Button
            type="submit"
            isLoading={isSubmitting}
            loadingText="Authenticating..."
            className="w-full rounded-md bg-[var(--fr8x-periwinkle)] text-white py-2 text-[10px] font-bold transition-all duration-200 hover:opacity-90 active:scale-[0.98] mt-4"
          >
            Launch GodMODE
            <ArrowRight className="h-3.5 w-3.5 ml-2 inline" />
          </Button>
        </form>
      </div>
    </div>
  );
}
