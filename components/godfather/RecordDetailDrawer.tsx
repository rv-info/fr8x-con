'use client';

import React from 'react';
import { X, ExternalLink, ShieldCheck, Clock, User, Building, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { GlobalSearchResult } from '@/lib/godfather/types';
import Link from 'next/link';

interface RecordDetailDrawerProps {
  record: GlobalSearchResult | null;
  onClose: () => void;
}

export function RecordDetailDrawer({ record, onClose }: RecordDetailDrawerProps) {
  if (!record) return null;

  const raw = record.rawObject || {};

  return (
    <div className="gf-drawer-overlay" onClick={onClose}>
      <div className="gf-drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="gf-drawer-header">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="gf-badge gf-badge-blue text-[11px] uppercase font-bold">{record.type}</span>
              {record.status && (
                <span className={`gf-badge gf-badge-${record.statusBadgeVariant || 'gray'} text-[11px]`}>
                  {record.status}
                </span>
              )}
            </div>
            <h2 className="gf-drawer-title">{record.title}</h2>
            <p className="gf-drawer-subtitle">{record.subtitle}</p>
          </div>
          <button onClick={onClose} className="gf-modal-close-btn" aria-label="Close">
            <X className="lucide w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="gf-drawer-body space-y-5">
          {/* Quick Details Box */}
          <div className="gf-card p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded">
            <div className="text-xs font-bold text-mut mb-2 flex items-center gap-1.5">
              <FileText className="lucide w-3.5 h-3.5" />
              Core Record Metadata
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-mut block">System Record ID:</span>
                <span className="font-mono font-bold text-ink">{record.id}</span>
              </div>
              <div>
                <span className="text-mut block">Domain Category:</span>
                <span className="font-semibold text-ink">{record.category}</span>
              </div>
              {raw.email && (
                <div>
                  <span className="text-mut block">Corporate Email:</span>
                  <span className="font-mono text-ink">{raw.email}</span>
                </div>
              )}
              {raw.mobile && (
                <div>
                  <span className="text-mut block">Verified Mobile:</span>
                  <span className="font-mono text-ink">{raw.mobile}</span>
                </div>
              )}
              {raw.gstn && (
                <div>
                  <span className="text-mut block">GST Identification:</span>
                  <span className="font-mono text-brand font-bold">{raw.gstn}</span>
                </div>
              )}
              {raw.pan && (
                <div>
                  <span className="text-mut block">PAN Number:</span>
                  <span className="font-mono text-ink">{raw.pan}</span>
                </div>
              )}
            </div>
          </div>

          {/* Raw JSON Data Inspector */}
          <div>
            <div className="text-xs font-bold text-mut mb-1.5 flex items-center justify-between">
              <span>Authoritative Payload Inspector</span>
              <span className="text-[10px] text-faint font-mono">Immutable Firestore Document</span>
            </div>
            <pre className="gf-raw-json-viewer text-xs p-3 rounded bg-slate-950 text-emerald-400 font-mono overflow-x-auto max-h-72 border border-slate-800">
              {JSON.stringify(raw, null, 2)}
            </pre>
          </div>

          {/* Audit Timeline Mock */}
          <div>
            <div className="text-xs font-bold text-mut mb-2 flex items-center gap-1.5">
              <Clock className="lucide w-3.5 h-3.5" />
              Security & Audit History
            </div>
            <div className="gf-timeline-list text-xs space-y-2 border-l-2 border-slate-200 dark:border-slate-700 pl-3">
              <div className="gf-timeline-item">
                <span className="text-faint block text-[10px]">2026-08-29 10:00 UTC</span>
                <span className="font-semibold text-ink">Record inspected by authorized operator</span>
              </div>
              <div className="gf-timeline-item">
                <span className="text-faint block text-[10px]">2026-08-20 09:15 UTC</span>
                <span className="font-semibold text-ink">Entity verified through automated GSTN gateway</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="gf-drawer-footer flex items-center justify-between p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <Link
            href={record.detailsUrl}
            onClick={onClose}
            className="gf-btn gf-btn-primary text-xs flex items-center gap-1.5 font-bold"
          >
            <ExternalLink className="lucide w-3.5 h-3.5" />
            Open Full Module Workspace
          </Link>
          <button onClick={onClose} className="gf-btn gf-btn-secondary text-xs">
            Close Drawer
          </button>
        </div>
      </div>
    </div>
  );
}
