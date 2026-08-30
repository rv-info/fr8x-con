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
      <div className="gf-card p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="lucide w-4 h-4 absolute left-3 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by Entity Name, Email, GSTN (27AABCA...), PAN, Auction (RA-2026...), Rate ID, RFQ..."
              className="gf-input w-full pl-9 text-sm font-medium"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="lucide w-4 h-4 text-slate-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="gf-select text-xs"
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
        <div className="flex items-center gap-2 mt-3 text-xs text-mut flex-wrap">
          <span className="font-semibold text-slate-400">Quick Test Searches:</span>
          {['Atlas Logistics', '27AABCA1234F1Z5', 'RA-2026-0842', 'RT-884210', 'sarah.lewis', 'OceanStar'].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setQuery(tag)}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] transition-colors border border-slate-700"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Search Results Summary */}
      <div className="flex items-center justify-between text-xs text-mut">
        <div>
          Showing <strong className="text-slate-200">{results.length}</strong> matching records for &ldquo;{query}&rdquo;
        </div>
        <span className="font-mono text-[11px]">IMMUTABLE FIRESTORE SEARCH INDEX</span>
      </div>

      {/* Results List */}
      {results.length === 0 ? (
        <div className="gf-card p-12 text-center text-xs text-mut">
          <Search className="lucide w-8 h-8 mx-auto text-slate-600 mb-2" />
          <div className="font-bold text-slate-300 text-sm">No records match the current query</div>
          <p className="mt-1 text-slate-500">Try searching by corporate legal name, verified email address, GSTN, or auction reference ID.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Operations Category */}
          {operationsResults.length > 0 && (
            <div className="gf-card overflow-hidden">
              <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs font-bold text-slate-300">
                <div className="flex items-center gap-2">
                  <Layers className="lucide w-3.5 h-3.5 text-sky-400" />
                  <span>Operations Domain Records ({operationsResults.length})</span>
                </div>
              </div>
              <div className="divide-y divide-slate-800">
                {operationsResults.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRecord(r)}
                    className="p-3.5 flex items-center justify-between hover:bg-slate-850 cursor-pointer transition-colors text-xs"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="gf-badge gf-badge-blue text-[10px] uppercase font-bold mt-0.5">{r.type}</span>
                      <div>
                        <div className="font-bold text-slate-100 text-sm">{r.title}</div>
                        <div className="text-mut text-xs mt-0.5">{r.subtitle}</div>
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
                        className="gf-btn gf-btn-secondary text-[11px] py-1 px-2 flex items-center gap-1"
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
              <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs font-bold text-slate-300">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="lucide w-3.5 h-3.5 text-red-400" />
                  <span>Trust, Safety & Blacklist Records ({trustResults.length})</span>
                </div>
              </div>
              <div className="divide-y divide-slate-800">
                {trustResults.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRecord(r)}
                    className="p-3.5 flex items-center justify-between hover:bg-slate-850 cursor-pointer transition-colors text-xs"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="gf-badge gf-badge-red text-[10px] uppercase font-bold mt-0.5">{r.type}</span>
                      <div>
                        <div className="font-bold text-slate-100 text-sm">{r.title}</div>
                        <div className="text-mut text-xs mt-0.5">{r.subtitle}</div>
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
                        className="gf-btn gf-btn-secondary text-[11px] py-1 px-2 flex items-center gap-1"
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
              <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs font-bold text-slate-300">
                <div className="flex items-center gap-2">
                  <FileText className="lucide w-3.5 h-3.5 text-emerald-400" />
                  <span>Commerce & Financial Records ({commerceResults.length})</span>
                </div>
              </div>
              <div className="divide-y divide-slate-800">
                {commerceResults.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRecord(r)}
                    className="p-3.5 flex items-center justify-between hover:bg-slate-850 cursor-pointer transition-colors text-xs"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="gf-badge gf-badge-green text-[10px] uppercase font-bold mt-0.5">{r.type}</span>
                      <div>
                        <div className="font-bold text-slate-100 text-sm">{r.title}</div>
                        <div className="text-mut text-xs mt-0.5">{r.subtitle}</div>
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
                        className="gf-btn gf-btn-secondary text-[11px] py-1 px-2 flex items-center gap-1"
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
