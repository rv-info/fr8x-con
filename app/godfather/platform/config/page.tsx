'use client';

import React, { useState } from 'react';
import { Sliders, Activity, Shield, CheckCircle2, AlertTriangle, RefreshCw, Server, Database, Globe, Zap, Radio } from 'lucide-react';
import { useGodfatherAuth } from '@/lib/godfather/context/GodfatherAuthContext';

export default function SystemConfigPage() {
  const { environment } = useGodfatherAuth();

  const [flags, setFlags] = useState([
    { id: 'flag-1', name: 'Reverse Freight Auction Engine', code: 'FEATURE_AUCTIONS_LIVE', enabled: true, category: 'Core Product', desc: 'Real-time multi-bidder tender and rank calculation room' },
    { id: 'flag-2', name: 'Real-time Carrier Rate Procurement', code: 'FEATURE_RATE_INTELLIGENCE', enabled: true, category: 'Core Product', desc: 'Instant search across published carrier spot tariffs' },
    { id: 'flag-3', name: 'Automated GSTN & PAN API Validation', code: 'INTEG_GOV_GSTN_PORTAL', enabled: true, category: 'Verification', desc: 'Direct government portal tax certificate verification pipeline' },
    { id: 'flag-4', name: 'Hardware TOTP Step-Up MFA Protocol', code: 'SECURITY_STEPUP_ENFORCEMENT', enabled: true, category: 'Security', desc: 'Mandatory cryptographic 2FA challenge on privileged operations' },
    { id: 'flag-5', name: 'Instant Trade Chat Websockets', code: 'FEATURE_TRADE_CHAT', enabled: true, category: 'Core Product', desc: 'Real-time buyer-seller negotiation channel' },
    { id: 'flag-6', name: 'Automated Bulk CSV Tariff Parser', code: 'FEATURE_BULK_TARIFF_ETL', enabled: true, category: 'Tariff Operations', desc: 'Fast asynchronous CSV tariff ETL parser with schema checks' },
  ]);

  const toggleFlag = (id: string) => {
    setFlags((prev) =>
      prev.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f))
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="gf-page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="gf-badge gf-badge-blue text-[11px] font-bold">PLATFORM GOVERNANCE</span>
            <span className="gf-badge gf-badge-green text-[11px] font-mono">NODE: {environment.toUpperCase()}</span>
          </div>
          <h1 className="gf-page-title">Feature Flags & Microservice Telemetry</h1>
          <p className="gf-page-subtitle">
            Configure dynamic platform circuit breakers, manage hot-reloadable feature switches, and inspect cluster health
          </p>
        </div>
      </div>

      {/* Infrastructure Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="gf-card p-4 flex items-center gap-3.5">
          <div className="p-3 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex-shrink-0">
            <Database className="lucide w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Firestore Cluster</div>
            <div className="text-sm font-bold text-slate-900 font-mono truncate">asia-south1 (Mumbai)</div>
            <div className="text-xs text-emerald-700 font-mono font-semibold flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
              P99 Latency: 14ms
            </div>
          </div>
        </div>

        <div className="gf-card p-4 flex items-center gap-3.5">
          <div className="p-3 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 flex-shrink-0">
            <Server className="lucide w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Serverless Compute</div>
            <div className="text-sm font-bold text-slate-900 font-mono truncate">Cloud Functions (2nd Gen)</div>
            <div className="text-xs text-sky-700 font-mono font-semibold flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 inline-block" />
              Error Rate: 0.00%
            </div>
          </div>
        </div>

        <div className="gf-card p-4 flex items-center gap-3.5">
          <div className="p-3 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 flex-shrink-0">
            <Globe className="lucide w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Edge CDN & Gateway</div>
            <div className="text-sm font-bold text-slate-900 font-mono truncate">Vercel Enterprise Edge</div>
            <div className="text-xs text-purple-700 font-mono font-semibold flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block" />
              Status: 100% Operational
            </div>
          </div>
        </div>
      </div>

      {/* Feature Flags Switchboard */}
      <div className="gf-card">
        <div className="gf-card-header">
          <div className="gf-card-title">
            <Sliders className="lucide w-4 h-4 text-sky-600" />
            <span>Hot-Reloadable Feature Switches</span>
          </div>
          <span className="text-xs text-slate-500 font-mono font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            ZERO DOWNTIME SYNC
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {flags.map((flag) => (
            <div key={flag.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-xs gap-4 flex-wrap sm:flex-nowrap">
              <div className="min-w-0">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <span>{flag.name}</span>
                  <span className="gf-badge gf-badge-gray text-[10px] font-mono font-semibold">{flag.code}</span>
                  <span className="gf-badge gf-badge-blue text-[9px] uppercase font-bold">{flag.category}</span>
                </div>
                <div className="text-slate-500 text-xs mt-1 leading-snug">{flag.desc}</div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={`text-[11px] font-mono font-bold ${flag.enabled ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {flag.enabled ? 'ACTIVE' : 'OFFLINE'}
                </span>
                <button
                  type="button"
                  onClick={() => toggleFlag(flag.id)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    flag.enabled ? 'bg-sky-600' : 'bg-slate-300'
                  }`}
                  aria-label={`Toggle ${flag.name}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      flag.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

