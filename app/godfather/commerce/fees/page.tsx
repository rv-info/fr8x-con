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
} from 'lucide-react';
import Link from 'next/link';

export default function FeesDiscountsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="gf-page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="gf-badge gf-badge-green text-[11px] font-bold">COMMERCE & INCENTIVES</span>
            <span className="gf-badge gf-badge-gold text-[11px]">40% Premium Gold Incentive Active</span>
          </div>
          <h1 className="gf-page-title">Commercial Fee Schedules, Benefit Rationale & Incentives</h1>
          <p className="gf-page-subtitle">
            Inspect fee structures across Reverse Freight Auctions, Job Postings, Advertisements, Company KYC, and VIP Member Discounts
          </p>
        </div>
      </div>

      {/* Grid of Fee Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Fee 1: Reverse Tender Bid Submission */}
        <div className="gf-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gavel className="lucide w-4 h-4 text-emerald-700" />
              <h3 className="font-bold text-emerald-950 text-sm">Reverse Auction Bidding Fee</h3>
            </div>
            <span className="gf-badge gf-badge-blue text-[10px] uppercase font-bold">Tender Rail</span>
          </div>

          <div className="font-mono">
            <span className="text-3xl font-extrabold text-emerald-950">₹300</span>
            <span className="text-xs text-mut"> / bid (Standard)</span>
          </div>

          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1">
            <strong className="block font-bold">Commercial Purpose & Utility:</strong>
            Eliminates phantom bidding, prevents bot spam, and commits freight forwarders to legally binding 48-hour container slot validity.
          </div>

          <div className="text-[11px] text-slate-600">
            <strong>Gold Member Rate:</strong> <span className="text-amber-800 font-bold font-mono">₹180 / bid (40% OFF)</span>
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
            <span className="gf-badge gf-badge-green text-[10px] uppercase font-bold">Talent Rail</span>
          </div>

          <div className="font-mono">
            <span className="text-3xl font-extrabold text-slate-900">₹500</span>
            <span className="text-xs text-mut"> / 30-day listing</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 space-y-1">
            <strong className="block font-bold">Commercial Purpose & Utility:</strong>
            Ensures listings represent legitimate freight forwarding & supply chain vacancies, protecting job seekers from unverified recruiter scams.
          </div>

          <div className="text-[11px] text-slate-600">
            Includes automated distribution across verified member trade feeds.
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
          GODFATHER operators may view and adjust future versioned fee schedules but cannot retroactively alter historical settled transaction invoices. Any fee remediation must be issued as an audited commercial credit note.
        </div>
      </div>
    </div>
  );
}
