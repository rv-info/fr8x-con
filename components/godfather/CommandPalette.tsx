'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Command, ArrowRight, Shield, Users, Building, Gavel, DollarSign, FileText, AlertOctagon, HelpCircle, X } from 'lucide-react';
import { useGodfatherData } from '@/lib/godfather/context/GodfatherDataContext';
import { GlobalSearchResult } from '@/lib/godfather/types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const { searchAllRecords } = useGodfatherData();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Quick navigation shortcuts
  const QUICK_LINKS = [
    { title: 'Overview Dashboard', url: '/godfather', icon: Command, category: 'Navigation' },
    { title: 'Global Deep Search', url: '/godfather/search', icon: Search, category: 'Navigation' },
    { title: 'Users & Profiles Governance', url: '/godfather/operations/users', icon: Users, category: 'Operations' },
    { title: 'Companies & KYC Verification', url: '/godfather/operations/companies', icon: Building, category: 'Operations' },
    { title: 'Auctions & Bids Administration', url: '/godfather/operations/auctions', icon: Gavel, category: 'Operations' },
    { title: 'Rates & Bulk Import Batches', url: '/godfather/operations/rates', icon: DollarSign, category: 'Operations' },
    { title: 'Trust & Content Moderation', url: '/godfather/trust-safety/moderation', icon: AlertOctagon, category: 'Trust & Safety' },
    { title: 'Blacklist & Member Blocks', url: '/godfather/trust-safety/blacklist', icon: Shield, category: 'Trust & Safety' },
    { title: 'Plans & Versioned Pricing', url: '/godfather/commerce/plans', icon: DollarSign, category: 'Commerce' },
    { title: 'Immutable Audit Ledger', url: '/godfather/platform/audit', icon: FileText, category: 'Platform' },
    { title: '360° Customer Lookup Dossier', url: '/godfather/support/lookup', icon: HelpCircle, category: 'Support' },
  ];

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const hits = searchAllRecords(query);
    setResults(hits.slice(0, 8));
  }, [query, searchAllRecords]);

  if (!isOpen) return null;

  const handleSelect = (url: string) => {
    onClose();
    router.push(url);
  };

  return (
    <div className="gf-modal-overlay gf-command-overlay" onClick={onClose}>
      <div className="gf-command-box" onClick={(e) => e.stopPropagation()}>
        {/* Search Input */}
        <div className="gf-command-input-wrap">
          <Search className="lucide w-5 h-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search records, companies, tax IDs, auctions, or type a command..."
            className="gf-command-input text-base"
          />
          <button onClick={onClose} className="gf-modal-close-btn">
            <X className="lucide w-4 h-4" />
          </button>
        </div>

        {/* Results Area */}
        <div className="gf-command-results">
          {query.trim() && results.length > 0 && (
            <div className="gf-command-section">
              <div className="gf-command-section-title">Matching System Records ({results.length})</div>
              {results.map((r) => (
                <div
                  key={r.id}
                  onClick={() => handleSelect(r.detailsUrl)}
                  className="gf-command-item"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="gf-badge gf-badge-blue text-[10px] uppercase font-bold">{r.type}</span>
                    <div>
                      <div className="font-bold text-ink text-sm">{r.title}</div>
                      <div className="text-xs text-mut">{r.subtitle}</div>
                    </div>
                  </div>
                  <ArrowRight className="lucide w-4 h-4 text-slate-400" />
                </div>
              ))}
            </div>
          )}

          {query.trim() && results.length === 0 && (
            <div className="p-6 text-center text-xs text-mut">
              No matching records found for &ldquo;{query}&rdquo;. Press Enter to open Deep Search.
            </div>
          )}

          {!query.trim() && (
            <div className="gf-command-section">
              <div className="gf-command-section-title">Fast Navigation & Module Controls</div>
              {QUICK_LINKS.map((link, idx) => {
                const Icon = link.icon;
                return (
                  <div
                    key={idx}
                    onClick={() => handleSelect(link.url)}
                    className="gf-command-item"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        <Icon className="lucide w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-ink text-xs">{link.title}</div>
                        <div className="text-[11px] text-mut">{link.category}</div>
                      </div>
                    </div>
                    <ArrowRight className="lucide w-3.5 h-3.5 text-slate-400" />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="gf-command-footer">
          <div className="flex items-center gap-3 text-[11px] text-faint">
            <span><kbd className="gf-kbd">ESC</kbd> to close</span>
            <span><kbd className="gf-kbd">↑↓</kbd> to navigate</span>
            <span><kbd className="gf-kbd">ENTER</kbd> to select</span>
          </div>
          <span className="text-[11px] font-mono text-brand font-semibold">GODFATHER / FR8X CONTROL</span>
        </div>
      </div>
    </div>
  );
}
