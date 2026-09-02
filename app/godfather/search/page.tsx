'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, ExternalLink, ShieldCheck, FileText, ArrowUpDown, Eye, Layers } from 'lucide-react';
import { useGodfatherData } from '@/lib/godfather/context/GodfatherDataContext';
import { GlobalSearchResult } from '@/lib/godfather/types';
import { RecordDetailDrawer } from '@/components/godfather/RecordDetailDrawer';

export default function GodfatherSearchPage() {
  const { searchAllRecords } = useGodfatherData();
  const [query, setQuery] = useState('Atlas');
  const [filterType, setFilterType] = useState('all');
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<GlobalSearchResult | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const hits = searchAllRecords(query, { type: filterType });
    setResults(hits);
  }, [query, filterType, searchAllRecords]);

  // Group by category
  const operationsResults = results.filter((r) => r.category === 'Operations');
  const trustResults = results.filter((r) => r.category === 'Trust & Safety');
  const commerceResults = results.filter((r) => r.category === 'Commerce');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="gf-page-header">
        <div>
          <h1 className="gf-page-title">Universal Global Deep Search & Inspection</h1>
          <p className="gf-page-subtitle">
            Universal federated query across 12+ record types: Users, Tax IDs (GSTN/PAN/IEC), Auctions, Rates, Invoices, and Blacklists
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="gf-card" style={{ padding: '14px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
            <Search style={{ width: '15px', height: '15px', position: 'absolute', left: '10px', top: '9px', color: '#94a3b8' }} />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by Entity Name, Email, GSTN (27AABCA...), PAN, Auction (RA-2026...), Rate ID, RFQ..."
              className="gf-input"
              style={{ width: '100%', paddingLeft: '34px', fontSize: '13px', fontWeight: 600 }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter style={{ width: '14px', height: '14px', color: '#64748b' }} />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="gf-select"
              style={{ fontSize: '11.5px', fontWeight: 700, minWidth: '150px' }}
            >
              <option value="all">All Record Types</option>
              <option value="user">Users & Profiles</option>
              <option value="company">Companies & KYC</option>
              <option value="auction">Auctions & RFQs</option>
              <option value="rate">Rate Inventory</option>
              <option value="blacklist">Blacklist & Disputes</option>
              <option value="invoice">Invoices & Billing</option>
            </select>
          </div>
        </div>

        {/* Quick query tags */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', fontSize: '11px', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 800, color: '#475569' }}>Quick Test Searches:</span>
          {['Atlas Logistics', '27AABCA1234F1Z5', 'RA-2026-0842', 'RT-884210', 'sarah.lewis', 'OceanStar'].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setQuery(tag)}
              style={{
                padding: '3px 8px',
                borderRadius: '4px',
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                color: '#334155',
                fontFamily: 'Consolas, monospace',
                fontSize: '10.5px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Search Results Summary */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <div>
          Showing <strong className="text-slate-900">{results.length}</strong> matching records for &ldquo;{query}&rdquo;
        </div>
        <span className="font-mono text-[11px] font-bold">IMMUTABLE FIRESTORE SEARCH INDEX</span>
      </div>

      {/* Results List */}
      {results.length === 0 ? (
        <div className="gf-card p-12 text-center text-xs text-slate-500">
          <Search className="lucide w-8 h-8 mx-auto text-slate-400 mb-2" />
          <div className="font-bold text-slate-800 text-sm">No records match the current query</div>
          <p className="mt-1 text-slate-500">Try searching by corporate legal name, verified email address, GSTN, or auction reference ID.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Operations Category */}
          {operationsResults.length > 0 && (
            <div className="gf-card overflow-hidden">
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-800">
                <div className="flex items-center gap-2">
                  <Layers className="lucide w-3.5 h-3.5 text-sky-600" />
                  <span>Operations Domain Records ({operationsResults.length})</span>
                </div>
              </div>
              <div className="divide-y divide-slate-100">
                {operationsResults.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRecord(r)}
                    className="p-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors text-xs"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="gf-badge gf-badge-blue text-[10px] uppercase font-bold mt-0.5">{r.type}</span>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{r.title}</div>
                        <div className="text-slate-500 text-xs mt-0.5">{r.subtitle}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      {r.status && (
                        <span className={`gf-badge gf-badge-${r.statusBadgeVariant || 'gray'} text-[11px]`}>
                          {r.status}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRecord(r);
                        }}
                        className="gf-btn gf-btn-secondary text-[11px] py-1 px-2.5 flex items-center gap-1 font-semibold"
                      >
                        <Eye className="lucide w-3 h-3" />
                        Inspect
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trust & Safety Category */}
          {trustResults.length > 0 && (
            <div className="gf-card overflow-hidden">
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-800">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="lucide w-3.5 h-3.5 text-rose-600" />
                  <span>Trust, Safety & Blacklist Records ({trustResults.length})</span>
                </div>
              </div>
              <div className="divide-y divide-slate-100">
                {trustResults.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRecord(r)}
                    className="p-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors text-xs"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="gf-badge gf-badge-red text-[10px] uppercase font-bold mt-0.5">{r.type}</span>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{r.title}</div>
                        <div className="text-slate-500 text-xs mt-0.5">{r.subtitle}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`gf-badge gf-badge-${r.statusBadgeVariant || 'red'} text-[11px]`}>
                        {r.status}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRecord(r);
                        }}
                        className="gf-btn gf-btn-secondary text-[11px] py-1 px-2.5 flex items-center gap-1 font-semibold"
                      >
                        <Eye className="lucide w-3 h-3" />
                        Inspect
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Commerce Category */}
          {commerceResults.length > 0 && (
            <div className="gf-card overflow-hidden">
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-800">
                <div className="flex items-center gap-2">
                  <FileText className="lucide w-3.5 h-3.5 text-emerald-600" />
                  <span>Commerce & Financial Records ({commerceResults.length})</span>
                </div>
              </div>
              <div className="divide-y divide-slate-100">
                {commerceResults.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRecord(r)}
                    className="p-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors text-xs"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="gf-badge gf-badge-green text-[10px] uppercase font-bold mt-0.5">{r.type}</span>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{r.title}</div>
                        <div className="text-slate-500 text-xs mt-0.5">{r.subtitle}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`gf-badge gf-badge-${r.statusBadgeVariant || 'green'} text-[11px]`}>
                        {r.status}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRecord(r);
                        }}
                        className="gf-btn gf-btn-secondary text-[11px] py-1 px-2.5 flex items-center gap-1 font-semibold"
                      >
                        <Eye className="lucide w-3 h-3" />
                        Inspect
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Slide-over Record Inspection Drawer */}
      <RecordDetailDrawer
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />
    </div>
  );
}
