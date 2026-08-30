'use client';

import React from 'react';
import { calculateDiff } from '@/lib/godfather/utils/audit';

interface JSONDiffViewerProps {
  before: any;
  after: any;
}

export function JSONDiffViewer({ before, after }: JSONDiffViewerProps) {
  const diffs = calculateDiff(before, after);

  if (diffs.length === 0) {
    return (
      <div className="gf-diff-empty">
        <span className="gf-muted">No state alterations detected between snapshots.</span>
      </div>
    );
  }

  return (
    <div className="gf-diff-container">
      <div className="gf-diff-header">
        <div className="gf-diff-col-title">Field Property</div>
        <div className="gf-diff-col-title gf-diff-old">Authoritative Prior State</div>
        <div className="gf-diff-col-title gf-diff-new">Audited New State</div>
      </div>
      <div className="gf-diff-body">
        {diffs.map((d, idx) => (
          <div key={idx} className="gf-diff-row">
            <div className="gf-diff-field font-mono font-bold">{d.key}</div>
            <div className="gf-diff-val gf-diff-val-old font-mono">
              {typeof d.oldValue === 'object' && d.oldValue !== null
                ? JSON.stringify(d.oldValue, null, 1)
                : String(d.oldValue)}
            </div>
            <div className="gf-diff-val gf-diff-val-new font-mono">
              {typeof d.newValue === 'object' && d.newValue !== null
                ? JSON.stringify(d.newValue, null, 1)
                : String(d.newValue)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
