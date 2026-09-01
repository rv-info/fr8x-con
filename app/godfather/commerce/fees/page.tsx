'use client';

import React from 'react';
import {
  Percent,
  DollarSign,
  Shield,
  CheckCircle2,
  Award,
  ArrowRight,
  Gavel,
  Briefcase,
  Layers,
  Sparkles,
  CreditCard,
  Building,
  ToggleLeft,
  ToggleRight,
  Check,
  AlertCircle,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePlatformConfig } from '@/lib/platform-config';
import { useToast } from '@/lib/context/ToastContext';

export default function FeesDiscountsPage() {
  const { config, updateConfig } = usePlatformConfig();
  const { toast } = useToast();

  const handleToggleBiddingFee = () => {
    const nextState = !config.biddingFeeEnabled;
    updateConfig({ biddingFeeEnabled: nextState });
    toast(nextState ? 'Bidding fee enabled (₹300/bid).' : 'Bidding fee REMOVED (100% Free Bidding active across platform).');
  };

  const handleToggleJobPostingFee = () => {
    const nextState = !config.jobPostingFeeEnabled;
    updateConfig({ jobPostingFeeEnabled: nextState });
    toast(nextState ? 'Job posting fee enabled (₹500/post).' : 'Job posting fee REMOVED (100% Free Job Posting active across platform).');
  };

  const handleTogglePaymentCards = () => {
    const nextState = !config.requirePaymentCards;
    updateConfig({ requirePaymentCards: nextState });
    toast(nextState ? 'Payment cards required for billing operations.' : 'Login & platform payment cards REMOVED (Zero-friction free mode).');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="gf-page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="gf-badge gf-badge-green text-[11px] font-bold">COMMERCE & INCENTIVES</span>
            <span className="gf-badge gf-badge-gold text-[11px]">Godfather Master Fee Controls</span>
          </div>
          <h1 className="gf-page-title">Commercial Fee Schedules, Payment Controls & Waivers</h1>
          <p className="gf-page-subtitle">
            Configure dynamic platform fee schedules, remove login payment card requirements, toggle job posting costs, and grant free bidding access
          </p>
        </div>
      </div>

      {/* Godfather Master Fee Switchboard */}
      <div className="gf-card p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl border border-slate-700 shadow-md">
        <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-slate-700">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>Godfather Live Sovereign Fee & Payment Card Controls</span>
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Instantly toggle fees and payment cards across user feeds, reverse auctions, and portal logins in real-time.
            </p>
          </div>
          <span className="gf-badge bg-emerald-500 text-slate-950 font-bold text-xs uppercase px-2.5 py-1">
            HOT-SYNC ACTIVE
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          {/* Switch 1: Payment Cards Requirement */}
          <div className="p-4 rounded-lg bg-slate-800/80 border border-slate-700 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-sky-400" /> Login Payment Cards
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${config.requirePaymentCards ? 'bg-amber-400 text-slate-950' : 'bg-emerald-400 text-slate-950'}`}>
                  {config.requirePaymentCards ? 'REQUIRED' : 'REMOVED / FREE'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                When removed, users can register and login without entering credit card details or payment walls.
              </p>
            </div>
            <button
              onClick={handleTogglePaymentCards}
              className={`w-full py-2 px-3 rounded text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                config.requirePaymentCards
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500'
              }`}
            >
              {config.requirePaymentCards ? 'Click to Remove Cards Requirement' : 'Payment Cards Removed (Active)'}
            </button>
          </div>

          {/* Switch 2: Job Posting Cost */}
          <div className="p-4 rounded-lg bg-slate-800/80 border border-slate-700 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-amber-400" /> Job Posting Cost
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${config.jobPostingFeeEnabled ? 'bg-amber-400 text-slate-950' : 'bg-emerald-400 text-slate-950'}`}>
                  {config.jobPostingFeeEnabled ? '₹500 / POST' : '100% FREE'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                When removed, recruiters and freight companies post job vacancies at ₹0 with zero card requirement.
              </p>
            </div>
            <button
              onClick={handleToggleJobPostingFee}
              className={`w-full py-2 px-3 rounded text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                config.jobPostingFeeEnabled
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500'
              }`}
            >
              {config.jobPostingFeeEnabled ? 'Click to Make Job Posts 100% Free' : 'Free Job Posting Active'}
            </button>
          </div>

          {/* Switch 3: Reverse Auction Bidding Cost */}
          <div className="p-4 rounded-lg bg-slate-800/80 border border-slate-700 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Gavel className="w-4 h-4 text-emerald-400" /> Auction Bidding Cost
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${config.biddingFeeEnabled ? 'bg-amber-400 text-slate-950' : 'bg-emerald-400 text-slate-950'}`}>
                  {config.biddingFeeEnabled ? '₹300 / BID' : '100% FREE'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                When removed, freight forwarders submit spot container bids without paying ₹300 per bid.
              </p>
            </div>
            <button
              onClick={handleToggleBiddingFee}
              className={`w-full py-2 px-3 rounded text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                config.biddingFeeEnabled
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500'
              }`}
            >
              {config.biddingFeeEnabled ? 'Click to Make Bidding 100% Free' : 'Free Bidding Active'}
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Fee Schedules & Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Fee 1: Reverse Tender Bid Submission */}
        <div className="gf-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gavel className="lucide w-4 h-4 text-emerald-700" />
              <h3 className="font-bold text-emerald-950 text-sm">Reverse Auction Bidding Fee</h3>
            </div>
            <span className={`gf-badge text-[10px] uppercase font-bold ${config.biddingFeeEnabled ? 'gf-badge-blue' : 'gf-badge-green'}`}>
              {config.biddingFeeEnabled ? 'Tender Rail' : 'Waived (Free)'}
            </span>
          </div>

          <div className="font-mono">
            <span className="text-3xl font-extrabold text-emerald-950">
              {config.biddingFeeEnabled ? `₹${config.biddingFeeAmount}` : '₹0'}
            </span>
            <span className="text-xs text-mut"> {config.biddingFeeEnabled ? '/ bid (Standard)' : '(Godfather Free Waiver Active)'}</span>
          </div>

          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1">
            <strong className="block font-bold">Commercial Status & Control:</strong>
            {config.biddingFeeEnabled
              ? 'Prevents bot spam and binds forwarders to legally enforceable 48-hour container slot validity.'
              : '100% Free Bidding mode is enabled by Godfather. Forwarders place bids with zero transaction fees.'}
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={handleToggleBiddingFee}
              className="text-xs font-bold text-emerald-700 hover:underline"
            >
              {config.biddingFeeEnabled ? 'Toggle to Free Bidding →' : 'Re-enable ₹300 Fee →'}
            </button>
          </div>
        </div>

        {/* Fee 2: Premium Gold Enterprise Tier */}
        <div className="gf-card p-5 space-y-4 border-amber-300 bg-amber-50/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="lucide w-4 h-4 text-amber-700" />
              <h3 className="font-bold text-amber-950 text-sm">Premium Enterprise Gold Plan</h3>
            </div>
            <span className="gf-badge gf-badge-gold text-[10px] uppercase font-bold">Top Tier</span>
          </div>

          <div className="font-mono">
            <span className="text-3xl font-extrabold text-amber-950">₹3,000</span>
            <span className="text-xs text-amber-800"> / month</span>
          </div>

          <div className="p-3 rounded-lg bg-amber-100/60 border border-amber-200 text-xs text-amber-950 space-y-1">
            <strong className="block font-bold">Commercial Purpose & Utility:</strong>
            Unlocks sovereign Gold verified badge, 40% bid fee discount, unlimited tender creations, direct carrier contract matching, and API exports.
          </div>

          <div className="text-[11px] text-amber-900 font-semibold">
            Included in Godfather 1-Month Free Trial Grants
          </div>
        </div>

        {/* Fee 3: Job Vacancy Posting Fee */}
        <div className="gf-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="lucide w-4 h-4 text-sky-700" />
              <h3 className="font-bold text-slate-900 text-sm">Logistics Job Posting Fee</h3>
            </div>
            <span className={`gf-badge text-[10px] uppercase font-bold ${config.jobPostingFeeEnabled ? 'gf-badge-green' : 'gf-badge-gold'}`}>
              {config.jobPostingFeeEnabled ? 'Talent Rail' : 'Waived (Free)'}
            </span>
          </div>

          <div className="font-mono">
            <span className="text-3xl font-extrabold text-slate-900">
              {config.jobPostingFeeEnabled ? `₹${config.jobPostingFeeAmount}` : '₹0'}
            </span>
            <span className="text-xs text-mut"> {config.jobPostingFeeEnabled ? '/ 30-day listing' : '(Free Posting Active)'}</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 space-y-1">
            <strong className="block font-bold">Commercial Status & Control:</strong>
            {config.jobPostingFeeEnabled
              ? 'Ensures listings represent legitimate freight forwarding & supply chain vacancies.'
              : 'Job posting fee is waived by Godfather. Any member can publish logistics jobs instantly.'}
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={handleToggleJobPostingFee}
              className="text-xs font-bold text-sky-700 hover:underline"
            >
              {config.jobPostingFeeEnabled ? 'Toggle to Free Job Posts →' : 'Re-enable ₹500 Fee →'}
            </button>
          </div>
        </div>

        {/* Fee 4: Commercial Feed Advertisement Banner */}
        <div className="gf-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="lucide w-4 h-4 text-purple-700" />
              <h3 className="font-bold text-slate-900 text-sm">Feed Advertisement Banner</h3>
            </div>
            <span className="gf-badge gf-badge-blue text-[10px] uppercase font-bold">Media Rail</span>
          </div>

          <div className="font-mono">
            <span className="text-3xl font-extrabold text-slate-900">₹1,200</span>
            <span className="text-xs text-mut"> / month placement</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 space-y-1">
            <strong className="block font-bold">Commercial Purpose & Utility:</strong>
            High-conversion promotional visibility targeted directly at active freight dispatchers, custom brokers, and ocean liner procurement heads.
          </div>

          <div className="text-[11px] text-slate-600">
            Subject to mandatory Godfather Advertisement Content & Copyright Review.
          </div>
        </div>

        {/* Fee 5: Enterprise KYC Legal Verification */}
        <div className="gf-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building className="lucide w-4 h-4 text-emerald-700" />
              <h3 className="font-bold text-slate-900 text-sm">Company KYC Legal Audit</h3>
            </div>
            <span className="gf-badge gf-badge-green text-[10px] uppercase font-bold">One-Time</span>
          </div>

          <div className="font-mono">
            <span className="text-3xl font-extrabold text-slate-900">₹2,500</span>
            <span className="text-xs text-mut"> / entity verification</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 space-y-1">
            <strong className="block font-bold">Commercial Purpose & Utility:</strong>
            Covers comprehensive GSTIN, IEC, PAN, and MTO statutory registry verification by licensed legal compliance officers.
          </div>

          <div className="text-[11px] text-slate-600">
            Waived for annual upfront Premium Enterprise Gold subscribers.
          </div>
        </div>

        {/* Fee 6: Complete 30-Day Free Trial Waiver */}
        <div className="gf-card p-5 space-y-4 border-emerald-300 bg-emerald-50/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="lucide w-4 h-4 text-emerald-700" />
              <h3 className="font-bold text-emerald-950 text-sm">Godfather Sovereign Free Trial</h3>
            </div>
            <span className="gf-badge gf-badge-green text-[10px] uppercase font-bold">100% Free</span>
          </div>

          <div className="font-mono">
            <span className="text-3xl font-extrabold text-emerald-900">₹0</span>
            <span className="text-xs text-emerald-800"> (30-Day Complete Access)</span>
          </div>

          <div className="p-3 rounded-lg bg-emerald-100/60 border border-emerald-200 text-xs text-emerald-950 space-y-1">
            <strong className="block font-bold">Commercial Purpose & Utility:</strong>
            Allows Godfather super-admins to grant high-potential freight forwarders and corporate cargo owners immediate unrestricted trial access with full fee exemptions.
          </div>

          <div className="pt-1">
            <Link href="/godfather/operations/users" className="gf-btn gf-btn-primary w-full text-xs font-bold">
              Grant Free Trial in Users Workspace →
            </Link>
          </div>
        </div>
      </div>

      {/* Policy Callout */}
      <div className="gf-card p-4 bg-emerald-50/80 border-emerald-200 text-xs text-emerald-950 flex items-start gap-3">
        <Shield className="lucide w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="text-emerald-950 block mb-1 font-bold">Settlement Integrity & Immutability Policy</strong>
          GODFATHER operators can dynamically remove or enable commercial fees, job posting costs, and payment cards across the exchange in real-time.
        </div>
      </div>
    </div>
  );
}
