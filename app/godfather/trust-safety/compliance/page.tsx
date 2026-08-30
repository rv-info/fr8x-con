'use client';

import React, { useState } from 'react';
import {
  BadgeCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Shield,
  FileCheck,
  Building,
  RefreshCw,
  Award,
  Lock,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { useGodfatherData } from '@/lib/godfather/context/GodfatherDataContext';
import { useGodfatherAuth } from '@/lib/godfather/context/GodfatherAuthContext';
import { ComplianceRecord } from '@/lib/godfather/types';
import { ActionConfirmModal } from '@/components/godfather/ActionConfirmModal';

export default function ComplianceGovernancePage() {
  const { complianceRecords, updateComplianceStatus } = useGodfatherData();
  const { requestStepUpVerification } = useGodfatherAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedRecord, setSelectedRecord] = useState<ComplianceRecord | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<ComplianceRecord['status']>('compliant');
  const [updateReason, setUpdateReason] = useState('');

  // Confirmation modal state
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    actionType: string;
    targetLabel: string;
    targetId: string;
    isDestructive?: boolean;
    onConfirm: (reason: string) => void;
  } | null>(null);

  const filteredRecords = complianceRecords.filter((rec) => {
    const matchesSearch =
      rec.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rec.certificateRef && rec.certificateRef.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = selectedType === 'all' || rec.type === selectedType;
    return matchesSearch && matchesType;
  });

  const handleOpenUpdate = (rec: ComplianceRecord) => {
    setSelectedRecord(rec);
    setNewStatus(rec.status);
    setUpdateReason(`Verified updated legal certificate and sanction records for ${rec.entityName}`);
    setIsUpdateModalOpen(true);
  };

  const handleSaveUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord || !updateReason.trim()) return;

    const verified = await requestStepUpVerification(`Update Compliance Status for ${selectedRecord.entityName}`);
    if (!verified) return;

    setModalConfig({
      isOpen: true,
      title: 'Update Statutory Compliance Status',
      actionType: 'COMPLIANCE_STATUS_UPDATED',
      targetLabel: selectedRecord.entityName,
      targetId: selectedRecord.id,
      isDestructive: newStatus !== 'compliant',
      onConfirm: async (reason) => {
        await updateComplianceStatus(selectedRecord.id, newStatus, reason);
        setIsUpdateModalOpen(false);
        setModalConfig(null);
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="gf-page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="gf-badge gf-badge-green text-[11px] font-bold">TRUST & SAFETY</span>
            <span className="gf-badge gf-badge-gold text-[11px]">Statutory & AML Screening Engine Active</span>
          </div>
          <h1 className="gf-page-title">Compliance, GSTIN & Sanctions Governance</h1>
          <p className="gf-page-subtitle">
            Audit member GSTIN validation, AML/PEP watchlist screenings, Indian DGS MTO licenses, and DPDP regulatory compliance
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="gf-metric-grid">
        <div className="gf-metric-card">
          <div className="gf-metric-title">GSTIN Verified Entities</div>
          <div className="gf-metric-value text-emerald-700">100%</div>
          <div className="gf-metric-foot">
            <CheckCircle2 className="lucide w-3.5 h-3.5" /> Direct GST Portal API Sync
          </div>
        </div>

        <div className="gf-metric-card">
          <div className="gf-metric-title">AML Watchlist Screenings</div>
          <div className="gf-metric-value text-sky-700">1,420</div>
          <div className="gf-metric-foot text-sky-700">
            <Shield className="lucide w-3.5 h-3.5" /> UN & EU Maritime Sanctions
          </div>
        </div>

        <div className="gf-metric-card">
          <div className="gf-metric-title">Remediation Required</div>
          <div className="gf-metric-value text-amber-700">
            {complianceRecords.filter((r) => r.status === 'remediation_required').length}
          </div>
          <div className="gf-metric-foot text-amber-700">
            <AlertTriangle className="lucide w-3.5 h-3.5" /> Expired MTO / Tax Certs
          </div>
        </div>

        <div className="gf-metric-card">
          <div className="gf-metric-title">Under Fraud Investigation</div>
          <div className="gf-metric-value text-rose-700">
            {complianceRecords.filter((r) => r.status === 'under_investigation').length}
          </div>
          <div className="gf-metric-foot text-rose-700">
            <AlertOctagon className="lucide w-3.5 h-3.5" /> Commercial Claim Escalated
          </div>
        </div>
      </div>

      {/* Compliance Records List */}
      <div className="gf-card">
        <div className="gf-filter-bar">
          <div className="gf-search-input-wrap">
            <Search className="lucide w-4 h-4 text-emerald-800" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by company name, certificate ref, or audit details..."
              className="gf-search-input"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="gf-select text-xs font-bold"
            >
              <option value="all">All Audit Types</option>
              <option value="gstin_audit">GSTIN Tax Audit</option>
              <option value="aml_sanctions">AML & Sanctions Screening</option>
              <option value="mto_license">MTO Freight License</option>
              <option value="dpdp_compliance">DPDP Data Protection</option>
            </select>
            <span className="text-xs text-mut font-bold">
              Showing <strong>{filteredRecords.length}</strong> audits
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="gf-table text-xs">
            <thead>
              <tr>
                <th>Entity & Organization</th>
                <th>Audit Category</th>
                <th>Risk Score</th>
                <th>Certificate & Reference</th>
                <th>Auditor & Timestamp</th>
                <th>Findings & Notes</th>
                <th>Compliance Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((rec) => (
                <tr key={rec.id}>
                  <td>
                    <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <Building className="lucide w-3.5 h-3.5 text-emerald-700" />
                      {rec.entityName}
                    </div>
                    <div className="text-[10px] text-faint font-mono mt-0.5">ID: {rec.entityId}</div>
                  </td>
                  <td>
                    <span className="gf-badge gf-badge-blue text-[10px] uppercase font-bold">
                      {rec.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`gf-badge ${
                        rec.riskScore > 60
                          ? 'gf-badge-red'
                          : rec.riskScore > 20
                          ? 'gf-badge-amber'
                          : 'gf-badge-green'
                      } text-[10px] font-mono font-bold`}
                    >
                      {rec.riskScore} / 100
                    </span>
                  </td>
                  <td>
                    <div className="font-mono text-slate-800 font-bold text-[11px]">{rec.certificateRef || 'N/A'}</div>
                    {rec.validUntil && (
                      <div className="text-[10px] text-faint">Valid until: {rec.validUntil}</div>
                    )}
                  </td>
                  <td>
                    <div className="text-slate-800 font-medium">{rec.auditedBy}</div>
                    <div className="text-[10px] text-faint font-mono">{rec.lastAuditedAt.split('T')[0]}</div>
                  </td>
                  <td>
                    <div className="text-slate-700 max-w-xs leading-relaxed text-[11px]">{rec.details}</div>
                  </td>
                  <td>
                    <span
                      className={`gf-badge ${
                        rec.status === 'compliant'
                          ? 'gf-badge-green'
                          : rec.status === 'remediation_required'
                          ? 'gf-badge-amber'
                          : 'gf-badge-red'
                      } text-[10px] uppercase font-bold`}
                    >
                      {rec.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="text-right">
                    <button
                      type="button"
                      onClick={() => handleOpenUpdate(rec)}
                      className="gf-btn gf-btn-secondary text-[11px] py-1 px-2.5 font-bold"
                    >
                      Audit / Remediate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Remediate Modal */}
      {isUpdateModalOpen && selectedRecord && (
        <div className="gf-modal-overlay">
          <div className="gf-modal-card">
            <div className="gf-modal-header">
              <div>
                <h3 className="gf-modal-title flex items-center gap-1.5 text-emerald-950">
                  <BadgeCheck className="lucide w-4 h-4 text-emerald-700" />
                  Statutory Compliance Audit Review
                </h3>
                <p className="gf-modal-subtitle">
                  {selectedRecord.entityName} · Category: {selectedRecord.type}
                </p>
              </div>
              <button onClick={() => setIsUpdateModalOpen(false)} className="gf-modal-close-btn">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUpdate} className="gf-modal-body space-y-4">
              <div className="gf-form-group">
                <label className="gf-form-label font-bold">Update Compliance Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="gf-select w-full text-xs font-bold"
                >
                  <option value="compliant">Compliant (100% Verified & Active)</option>
                  <option value="remediation_required">Remediation Required (Notice Sent)</option>
                  <option value="under_investigation">Under Investigation (Elevated Risk)</option>
                  <option value="flagged">Flagged / Suspended</option>
                </select>
              </div>

              <div className="gf-form-group">
                <label className="gf-form-label font-bold">Auditor Findings & Justification (Immutable Ledger)</label>
                <textarea
                  required
                  rows={3}
                  value={updateReason}
                  onChange={(e) => setUpdateReason(e.target.value)}
                  className="gf-textarea w-full text-xs"
                />
              </div>

              <div className="gf-modal-footer flex items-center justify-end gap-2 pt-3">
                <button type="button" onClick={() => setIsUpdateModalOpen(false)} className="gf-btn gf-btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="gf-btn gf-btn-primary font-bold">
                  Authorize & Commit Audit Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
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
