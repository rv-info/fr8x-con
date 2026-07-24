// FR8X-CON GodMode Dedicated Admin Login Page — Spec Page 11

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, ArrowRight } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { signInWithEmail } from "@/lib/firebase/auth";
import { ROUTES } from "@/lib/utils/constants";
import { Button } from "@/components/ui/Button";

export default function GodModeLoginPage() {
  const [emailOrUser, setEmailOrUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  // If already authenticated as GodMode admin, redirect directly to /godmode
  useEffect(() => {
    if (isAuthenticated && user?.isGodMode) {
      router.replace(ROUTES.GODMODE);
    }
  }, [isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrUser.trim() || !password.trim()) {
      setError("Please enter your admin email and password.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await signInWithEmail(emailOrUser.trim(), password);
      router.push(ROUTES.GODMODE);
    } catch (err: unknown) {
      console.error("GodMode Login error:", err);
      setError("Authentication failed. Invalid admin credentials.");
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
              Admin Email
            </label>
            <input
              type="email"
              value={emailOrUser}
              onChange={(e) => setEmailOrUser(e.target.value)}
              placeholder="admin@company.com"
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

          <Button
            type="submit"
            isLoading={isSubmitting}
            loadingText="Authenticating..."
            className="w-full rounded-md bg-[#56C5F0] py-2.5 text-body-sm font-bold text-slate-900 transition-all duration-200 hover:bg-[#3ABFF0] active:scale-[0.98] mt-4"
          >
            Launch GodMODE
            <ArrowRight className="h-4 w-4 ml-2 inline" />
          </Button>

          {/* Quick Demo Credentials Fill */}
          <div className="mt-2 text-center">
            <button
              type="button"
              onClick={() => {
                setEmailOrUser("admin@fr8x.in");
                setPassword("Admin@123456");
              }}
              className="text-caption text-slate-400 hover:text-white underline transition-colors"
            >
              Fill Demo Credentials (GODMODE Angle)
            </button>
          </div>
        </form>

        <div className="pt-4 border-t border-slate-700/80 text-center">
          <Link
            href={ROUTES.LOGIN}
            className="text-caption text-slate-400 hover:text-white underline transition-colors"
          >
            Switch to General User Login
          </Link>
        </div>
      </div>
    </div>
  );
}
