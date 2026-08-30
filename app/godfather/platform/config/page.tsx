'use client';

import React, { useState } from 'react';
import { Sliders, Activity, Shield, CheckCircle2, AlertTriangle, RefreshCw, Server, Database, Globe } from 'lucide-react';
import { useGodfatherAuth } from '@/lib/godfather/context/GodfatherAuthContext';

export default function SystemConfigPage() {
  const { environment } = useGodfatherAuth();

  const [flags, setFlags] = useState([
    { id: 'flag-1', name: 'Reverse Freight Auction Engine', code: 'FEATURE_AUCTIONS_LIVE', enabled: true, category: 'Core Product' },
    { id: 'flag-2', name: 'Real-time Carrier Rate Procurement', code: 'FEATURE_RATE_INTELLIGENCE', enabled: true, category: 'Core Product' },
    { id: 'flag-3', name: 'Automated GSTN & PAN API Validation', code: 'INTEG_GOV_GSTN_PORTAL', enabled: true, category: 'Verification' },
    { id: 'flag-4', name: 'Hardware TOTP Step-Up MFA Protocol', code: 'SECURITY_STEPUP_ENFORCEMENT', enabled: true, category: 'Security' },
    { id: 'flag-5', name: 'Instant Trade Chat Websockets', code: 'FEATURE_TRADE_CHAT', enabled: true, category: 'Core Product' },
    { id: 'flag-6', name: 'Automated Bulk CSV Tariff Parser', code: 'FEATURE_BULK_TARIFF_ETL', enabled: true, category: 'Tariff Operations' },
  ]);

  const toggleFlag = (id: string) => {
    setFlags((prev) =>
      prev.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f))
    );
  };

  return (
    <div className="space-y-6">
      <div className="gf-page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="gf-badge gf-badge-blue text-[11px] font-bold">PLATFORM</span>
            <span className="gf-badge gf-badge-green text-[11px]">Active Node: {environment}</span>
          </div>
          <h1 className="gf-page-title">Feature Flags & System Telemetry</h1>
          <p className="gf-page-subtitle">
            Configure dynamic platform switches, emergency circuit breakers, and inspect backend microservices
          </p>
        </div>
      </div>

      {/* Infrastructure Telemetry */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="gf-card p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800">
            <Database className="lucide w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-mut font-bold uppercase">Firestore Cluster</div>
            <div className="text-sm font-bold text-slate-100 font-mono">asia-south1 (Mumbai)</div>
            <div className="text-[10px] text-emerald-400 font-mono">P99 Latency: 14ms</div>
          </div>
        </div>

        <div className="gf-card p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800">
            <Server className="lucide w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-mut font-bold uppercase">Cloud Functions</div>
            <div className="text-sm font-bold text-slate-100 font-mono">2nd Gen (V8 Engine)</div>
            <div className="text-[10px] text-emerald-400 font-mono">Error Rate: 0.00%</div>
          </div>
        </div>

        <div className="gf-card p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800">
            <Globe className="lucide w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-mut font-bold uppercase">Edge CDN & Routing</div>
            <div className="text-sm font-bold text-slate-100 font-mono">Vercel Enterprise Edge</div>
            <div className="text-[10px] text-emerald-400 font-mono">Status: Healthy (100%)</div>
          </div>
        </div>
      </div>

      {/* Feature Flags Table */}
      <div className="gf-card">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="lucide w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold text-slate-100">Dynamic Feature Switches</h3>
          </div>
          <span className="text-xs text-mut font-mono">HOT-RELOADABLE ZERO DOWNTIME</span>
        </div>

        <div className="divide-y divide-slate-800">
          {flags.map((flag) => (
            <div key={flag.id} className="p-4 flex items-center justify-between hover:bg-slate-850 transition-colors text-xs">
              <div>
                <div className="font-bold text-slate-100 flex items-center gap-2">
                  {flag.name}
                  <span className="gf-badge gf-badge-gray text-[10px] font-mono">{flag.code}</span>
                </div>
                <div className="text-mut text-[11px] mt-0.5">Category: {flag.category}</div>
              </div>

              <button
                type="button"
                onClick={() => toggleFlag(flag.id)}
                className={`gf-btn text-xs font-bold py-1 px-3 ${
                  flag.enabled ? 'gf-btn-success' : 'gf-btn-secondary text-slate-500'
                }`}
              >
                {flag.enabled ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
