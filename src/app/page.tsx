// FR8X-CON Enterprise Freight Platform Landing & Showcase Page
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/providers/AuthProvider";
import { saveActiveUserSession } from "@/lib/firebase/auth";
import { ROUTES } from "@/lib/utils/constants";
import {
  Ship,
  Gavel,
  TrendingUp,
  ShieldCheck,
  Globe2,
  Users,
  ArrowRight,
  Sparkles,
  Layers,
  ChevronRight,
  Zap,
  CheckCircle2,
} from "lucide-react";

export default function RootPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleQuickDemoLaunch = () => {
    saveActiveUserSession(
      "user_mgt_raivega_2026",
      "mgt@raivega.in",
      "Management (Rai Vega)",
      "premium",
      "comp_raivega_001",
      false,
      "freight_forwarder"
    );
    window.location.href = ROUTES.FEEDS;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Background Gradient Orbs */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-[450px] h-[450px] bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Navigation Header */}
      <header className="w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-black text-base shadow-lg shadow-indigo-500/20 border border-indigo-400/30">
              F8
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-wider text-white">FR8X</span>
              <span className="font-bold text-xl tracking-wide text-indigo-400">-CON</span>
              <span className="ml-2.5 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Enterprise B2B
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={handleQuickDemoLaunch}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs sm:text-sm border border-emerald-500/40 transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <Zap className="h-4 w-4 text-emerald-400 animate-pulse" />
              <span>1-Click Demo Launch</span>
            </button>

            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-indigo-600/30 border border-indigo-400/40"
            >
              <span>Sign In</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 flex flex-col items-center text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-800/60 text-indigo-300 text-xs font-semibold mb-6 shadow-inner">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          <span>Next-Generation Global Freight Reverse Auction & Rate Intelligence</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight max-w-4xl leading-[1.1]">
          The Intelligent B2B Logistics Marketplace for <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400">Global Trade</span>
        </h1>

        <p className="mt-6 text-base sm:text-xl text-slate-400 max-w-2xl leading-relaxed">
          Connect freight forwarders, shipping lines, NVOCCs, and importers in a real-time reverse auction ecosystem with instant spot rates, verified KYC, and enterprise collaboration.
        </p>

        {/* Hero CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full max-w-md justify-center">
          <button
            onClick={handleQuickDemoLaunch}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-extrabold text-base shadow-xl shadow-indigo-600/30 transition-all border border-indigo-400/30 flex items-center justify-center gap-2.5 active:scale-98 cursor-pointer"
          >
            <Zap className="h-5 w-5 text-amber-300 fill-amber-300" />
            <span>Launch Live Demo Dashboard</span>
          </button>

          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-base border border-slate-700/80 transition-all flex items-center justify-center gap-2"
          >
            <span>Member Login</span>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </Link>
        </div>

        {/* Live Metrics Ticker Bar */}
        <div className="mt-16 w-full grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-2xl">
          <div className="flex flex-col items-center">
            <span className="text-2xl sm:text-4xl font-extrabold text-white">USD 14.2M+</span>
            <span className="text-xs text-slate-400 font-medium mt-1">Freight Contracts Auctioned</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl sm:text-4xl font-extrabold text-indigo-400">12,400+</span>
            <span className="text-xs text-slate-400 font-medium mt-1">Container Teus Shipped</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl sm:text-4xl font-extrabold text-sky-400">450+</span>
            <span className="text-xs text-slate-400 font-medium mt-1">Verified Forwarder Networks</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl sm:text-4xl font-extrabold text-emerald-400">99.8%</span>
            <span className="text-xs text-slate-400 font-medium mt-1">Contract Fulfillment</span>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-indigo-500/40 transition-all group">
            <div className="h-12 w-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Gavel className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Live Reverse Auctions</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Post cargo RFQs and receive real-time competing bids from shipping lines and NVOCCs, driving down container spot rates dynamically.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-sky-500/40 transition-all group">
            <div className="h-12 w-12 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <TrendingUp className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Rate Intelligence Engine</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Instantly search and compare ocean FCL, LCL, air freight, and customs clearance tariffs across major global trade lanes.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-emerald-500/40 transition-all group">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Verified B2B Directory</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Every partner is Tier-3 KYC verified with GSTIN, PAN, and IEC credentials for maximum trade trust and transaction security.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/80 py-8 bg-slate-950 text-slate-500 text-xs text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">FR8X-CON</span>
            <span>&copy; 2026 Enterprise B2B Logistics Platform. All Rights Reserved.</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-slate-300 transition-colors">Terms of Service</Link>
            <Link href="/login" className="hover:text-slate-300 transition-colors">Partner Portal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
