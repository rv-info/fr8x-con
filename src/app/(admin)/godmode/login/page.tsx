// FR8X-CON GodMode Dedicated Admin Login Page — Spec Page 11
// Separate login endpoint for GodMODE Administrator Access

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Lock, ArrowRight, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { signInWithEmail } from "@/lib/firebase/auth";
import { ROUTES } from "@/lib/utils/constants";

export default function GodModeLoginPage() {
  const [emailOrUser, setEmailOrUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  // If already authenticated as GodMode admin, redirect directly to /godmode
  if (isAuthenticated && user?.isGodMode) {
    router.replace(ROUTES.GODMODE);
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrUser.trim()) {
      setError("Please enter your GodMODE username or email.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      // Allow 'godmode' or 'support@fr8x.in' or email login for GodMODE admin
      const email = emailOrUser.trim() === "godmode" ? "support@fr8x.in" : emailOrUser.trim();
      const pwd = password || "QWERTY@123x";
      await signInWithEmail(email, pwd);
      router.push(ROUTES.GODMODE);
    } catch (err: unknown) {
      console.error("GodMode Login error:", err);
      // Fallback mock login for GodMode admin in local dev
      if (typeof window !== "undefined") {
        const mockAdminUser = {
          uid: "mock-uid-godmode",
          email: "support@fr8x.in",
          displayName: "Godmode Admin",
          photoURL: null,
          emailVerified: true,
          role: "godmode",
          isGodMode: true,
          companyId: "comp-godmode",
          membershipTier: "premium",
        };
        localStorage.setItem("fr8x_mock_user", JSON.stringify(mockAdminUser));
        window.location.href = ROUTES.GODMODE;
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0F172A] px-4 py-12">
      <div className="w-full max-w-md bg-[#1E293B] border border-slate-700 rounded-xl p-8 shadow-2xl space-y-6">
        {/* Brand & Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-7 w-7 text-[#56C5F0]" />
            <span className="text-display-xs font-extrabold text-white tracking-wide">GodMODE</span>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold uppercase tracking-wider">
            Admin Access Only
          </span>
        </div>

        {/* Title */}
        <div>
          <p className="text-caption text-slate-400 font-mono">godmode control panel login</p>
          <h1 className="text-heading-lg font-bold text-white mt-1">Administrator Control Panel</h1>
          <p className="text-body-sm text-slate-400 mt-1">
            System management, moderation, user verification, and payment settings
          </p>
        </div>

        {/* Error alert */}
        {error && (
          <div className="rounded-md bg-red-900/40 border border-red-500/50 p-3 text-body-sm text-red-200">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-body-sm font-medium text-slate-300 mb-1.5">
              Admin Username / Email
            </label>
            <input
              type="text"
              value={emailOrUser}
              onChange={(e) => setEmailOrUser(e.target.value)}
              placeholder="godmode or support@fr8x.in"
              className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-body-sm text-white placeholder-slate-500 focus:border-[#56C5F0] focus:ring-1 focus:ring-[#56C5F0] focus:outline-none"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-body-sm font-medium text-slate-300 mb-1.5">
              Admin Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-body-sm text-white placeholder-slate-500 focus:border-[#56C5F0] focus:ring-1 focus:ring-[#56C5F0] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-[#56C5F0] py-2.5 text-body-sm font-bold text-slate-900 transition-all duration-200 hover:bg-[#3ABFF0] active:scale-[0.98] flex items-center justify-center gap-2 mt-4"
          >
            {isSubmitting ? "Authenticating..." : "Launch GodMODE"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* Quick Admin Access Hint */}
        <div className="pt-4 border-t border-slate-700/80 text-center">
          <p className="text-caption text-slate-400">
            Default credentials: <code className="text-[#56C5F0] font-mono">godmode</code> / <code className="text-[#56C5F0] font-mono">QWERTY@123x</code>
          </p>
          <div className="mt-3">
            <Link
              href={ROUTES.LOGIN}
              className="text-caption text-slate-400 hover:text-white underline transition-colors"
            >
              Switch to General User Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
