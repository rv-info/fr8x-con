'use client';

import React, { useState } from 'react';
import {
  DollarSign,
  Search,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Shield,
  Eye,
  Sliders,
  Ship,
} from 'lucide-react';
import { useGodfatherData } from '@/lib/godfather/context/GodfatherDataContext';
import { useGodfatherAuth } from '@/lib/godfather/context/GodfatherAuthContext';
import { RateItem } from '@/lib/types';
import { RateImportBatch } from '@/lib/godfather/types';
import { ActionConfirmModal } from '@/components/godfather/ActionConfirmModal';

export default function RatesManagementPage() {
  const { rates, rateImports, moderateRate, finalizeRateImport } = useGodfatherData();
  const { requestStepUpVerification } = useGodfatherAuth();

  const [activeTab, setActiveTab] = useState<'inventory' | 'imports'>('imports');
  const [rateSearch, setRateSearch] = useState('');
  const [selectedBatch, setSelectedBatch] = useState<any>(rateImports[0]);

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

  const filteredRates = rates.filter(
    (r) =>
      r.id.toLowerCase().includes(rateSearch.toLowerCase()) ||
      r.carrier.toLowerCase().includes(rateSearch.toLowerCase()) ||
      r.route.toLowerCase().includes(rateSearch.toLowerCase()) ||
      r.sp.toLowerCase().includes(rateSearch.toLowerCase())
  );

  const handleFinalizeBatch = async (batch: any) => {
    const verified = await requestStepUpVerification(`Finalize Rate Import Batch ${batch.batchCode}`);
    if (!verified) return;

    setModalConfig({
      isOpen: true,
      title: 'Finalize Bulk Rate Tariff Import',
      actionType: 'RATE_IMPORT_BATCH_FINALIZED',
      targetLabel: `${batch.batchCode} (${batch.filename})`,
      targetId: batch.importId,
      onConfirm: async (reason) => {
        await finalizeRateImport(batch.importId, reason);
        setModalConfig(null);
      },
    });
  };

  const handleModerateRate = async (rate: any, action: 'hide' | 'suspend' | 'restore') => {
    setModalConfig({
      isOpen: true,
      title: `Moderate Rate ${rate.id} (${action.toUpperCase()})`,
      actionType: `RATE_${action.toUpperCase()}`,
      targetLabel: `${rate.id} · ${rate.carrier}`,
      targetId: rate.id,
      isDestructive: action !== 'restore',
      onConfirm: async (reason) => {
        await moderateRate(rate.id, action, reason);
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
            <span className="gf-badge gf-badge-blue text-[11px] font-bold">OPERATIONS</span>
            <span className="gf-badge gf-badge-amber text-[11px]">
              {rateImports.filter((i) => i.status === 'Needs Review').length} Batches Flagged
            </span>
          </div>
          <h1 className="gf-page-title">Rates Inventory & Bulk Import Pipeline</h1>
          <p className="gf-page-subtitle">
            Validate high-volume carrier tariff sheets, review validation anomaly reports, and moderate published rates
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab('imports')}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${
              activeTab === 'imports' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Bulk Import Pipeline ({rateImports.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${
              activeTab === 'inventory' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Active Rate Inventory ({rates.length})
          </button>
        </div>
      </div>

      {activeTab === 'imports' ? (
        /* Bulk Imports Pipeline View */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Batches List on Left (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="gf-card p-3 font-bold text-xs text-slate-300 flex items-center justify-between">
              <span>Tariff Upload Batches</span>
              <span className="text-[11px] font-mono text-faint">ETL PIPELINE</span>
            </div>

            <div className="space-y-2">
              {rateImports.map((batch) => {
                const isSelected = selectedBatch?.importId === batch.importId;
                return (
                  <div
                    key={batch.importId}
                    onClick={() => setSelectedBatch(batch)}
                    className={`gf-card p-3.5 cursor-pointer transition-all ${
                      isSelected ? 'border-sky-500 bg-slate-850 shadow-md' : 'hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-slate-100 text-xs flex items-center gap-1.5">
                          <FileSpreadsheet className="lucide w-3.5 h-3.5 text-sky-400" />
                          {batch.batchCode}
                        </div>
                        <div className="text-[11px] text-mut font-mono mt-0.5">{batch.filename}</div>
                      </div>
                      <span
                        className={`gf-badge gf-badge-${
                          batch.status === 'Finalized' ? 'green' : batch.status === 'Needs Review' ? 'amber' : 'blue'
                        } text-[10px] uppercase font-bold`}
                      >
                        {batch.status}
                      </span>
                    </div>

                    <div className="mt-2 text-[11px] flex items-center justify-between text-slate-400 border-t border-slate-800 pt-2 font-mono">
                      <span>Uploader: {batch.uploaderName}</span>
                      <span>{batch.validRows}/{batch.totalRows} Valid Rows</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Batch Detail Inspector on Right (7 cols) */}
          <div className="lg:col-span-7">
            {selectedBatch ? (
              <div className="gf-card divide-y divide-slate-800">
                {/* Header */}
                <div className="p-4 bg-slate-900 flex items-start justify-between flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-100">{selectedBatch.batchCode}</h2>
                      <span className="gf-badge gf-badge-blue text-[10px] uppercase font-mono font-bold">
                        {selectedBatch.importId}
                      </span>
                    </div>
                    <p className="text-xs text-mut mt-0.5">
                      File: <strong className="text-slate-200">{selectedBatch.filename}</strong> · Uploader: {selectedBatch.uploaderCompany}
                    </p>
                  </div>

                  {selectedBatch.status !== 'Finalized' && (
                    <button
                      type="button"
                      onClick={() => handleFinalizeBatch(selectedBatch)}
                      className="gf-btn gf-btn-success text-xs font-bold flex items-center gap-1"
                    >
                      <CheckCircle2 className="lucide w-3.5 h-3.5" />
                      Finalize Valid Rows ({selectedBatch.validRows})
                    </button>
                  )}
                </div>

                {/* Batch Metrics */}
                <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/40 text-xs">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-mut text-[10px] uppercase font-bold block">Total Rows</span>
                    <span className="font-mono text-slate-200 font-bold text-sm">{selectedBatch.totalRows}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-mut text-[10px] uppercase font-bold block">Valid Rows</span>
                    <span className="font-mono text-emerald-400 font-bold text-sm">{selectedBatch.validRows}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-mut text-[10px] uppercase font-bold block">Invalid Flags</span>
                    <span className="font-mono text-red-400 font-bold text-sm">{selectedBatch.invalidRows}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-mut text-[10px] uppercase font-bold block">Duplicates</span>
                    <span className="font-mono text-amber-400 font-bold text-sm">{selectedBatch.duplicateRows}</span>
                  </div>
                </div>

                {/* Validation Anomaly Report */}
                <div className="p-4 space-y-2">
                  <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>Validation Anomaly & Error Report ({selectedBatch.validationReport.length})</span>
                    <span className="text-[10px] font-mono text-red-400 font-bold">AUTOMATED GATEWAY SCAN</span>
                  </div>

                  {selectedBatch.validationReport.length === 0 ? (
                    <div className="p-3 bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs rounded">
                      ✅ Clean batch: All rows conform to UN/LOCODE, positive pricing, and valid Gregorian date ranges.
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {selectedBatch.validationReport.map((err: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded bg-slate-900 border border-slate-800 text-xs flex items-start gap-2.5"
                        >
                          <span className="gf-badge gf-badge-red text-[9px] font-mono font-bold mt-0.5">
                            ROW #{err.rowNumber}
                          </span>
                          <div className="min-w-0">
                            <span className="font-mono font-bold text-red-300">{err.errorType}: </span>
                            <span className="text-slate-300">{err.message}</span>
                            <span className="text-mut text-[10px] block font-mono">Field: {err.field}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="gf-card p-12 text-center text-xs text-mut">
                Select an import batch from the left to inspect validation reports and approve row insertion.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Active Rate Inventory View */
        <div className="gf-card">
          <div className="gf-filter-bar">
            <div className="gf-search-input-wrap">
              <Search className="lucide w-4 h-4" />
              <input
                type="text"
                value={rateSearch}
                onChange={(e) => setRateSearch(e.target.value)}
                placeholder="Search active rates by RT-ID, carrier, port..."
                className="gf-search-input"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="gf-table text-xs">
              <thead>
                <tr>
                  <th>Rate ID & Type</th>
                  <th>Carrier & Provider</th>
                  <th>Route (POL → POD)</th>
                  <th>20DV (USD)</th>
                  <th>40HC (USD)</th>
                  <th>Free Time</th>
                  <th>Validity Date</th>
                  <th className="text-right">Moderation</th>
                </tr>
              </thead>
              <tbody>
                {filteredRates.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span className="font-mono font-bold text-sky-400">{r.id}</span>
                      <div className="text-[10px] text-mut">{r.id.startsWith('IRT') ? 'Self-Posted' : 'Market Rate'}</div>
                    </td>
                    <td>
                      <div className="font-bold text-slate-200">{r.carrier}</div>
                      <div className="text-[11px] text-mut">{r.sp}</div>
                    </td>
                    <td className="font-semibold text-slate-300">{r.route}</td>
                    <td className="font-mono font-bold text-emerald-400">${r.d20}</td>
                    <td className="font-mono font-bold text-emerald-400">${r.h40}</td>
                    <td className="text-slate-400">{r.ft}</td>
                    <td className="font-mono text-slate-300">{r.valid}</td>
                    <td className="text-right">
                      <button
                        type="button"
                        onClick={() => handleModerateRate(r, 'hide')}
                        className="gf-btn gf-btn-secondary text-[11px] py-1 px-2 text-red-400 hover:bg-red-950"
                      >
                        Moderate / Hide
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
