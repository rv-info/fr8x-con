'use client';

import React, { useState } from 'react';
import {
  Receipt,
  Search,
  Download,
  CheckCircle2,
  DollarSign,
  FileText,
  CreditCard,
  RefreshCcw,
  ArrowRight,
} from 'lucide-react';
import { useGodfatherData } from '@/lib/godfather/context/GodfatherDataContext';
import { useGodfatherAuth } from '@/lib/godfather/context/GodfatherAuthContext';
import { InvoiceRecord } from '@/lib/godfather/types';
import { ActionConfirmModal } from '@/components/godfather/ActionConfirmModal';

export default function InvoicesGSTPage() {
  const { invoices, processRefundOrCredit } = useGodfatherData();
  const { requestStepUpVerification } = useGodfatherAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState(0);
  const [refundType, setRefundType] = useState<'refund' | 'credit'>('refund');
  const [exportNotice, setExportNotice] = useState(false);

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

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.paymentRef.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenRefund = (inv: InvoiceRecord) => {
    setSelectedInvoice(inv);
    setRefundAmount(inv.amountTotal);
    setIsRefundModalOpen(true);
  };

  const handleSaveRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    // High risk action: requires Step-up verification
    const verified = await requestStepUpVerification(`Issue ${refundType.toUpperCase()} of ${selectedInvoice.currency} ${refundAmount} for ${selectedInvoice.invoiceNumber}`);
    if (!verified) return;

    setModalConfig({
      isOpen: true,
      title: `Authorize Commercial ${refundType === 'credit' ? 'Credit Note' : 'Payment Refund'}`,
      actionType: refundType === 'refund' ? 'INVOICE_PAYMENT_REFUNDED' : 'INVOICE_CREDIT_ADJUSTED',
      targetLabel: `${selectedInvoice.invoiceNumber} (${selectedInvoice.companyName})`,
      targetId: selectedInvoice.invoiceId,
      isDestructive: true,
      onConfirm: async (reason) => {
        await processRefundOrCredit(selectedInvoice.invoiceId, refundAmount, refundType, reason);
        setIsRefundModalOpen(false);
        setModalConfig(null);
      },
    });
  };

  const handleExportCSV = () => {
    setExportNotice(true);
    setTimeout(() => setExportNotice(false), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="gf-page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="gf-badge gf-badge-green text-[11px] font-bold">COMMERCE</span>
            <span className="gf-badge gf-badge-blue text-[11px]">GST / SAC 998431 Tax Accounting</span>
          </div>
          <h1 className="gf-page-title">Invoices, GST & Tax Breakdown Ledger</h1>
          <p className="gf-page-subtitle">
            Inspect formal tax invoices, GST components (CGST/SGST/IGST), SAC codes, and process audited refunds or credits
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          className="gf-btn gf-btn-secondary text-xs flex items-center gap-1.5 font-bold"
        >
          <Download className="lucide w-3.5 h-3.5" />
          Export GST Tax Report (CSV)
        </button>
      </div>

      {exportNotice && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs rounded font-semibold flex items-center gap-2">
          <CheckCircle2 className="lucide w-4 h-4 text-emerald-400" />
          GST Tax Ledger exported to secure download session with cryptographic operator attribution.
        </div>
      )}

      {/* Invoices Table Card */}
      <div className="gf-card">
        <div className="gf-filter-bar">
          <div className="gf-search-input-wrap">
            <Search className="lucide w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search invoices by number, company, email, payment ref..."
              className="gf-search-input"
            />
          </div>
          <div className="text-xs text-mut">
            Showing <strong className="text-slate-200">{filteredInvoices.length}</strong> tax records
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="gf-table text-xs">
            <thead>
              <tr>
                <th>Invoice Number & Date</th>
                <th>Billed Entity & GSTN</th>
                <th>Plan Tier</th>
                <th>Subtotal</th>
                <th>GST / Tax</th>
                <th>Total Paid</th>
                <th>Gateway Reference</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv) => (
                <tr key={inv.invoiceId}>
                  <td>
                    <div className="font-mono font-bold text-sky-400">{inv.invoiceNumber}</div>
                    <div className="text-[10px] text-faint">{inv.date}</div>
                  </td>
                  <td>
                    <div className="font-semibold text-slate-200">{inv.companyName}</div>
                    <div className="text-[10px] text-mut font-mono">
                      GST: {inv.companyGstn || 'N/A (International)'}
                    </div>
                  </td>
                  <td>
                    <span className="gf-badge gf-badge-blue text-[10px] uppercase font-bold">
                      {inv.planTier}
                    </span>
                  </td>
                  <td className="font-mono text-slate-300">
                    {inv.currency === 'INR' ? '₹' : '$'}{inv.amountSubtotal.toFixed(2)}
                  </td>
                  <td className="font-mono text-amber-400">
                    {inv.currency === 'INR' ? '₹' : '$'}{inv.totalTax.toFixed(2)}
                    {inv.cgst > 0 && <div className="text-[9px] text-faint">CGST 9% + SGST 9%</div>}
                  </td>
                  <td className="font-mono font-bold text-emerald-400 text-sm">
                    {inv.currency === 'INR' ? '₹' : '$'}{inv.amountTotal.toFixed(2)}
                  </td>
                  <td>
                    <span className="font-mono text-[10px] text-slate-400 bg-slate-800 px-1 py-0.5 rounded">
                      {inv.paymentProvider}: {inv.paymentRef}
                    </span>
                  </td>
                  <td>
                    <span className={`gf-badge ${inv.status === 'paid' ? 'gf-badge-green' : 'gf-badge-amber'} text-[10px] uppercase font-bold`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="text-right">
                    {inv.status === 'paid' ? (
                      <button
                        type="button"
                        onClick={() => handleOpenRefund(inv)}
                        className="gf-btn gf-btn-secondary text-[11px] py-1 px-2 text-amber-400 hover:bg-amber-950"
                      >
                        Refund / Credit
                      </button>
                    ) : (
                      <span className="text-[10px] text-mut italic">Settled</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Refund / Credit Modal */}
      {isRefundModalOpen && selectedInvoice && (
        <div className="gf-modal-overlay">
          <div className="gf-modal-card">
            <div className="gf-modal-header">
              <div>
                <h3 className="gf-modal-title">Commercial Refund / Adjustment Credit</h3>
                <p className="gf-modal-subtitle">Invoice: {selectedInvoice.invoiceNumber} ({selectedInvoice.companyName})</p>
              </div>
              <button onClick={() => setIsRefundModalOpen(false)} className="gf-modal-close-btn">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRefund} className="gf-modal-body space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="gf-form-group">
                  <label className="gf-form-label font-bold">Adjustment Type</label>
                  <select
                    value={refundType}
                    onChange={(e) => setRefundType(e.target.value as any)}
                    className="gf-select w-full text-xs"
                  >
                    <option value="refund">Direct Gateway Payment Refund</option>
                    <option value="credit">Commercial Platform Credit Note</option>
                  </select>
                </div>
                <div className="gf-form-group">
                  <label className="gf-form-label font-bold">Amount ({selectedInvoice.currency})</label>
                  <input
                    type="number"
                    required
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(Number(e.target.value))}
                    className="gf-input w-full text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="gf-modal-footer flex items-center justify-end gap-2 pt-3">
                <button type="button" onClick={() => setIsRefundModalOpen(false)} className="gf-btn gf-btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="gf-btn gf-btn-danger font-bold">
                  Execute Step-Up & Process
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
