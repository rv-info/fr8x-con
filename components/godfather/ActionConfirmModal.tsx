'use client';

import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, X, FileText, Shield } from 'lucide-react';
import { JSONDiffViewer } from './JSONDiffViewer';

interface ActionConfirmModalProps {
  isOpen: boolean;
  title: string;
  actionType: string;
  targetLabel: string;
  targetId: string;
  beforeSnapshot?: any;
  afterSnapshot?: any;
  isDestructive?: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export function ActionConfirmModal({
  isOpen,
  title,
  actionType,
  targetLabel,
  targetId,
  beforeSnapshot,
  afterSnapshot,
  isDestructive = false,
  onConfirm,
  onCancel,
}: ActionConfirmModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 5) {
      setError('A comprehensive operational justification (min 5 characters) is required for platform audit integrity.');
      return;
    }
    setError('');
    onConfirm(reason.trim());
  };

  return (
    <div className="gf-modal-overlay">
      <div className="gf-modal-card gf-action-modal">
        <div className="gf-modal-header">
          <div className="gf-modal-title-wrap">
            <div className={`gf-icon-badge ${isDestructive ? 'gf-icon-badge-red' : 'gf-icon-badge-blue'}`}>
              <AlertTriangle className={`lucide w-5 h-5 ${isDestructive ? 'text-red-600' : 'text-blue-600'}`} />
            </div>
            <div>
              <h3 className="gf-modal-title">{title}</h3>
              <p className="gf-modal-subtitle">
                Target: <span className="font-bold text-ink">{targetLabel}</span> ({targetId})
              </p>
            </div>
          </div>
          <button onClick={onCancel} className="gf-modal-close-btn" aria-label="Close">
            <X className="lucide w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="gf-modal-body">
          {/* Diff View if available */}
          {(beforeSnapshot || afterSnapshot) && (
            <div className="mb-4">
              <div className="text-xs font-bold text-mut mb-1.5 flex items-center gap-1.5">
                <FileText className="lucide w-3.5 h-3.5" />
                Proposed State Alterations
              </div>
              <JSONDiffViewer before={beforeSnapshot} after={afterSnapshot} />
            </div>
          )}

          <div className="gf-form-group">
            <label className="gf-form-label font-bold flex items-center justify-between">
              <span>Mandatory Operational Rationale / Reason *</span>
              <span className="text-[11px] text-mut font-normal">Logged into immutable audit record</span>
            </label>
            <textarea
              required
              rows={3}
              autoFocus
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State the legal, commercial, or compliance rationale for this administrative action..."
              className="gf-textarea w-full text-sm"
            />
            {error && <div className="gf-form-error text-xs text-red-600 font-semibold mt-1">{error}</div>}
          </div>

          <div className="gf-callout gf-callout-blue mt-3 p-2.5 rounded text-xs flex items-center gap-2">
            <Shield className="lucide w-4 h-4 text-blue-600 flex-shrink-0" />
            <span className="text-slate-600 dark:text-slate-300">
              Action code: <strong className="font-mono text-ink">{actionType}</strong>. An immutable ledger entry with timestamp and actor correlation ID will be committed to Google Cloud Firestore.
            </span>
          </div>

          <div className="gf-modal-footer mt-5 flex items-center justify-end gap-2.5">
            <button type="button" onClick={onCancel} className="gf-btn gf-btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              className={`gf-btn ${isDestructive ? 'gf-btn-danger' : 'gf-btn-primary'} flex items-center gap-1.5`}
            >
              <CheckCircle2 className="lucide w-4 h-4" />
              Confirm & Commit Action
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
