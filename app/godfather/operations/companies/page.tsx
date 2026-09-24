'use client';

import React, { useState, useEffect } from 'react';
import {
  Building,
  Search,
  CheckCircle2,
  XCircle,
  FileText,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Eye,
  MessageSquare,
  X,
  ZoomIn,
  ZoomOut,
  Download,
  AlertCircle,
  HelpCircle,
  FileCheck,
  ShieldAlert,
  Database,
  GitMerge,
  Plus,
  MapPin,
  RefreshCw,
  Layers,
  Check,
  ArrowRight,
  Edit3,
} from 'lucide-react';
import { useGodfatherData } from '@/lib/godfather/context/GodfatherDataContext';
import { useGodfatherAuth } from '@/lib/godfather/context/GodfatherAuthContext';
import { CompanyVerificationItem } from '@/lib/godfather/types';
import { ActionConfirmModal } from '@/components/godfather/ActionConfirmModal';
import { getStatutoryProfile } from '@/lib/utils/statutory-kyc';
import { useSearchParams } from 'next/navigation';

function CompaniesKYCContent() {
  const { companies, verifyCompany, rejectCompany, requestCompanyInfo, auditLogs } = useGodfatherData();
  const { requestStepUpVerification, hasPermission } = useGodfatherAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [countryFilter, setCountryFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');

  const [selectedCompany, setSelectedCompany] = useState<CompanyVerificationItem | null>(null);
  const [previewDocument, setPreviewDocument] = useState<any | null>(null);
  const [docZoom, setDocZoom] = useState(100);

  const [infoNote, setInfoNote] = useState('');
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  // Active view tab: KYC queue vs DBMS Master Register
  const [activeTab, setActiveTab] = useState<'kyc' | 'master_dbms'>('kyc');

  // Master Company Register (DBMS & Anti-Duplication) state
  const [dbmsCompanies, setDbmsCompanies] = useState<any[]>([]);
  const [isLoadingDbms, setIsLoadingDbms] = useState(false);
  const [dbmsSearch, setDbmsSearch] = useState('');
  const [dbmsFilter, setDbmsFilter] = useState<'ALL' | 'DUPLICATES' | 'MERGED' | 'CANONICAL'>('ALL');
  const [dbmsCountryFilter, setDbmsCountryFilter] = useState('ALL');

  // Merge modal state
  const [mergeModal, setMergeModal] = useState<{
    isOpen: boolean;
    sourceCompany: any | null;
    targetCompanyId: string;
    mergeNotes: string;
  }>({
    isOpen: false,
    sourceCompany: null,
    targetCompanyId: '',
    mergeNotes: '',
  });

  // Edit / Add Master Company modal state
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    company: any | null;
    isNew: boolean;
  }>({
    isOpen: false,
    company: null,
    isNew: false,
  });

  const [isSavingDbms, setIsSavingDbms] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchDbmsCompanies = async () => {
    setIsLoadingDbms(true);
    try {
      const res = await fetch('/api/godfather/companies');
      const data = await res.json();
      if (data.success && Array.isArray(data.companies)) {
        setDbmsCompanies(data.companies);
      }
    } catch (err) {
      console.error('Failed to fetch DBMS companies:', err);
    } finally {
      setIsLoadingDbms(false);
    }
  };

  // Synchronize tab with URL search param on mount and navigation
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get('tab');

  useEffect(() => {
    if (tabParam === 'master_dbms' || tabParam === 'dbms') {
      setActiveTab('master_dbms');
      fetchDbmsCompanies();
    } else if (tabParam === 'kyc') {
      setActiveTab('kyc');
    }
  }, [tabParam]);

  const handleTabChange = (tab: 'kyc' | 'master_dbms') => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (tab === 'master_dbms') {
        url.searchParams.set('tab', 'master_dbms');
        if (dbmsCompanies.length === 0) {
          fetchDbmsCompanies();
        }
      } else {
        url.searchParams.delete('tab');
      }
      window.history.replaceState(null, '', url.toString());
    }
  };

  useEffect(() => {
    if (activeTab === 'master_dbms') {
      fetchDbmsCompanies();
    }
  }, [activeTab]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  const handleExecuteMerge = async () => {
    if (!mergeModal.sourceCompany || !mergeModal.targetCompanyId) return;
    setIsSavingDbms(true);
    try {
      const res = await fetch('/api/godfather/companies', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          canonicalId: mergeModal.targetCompanyId,
          duplicateId: mergeModal.sourceCompany.id,
          mergeNotes: mergeModal.mergeNotes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', data.message || 'Duplicate company merged successfully.');
        setMergeModal({ isOpen: false, sourceCompany: null, targetCompanyId: '', mergeNotes: '' });
        fetchDbmsCompanies();
      } else {
        showToast('error', data.error || 'Failed to merge duplicate company.');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Network error during company merge.');
    } finally {
      setIsSavingDbms(false);
    }
  };

  const handleSaveMasterCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal.company?.legalName || !editModal.company?.city || !editModal.company?.country) return;
    setIsSavingDbms(true);
    try {
      const res = await fetch('/api/godfather/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editModal.company),
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          'success',
          editModal.isNew
            ? `Master entity "${editModal.company.legalName}" registered in DBMS.`
            : `Entity "${editModal.company.legalName}" updated in DBMS.`
        );
        setEditModal({ isOpen: false, company: null, isNew: false });
        fetchDbmsCompanies();
      } else {
        showToast('error', data.error || 'Failed to save master company.');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Network error saving company to DBMS.');
    } finally {
      setIsSavingDbms(false);
    }
  };

  const handleAcknowledgeDistinctBranch = async (comp: any) => {
    setIsSavingDbms(true);
    try {
      const updated = {
        ...comp,
        duplicateWarning: false,
        adminNotes: [
          ...(comp.adminNotes || []),
          `Audited and verified as distinct operational branch entity on ${new Date().toLocaleDateString()}`,
        ],
      };
      const res = await fetch('/api/godfather/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', `Entity "${comp.legalName}" marked as distinct branch.`);
        fetchDbmsCompanies();
      } else {
        showToast('error', data.error || 'Failed to update branch status.');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Error updating entity.');
    } finally {
      setIsSavingDbms(false);
    }
  };

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

  const filtered = companies.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      c.legalName.toLowerCase().includes(q) ||
      c.companyId.toLowerCase().includes(q) ||
      (c.gstn && c.gstn.toLowerCase().includes(q)) ||
      (c.pan && c.pan.toLowerCase().includes(q));

    const matchesStatus =
      statusFilter === 'ALL' || c.status.toUpperCase() === statusFilter.replace(/\s+/g, '_');
    const matchesCountry = countryFilter === 'ALL' || c.country.toUpperCase() === countryFilter;
    const matchesRisk = riskFilter === 'ALL' || (c.riskLevel || 'LOW').toUpperCase() === riskFilter;

    return matchesSearch && matchesStatus && matchesCountry && matchesRisk;
  });

  const filteredDbmsCompanies = dbmsCompanies.filter((c) => {
    const q = dbmsSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      c.legalName?.toLowerCase().includes(q) ||
      c.tradeName?.toLowerCase().includes(q) ||
      c.id?.toLowerCase().includes(q) ||
      c.registeredAddress?.toLowerCase().includes(q) ||
      c.city?.toLowerCase().includes(q) ||
      c.country?.toLowerCase().includes(q) ||
      c.gstn?.toLowerCase().includes(q) ||
      c.taxId?.toLowerCase().includes(q) ||
      c.pan?.toLowerCase().includes(q);

    const matchesFilter =
      dbmsFilter === 'ALL' ||
      (dbmsFilter === 'DUPLICATES' && c.duplicateWarning && !c.duplicateFlag) ||
      (dbmsFilter === 'MERGED' && c.duplicateFlag) ||
      (dbmsFilter === 'CANONICAL' && !c.duplicateWarning && !c.duplicateFlag);

    const matchesCountry =
      dbmsCountryFilter === 'ALL' ||
      c.country?.toUpperCase() === dbmsCountryFilter.toUpperCase();

    return matchesSearch && matchesFilter && matchesCountry;
  });

  const statusCounts = {
    ALL: companies.length,
    PENDING: companies.filter((c) => c.status === 'pending').length,
    ADDITIONAL_INFO_REQUIRED: companies.filter((c) => c.status === 'additional_info_required').length,
    VERIFIED: companies.filter((c) => c.status === 'verified').length,
    REJECTED: companies.filter((c) => c.status === 'rejected').length,
    SUSPENDED: companies.filter((c) => c.status === 'suspended').length,
  };

  const handleVerify = async (c: CompanyVerificationItem) => {
    const verified = await requestStepUpVerification(`Approve KYC for ${c.legalName}`);
    if (!verified) return;

    setModalConfig({
      isOpen: true,
      title: 'Approve Company KYC & Legal Verification',
      actionType: 'COMPANY_KYC_VERIFIED',
      targetLabel: c.legalName,
      targetId: c.companyId,
      onConfirm: async (reason) => {
        await verifyCompany(c.companyId, reason);
        setModalConfig(null);
        if (selectedCompany?.companyId === c.companyId) {
          setSelectedCompany({ ...c, status: 'verified' });
        }
      },
    });
  };

  const handleReject = async (c: CompanyVerificationItem) => {
    const verified = await requestStepUpVerification(`Reject KYC for ${c.legalName}`);
    if (!verified) return;

    setModalConfig({
      isOpen: true,
      title: 'Reject Corporate KYC Submission',
      actionType: 'COMPANY_KYC_REJECTED',
      targetLabel: c.legalName,
      targetId: c.companyId,
      isDestructive: true,
      onConfirm: async (reason) => {
        await rejectCompany(c.companyId, reason);
        setModalConfig(null);
        if (selectedCompany?.companyId === c.companyId) {
          setSelectedCompany({ ...c, status: 'rejected' });
        }
      },
    });
  };

  const handleRequestInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany || !infoNote.trim()) return;

    await requestCompanyInfo(selectedCompany.companyId, infoNote.trim());
    setIsInfoModalOpen(false);
    setInfoNote('');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="gf-page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="gf-badge gf-badge-blue font-bold">OPERATIONS & COMPLIANCE</span>
            <span className="gf-badge gf-badge-amber font-mono font-bold">
              {statusCounts.PENDING} PENDING VERIFICATION
            </span>
          </div>
          <h1 className="gf-page-title flex items-center gap-2">
            <Building className="lucide w-4 h-4 text-sky-600" />
            <span>Companies & KYC Verification Governance</span>
          </h1>
          <p className="gf-page-subtitle">
            Enterprise legal entity registry, statutory tax verification (GSTN, PAN, IEC, MTO), and risk evaluation.
          </p>
        </div>
      </div>

      {/* Main Governance View Mode Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => handleTabChange('kyc')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'kyc'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ShieldCheck className="lucide w-4 h-4" />
          <span>KYC Verification Queue</span>
          <span
            className={`px-1.5 py-0.5 rounded-full font-mono text-[10px] ${
              activeTab === 'kyc' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {statusCounts.PENDING}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('master_dbms')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'master_dbms'
              ? 'bg-slate-900 text-white shadow-sm ring-2 ring-sky-500/20'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Database className="lucide w-4 h-4 text-emerald-400" />
          <span>DBMS Master Company Register & Duplicate Governance</span>
          <span className="gf-badge gf-badge-amber text-[9px] font-bold">
            GODFATHER EXCLUSIVE
          </span>
          {dbmsCompanies.length > 0 && (
            <span
              className={`px-1.5 py-0.5 rounded-full font-mono text-[10px] ${
                activeTab === 'master_dbms' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {dbmsCompanies.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'kyc' && (
        <div className="space-y-4">
          {/* Top Status Summary Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { key: 'ALL', label: 'All Companies', count: statusCounts.ALL, badge: 'gf-badge-gray' },
          { key: 'PENDING', label: 'Pending', count: statusCounts.PENDING, badge: 'gf-badge-amber' },
          { key: 'ADDITIONAL_INFO_REQUIRED', label: 'Additional Info Required', count: statusCounts.ADDITIONAL_INFO_REQUIRED, badge: 'gf-badge-blue' },
          { key: 'VERIFIED', label: 'Verified', count: statusCounts.VERIFIED, badge: 'gf-badge-green' },
          { key: 'REJECTED', label: 'Rejected', count: statusCounts.REJECTED, badge: 'gf-badge-red' },
          { key: 'SUSPENDED', label: 'Suspended', count: statusCounts.SUSPENDED, badge: 'gf-badge-red' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3 py-1.5 rounded text-[10px] font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === tab.key
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full font-mono text-[9px] ${
                statusFilter === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filter Toolbar */}
      <div className="gf-filter-bar">
        <div className="gf-search-input-wrap">
          <Search className="lucide w-3 h-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by legal name, GSTN, PAN, company ID..."
            className="gf-search-input font-medium"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="gf-select"
          >
            <option value="ALL">All Countries</option>
            <option value="INDIA">India</option>
            <option value="NETHERLANDS">Netherlands</option>
            <option value="SINGAPORE">Singapore</option>
            <option value="ITALY">Italy</option>
          </select>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="gf-select"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="LOW">Low Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="HIGH">High Risk</option>
          </select>

          <span className="text-[10px] font-bold text-slate-600 font-mono">
            Showing {filtered.length} of {companies.length}
          </span>
        </div>
      </div>

      {/* Enterprise Data Table in Excel Grid */}
      <div className="gf-card">
        <div className="gf-excel-sheet border-0">
          <table className="gf-table">
            <thead>
              <tr>
                <th className="col-index">#</th>
                <th className="text-left">COMPANY</th>
                <th className="text-center" style={{ width: '110px' }}>COMPANY ID</th>
                <th className="text-center" style={{ width: '90px' }}>COUNTRY</th>
                <th className="text-center" style={{ width: '130px' }}>GSTN</th>
                <th className="text-center" style={{ width: '120px' }}>STATUS</th>
                <th className="text-center" style={{ width: '80px' }}>RISK</th>
                <th className="text-center" style={{ width: '100px' }}>SUBMITTED</th>
                <th className="text-right" style={{ width: '140px' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    <Building className="lucide w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <div className="font-bold text-slate-700 text-xs">No Companies Found</div>
                    <div className="text-[9px]">Zero company records matching the applied status or query filters.</div>
                  </td>
                </tr>
              ) : (
                filtered.map((comp, idx) => (
                  <tr
                    key={comp.companyId}
                    onClick={() => setSelectedCompany(comp)}
                    className="cursor-pointer"
                  >
                    <td className="col-index">{idx + 1}</td>
                    <td className="text-left">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Building className="lucide w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                        <span>{comp.legalName}</span>
                      </div>
                      <div className="text-[9px] text-slate-500">{comp.city}, {comp.country}</div>
                    </td>
                    <td className="text-center">
                      <span className="font-mono text-[9.5px] font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {comp.companyId}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className="text-slate-800 font-medium">{comp.country}</span>
                    </td>
                    <td className="text-center font-mono">
                      <span className="text-[9.5px] text-sky-800 font-semibold">
                        {comp.gstn || 'N/A'}
                      </span>
                    </td>
                    <td className="text-center">
                      <span
                        className={`gf-badge ${
                          comp.status === 'verified'
                            ? 'gf-badge-green'
                            : comp.status === 'pending'
                            ? 'gf-badge-amber'
                            : comp.status === 'additional_info_required'
                            ? 'gf-badge-blue'
                            : 'gf-badge-red'
                        }`}
                      >
                        {comp.status.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="text-center">
                      <span
                        className={`gf-badge ${
                          (comp.riskLevel || 'LOW') === 'HIGH'
                            ? 'gf-badge-red'
                            : (comp.riskLevel || 'LOW') === 'MEDIUM'
                            ? 'gf-badge-amber'
                            : 'gf-badge-green'
                        }`}
                      >
                        {comp.riskLevel || 'LOW'}
                      </span>
                    </td>
                    <td className="text-center font-mono text-[10px] text-slate-500">
                      {comp.submittedAt ? new Date(comp.submittedAt).toLocaleDateString() : '2026-01-15'}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setSelectedCompany(comp)}
                          className="gf-btn gf-btn-secondary h-[24px] text-[11px] py-0 px-2"
                          title="Open Company Dossier"
                        >
                          <Eye className="lucide w-3 h-3" />
                          <span>Review</span>
                        </button>
                        {comp.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => handleVerify(comp)}
                            className="gf-btn gf-btn-success font-bold h-[24px] text-[11px] py-0 px-2"
                          >
                            <CheckCircle2 className="lucide w-3 h-3" />
                            <span>Verify</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="gf-excel-status-bar">
            <span>● REGISTERED COMMERCIAL ENTITIES</span>
            <span>Showing {filtered.length} of {companies.length} Records | KYB/AML Verification Active</span>
          </div>
        </div>
      </div>

      {/* Company Detail Drawer */}
      {selectedCompany && (
        <div className="gf-drawer-overlay" onClick={() => setSelectedCompany(null)}>
          <div className="gf-drawer-panel max-w-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="gf-drawer-header bg-slate-50 border-b border-slate-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-sky-900 text-white flex items-center justify-center font-bold text-sm">
                  {selectedCompany.legalName.charAt(0)}
                </div>
                <div>
                  <div className="gf-drawer-title flex items-center gap-2">
                    <span>{selectedCompany.legalName}</span>
                    <span className="gf-badge gf-badge-blue font-mono font-bold">
                      {selectedCompany.companyId}
                    </span>
                  </div>
                  <div className="gf-drawer-subtitle">
                    {selectedCompany.city}, {selectedCompany.country} ·{' '}
                    <span className="font-semibold text-slate-700 capitalize">
                      Status: {selectedCompany.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCompany(null)}
                className="gf-modal-close-btn"
              >
                <X className="lucide w-4 h-4" />
              </button>
            </div>

            {/* Action Area */}
            <div className="p-3 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-600 uppercase">Verification Actions:</span>
                <button
                  type="button"
                  onClick={() => setIsInfoModalOpen(true)}
                  className="gf-btn gf-btn-secondary"
                >
                  <MessageSquare className="lucide w-3 h-3" />
                  <span>Request Info</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleReject(selectedCompany)}
                  className="gf-btn gf-btn-danger"
                >
                  <XCircle className="lucide w-3 h-3" />
                  <span>Reject</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleVerify(selectedCompany)}
                  className="gf-btn gf-btn-success font-bold"
                >
                  <CheckCircle2 className="lucide w-3 h-3" />
                  <span>Verify KYC</span>
                </button>
              </div>

              <span className="text-[9.5px] font-mono text-slate-500">
                Risk: <strong>{selectedCompany.riskLevel || 'LOW'}</strong>
              </span>
            </div>

            {/* Structured Sections */}
            <div className="gf-drawer-body space-y-4">
              {/* Section 1: Company Information */}
              <div className="gf-card p-3 space-y-2">
                <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                  <Building className="lucide w-3.5 h-3.5 text-sky-600" />
                  <span>Company Information</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <span className="text-slate-400">Legal Registered Name:</span>{' '}
                    <strong className="text-slate-800 block">{selectedCompany.legalName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Company ID:</span>{' '}
                    <strong className="font-mono text-slate-800 block">{selectedCompany.companyId}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Country of Registration:</span>{' '}
                    <strong className="text-slate-800 block">{selectedCompany.country}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Registered Address:</span>{' '}
                    <span className="text-slate-700 block">{selectedCompany.city}, {selectedCompany.country}</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Multi-Jurisdiction Tax & Statutory Registration */}
              {(() => {
                const compProfile = getStatutoryProfile(selectedCompany.country || 'India');
                return (
                  <div className="gf-card p-3 space-y-2">
                    <div className="font-bold text-slate-800 text-xs flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <div className="flex items-center gap-1.5">
                        <FileCheck className="lucide w-3.5 h-3.5 text-emerald-600" />
                        <span>Statutory Trade Filings ({compProfile.flag} {compProfile.countryName} Jurisdiction)</span>
                      </div>
                      <span className="text-[9px] text-slate-500 font-mono">
                        Validated with {compProfile.regulatoryAuthorities}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                      <div className="p-2 rounded bg-slate-50 border border-slate-200">
                        <span className="text-slate-400 uppercase font-bold text-[8.5px] block">{compProfile.primaryTaxId.shortLabel}</span>
                        <strong className="font-mono text-sky-800">{(selectedCompany as any).taxId || selectedCompany.gstn || 'N/A'}</strong>
                      </div>
                      <div className="p-2 rounded bg-slate-50 border border-slate-200">
                        <span className="text-slate-400 uppercase font-bold text-[8.5px] block">{compProfile.corporateReg.shortLabel}</span>
                        <strong className="font-mono text-slate-800">{(selectedCompany as any).corporateRegNumber || selectedCompany.pan || 'N/A'}</strong>
                      </div>
                      <div className="p-2 rounded bg-slate-50 border border-slate-200">
                        <span className="text-slate-400 uppercase font-bold text-[8.5px] block">{compProfile.tradeCustomsCode.shortLabel}</span>
                        <strong className="font-mono text-slate-800">{(selectedCompany as any).tradeCustomsCode || selectedCompany.iec || 'N/A'}</strong>
                      </div>
                      <div className="p-2 rounded bg-slate-50 border border-slate-200">
                        <span className="text-slate-400 uppercase font-bold text-[8.5px] block">{compProfile.logisticsLicense.shortLabel}</span>
                        <strong className="font-mono text-slate-800">{(selectedCompany as any).logisticsLicenseNumber || selectedCompany.mto || 'N/A'}</strong>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Section 3: Primary Contact */}
              <div className="gf-card p-3 space-y-2">
                <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                  <FileText className="lucide w-3.5 h-3.5 text-slate-600" />
                  <span>Primary Corporate Contact</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  <div>
                    <span className="text-slate-400">Representative Name:</span>
                    <strong className="text-slate-800 block">{selectedCompany.primaryContactName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Corporate Email:</span>
                    <strong className="font-mono text-slate-800 block">{selectedCompany.primaryContactEmail}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Phone:</span>
                    <span className="font-mono text-slate-800 block">{selectedCompany.phone || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Section 4: KYC Documents with Safe Preview Experience */}
              <div className="gf-card p-3 space-y-2">
                <div className="font-bold text-slate-800 text-xs flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="lucide w-3.5 h-3.5 text-emerald-600" />
                    <span>Uploaded KYC Filings & Documents ({selectedCompany.documents.length})</span>
                  </div>
                  <span className="text-[8.5px] font-mono text-slate-400">UNTRUSTED INPUT SANITIZED</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {selectedCompany.documents.map((doc, idx) => (
                    <div key={idx} className="py-2 flex items-center justify-between text-[10px]">
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <FileText className="lucide w-3 h-3 text-sky-600" />
                          <span>{doc.name}</span>
                        </div>
                        <div className="text-[9px] text-slate-500 font-mono">
                          {doc.type} · Size: {doc.size || '1.4 MB'} · Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className={`gf-badge ${doc.status === 'verified' || doc.verified ? 'gf-badge-green' : 'gf-badge-amber'}`}>
                          {(doc.status || (doc.verified ? 'verified' : 'pending')).toUpperCase()}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setDocZoom(100);
                            setPreviewDocument(doc);
                          }}
                          className="gf-btn gf-btn-secondary"
                        >
                          <Eye className="lucide w-3 h-3" />
                          <span>Inspect Preview</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 5: Compliance & Administrative History */}
              <div className="gf-card p-3 space-y-2">
                <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                  <Clock className="lucide w-3.5 h-3.5 text-slate-500" />
                  <span>Administrative Audit History</span>
                </div>
                <div className="space-y-1.5 text-[9.5px]">
                  {auditLogs
                    .filter((l) => l.targetId === selectedCompany.companyId)
                    .slice(0, 5)
                    .map((log) => (
                      <div key={log.actionId} className="p-2 rounded bg-slate-50 border border-slate-200">
                        <div className="flex items-center justify-between font-mono text-[8.5px] text-slate-500">
                          <span>{log.actorName} ({log.actorRole})</span>
                          <span>{new Date(log.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="font-bold text-slate-900 mt-0.5">{log.actionType}</div>
                        <div className="text-slate-600">{log.reason}</div>
                      </div>
                    ))}
                  {auditLogs.filter((l) => l.targetId === selectedCompany.companyId).length === 0 && (
                    <div className="text-slate-400 text-center py-2">
                      No previous administrative decisions on record.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
        </div>
      )}

      {/* DBMS Master Company Register & Duplicate Governance (Godfather Exclusive) */}
      {activeTab === 'master_dbms' && (
        <div className="space-y-4">
          {/* Summary Metric Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="gf-card p-3 flex items-center justify-between border-l-4 border-l-sky-600">
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">DBMS Master Entities</div>
                <div className="text-xl font-mono font-bold text-slate-900 mt-0.5">{dbmsCompanies.length}</div>
                <div className="text-[9px] text-slate-500">Persisted in DBMS companies.json</div>
              </div>
              <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center">
                <Database className="lucide w-4 h-4" />
              </div>
            </div>

            <div className="gf-card p-3 flex items-center justify-between border-l-4 border-l-amber-500">
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Duplicate Warnings</div>
                <div className="text-xl font-mono font-bold text-amber-600 mt-0.5">
                  {dbmsCompanies.filter((c) => c.duplicateWarning && !c.duplicateFlag).length}
                </div>
                <div className="text-[9px] text-amber-700 font-medium">Same name or identical address</div>
              </div>
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <AlertTriangle className="lucide w-4 h-4" />
              </div>
            </div>

            <div className="gf-card p-3 flex items-center justify-between border-l-4 border-l-purple-500">
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Merged Duplicates</div>
                <div className="text-xl font-mono font-bold text-purple-700 mt-0.5">
                  {dbmsCompanies.filter((c) => c.duplicateFlag).length}
                </div>
                <div className="text-[9px] text-slate-500">Consolidated into canonical parents</div>
              </div>
              <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                <GitMerge className="lucide w-4 h-4" />
              </div>
            </div>

            <div className="gf-card p-3 flex items-center justify-between border-l-4 border-l-emerald-600">
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Canonical Master Records</div>
                <div className="text-xl font-mono font-bold text-emerald-700 mt-0.5">
                  {dbmsCompanies.filter((c) => !c.duplicateWarning && !c.duplicateFlag).length}
                </div>
                <div className="text-[9px] text-emerald-700 font-medium">Distinct verified entities</div>
              </div>
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="lucide w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Filter & Action Toolbar */}
          <div className="gf-filter-bar flex-wrap gap-2">
            <div className="gf-search-input-wrap min-w-[280px]">
              <Search className="lucide w-3 h-3 text-slate-400" />
              <input
                type="text"
                value={dbmsSearch}
                onChange={(e) => setDbmsSearch(e.target.value)}
                placeholder="Search by company name, address, city, country, tax ID, or CMP ID..."
                className="gf-search-input font-medium"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={dbmsFilter}
                onChange={(e) => setDbmsFilter(e.target.value as any)}
                className="gf-select"
              >
                <option value="ALL">All Master Records ({dbmsCompanies.length})</option>
                <option value="DUPLICATES">Flagged Duplicates Only</option>
                <option value="CANONICAL">Canonical Entities Only</option>
                <option value="MERGED">Merged Records Only</option>
              </select>

              <select
                value={dbmsCountryFilter}
                onChange={(e) => setDbmsCountryFilter(e.target.value)}
                className="gf-select"
              >
                <option value="ALL">All Countries</option>
                <option value="India">India</option>
                <option value="Netherlands">Netherlands</option>
                <option value="Singapore">Singapore</option>
                <option value="Germany">Germany</option>
                <option value="United States">United States</option>
                <option value="UAE">UAE</option>
              </select>

              <button
                type="button"
                onClick={fetchDbmsCompanies}
                disabled={isLoadingDbms}
                className="gf-btn gf-btn-secondary flex items-center gap-1.5 cursor-pointer"
                title="Refresh DBMS Registry"
              >
                <RefreshCw className={`lucide w-3 h-3 ${isLoadingDbms ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setEditModal({
                    isOpen: true,
                    company: {
                      legalName: '',
                      tradeName: '',
                      country: 'India',
                      city: '',
                      state: '',
                      postalCode: '',
                      registeredAddress: '',
                      gstn: '',
                      pan: '',
                      iec: '',
                      mto: '',
                      taxId: '',
                      corporateRegNumber: '',
                      tradeCustomsCode: '',
                      logisticsLicenseNumber: '',
                      primaryContactName: '',
                      primaryContactEmail: '',
                      primaryContactPhone: '',
                      status: 'verified',
                      verified: true,
                      memberCount: 1,
                    },
                    isNew: true,
                  })
                }
                className="gf-btn gf-btn-primary flex items-center gap-1.5 font-bold cursor-pointer"
              >
                <Plus className="lucide w-3.5 h-3.5" />
                <span>Register Master Entity in DBMS</span>
              </button>
            </div>
          </div>

          {/* Master Company Registry Enterprise Table */}
          <div className="gf-card">
            <div className="gf-excel-sheet border-0">
              <table className="gf-table">
                <thead>
                  <tr>
                    <th className="col-index">#</th>
                    <th className="text-left" style={{ minWidth: '220px' }}>COMPANY & TRADE NAME</th>
                    <th className="text-center" style={{ width: '100px' }}>COMPANY ID</th>
                    <th className="text-left" style={{ minWidth: '260px' }}>LOCATION & REGISTERED ADDRESS</th>
                    <th className="text-center" style={{ width: '150px' }}>TAX / STATUTORY ID</th>
                    <th className="text-center" style={{ width: '180px' }}>DUPLICATE ADVISORY</th>
                    <th className="text-center" style={{ width: '100px' }}>MEMBERS</th>
                    <th className="text-right" style={{ width: '220px' }}>GODFATHER ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDbmsCompanies.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-slate-400">
                        <Database className="lucide w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <div className="font-bold text-slate-700 text-xs">No Master Entities Found</div>
                        <div className="text-[9px]">
                          {isLoadingDbms
                            ? 'Loading DBMS Master Registry from .knox/dbms/companies.json...'
                            : 'Zero company records matching the applied search or filter query.'}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredDbmsCompanies.map((comp, idx) => {
                      const isDup = comp.duplicateWarning && !comp.duplicateFlag;
                      const isMerged = comp.duplicateFlag;
                      return (
                        <tr
                          key={comp.id}
                          className={`transition-colors ${
                            isDup
                              ? 'bg-amber-50/40 hover:bg-amber-50/80'
                              : isMerged
                              ? 'bg-slate-50/50 hover:bg-slate-100/50 opacity-70'
                              : 'hover:bg-sky-50/30'
                          }`}
                        >
                          <td className="col-index">{idx + 1}</td>

                          {/* Company & Trade Name */}
                          <td className="text-left">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <Building className="lucide w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                              <span className="truncate max-w-[220px]">{comp.legalName}</span>
                            </div>
                            {comp.tradeName && comp.tradeName !== comp.legalName && (
                              <div className="text-[9.5px] text-slate-500 font-medium">
                                Trade: {comp.tradeName}
                              </div>
                            )}
                          </td>

                          {/* Company ID */}
                          <td className="text-center">
                            <span className="font-mono text-[9.5px] font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                              {comp.id}
                            </span>
                          </td>

                          {/* Location & Address */}
                          <td className="text-left">
                            <div className="flex items-center gap-1 text-[10px] font-bold text-sky-900 mb-0.5">
                              <MapPin className="lucide w-3 h-3 text-sky-600 flex-shrink-0" />
                              <span>{comp.city}, {comp.country}</span>
                            </div>
                            <div className="text-[9.5px] text-slate-600 line-clamp-1" title={comp.registeredAddress}>
                              {comp.registeredAddress || 'No street address specified'}
                            </div>
                          </td>

                          {/* Tax / Statutory ID */}
                          <td className="text-center font-mono text-[9.5px]">
                            {comp.gstn ? (
                              <div className="text-sky-800 font-bold">GST: {comp.gstn}</div>
                            ) : comp.taxId ? (
                              <div className="text-slate-800 font-bold">Tax: {comp.taxId}</div>
                            ) : (
                              <span className="text-slate-400">Not Specified</span>
                            )}
                            {comp.pan && <div className="text-slate-500 text-[8.5px]">PAN: {comp.pan}</div>}
                          </td>

                          {/* Duplicate Advisory */}
                          <td className="text-center">
                            {isDup ? (
                              <div className="space-y-1">
                                <span className="gf-badge gf-badge-amber text-[9px] font-bold flex items-center justify-center gap-1">
                                  <AlertTriangle className="lucide w-3 h-3 text-amber-700" />
                                  <span>DUPLICATE ADVISORY</span>
                                </span>
                                <div
                                  className="text-[8.5px] text-amber-800 font-medium line-clamp-2 text-left"
                                  title={comp.duplicateReason}
                                >
                                  {comp.duplicateReason || 'Potential identical name or address match detected.'}
                                </div>
                              </div>
                            ) : isMerged ? (
                              <div className="space-y-0.5">
                                <span className="gf-badge gf-badge-gray text-[9px] font-bold flex items-center justify-center gap-1">
                                  <GitMerge className="lucide w-3 h-3" />
                                  <span>MERGED ALIAS</span>
                                </span>
                                <div className="text-[8.5px] font-mono text-slate-500">
                                  Parent: {comp.duplicateOfId}
                                </div>
                              </div>
                            ) : (
                              <span className="gf-badge gf-badge-green text-[9px] font-bold flex items-center justify-center gap-1">
                                <CheckCircle2 className="lucide w-3 h-3 text-emerald-600" />
                                <span>CANONICAL MASTER</span>
                              </span>
                            )}
                          </td>

                          {/* Members */}
                          <td className="text-center font-mono text-[10px]">
                            <span className="font-bold text-slate-800">{comp.memberCount || 1}</span>{' '}
                            <span className="text-slate-500 text-[8.5px]">users</span>
                          </td>

                          {/* Actions */}
                          <td className="text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {isDup && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const targetMatch = comp.duplicateMatches?.[0]?.id || '';
                                      setMergeModal({
                                        isOpen: true,
                                        sourceCompany: comp,
                                        targetCompanyId: targetMatch,
                                        mergeNotes: `Duplicate consolidation requested: ${comp.duplicateReason || 'Matches existing registered entity.'}`,
                                      });
                                    }}
                                    className="gf-btn gf-btn-danger h-[24px] text-[10px] py-0 px-2 font-bold flex items-center gap-1 cursor-pointer"
                                    title="Merge duplicate into canonical parent"
                                  >
                                    <GitMerge className="lucide w-3 h-3" />
                                    <span>Merge</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleAcknowledgeDistinctBranch(comp)}
                                    className="gf-btn gf-btn-secondary h-[24px] text-[10px] py-0 px-2 flex items-center gap-1 cursor-pointer"
                                    title="Acknowledge this record as an independent branch operating at same location"
                                  >
                                    <Check className="lucide w-3 h-3 text-emerald-600" />
                                    <span>Distinct Branch</span>
                                  </button>
                                </>
                              )}

                              <button
                                type="button"
                                onClick={() => setEditModal({ isOpen: true, company: { ...comp }, isNew: false })}
                                className="gf-btn gf-btn-secondary h-[24px] text-[10px] py-0 px-2 flex items-center gap-1 cursor-pointer"
                                title="Edit master details in DBMS"
                              >
                                <Edit3 className="lucide w-3 h-3" />
                                <span>Edit</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              <div className="gf-excel-status-bar">
                <span>● DBMS MASTER COMPANY REPOSITORY (.knox/dbms/companies.json)</span>
                <span>Showing {filteredDbmsCompanies.length} of {dbmsCompanies.length} Master Entities</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Safe In-Modal KYC Document Preview Viewer */}
      {previewDocument && (
        <div className="gf-modal-overlay">
          <div className="gf-modal-card max-w-3xl">
            <div className="gf-modal-header bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <FileText className="lucide w-4 h-4 text-sky-400" />
                <div>
                  <div className="font-bold text-xs text-white">{previewDocument.name}</div>
                  <div className="text-[9px] text-slate-400 font-mono">{previewDocument.type} (Protected Sandboxed Preview)</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDocZoom((z) => Math.max(50, z - 25))}
                  className="p-1 rounded bg-slate-800 text-slate-200 hover:bg-slate-700"
                  title="Zoom Out"
                >
                  <ZoomOut className="lucide w-3.5 h-3.5" />
                </button>
                <span className="text-[9px] font-mono text-slate-300">{docZoom}%</span>
                <button
                  type="button"
                  onClick={() => setDocZoom((z) => Math.min(200, z + 25))}
                  className="p-1 rounded bg-slate-800 text-slate-200 hover:bg-slate-700"
                  title="Zoom In"
                >
                  <ZoomIn className="lucide w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDocument(null)}
                  className="p-1 rounded text-slate-400 hover:text-white"
                >
                  <X className="lucide w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Document Render Surface (Safe Sandbox - zero macro/script execution) */}
            <div className="p-6 bg-slate-800 min-h-[380px] max-h-[500px] overflow-auto flex items-center justify-center">
              <div
                style={{ transform: `scale(${docZoom / 100})`, transformOrigin: 'center center' }}
                className="transition-transform p-8 bg-white rounded shadow-lg border border-slate-300 w-full max-w-lg text-slate-900 text-xs space-y-4"
              >
                <div className="border-b border-slate-300 pb-3 flex justify-between items-center">
                  <div>
                    <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900">
                      GOVERNMENT TAX CERTIFICATE
                    </h3>
                    <p className="text-[9px] text-slate-500 font-mono">SANCTIONED REGISTRATION FILING</p>
                  </div>
                  <span className="gf-badge gf-badge-green font-mono">OFFICIAL FILING</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[10px]">
                  <div>
                    <span className="text-slate-400 block font-bold">DOCUMENT TYPE:</span>
                    <strong>{previewDocument.type}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold">DOCUMENT ID:</span>
                    <span className="font-mono font-bold">DOC-{Math.abs(previewDocument.name.length * 9912)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold">TIMESTAMP:</span>
                    <span>{new Date(previewDocument.uploadedAt).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold">VERIFICATION STATUS:</span>
                    <span className="text-emerald-700 font-bold uppercase">{previewDocument.status}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded text-[9.5px] leading-relaxed text-slate-700">
                  This document has been ingested through the FR8X KYC processing gateway. Active scripting, macros, and embedded binaries are stripped and neutralized.
                </div>
              </div>
            </div>

            {/* Footer Action Bar */}
            <div className="gf-modal-footer flex items-center justify-between">
              <span className="text-[9.5px] text-slate-500">
                Document Inspection Sandbox · {selectedCompany?.legalName}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewDocument(null)}
                  className="gf-btn gf-btn-secondary"
                >
                  Close Viewer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Request Information Dialog */}
      {isInfoModalOpen && (
        <div className="gf-modal-overlay">
          <div className="gf-modal-card">
            <div className="gf-modal-header bg-sky-50 border-b border-sky-200">
              <div className="gf-modal-title text-sky-900 flex items-center gap-2">
                <MessageSquare className="lucide w-4 h-4 text-sky-600" />
                <span>Request Additional Compliance Information</span>
              </div>
            </div>

            <form onSubmit={handleRequestInfoSubmit} className="p-4 space-y-3">
              <div className="text-xs text-slate-700">
                Dispatch an official regulatory notice to <strong className="text-slate-900">{selectedCompany?.legalName}</strong> (
                {selectedCompany?.primaryContactEmail}).
              </div>

              <div className="gf-form-group">
                <label className="gf-form-label">
                  Information / Documents Requested <span className="text-rose-600">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={infoNote}
                  onChange={(e) => setInfoNote(e.target.value)}
                  placeholder="Specify the clarification or document re-upload required (e.g. MTO Registration Certificate renewal is required for Indian corridor bookings)."
                  className="gf-textarea w-full"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsInfoModalOpen(false)}
                  className="gf-btn gf-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!infoNote.trim()}
                  className="gf-btn gf-btn-primary"
                >
                  Dispatch Regulatory Notice
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
          onClose={() => setModalConfig(null)}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-lg shadow-xl border text-xs font-bold flex items-center gap-2 transition-all ${
            toastMessage.type === 'success'
              ? 'bg-slate-900 text-emerald-400 border-emerald-500/50 shadow-emerald-950/30'
              : 'bg-slate-900 text-rose-400 border-rose-500/50 shadow-rose-950/30'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="lucide w-4 h-4 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="lucide w-4 h-4 text-rose-400 flex-shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Merge Duplicate Entity Modal */}
      {mergeModal.isOpen && mergeModal.sourceCompany && (
        <div className="gf-modal-overlay">
          <div className="gf-modal-card max-w-xl">
            <div className="gf-modal-header bg-amber-50 border-b border-amber-200">
              <div className="gf-modal-title text-amber-950 flex items-center gap-2">
                <GitMerge className="lucide w-4 h-4 text-amber-600" />
                <span>Merge Duplicate Company into Canonical Master</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  setMergeModal({ isOpen: false, sourceCompany: null, targetCompanyId: '', mergeNotes: '' })
                }
                className="gf-modal-close-btn cursor-pointer"
              >
                <X className="lucide w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 text-xs">
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-amber-900 text-[11px] leading-relaxed">
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="lucide w-3.5 h-3.5 text-amber-700" />
                  <span>Consolidation & Duplicate Resolution Policy</span>
                </div>
                Merging consolidates member accounts and booking privileges into the canonical master company. The source duplicate entity will be marked as an archived alias pointing to the canonical master in DBMS.
              </div>

              {/* Source Entity */}
              <div className="p-3 rounded border border-rose-200 bg-rose-50/50">
                <div className="text-[10px] font-bold text-rose-700 uppercase tracking-wide mb-1">
                  Source Duplicate Entity (To Be Merged)
                </div>
                <div className="font-bold text-slate-900 text-sm">{mergeModal.sourceCompany.legalName}</div>
                <div className="text-slate-600 text-[10px] flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span className="font-mono font-bold text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    {mergeModal.sourceCompany.id}
                  </span>
                  <span>📍 {mergeModal.sourceCompany.city}, {mergeModal.sourceCompany.country}</span>
                  <span>· {mergeModal.sourceCompany.registeredAddress}</span>
                </div>
              </div>

              {/* Target Canonical Entity */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                  Target Canonical Master Company <span className="text-rose-600">*</span>
                </label>
                <select
                  value={mergeModal.targetCompanyId}
                  onChange={(e) => setMergeModal((prev) => ({ ...prev, targetCompanyId: e.target.value }))}
                  className="gf-select w-full font-medium"
                >
                  <option value="">-- Select Canonical Parent Entity --</option>
                  {dbmsCompanies
                    .filter((c) => c.id !== mergeModal.sourceCompany?.id && !c.duplicateFlag)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.legalName} ({c.id}) — 📍 {c.city}, {c.country} ({c.registeredAddress})
                      </option>
                    ))}
                </select>
              </div>

              {/* Merge Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                  Godfather Audit Reason / Consolidation Notes <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={3}
                  value={mergeModal.mergeNotes}
                  onChange={(e) => setMergeModal((prev) => ({ ...prev, mergeNotes: e.target.value }))}
                  placeholder="e.g. Duplicate registration sharing identical street address and registered office at Mumbai Logistics Park."
                  className="gf-textarea w-full"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() =>
                    setMergeModal({ isOpen: false, sourceCompany: null, targetCompanyId: '', mergeNotes: '' })
                  }
                  className="gf-btn gf-btn-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!mergeModal.targetCompanyId || !mergeModal.mergeNotes.trim() || isSavingDbms}
                  onClick={handleExecuteMerge}
                  className="gf-btn gf-btn-danger flex items-center gap-1.5 cursor-pointer font-bold"
                >
                  <GitMerge className="lucide w-3.5 h-3.5" />
                  <span>{isSavingDbms ? 'Executing Merge...' : 'Execute Canonical Merge'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Register / Edit Master Company Modal */}
      {editModal.isOpen && editModal.company && (
        <div className="gf-modal-overlay">
          <div className="gf-modal-card max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="gf-modal-header bg-slate-900 text-white">
              <div className="gf-modal-title flex items-center gap-2 text-white">
                <Database className="lucide w-4 h-4 text-emerald-400" />
                <span>
                  {editModal.isNew
                    ? 'Register Master Corporate Entity in DBMS'
                    : `Edit Master Entity: ${editModal.company.legalName}`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEditModal({ isOpen: false, company: null, isNew: false })}
                className="gf-modal-close-btn text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="lucide w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMasterCompany} className="p-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="gf-form-group">
                  <label className="gf-form-label">
                    Legal Registered Company Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editModal.company.legalName || ''}
                    onChange={(e) =>
                      setEditModal((prev) => ({
                        ...prev,
                        company: { ...prev.company, legalName: e.target.value },
                      }))
                    }
                    placeholder="e.g. Cogoport India Private Limited"
                    className="gf-input font-bold"
                  />
                </div>

                <div className="gf-form-group">
                  <label className="gf-form-label">Trade / Operating Name</label>
                  <input
                    type="text"
                    value={editModal.company.tradeName || ''}
                    onChange={(e) =>
                      setEditModal((prev) => ({
                        ...prev,
                        company: { ...prev.company, tradeName: e.target.value },
                      }))
                    }
                    placeholder="e.g. Apex Forwarders"
                    className="gf-input"
                  />
                </div>

                <div className="gf-form-group">
                  <label className="gf-form-label">
                    Country <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editModal.company.country || ''}
                    onChange={(e) =>
                      setEditModal((prev) => ({
                        ...prev,
                        company: { ...prev.company, country: e.target.value },
                      }))
                    }
                    placeholder="e.g. India, Netherlands, Singapore..."
                    className="gf-input"
                  />
                </div>

                <div className="gf-form-group">
                  <label className="gf-form-label">
                    City <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editModal.company.city || ''}
                    onChange={(e) =>
                      setEditModal((prev) => ({
                        ...prev,
                        company: { ...prev.company, city: e.target.value },
                      }))
                    }
                    placeholder="e.g. Mumbai, Rotterdam, Singapore..."
                    className="gf-input"
                  />
                </div>

                <div className="gf-form-group">
                  <label className="gf-form-label">State / Province</label>
                  <input
                    type="text"
                    value={editModal.company.state || ''}
                    onChange={(e) =>
                      setEditModal((prev) => ({
                        ...prev,
                        company: { ...prev.company, state: e.target.value },
                      }))
                    }
                    placeholder="e.g. Maharashtra, Zuid-Holland..."
                    className="gf-input"
                  />
                </div>

                <div className="gf-form-group">
                  <label className="gf-form-label">Postal / ZIP Code</label>
                  <input
                    type="text"
                    value={editModal.company.postalCode || ''}
                    onChange={(e) =>
                      setEditModal((prev) => ({
                        ...prev,
                        company: { ...prev.company, postalCode: e.target.value },
                      }))
                    }
                    placeholder="e.g. 400093"
                    className="gf-input font-mono"
                  />
                </div>
              </div>

              <div className="gf-form-group">
                <label className="gf-form-label">
                  Registered Street Address / Logistics Terminal <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={editModal.company.registeredAddress || ''}
                  onChange={(e) =>
                    setEditModal((prev) => ({
                      ...prev,
                      company: { ...prev.company, registeredAddress: e.target.value },
                    }))
                  }
                  placeholder="e.g. Unit 402, B-Wing, Logistics Park, Andheri East"
                  className="gf-textarea w-full"
                />
              </div>

              {/* Statutory Tax & Corporate Identifiers (Country Adaptive - Clean Distinct Fields) */}
              <div className="pt-2 border-t border-slate-100">
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="lucide w-3.5 h-3.5 text-sky-600" />
                  <span>
                    {(editModal.company.country || '').trim().toLowerCase() === 'india'
                      ? 'India Statutory Filings (GSTN, PAN, IEC, MTO)'
                      : `International Corporate Filings (${editModal.company.country || 'Global'})`}
                  </span>
                </div>

                {(editModal.company.country || '').trim().toLowerCase() === 'india' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="gf-form-group">
                      <label className="gf-form-label">GST Identification (GSTN)</label>
                      <input
                        type="text"
                        value={editModal.company.gstn || ''}
                        onChange={(e) =>
                          setEditModal((prev) => ({
                            ...prev,
                            company: { ...prev.company, gstn: e.target.value.toUpperCase().trim() },
                          }))
                        }
                        placeholder="e.g. 27AABCA1234F1Z5"
                        className="gf-input font-mono uppercase"
                      />
                    </div>

                    <div className="gf-form-group">
                      <label className="gf-form-label">Company PAN</label>
                      <input
                        type="text"
                        value={editModal.company.pan || ''}
                        onChange={(e) =>
                          setEditModal((prev) => ({
                            ...prev,
                            company: { ...prev.company, pan: e.target.value.toUpperCase().trim() },
                          }))
                        }
                        placeholder="e.g. AABCA1234F"
                        className="gf-input font-mono uppercase"
                      />
                    </div>

                    <div className="gf-form-group">
                      <label className="gf-form-label">Import Export Code (IEC)</label>
                      <input
                        type="text"
                        value={editModal.company.iec || ''}
                        onChange={(e) =>
                          setEditModal((prev) => ({
                            ...prev,
                            company: { ...prev.company, iec: e.target.value.trim() },
                          }))
                        }
                        placeholder="e.g. 0312004561"
                        className="gf-input font-mono"
                      />
                    </div>

                    <div className="gf-form-group">
                      <label className="gf-form-label">MTO Registration License</label>
                      <input
                        type="text"
                        value={editModal.company.mto || ''}
                        onChange={(e) =>
                          setEditModal((prev) => ({
                            ...prev,
                            company: { ...prev.company, mto: e.target.value.trim() },
                          }))
                        }
                        placeholder="e.g. MTO/DGS/2024/9912"
                        className="gf-input font-mono"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="gf-form-group">
                      <label className="gf-form-label">Statutory Tax ID / VAT</label>
                      <input
                        type="text"
                        value={editModal.company.taxId || ''}
                        onChange={(e) =>
                          setEditModal((prev) => ({
                            ...prev,
                            company: { ...prev.company, taxId: e.target.value.trim() },
                          }))
                        }
                        placeholder="e.g. NL884210992B01 / EIN"
                        className="gf-input font-mono"
                      />
                    </div>

                    <div className="gf-form-group">
                      <label className="gf-form-label">Corporate Reg Number (KvK/CR)</label>
                      <input
                        type="text"
                        value={editModal.company.corporateRegNumber || ''}
                        onChange={(e) =>
                          setEditModal((prev) => ({
                            ...prev,
                            company: { ...prev.company, corporateRegNumber: e.target.value.trim() },
                          }))
                        }
                        placeholder="e.g. KvK-24389102 / 913100"
                        className="gf-input font-mono"
                      />
                    </div>

                    <div className="gf-form-group">
                      <label className="gf-form-label">Customs / EORI / FMC Code</label>
                      <input
                        type="text"
                        value={editModal.company.tradeCustomsCode || ''}
                        onChange={(e) =>
                          setEditModal((prev) => ({
                            ...prev,
                            company: { ...prev.company, tradeCustomsCode: e.target.value.trim() },
                          }))
                        }
                        placeholder="e.g. NL-EORI-884210992 / FMC"
                        className="gf-input font-mono"
                      />
                    </div>

                    <div className="gf-form-group">
                      <label className="gf-form-label">Logistics Operating License</label>
                      <input
                        type="text"
                        value={editModal.company.logisticsLicenseNumber || ''}
                        onChange={(e) =>
                          setEditModal((prev) => ({
                            ...prev,
                            company: { ...prev.company, logisticsLicenseNumber: e.target.value.trim() },
                          }))
                        }
                        placeholder="e.g. OTI-19924-NF / FAK-882"
                        className="gf-input font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Primary Contact & Verification Status */}
              <div className="pt-2 border-t border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="gf-form-group">
                  <label className="gf-form-label">Primary Contact Person</label>
                  <input
                    type="text"
                    value={editModal.company.primaryContactName || ''}
                    onChange={(e) =>
                      setEditModal((prev) => ({
                        ...prev,
                        company: { ...prev.company, primaryContactName: e.target.value },
                      }))
                    }
                    placeholder="e.g. Rajat RAI"
                    className="gf-input"
                  />
                </div>

                <div className="gf-form-group">
                  <label className="gf-form-label">Contact Email</label>
                  <input
                    type="email"
                    value={editModal.company.primaryContactEmail || ''}
                    onChange={(e) =>
                      setEditModal((prev) => ({
                        ...prev,
                        company: { ...prev.company, primaryContactEmail: e.target.value },
                      }))
                    }
                    placeholder="ops@company.com"
                    className="gf-input font-mono"
                  />
                </div>

                <div className="gf-form-group">
                  <label className="gf-form-label">Contact Phone</label>
                  <input
                    type="text"
                    value={editModal.company.primaryContactPhone || ''}
                    onChange={(e) =>
                      setEditModal((prev) => ({
                        ...prev,
                        company: { ...prev.company, primaryContactPhone: e.target.value },
                      }))
                    }
                    placeholder="+91 98765 43210"
                    className="gf-input font-mono"
                  />
                </div>

                <div className="gf-form-group">
                  <label className="gf-form-label">Verification Governance Status</label>
                  <select
                    value={editModal.company.status || 'verified'}
                    onChange={(e) =>
                      setEditModal((prev) => ({
                        ...prev,
                        company: {
                          ...prev.company,
                          status: e.target.value as any,
                          verified: e.target.value === 'verified',
                        },
                      }))
                    }
                    className="gf-select w-full font-bold"
                  >
                    <option value="verified">Verified Canonical</option>
                    <option value="pending">Pending Review</option>
                    <option value="additional_info_required">Additional Info Required</option>
                    <option value="suspended">Suspended / Merged</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModal({ isOpen: false, company: null, isNew: false })}
                  className="gf-btn gf-btn-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingDbms}
                  className="gf-btn gf-btn-primary flex items-center gap-1.5 font-bold cursor-pointer"
                >
                  <Check className="lucide w-3.5 h-3.5" />
                  <span>{isSavingDbms ? 'Saving to DBMS...' : 'Save to DBMS Registry'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CompaniesKYCPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-6 text-slate-500 font-mono text-xs flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-600 animate-spin" />
          <span>Loading DBMS & KYC Registry...</span>
        </div>
      }
    >
      <CompaniesKYCContent />
    </React.Suspense>
  );
}
