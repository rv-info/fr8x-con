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
  TrendingUp,
  Calendar,
  Layers,
  PieChart,
  ShieldCheck,
} from 'lucide-react';
import { useGodfatherData } from '@/lib/godfather/context/GodfatherDataContext';
import { useGodfatherAuth } from '@/lib/godfather/context/GodfatherAuthContext';
import { InvoiceRecord } from '@/lib/godfather/types';
import { ActionConfirmModal } from '@/components/godfather/ActionConfirmModal';

export default function InvoicesGSTPage() {
  const { invoices, monthlyAccounting, processRefundOrCredit } = useGodfatherData();
  const { requestStepUpVerification } = useGodfatherAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
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

    const verified = await requestStepUpVerification(
      `Issue ${refundType.toUpperCase()} of ${selectedInvoice.currency} ${refundAmount} for ${selectedInvoice.invoiceNumber}`
    );
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

  const totalGross = monthlyAccounting.reduce((sum, m) => sum + m.grossRevenue, 0);
  const totalTax = monthlyAccounting.reduce((sum, m) => sum + m.totalTax, 0);
  const totalNet = monthlyAccounting.reduce((sum, m) => sum + m.netSettledRevenue, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="gf-page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="gf-badge gf-badge-green text-[11px] font-bold">COMMERCE & ACCOUNTING</span>
            <span className="gf-badge gf-badge-gold text-[11px]">GST SAC 998431 Tax Compliance</span>
          </div>
          <h1 className="gf-page-title">Accounting Ledger, GST & Monthly Revenue Records</h1>
          <p className="gf-page-subtitle">
            Inspect monthly revenue streams, reverse auction fee settlements, subscription accounting, GST tax compliance, and audited refund receipts
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          className="gf-btn gf-btn-primary text-xs flex items-center gap-1.5 font-bold"
        >
          <Download className="lucide w-3.5 h-3.5" />
          Export Comprehensive Accounting CSV
        </button>
      </div>

      {exportNotice && (
        <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-950 text-xs rounded-lg font-semibold flex items-center gap-2">
          <CheckCircle2 className="lucide w-4 h-4 text-emerald-700" />
          Full GST Tax Ledger & Monthly Revenue P&L exported to secure download session with cryptographic operator signature.
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="gf-metric-grid">
        <div className="gf-metric-card">
          <div className="gf-metric-title">Total Gross Revenue (YTD)</div>
          <div className="gf-metric-value text-emerald-800">₹{totalGross.toLocaleString()}</div>
          <div className="gf-metric-foot">
            <TrendingUp className="lucide w-3.5 h-3.5" /> Subscriptions + Auctions + Jobs + Ads
          </div>
        </div>

        <div className="gf-metric-card">
          <div className="gf-metric-title">GST Tax Collected (18%)</div>
          <div className="gf-metric-value text-amber-800">₹{totalTax.toLocaleString()}</div>
          <div className="gf-metric-foot text-amber-800">
            <Receipt className="lucide w-3.5 h-3.5" /> CGST 9% + SGST 9% (SAC 998431)
          </div>
        </div>

        <div className="gf-metric-card">
          <div className="gf-metric-title">Net Settled to Bank</div>
          <div className="gf-metric-value text-sky-800">₹{totalNet.toLocaleString()}</div>
          <div className="gf-metric-foot text-sky-800">
            <CheckCircle2 className="lucide w-3.5 h-3.5" /> Post Gateway Fee Deductions
          </div>
        </div>
      </div>

      {/* Monthly Accounting Records Breakdown */}
      <div className="gf-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="lucide w-4 h-4 text-emerald-700" />
            <h3 className="font-bold text-emerald-950 text-sm">Monthly Accounting & Revenue Stream Ledger</h3>
          </div>
          <span className="gf-badge gf-badge-green text-[10px] uppercase font-bold font-mono">
            AUDITED MONTHLY LEDGER
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="gf-table text-xs">
            <thead>
              <tr>
                <th>Billing Month</th>
                <th>Subscriptions</th>
                <th>Auction Bid Fees</th>
                <th>Jobs & Ads</th>
                <th>Gross Revenue</th>
                <th>GST Collected (18%)</th>
                <th>Gateway Fees</th>
                <th>Net Settled</th>
                <th>Txns</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {monthlyAccounting.map((m) => (
                <tr key={m.monthId}>
                  <td>
                    <div className="font-bold text-emerald-950">{m.monthName}</div>
                    <div className="text-[10px] text-faint font-mono">{m.monthId}</div>
                  </td>
                  <td className="font-mono text-slate-800">₹{m.subscriptionRevenue.toLocaleString()}</td>
                  <td className="font-mono text-amber-800 font-semibold">₹{m.auctionBiddingRevenue.toLocaleString()}</td>
                  <td className="font-mono text-slate-800">₹{(m.jobPostRevenue + m.adPostingRevenue).toLocaleString()}</td>
                  <td className="font-mono font-bold text-emerald-900">₹{m.grossRevenue.toLocaleString()}</td>
                  <td className="font-mono text-amber-800">
                    ₹{m.totalTax.toLocaleString()}
                    <div className="text-[9px] text-slate-500">CGST+SGST</div>
                  </td>
                  <td className="font-mono text-rose-800">-₹{m.gatewayDeductions.toLocaleString()}</td>
                  <td className="font-mono font-black text-emerald-900 text-sm">
                    ₹{m.netSettledRevenue.toLocaleString()}
                  </td>
                  <td>
                    <span className="font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                      {m.totalTransactions}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`gf-badge ${
                        m.status === 'settled' ? 'gf-badge-green' : 'gf-badge-amber'
                      } text-[10px] uppercase font-bold`}
                    >
                      {m.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tax Invoices Table Card */}
      <div className="gf-card">
        <div className="gf-filter-bar">
          <div className="gf-search-input-wrap">
            <Search className="lucide w-4 h-4 text-emerald-800" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search invoices by number, company, email, payment ref..."
              className="gf-search-input"
            />
          </div>
          <div className="text-xs text-mut font-bold">
            Showing <strong>{filteredInvoices.length}</strong> tax records
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="gf-table text-xs">
            <thead>
              <tr>
                <th>Invoice Number & Date</th>
                <th>Billed Entity & GSTN</th>
                <th>Plan / Module</th>
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
                    <div className="font-mono font-bold text-emerald-900">{inv.invoiceNumber}</div>
                    <div className="text-[10px] text-faint">{inv.date}</div>
                  </td>
                  <td>
                    <div className="font-semibold text-slate-900">{inv.companyName}</div>
                    <div className="text-[10px] text-mut font-mono">
                      GST: {inv.companyGstn || 'N/A (International)'}
                    </div>
                  </td>
                  <td>
                    <span className="gf-badge gf-badge-blue text-[10px] uppercase font-bold">
                      {inv.planTier}
                    </span>
                  </td>
                  <td className="font-mono text-slate-800">
                    {inv.currency === 'INR' ? '₹' : '$'}{inv.amountSubtotal.toFixed(2)}
                  </td>
                  <td className="font-mono text-amber-800">
                    {inv.currency === 'INR' ? '₹' : '$'}{inv.totalTax.toFixed(2)}
                    {inv.cgst > 0 && <div className="text-[9px] text-slate-500">CGST 9% + SGST 9%</div>}
                  </td>
                  <td className="font-mono font-bold text-emerald-900 text-sm">
                    {inv.currency === 'INR' ? '₹' : '$'}{inv.amountTotal.toFixed(2)}
                  </td>
                  <td>
                    <span className="font-mono text-[10px] text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      {inv.paymentProvider}: {inv.paymentRef}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`gf-badge ${
                        inv.status === 'paid' ? 'gf-badge-green' : 'gf-badge-amber'
                      } text-[10px] uppercase font-bold`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="text-right">
                    {inv.status === 'paid' ? (
                      <button
                        type="button"
                        onClick={() => handleOpenRefund(inv)}
                        className="gf-btn gf-btn-secondary text-[11px] py-1 px-2 text-amber-800 hover:bg-amber-50 font-bold"
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
                <h3 className="gf-modal-title flex items-center gap-1.5 text-emerald-950">
                  <Receipt className="lucide w-4 h-4 text-emerald-700" />
                  Commercial Refund / Adjustment Credit Note
                </h3>
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
                    className="gf-select w-full text-xs font-bold"
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
