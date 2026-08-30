'use client';

import React from 'react';
import { Percent, DollarSign, Shield, CheckCircle2, Award, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function FeesDiscountsPage() {
  return (
    <div className="space-y-6">
      <div className="gf-page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="gf-badge gf-badge-green text-[11px] font-bold">COMMERCE</span>
            <span className="gf-badge gf-badge-gold text-[11px]">40% Premium Incentive Active</span>
          </div>
          <h1 className="gf-page-title">Bid Posting Fees & Commercial Incentive Schedules</h1>
          <p className="gf-page-subtitle">
            Audit standard vs gold-verified tender participation fees, discount applications, and adjustment ledgers
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Standard Fee Card */}
        <div className="gf-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="lucide w-4 h-4 text-sky-400" />
              <h3 className="font-bold text-slate-100 text-sm">Standard Bid Posting Fee</h3>
            </div>
            <span className="gf-badge gf-badge-blue text-[10px] uppercase font-bold">Default Tier</span>
          </div>

          <div className="font-mono">
            <span className="text-3xl font-extrabold text-white">₹300</span>
            <span className="text-xs text-mut"> / submitted bid (Inclusive of 18% GST)</span>
          </div>

          <p className="text-xs text-mut leading-relaxed">
            Applied to standard registered members, trial accounts, and professional workspace tier participants on reverse freight tenders.
          </p>
        </div>

        {/* Premium Gold Tier Fee Card */}
        <div className="gf-card p-5 space-y-4 border-amber-800/60 bg-amber-950/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="lucide w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-slate-100 text-sm">Premium Gold Member Fee</h3>
            </div>
            <span className="gf-badge gf-badge-gold text-[10px] uppercase font-bold">40% Discount</span>
          </div>

          <div className="font-mono">
            <span className="text-3xl font-extrabold text-amber-300">₹180</span>
            <span className="text-xs text-amber-400/80"> / submitted bid (Inclusive of 18% GST)</span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Automatic 40% commercial discount applied exclusively to verified enterprise organizations holding an active Premium Gold subscription tier.
          </p>
        </div>
      </div>

      <div className="gf-card p-4 bg-slate-900 border-slate-800 text-xs text-slate-300 flex items-start gap-3">
        <Shield className="lucide w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-100 block mb-1">Settlement Integrity Policy</strong>
          GODFATHER operators may view fee application breakdowns but cannot manually alter historic settled fees. Any discrepancy requires an audited commercial credit adjustment.
        </div>
      </div>
    </div>
  );
}
