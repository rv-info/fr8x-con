'use client';

import React, { useState } from 'react';
import { FileCheck, Search, CheckCircle2, AlertTriangle, Shield, Clock, ExternalLink } from 'lucide-react';
import { useGodfatherData } from '@/lib/godfather/context/GodfatherDataContext';
import { useGodfatherAuth } from '@/lib/godfather/context/GodfatherAuthContext';
import { ActionConfirmModal } from '@/components/godfather/ActionConfirmModal';

export default function ReportsAppealsPage() {
  const [reports, setReports] = useState([
    {
      id: 'REP-2026-042',
      reporterName: 'Arjun Rao (Atlas Logistics)',
      targetType: 'post',
      targetId: 'post-088',
      category: 'Unverified Commercial Solicitation',
      description: 'User spamming multiple corridors offering fake carrier contract slots below cost without IEC.',
      status: 'pending',
      severity: 'high',
      createdAt: '2026-08-27 11:00',
    },
    {
      id: 'REP-2026-039',
      reporterName: 'Kiran Mehta (Indo Ocean Lines)',
      targetType: 'company',
      targetId: 'CMP-00999',
      category: 'Demurrage & BL Withholding Dispute',
      description: 'Cargo released to unauthorized consignee without original BL surrender at Jebel Ali.',
      status: 'under_investigation',
      severity: 'critical',
      createdAt: '2026-08-10 10:00',
    },
  ]);

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    actionType: string;
    targetLabel: string;
    targetId: string;
    isDestructive?: boolean;
    onConfirm: (reason: string) => void;
  } | null>(null);

  const handleResolve = (rep: any, resolution: string) => {
    setModalConfig({
      isOpen: true,
      title: `Resolve Platform Report (${resolution})`,
      actionType: `REPORT_${resolution.toUpperCase()}`,
      targetLabel: `${rep.id} · ${rep.category}`,
      targetId: rep.id,
      onConfirm: (reason) => {
        setReports((prev) =>
          prev.map((r) => (r.id === rep.id ? { ...r, status: 'resolved' } : r))
        );
        setModalConfig(null);
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="gf-page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="gf-badge gf-badge-red text-[11px] font-bold">TRUST & SAFETY</span>
            <span className="gf-badge gf-badge-amber text-[11px]">{reports.filter((r) => r.status === 'pending').length} Unassigned Reports</span>
          </div>
          <h1 className="gf-page-title">Platform Reports & Dispute Appeals Queue</h1>
          <p className="gf-page-subtitle">
            Triage user-submitted fraud alerts, intellectual property complaints, and commercial dispute appeals
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {reports.map((rep) => (
          <div key={rep.id} className="gf-card p-4 space-y-3">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="gf-badge gf-badge-red text-[10px] uppercase font-bold font-mono">
                    {rep.id}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm">{rep.category}</h3>
                  <span className={`gf-badge gf-badge-${rep.severity === 'critical' ? 'red' : 'amber'} text-[10px] uppercase font-bold`}>
                    {rep.severity}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Filed by: <strong className="text-slate-800">{rep.reporterName}</strong> · Target: <span className="font-mono text-sky-700 font-bold">{rep.targetType} ({rep.targetId})</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleResolve(rep, 'dismiss')}
                  className="gf-btn gf-btn-secondary text-xs"
                >
                  Dismiss Report
                </button>
                <button
                  type="button"
                  onClick={() => handleResolve(rep, 'action_taken')}
                  className="gf-btn gf-btn-success text-xs font-bold"
                >
                  Uphold & Take Action
                </button>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed font-normal">
              {rep.description}
            </div>
          </div>
        ))}
      </div>

      {modalConfig && (
        <ActionConfirmModal
          isOpen={modalConfig.isOpen}
          title={modalConfig.title}
          actionType={modalConfig.actionType}
          targetLabel={modalConfig.targetLabel}
          targetId={modalConfig.targetId}
          isDestructive={modalConfig.isDestructive}
          onConfirm={modalConfig.onConfirm}
          onCancel={() => setModalConfig(null)}
        />
      )}
    </div>
  );
}
