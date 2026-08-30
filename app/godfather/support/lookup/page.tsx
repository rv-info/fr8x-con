'use client';

import React, { useState } from 'react';
import {
  HelpCircle,
  Search,
  ShieldAlert,
  Building,
  User,
  MapPin,
  Clock,
  CheckCircle2,
  DollarSign,
  Gavel,
  FileText,
  AlertTriangle,
  Award,
} from 'lucide-react';
import { useGodfatherData } from '@/lib/godfather/context/GodfatherDataContext';
import { CustomerDossier } from '@/lib/godfather/types';

export default function CustomerLookupPage() {
  const { getCustomerDossier } = useGodfatherData();
  const [searchQuery, setSearchQuery] = useState('arjun@atlaslogistics.com');
  const [dossier, setDossier] = useState<CustomerDossier | null>(getCustomerDossier('arjun@atlaslogistics.com'));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const res = getCustomerDossier(searchQuery.trim());
    setDossier(res);
  };

  const getRiskColor = (score: number) => {
    if (score < 30) return 'emerald';
    if (score < 60) return 'amber';
    return 'red';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="gf-page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="gf-badge gf-badge-blue text-[11px] font-bold">SUPPORT & INVESTIGATION</span>
            <span className="gf-badge gf-badge-green text-[11px]">360° Comprehensive Dossier</span>
          </div>
          <h1 className="gf-page-title">360-Degree Freight Customer Dossier Lookup</h1>
          <p className="gf-page-subtitle">
            Instant investigation panel compiling member profile, KYC standing, active bids, auctions, billing history, and platform risk score
          </p>
        </div>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSearch} className="gf-card p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="lucide w-4 h-4 absolute left-3 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dossier by email (arjun@atlaslogistics.com), name, company, or user ID..."
              className="gf-input w-full pl-9 text-sm font-medium"
            />
          </div>
          <button type="submit" className="gf-btn gf-btn-primary text-xs font-bold py-2 px-4">
            Generate Dossier
          </button>
        </div>

        {/* Quick links */}
        <div className="flex items-center gap-2 mt-3 text-xs text-mut flex-wrap">
          <span className="font-semibold text-slate-400">Quick Profiles:</span>
          {['arjun@atlaslogistics.com', 'sarah.lewis@rotterdamfreight.nl', 'kiran.mehta@indoocean.com', 'chen.wei@orientfreight.cn'].map((em) => (
            <button
              key={em}
              type="button"
              onClick={() => {
                setSearchQuery(em);
                setDossier(getCustomerDossier(em));
              }}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] transition-colors border border-slate-700"
            >
              {em.split('@')[0]}
            </button>
          ))}
        </div>
      </form>

      {/* Dossier Display */}
      {dossier ? (
        <div className="space-y-6">
          {/* Top Banner: Profile + Risk Score Meter */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* User Overview Box (8 cols) */}
            <div className="lg:col-span-8 gf-card p-5 space-y-4">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-600 to-teal-500 text-white font-bold flex items-center justify-center text-lg shadow-md">
                    {dossier.user.displayName.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                      {dossier.user.displayName}
                      {dossier.user.hasGoldenTick && (
                        <span className="text-amber-400" title="Premium Gold Tick Verified">
                          ★
                        </span>
                      )}
                      <span className={`gf-badge ${dossier.user.isVerified ? 'gf-badge-green' : 'gf-badge-amber'} text-[10px]`}>
                        {dossier.user.isVerified ? 'Verified Account' : 'Pending Verification'}
                      </span>
                    </h2>
                    <div className="text-xs text-mut font-mono mt-0.5">
                      {dossier.user.email} · UID: {dossier.user.uid}
                    </div>
                  </div>
                </div>

                <span className={`gf-badge ${dossier.user.plan === 'premium' ? 'gf-badge-gold' : 'gf-badge-blue'} text-xs uppercase font-bold`}>
                  {dossier.user.plan} Plan
                </span>
              </div>

              {/* Identity & Company Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-3 border-t border-slate-800">
                <div>
                  <span className="text-mut block text-[10px] uppercase font-bold">Company Legal Entity</span>
                  <span className="font-semibold text-slate-200">{dossier.user.company}</span>
                </div>
                <div>
                  <span className="text-mut block text-[10px] uppercase font-bold">GST Identification</span>
                  <span className="font-mono text-sky-400 font-bold">{dossier.user.gstn || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-mut block text-[10px] uppercase font-bold">Designation</span>
                  <span className="text-slate-300">{dossier.user.designation}</span>
                </div>
                <div>
                  <span className="text-mut block text-[10px] uppercase font-bold">Local Timezone</span>
                  <span className="font-mono text-slate-300">{dossier.user.timezone}</span>
                </div>
              </div>
            </div>

            {/* Risk Assessment Meter (4 cols) */}
            <div className="lg:col-span-4 gf-card p-5 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-mut uppercase">Platform Risk Score</span>
                  <span className={`gf-badge gf-badge-${getRiskColor(dossier.riskScore)} text-xs font-mono font-bold`}>
                    {dossier.riskScore < 30 ? 'LOW RISK' : dossier.riskScore < 60 ? 'MODERATE RISK' : 'HIGH RISK'}
                  </span>
                </div>
                <div className="text-3xl font-extrabold text-white font-mono">{dossier.riskScore} / 100</div>

                {/* Progress Bar */}
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden mt-3">
                  <div
                    className={`h-full bg-${getRiskColor(dossier.riskScore)}-500 transition-all`}
                    style={{ width: `${dossier.riskScore}%` }}
                  />
                </div>
              </div>

              <div className="text-xs space-y-1 pt-2 border-t border-slate-800">
                <span className="font-bold text-slate-400 text-[10px] uppercase block">Risk Factor Signals</span>
                {dossier.riskFactors.length === 0 ? (
                  <div className="text-emerald-400 text-[11px]">✅ Zero risk anomalies detected. Clean standing.</div>
                ) : (
                  dossier.riskFactors.map((f, i) => (
                    <div key={i} className="text-red-300 text-[11px] flex items-center gap-1.5">
                      <span className="text-red-400 font-bold">•</span>
                      <span>{f}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Activity Matrix Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div className="gf-card p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-mut font-bold text-[10px] uppercase">Auctions Created</span>
                <Gavel className="lucide w-4 h-4 text-sky-400" />
              </div>
              <div className="text-xl font-bold text-white font-mono">{dossier.auctionsCreated.length}</div>
            </div>

            <div className="gf-card p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-mut font-bold text-[10px] uppercase">Rates Posted</span>
                <DollarSign className="lucide w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl font-bold text-white font-mono">{dossier.ratesPosted.length}</div>
            </div>

            <div className="gf-card p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-mut font-bold text-[10px] uppercase">Invoices Paid</span>
                <FileText className="lucide w-4 h-4 text-sky-400" />
              </div>
              <div className="text-xl font-bold text-white font-mono">{dossier.invoices.length}</div>
            </div>

            <div className="gf-card p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-mut font-bold text-[10px] uppercase">Open Cases</span>
                <AlertTriangle className="lucide w-4 h-4 text-amber-400" />
              </div>
              <div className="text-xl font-bold text-white font-mono">{dossier.activeCases.length}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="gf-card p-12 text-center text-xs text-mut">
          No dossier found matching query &ldquo;{searchQuery}&rdquo;.
        </div>
      )}
    </div>
  );
}
