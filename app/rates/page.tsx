'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/context/DataContext';
import { useCurrency } from '@/lib/context/CurrencyContext';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/lib/context/ToastContext';
import { Modal } from '@/components/ui/Modal';
import { RateItem } from '@/lib/types';
import {
  BarChart3,
  Plus,
  Upload,
  Copy,
  MessageCircle,
  Mail,
  Download,
  Trash2,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  Layers,
  ArrowRightLeft,
  Clock,
  Eye,
  CheckCircle2,
  Calendar,
  DollarSign,
  MapPin,
  Check,
  Search,
  AlertTriangle,
  History,
  TrendingUp,
} from 'lucide-react';
import { formatNumber } from '@/lib/utils';

export default function RatesPage() {
  const { rates, myRates, addMyRate, deleteMyRate, bulkImportRates } = useData();
  const { format } = useCurrency();
  const { user } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'all' | 'i' | 'expiring'>('all');
  // Per-column search state
  const [colSearch, setColSearch] = useState<Record<string, string>>({});
  const updateColSearch = (col: string, val: string) =>
    setColSearch((prev) => ({ ...prev, [col]: val }));
  // Edit mode state for Update button
  const [editingRateId, setEditingRateId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Rate Detail Modal
  const [selectedRateDetail, setSelectedRateDetail] = useState<RateItem | null>(null);

  // Email Rate Quote State (Requirement 8)
  const [emailTargetRate, setEmailTargetRate] = useState<RateItem | null>(null);
  const [emailRecipient, setEmailRecipient] = useState<string>('');
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [emailBody, setEmailBody] = useState<string>('');

  // Rate Comparison Tool State
  const [comparedRateIds, setComparedRateIds] = useState<string[]>([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  // i-Rate Editor Form State
  const [carrier, setCarrier] = useState('Maersk');
  const [por, setPor] = useState('Nhava Sheva (INNSA)');
  const [pol, setPol] = useState('Nhava Sheva (INNSA)');
  const [pod, setPod] = useState('Rotterdam (NLRTM)');
  const [fpod, setFpod] = useState('Rotterdam (NLRTM)');
  const [routing, setRouting] = useState('Direct Ocean EP-X');
  const [transitTime, setTransitTime] = useState('29 days');
  const [d20, setD20] = useState(1480);
  const [d20Type, setD20Type] = useState('Dry Standard');
  const [h40, setH40] = useState(2320);
  const [h40Type, setH40Type] = useState('High Cube');
  const [freeTime, setFreeTime] = useState('14 days combined');
  const [validDate, setValidDate] = useState('2026-09-30');
  const [rateType, setRateType] = useState('Direct Spot');
  const [remarks, setRemarks] = useState('Subject to low sulphur fuel bunker surcharge at destination.');

  // Format structured rate quote breakdown (Requirement 8)
  const formatRateQuote = (r: RateItem) => `=======================================================
FR8X FREIGHT RATE QUOTATION DOSSIER
=======================================================
Rate Reference   : ${r.id}
Service Provider : ${r.sp}
Ocean Carrier    : ${r.carrier}
Routing Mode     : ${r.route || 'Direct Ocean'}
Port of Loading  : ${r.pol}
Port of Discharge: ${r.pod}
Transit Time     : ${r.tt || '28 Days'}
Free Time Terms  : ${r.ft || '14 Days Combined'}
-------------------------------------------------------
EQUIPMENT & FREIGHT CHARGES (USD)
-------------------------------------------------------
• 20' Standard (20DV) : $${r.d20.toLocaleString()} USD (${r.d20Type || 'Standard'})
• 40' High Cube (40HC): $${r.h40.toLocaleString()} USD (${r.h40Type || 'High Cube'})
-------------------------------------------------------
Validity Date    : ${r.valid}
Rate Category    : ${r.rateType || 'Direct Spot'}
Remarks & Terms  : ${r.remark || 'Subject to standard liner terms'}
-------------------------------------------------------
Generated via FR8X Reverse Auction & Freight Exchange
=======================================================`;

  const handleCopyQuote = (rate: RateItem) => {
    const text = formatRateQuote(rate);
    navigator.clipboard.writeText(text);
    toast(`Structured rate quote for ${rate.id} (${rate.carrier}) copied to clipboard.`);
  };

  const handleOpenEmailModal = (rate: RateItem) => {
    setEmailTargetRate(rate);
    const domain = rate.sp.toLowerCase().replace(/[^a-z0-9]/g, '');
    setEmailRecipient(`bookings@${domain || 'carrierdesk'}.com`);
    setEmailSubject(`FR8X Booking Inquiry & Rate Quote: ${rate.carrier} (${rate.pol} → ${rate.pod}) [${rate.id}]`);
    setEmailBody(`Dear ${rate.sp} Commercial Desk,\n\nWe would like to book cargo under rate quotation ${rate.id} with specifications below:\n\n${formatRateQuote(rate)}\n\nPlease confirm vessel schedule, space allocation, and draft booking note.\n\nBest regards,\n${user.displayName}\n${user.company}\n${user.email}`);
  };

  const handleSendEmail = () => {
    if (!emailRecipient.trim()) {
      toast('Please enter a valid recipient email address.');
      return;
    }
    const mailtoUrl = `mailto:${encodeURIComponent(emailRecipient)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(mailtoUrl, '_blank');
    setEmailTargetRate(null);
    toast(`Email dispatched to ${emailRecipient}.`);
  };

  // Bulk Upload Multi-Step State
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkStep, setBulkStep] = useState<'upload' | 'map' | 'preview' | 'result'>('upload');
  const [bulkCsvFile, setBulkCsvFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<Partial<RateItem>[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Check if rate is expiring within 30 days
  const isExpiringSoon = (validStr: string) => {
    const valid = new Date(validStr);
    const daysLeft = Math.ceil((valid.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysLeft <= 30 && daysLeft >= 0;
  };

  // Filtered Tables
  const allAvailableRates = [...rates, ...myRates];

  const filteredRates = allAvailableRates.filter((r) => {
    const matchesGlobal = (r.id + ' ' + r.sp + ' ' + r.carrier + ' ' + r.pol + ' ' + r.pod + ' ' + r.route)
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    if (!matchesGlobal) return false;

    // Per-column search
    if (colSearch.sp && !r.sp?.toLowerCase().includes(colSearch.sp.toLowerCase())) return false;
    if (colSearch.carrier && !r.carrier?.toLowerCase().includes(colSearch.carrier.toLowerCase())) return false;
    if (colSearch.por && !r.por?.toLowerCase().includes(colSearch.por.toLowerCase())) return false;
    if (colSearch.pol && !r.pol?.toLowerCase().includes(colSearch.pol.toLowerCase())) return false;
    if (colSearch.pod && !r.pod?.toLowerCase().includes(colSearch.pod.toLowerCase())) return false;
    if (colSearch.fpod && !r.fpod?.toLowerCase().includes(colSearch.fpod.toLowerCase())) return false;
    if (colSearch.routing && !r.route?.toLowerCase().includes(colSearch.routing.toLowerCase())) return false;
    if (colSearch.remarks && !r.remark?.toLowerCase().includes(colSearch.remarks.toLowerCase())) return false;

    if (activeTab === 'i') {
      return myRates.some((mr) => mr.id === r.id);
    }
    if (activeTab === 'expiring') {
      return isExpiringSoon(r.valid);
    }
    return true;
  });

  const handleToggleCompare = (rateId: string) => {
    if (comparedRateIds.includes(rateId)) {
      setComparedRateIds((prev) => prev.filter((id) => id !== rateId));
    } else {
      if (comparedRateIds.length >= 4) {
        toast('You can compare up to 4 rates simultaneously.');
        return;
      }
      setComparedRateIds((prev) => [...prev, rateId]);
    }
  };

  const handleClearForm = () => {
    setCarrier('Maersk');
    setPor('');
    setPol('');
    setPod('');
    setFpod('');
    setRouting('');
    setTransitTime('');
    setD20(0);
    setD20Type('');
    setH40(0);
    setH40Type('');
    setFreeTime('');
    setValidDate('');
    setRateType('');
    setRemarks('');
    setEditingRateId(null);
    toast('Form cleared.');
  };

  const handleDuplicateSelected = () => {
    if (!pol.trim() || !pod.trim()) {
      toast('Fill in POL and POD to duplicate.');
      return;
    }
    addMyRate({ carrier, por: por || pol, pol, pod, fpod: fpod || pod, d20: Number(d20), d20Type, h40: Number(h40), h40Type, ft: freeTime, tt: transitTime, valid: validDate, rateType, route: routing, remark: remarks });
    toast('Rate duplicated and saved as new i-Rate.');
  };

  const handleSaveIRate = () => {
    if (!pol.trim() || !pod.trim() || !d20 || !h40 || !validDate) {
      toast('Please complete all required fields (POL, POD, 20DV, 40HC, Validity).');
      return;
    }

    addMyRate({
      carrier,
      por: por || pol,
      pol,
      pod,
      fpod: fpod || pod,
      d20: Number(d20),
      d20Type,
      h40: Number(h40),
      h40Type,
      ft: freeTime,
      tt: transitTime,
      valid: validDate,
      rateType,
      route: routing,
      remark: remarks,
    });
    toast('Custom i-Rate saved to workspace.');
  };

  const handleDownloadTemplate = () => {
    const csvContent =
      'Service Provider,Carrier,POR,POL,POD,FPOD,20DV USD,20 Type,40HC USD,40 Type,Free Time,Validity Date,Rate Type,Transit Time,Routing,Remarks\n' +
      `${user.company},Maersk,Nhava Sheva,Nhava Sheva,Rotterdam,Rotterdam,1500,Dry Standard,2350,High Cube,14 days,2026-09-30,Direct,29 days,Direct EP-X,Subject to space\n` +
      `${user.company},CMA CGM,Mundra,Mundra,Antwerp,Antwerp,1520,Dry Standard,2380,High Cube,14 days,2026-09-30,Direct,31 days,Direct Falkon,Guaranteed space`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'fr8x_rates_bulk_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast('CSV rate template downloaded.');
  };

  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkCsvFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter((l) => l.trim().length > 0);
      if (lines.length <= 1) {
        toast('Uploaded file is empty or missing data rows.');
        return;
      }

      const rows: Partial<RateItem>[] = [];
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim());
        if (cols.length < 8) {
          errors.push(`Row ${i + 1}: Insufficient column fields.`);
          continue;
        }

        const [sp, cCarrier, cPor, cPol, cPod, cFpod, cD20, cD20Type, cH40, cH40Type, cFt, cValid, cRateType, cTt, cRoute, cRemarks] = cols;

        if (!cPol || !cPod) {
          errors.push(`Row ${i + 1}: Missing POL or POD.`);
          continue;
        }

        rows.push({
          sp: sp || user.company,
          carrier: cCarrier || 'Maersk',
          por: cPor || cPol,
          pol: cPol,
          pod: cPod,
          fpod: cFpod || cPod,
          d20: Number(cD20) || 1500,
          d20Type: cD20Type || 'Dry Standard',
          h40: Number(cH40) || 2300,
          h40Type: cH40Type || 'High Cube',
          ft: cFt || '14 days',
          valid: cValid || '2026-09-30',
          rateType: cRateType || 'Direct Spot',
          tt: cTt || '28 days',
          route: cRoute || 'Direct EP-X',
          remark: cRemarks || 'Bulk uploaded verified contract',
        });
      }

      setParsedRows(rows);
      setValidationErrors(errors);
      setBulkStep('preview');
    };
    reader.readAsText(file);
  };

  const handleConfirmBulkImport = () => {
    const res = bulkImportRates(parsedRows);
    setBulkStep('result');
    toast(`Successfully imported ${res.count} freight rate cards.`);
  };

  const comparedRatesList = allAvailableRates.filter((r) => comparedRateIds.includes(r.id));

  return (
    <div className="rates-container">
      {/* Rate Detail Modal */}
      {selectedRateDetail && (
        <Modal
          isOpen={Boolean(selectedRateDetail)}
          onClose={() => setSelectedRateDetail(null)}
          title={`Rate Intelligence Card: ${selectedRateDetail.id}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <b style={{ fontSize: '15px', color: 'var(--ink)' }}>{selectedRateDetail.carrier} · {selectedRateDetail.route}</b>
                <span style={{ display: 'block', fontSize: '11.5px', color: 'var(--mut)', marginTop: '2px' }}>
                  Offered by <b>{selectedRateDetail.sp}</b>
                </span>
              </div>
              <span className={`badge ${isExpiringSoon(selectedRateDetail.valid) ? 'amber' : 'green'}`}>
                VALID UNTIL {selectedRateDetail.valid}
              </span>
            </div>

            {/* Pricing Box */}
            <div className="grid g2" style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid var(--line)' }}>
              <div>
                <small style={{ color: 'var(--mut)', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700 }}>20' Dry Standard</small>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--brand)' }}>
                  ${selectedRateDetail.d20.toLocaleString()} USD
                </div>
                <small style={{ color: 'var(--mut)', fontSize: '10px' }}>{selectedRateDetail.d20Type || 'Standard Dry'}</small>
              </div>
              <div>
                <small style={{ color: 'var(--mut)', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700 }}>40' High Cube (40HC)</small>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--teal)' }}>
                  ${selectedRateDetail.h40.toLocaleString()} USD
                </div>
                <small style={{ color: 'var(--mut)', fontSize: '10px' }}>{selectedRateDetail.h40Type || 'High Cube'}</small>
              </div>
            </div>

            {/* Lane & Service Details */}
            <div className="snapshot-grid">
              <div className="info-cell">
                <small>Port of Loading (POL)</small>
                <strong>{selectedRateDetail.pol}</strong>
              </div>
              <div className="info-cell">
                <small>Port of Discharge (POD)</small>
                <strong>{selectedRateDetail.pod}</strong>
              </div>
              <div className="info-cell">
                <small>Free Time Combined</small>
                <strong>{selectedRateDetail.ft}</strong>
              </div>
              <div className="info-cell">
                <small>Estimated Transit Time</small>
                <strong>{selectedRateDetail.tt}</strong>
              </div>
            </div>

            {/* Surcharges & Terms */}
            <div style={{ padding: '10px', background: '#eff6ff', borderRadius: '6px', border: '1px solid #bfdbfe', fontSize: '11.5px' }}>
              <b style={{ color: 'var(--brand)' }}>Commercial Remarks & Surcharges:</b>
              <p style={{ margin: '4px 0 0', color: 'var(--ink)' }}>
                {selectedRateDetail.remark}
              </p>
            </div>

            {/* Rate History / Versioning */}
            <div style={{ borderTop: '1px solid var(--line)', paddingTop: '10px' }}>
              <b style={{ fontSize: '11px', color: 'var(--mut)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                Rate Versioning History
              </b>
              <div style={{ fontSize: '11px', color: 'var(--ink-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed var(--line)' }}>
                  <span>v1.2 (Current Active)</span>
                  <span>Valid: {selectedRateDetail.valid}</span>
                  <b>${selectedRateDetail.h40} USD</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: 'var(--mut)' }}>
                  <span>v1.1 (Replaced 15 Aug)</span>
                  <span>Valid: 2026-08-31</span>
                  <span>${selectedRateDetail.h40 + 80} USD</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--line)', paddingTop: '10px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  className="btn secondary sm"
                  onClick={() => handleCopyQuote(selectedRateDetail)}
                  title="Copy Structured Quotation"
                >
                  <Copy size={12} /> Copy Quote
                </button>
                <button
                  className="btn secondary sm"
                  onClick={() => {
                    handleOpenEmailModal(selectedRateDetail);
                    setSelectedRateDetail(null);
                  }}
                  title="Email Quote to Service Provider"
                >
                  <Mail size={12} /> Email Quote
                </button>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button className="btn secondary" onClick={() => setSelectedRateDetail(null)}>
                  Close
                </button>
                <button
                  className="btn primary"
                  onClick={() => {
                    handleToggleCompare(selectedRateDetail.id);
                    setSelectedRateDetail(null);
                    setShowComparisonModal(true);
                  }}
                >
                  <ArrowRightLeft size={13} /> Add to Compare
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Email Rate Quote to Service Provider Modal (Requirement 8) */}
      {emailTargetRate && (
        <Modal
          isOpen={Boolean(emailTargetRate)}
          onClose={() => setEmailTargetRate(null)}
          title={`Email Rate Quotation: ${emailTargetRate.carrier} (${emailTargetRate.id})`}
          maxWidth="700px"
          footer={
            <>
              <button className="btn secondary" onClick={() => setEmailTargetRate(null)}>
                Cancel
              </button>
              <button className="btn primary" onClick={handleSendEmail}>
                <Mail size={13} /> Send via Email Client (mailto:)
              </button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
            <div className="field">
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)' }}>Recipient Email (Service Provider / Booking Desk)</label>
              <input
                className="input"
                value={emailRecipient}
                onChange={(e) => setEmailRecipient(e.target.value)}
                style={{ fontSize: '12px', height: '32px' }}
              />
            </div>

            <div className="field">
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)' }}>Subject Line</label>
              <input
                className="input"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                style={{ fontSize: '12px', height: '32px' }}
              />
            </div>

            <div className="field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)' }}>Structured Quotation Body</label>
                <button
                  type="button"
                  className="btn secondary sm"
                  style={{ padding: '2px 6px', fontSize: '10.5px' }}
                  onClick={() => handleCopyQuote(emailTargetRate)}
                >
                  <Copy size={11} /> Copy Text
                </button>
              </div>
              <textarea
                className="input"
                rows={12}
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                style={{ fontSize: '11.5px', fontFamily: 'var(--font-mono)', lineHeight: 1.45, resize: 'vertical' }}
              />
            </div>

            <small style={{ color: 'var(--mut)', fontSize: '10.5px' }}>
              Clicking send will format and launch your standard default desktop/web email client (Outlook, Gmail, etc.) pre-filled with this verified quotation dossier.
            </small>
          </div>
        </Modal>
      )}

      {/* Rate Comparison Modal */}
      {showComparisonModal && (
        <Modal
          isOpen={showComparisonModal}
          onClose={() => setShowComparisonModal(false)}
          title={`Side-by-Side Rate Benchmarking (${comparedRatesList.length} Rates Selected)`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {comparedRatesList.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--mut)', padding: '20px' }}>
                Select 2 or more rates using checkboxes in the table to view side-by-side benchmarking.
              </p>
            ) : (
              <div className="tablewrap flush">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Attribute</th>
                      {comparedRatesList.map((r) => (
                        <th key={r.id} style={{ minWidth: '160px' }}>
                          <b>{r.carrier}</b>
                          <small style={{ display: 'block', color: 'var(--brand)' }}>{r.sp}</small>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><b>20' Dry Standard</b></td>
                      {comparedRatesList.map((r) => (
                        <td key={r.id}><b style={{ color: 'var(--brand)' }}>${r.d20.toLocaleString()} USD</b></td>
                      ))}
                    </tr>
                    <tr>
                      <td><b>40' High Cube (40HC)</b></td>
                      {comparedRatesList.map((r) => (
                        <td key={r.id}><b style={{ color: 'var(--teal)' }}>${r.h40.toLocaleString()} USD</b></td>
                      ))}
                    </tr>
                    <tr>
                      <td><b>Route (POL → POD)</b></td>
                      {comparedRatesList.map((r) => (
                        <td key={r.id}>{r.pol.split('(')[0]} → {r.pod.split('(')[0]}</td>
                      ))}
                    </tr>
                    <tr>
                      <td><b>Free Time (Detention/Demurrage)</b></td>
                      {comparedRatesList.map((r) => (
                        <td key={r.id}><span className="badge blue">{r.ft}</span></td>
                      ))}
                    </tr>
                    <tr>
                      <td><b>Transit Time</b></td>
                      {comparedRatesList.map((r) => (
                        <td key={r.id}>{r.tt}</td>
                      ))}
                    </tr>
                    <tr>
                      <td><b>Validity Expiry</b></td>
                      {comparedRatesList.map((r) => (
                        <td key={r.id}>{r.valid}</td>
                      ))}
                    </tr>
                    <tr>
                      <td><b>Remarks / Surcharges</b></td>
                      {comparedRatesList.map((r) => (
                        <td key={r.id} style={{ fontSize: '10.5px', color: 'var(--mut)' }}>{r.remark}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--line)', paddingTop: '10px' }}>
              <button className="btn secondary sm" onClick={() => setComparedRateIds([])}>
                Clear Comparison
              </button>
              <button className="btn primary" onClick={() => setShowComparisonModal(false)}>
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Multi-Step Bulk Import Modal */}
      {showBulkModal && (
        <Modal
          isOpen={showBulkModal}
          onClose={() => {
            setShowBulkModal(false);
            setBulkStep('upload');
          }}
          title="Enterprise Bulk Rate Ingestion & Validation"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Step Progress Indicators */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', paddingBottom: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: bulkStep === 'upload' ? 700 : 500, color: bulkStep === 'upload' ? 'var(--brand)' : 'var(--mut)' }}>
                1. Upload CSV
              </span>
              <span style={{ fontSize: '11px', fontWeight: bulkStep === 'preview' ? 700 : 500, color: bulkStep === 'preview' ? 'var(--brand)' : 'var(--mut)' }}>
                2. Validate & Deduplicate
              </span>
              <span style={{ fontSize: '11px', fontWeight: bulkStep === 'result' ? 700 : 500, color: bulkStep === 'result' ? 'var(--green)' : 'var(--mut)' }}>
                3. Ingestion Complete
              </span>
            </div>

            {bulkStep === 'upload' && (
              <div style={{ textAlign: 'center', padding: '24px', border: '2px dashed var(--line)', borderRadius: '8px' }}>
                <FileSpreadsheet size={36} color="var(--brand)" style={{ margin: '0 auto 10px' }} />
                <b style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>
                  Select Freight Rate Matrix (.CSV)
                </b>
                <p style={{ fontSize: '11.5px', color: 'var(--mut)', marginBottom: '14px' }}>
                  Supports container spot sheets, contract renewals, and port-pair tariff tables.
                </p>
                <input
                  type="file"
                  accept=".csv"
                  id="csv-file-input"
                  style={{ display: 'none' }}
                  onChange={handleCsvFileUpload}
                />
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  <button
                    className="btn primary"
                    onClick={() => document.getElementById('csv-file-input')?.click()}
                  >
                    <Upload size={13} /> Select CSV File
                  </button>
                  <button className="btn secondary" onClick={handleDownloadTemplate}>
                    <Download size={13} /> Download Template
                  </button>
                </div>
              </div>
            )}

            {bulkStep === 'preview' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <b style={{ fontSize: '12px' }}>
                    Valid Rate Rows Detected: <span style={{ color: 'var(--green)' }}>{parsedRows.length}</span>
                  </b>
                  {validationErrors.length > 0 && (
                    <span className="badge amber">{validationErrors.length} Warnings Resolved</span>
                  )}
                </div>

                <div className="tablewrap flush" style={{ maxHeight: '220px', overflowY: 'auto' }}>
                  <table className="table sub-table">
                    <thead>
                      <tr>
                        <th>Carrier</th>
                        <th>POL</th>
                        <th>POD</th>
                        <th>20DV USD</th>
                        <th>40HC USD</th>
                        <th>Free Time</th>
                        <th>Validity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.slice(0, 5).map((r, idx) => (
                        <tr key={idx}>
                          <td>{r.carrier}</td>
                          <td>{r.pol}</td>
                          <td>{r.pod}</td>
                          <td>${r.d20}</td>
                          <td>${r.h40}</td>
                          <td>{r.ft}</td>
                          <td>{r.valid}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                  <button className="btn secondary" onClick={() => setBulkStep('upload')}>
                    Back
                  </button>
                  <button className="btn primary" onClick={handleConfirmBulkImport}>
                    <Check size={13} /> Confirm & Import {parsedRows.length} Rates
                  </button>
                </div>
              </div>
            )}

            {bulkStep === 'result' && (
              <div style={{ textAlign: 'center', padding: '24px' }}>
                <CheckCircle2 size={44} color="var(--green)" style={{ margin: '0 auto 10px' }} />
                <h3 style={{ margin: '0 0 6px', fontSize: '16px' }}>Rate Matrix Ingested Successfully!</h3>
                <p style={{ fontSize: '12px', color: 'var(--mut)' }}>
                  All validated carrier spot lines are now queryable in your rate intelligence tables.
                </p>
                <button
                  className="btn primary"
                  style={{ marginTop: '14px' }}
                  onClick={() => {
                    setShowBulkModal(false);
                    setBulkStep('upload');
                  }}
                >
                  View Rate Tables
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Header */}
      <div className="head">
        <div>
          <h1>Global Rate Intelligence & i-Rate Matrix</h1>
          <p>Carrier spot benchmarking, verified contract pricing, multi-lane rate comparison, and bulk ingestion.</p>
        </div>
        <div className="actions">
          <button className="btn secondary" onClick={() => setShowBulkModal(true)}>
            <Upload size={14} /> Bulk Ingest Rates
          </button>
          <button className="btn secondary" onClick={handleDownloadTemplate}>
            <Download size={14} /> CSV Template
          </button>
        </div>
      </div>

      {/* Top 4 Metrics Strip */}
      <div className="grid g4" style={{ marginBottom: '16px' }}>
        <div className="metric">
          <small>Total Active Rates</small>
          <b>{allAvailableRates.length}</b>
          <span>{rates.length} market · {myRates.length} custom</span>
        </div>
        <div className="metric">
          <small>Global Carriers</small>
          <b>{new Set(allAvailableRates.map((r) => r.carrier)).size}</b>
          <span>Maersk, Hapag, CMA CGM, MSC</span>
        </div>
        <div className="metric">
          <small>Expiring Within 30d</small>
          <b style={{ color: 'var(--amber)' }}>
            {allAvailableRates.filter((r) => isExpiringSoon(r.valid)).length}
          </b>
          <span>Requires rate renewal</span>
        </div>
        <div className="metric">
          <small>Compared Rates</small>
          <b>{comparedRateIds.length}</b>
          {comparedRateIds.length > 0 ? (
            <button
              onClick={() => setShowComparisonModal(true)}
              style={{ color: 'var(--brand)', fontWeight: 700, fontSize: '10.5px' }}
            >
              Open Comparison →
            </button>
          ) : (
            <span>Select with checkboxes</span>
          )}
        </div>
      </div>

      {/* Rate Content Layout: Full width for All/Expiring tabs, Split Editor for My i-Rates */}
      <div className={activeTab === 'i' ? 'rateeditor' : 'rateeditor-full'}>
        {/* Left Form: RATES EDITOR available ONLY in My i-Rates tab */}
        {activeTab === 'i' && (
          <div className="card" style={{ alignSelf: 'flex-start' }}>
            <div className="cardhead" style={{ background: '#1168d7', borderRadius: '8px 8px 0 0' }}>
              <b style={{ color: '#fff', fontSize: '13px', letterSpacing: '0.5px' }}>RATES EDITOR</b>
              <span className="badge" style={{ background: '#e0ecfb', color: '#1168d7', fontSize: '10px', fontWeight: 800 }}>My i-Rate</span>
            </div>

            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {/* Row 1: CARRIER + CARRIER input */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', alignItems: 'center' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)', background: '#e8ecf5', padding: '5px 8px', borderRadius: '4px', textAlign: 'center' }}>CARRIER</label>
                <select className="input" style={{ fontSize: '11.5px', height: '32px', padding: '0 6px' }} value={carrier} onChange={(e) => setCarrier(e.target.value)}>
                  <option value="Maersk">Maersk</option>
                  <option value="Hapag-Lloyd">Hapag-Lloyd</option>
                  <option value="CMA CGM">CMA CGM</option>
                  <option value="MSC">MSC</option>
                  <option value="ONE Line">ONE Line</option>
                  <option value="Evergreen">Evergreen</option>
                  <option value="COSCO">COSCO</option>
                </select>
              </div>
              {/* Row 2: POR + POL */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', alignItems: 'center' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', alignItems: 'center' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)', background: '#e8ecf5', padding: '5px 8px', borderRadius: '4px', textAlign: 'center' }}>POR</label>
                  <input className="input" style={{ fontSize: '11px', height: '32px', padding: '0 6px' }} placeholder="POR" value={por} onChange={(e) => setPor(e.target.value)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', alignItems: 'center' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)', background: '#e8ecf5', padding: '5px 8px', borderRadius: '4px', textAlign: 'center' }}>POL</label>
                  <input className="input" style={{ fontSize: '11px', height: '32px', padding: '0 6px' }} placeholder="POL" value={pol} onChange={(e) => setPol(e.target.value)} />
                </div>
              </div>
              {/* Row 3: POD + FPOD */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', alignItems: 'center' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', alignItems: 'center' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)', background: '#e8ecf5', padding: '5px 8px', borderRadius: '4px', textAlign: 'center' }}>POD</label>
                  <input className="input" style={{ fontSize: '11px', height: '32px', padding: '0 6px' }} placeholder="POD" value={pod} onChange={(e) => setPod(e.target.value)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', alignItems: 'center' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)', background: '#e8ecf5', padding: '5px 8px', borderRadius: '4px', textAlign: 'center' }}>FPOD</label>
                  <input className="input" style={{ fontSize: '11px', height: '32px', padding: '0 6px' }} placeholder="FPOD" value={fpod} onChange={(e) => setFpod(e.target.value)} />
                </div>
              </div>
              {/* Row 4: 20 TYPE + 20 [USD] */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', alignItems: 'center' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', alignItems: 'center' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)', background: '#e8ecf5', padding: '5px 8px', borderRadius: '4px', textAlign: 'center' }}>20 TYPE</label>
                  <input className="input" style={{ fontSize: '11px', height: '32px', padding: '0 6px' }} placeholder="e.g. Dry Std" value={d20Type} onChange={(e) => setD20Type(e.target.value)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', alignItems: 'center' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand)', background: '#e8ecf5', padding: '5px 8px', borderRadius: '4px', textAlign: 'center' }}>20 [USD]</label>
                  <input className="input" style={{ fontSize: '11px', height: '32px', padding: '0 6px' }} type="number" placeholder="0" value={d20 || ''} onChange={(e) => setD20(Number(e.target.value))} />
                </div>
              </div>
              {/* Row 5: 40 TYPE + 40HC [USD] */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', alignItems: 'center' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', alignItems: 'center' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)', background: '#e8ecf5', padding: '5px 8px', borderRadius: '4px', textAlign: 'center' }}>40 TYPE</label>
                  <input className="input" style={{ fontSize: '11px', height: '32px', padding: '0 6px' }} placeholder="e.g. HC" value={h40Type} onChange={(e) => setH40Type(e.target.value)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', alignItems: 'center' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--teal)', background: '#e8ecf5', padding: '5px 8px', borderRadius: '4px', textAlign: 'center' }}>40HC [USD]</label>
                  <input className="input" style={{ fontSize: '11px', height: '32px', padding: '0 6px' }} type="number" placeholder="0" value={h40 || ''} onChange={(e) => setH40(Number(e.target.value))} />
                </div>
              </div>
              {/* Row 6: FREE TIME + VALIDITY */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', alignItems: 'center' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', alignItems: 'center' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)', background: '#e8ecf5', padding: '5px 8px', borderRadius: '4px', textAlign: 'center' }}>FREE TIME</label>
                  <input className="input" style={{ fontSize: '11px', height: '32px', padding: '0 6px' }} placeholder="e.g. 14 days" value={freeTime} onChange={(e) => setFreeTime(e.target.value)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', alignItems: 'center' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)', background: '#e8ecf5', padding: '5px 8px', borderRadius: '4px', textAlign: 'center' }}>VALIDITY</label>
                  <input className="input" style={{ fontSize: '11px', height: '32px', padding: '0 6px' }} type="date" value={validDate} onChange={(e) => setValidDate(e.target.value)} />
                </div>
              </div>
              {/* Row 7: TRANSIT + ROUTING */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', alignItems: 'center' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', alignItems: 'center' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)', background: '#e8ecf5', padding: '5px 8px', borderRadius: '4px', textAlign: 'center' }}>TRANSIT</label>
                  <input className="input" style={{ fontSize: '11px', height: '32px', padding: '0 6px' }} placeholder="e.g. 29 days" value={transitTime} onChange={(e) => setTransitTime(e.target.value)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', alignItems: 'center' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)', background: '#e8ecf5', padding: '5px 8px', borderRadius: '4px', textAlign: 'center' }}>ROUTING</label>
                  <input className="input" style={{ fontSize: '11px', height: '32px', padding: '0 6px' }} placeholder="Direct / TS" value={routing} onChange={(e) => setRouting(e.target.value)} />
                </div>
              </div>
              {/* Row 8: VALIDITY TYPE */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', alignItems: 'center' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', alignItems: 'center' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)', background: '#e8ecf5', padding: '5px 8px', borderRadius: '4px', textAlign: 'center' }}>VALIDITY TYPE</label>
                  <select className="input" style={{ fontSize: '11px', height: '32px', padding: '0 4px' }} value={rateType} onChange={(e) => setRateType(e.target.value)}>
                    <option value="Direct Spot">Direct Spot</option>
                    <option value="Contract">Contract</option>
                    <option value="NAC">NAC</option>
                    <option value="Coloader">Coloader</option>
                  </select>
                </div>
                <div />
              </div>
              {/* Row 9: REMARKS full width */}
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '4px', alignItems: 'flex-start' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)', background: '#e8ecf5', padding: '5px 8px', borderRadius: '4px', textAlign: 'center', alignSelf: 'flex-start', marginTop: '2px' }}>REMARKS</label>
                <textarea className="input" style={{ fontSize: '11px', padding: '5px 6px', resize: 'vertical' }} rows={2} placeholder="Surcharges, conditions…" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
              </div>

              {/* Action Buttons: SAVE | UPDATE | CLEAR | DUPLICATE */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginTop: '4px' }}>
                <button className="btn primary" style={{ fontSize: '11.5px', padding: '7px 0', fontWeight: 700, background: '#2e7d32', borderColor: '#2e7d32' }} onClick={handleSaveIRate}>
                  SAVE
                </button>
                <button className="btn secondary" style={{ fontSize: '11.5px', padding: '7px 0', fontWeight: 700 }} onClick={() => {
                  if (!editingRateId) { alert('Select a rate row to update.'); return; }
                  handleSaveIRate();
                }}>
                  UPDATE
                </button>
                <button className="btn secondary" style={{ fontSize: '11.5px', padding: '7px 0', fontWeight: 700, color: '#b45309', borderColor: '#f59e0b', background: '#fffbeb' }} onClick={handleClearForm}>
                  CLEAR
                </button>
                <button className="btn secondary" style={{ fontSize: '11.5px', padding: '7px 0', fontWeight: 700 }} onClick={handleDuplicateSelected}>
                  DUPLICATE
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Table: Rates Matrix */}
        <div className="card" style={{ width: '100%', overflow: 'hidden' }}>

          <div className="cardhead" style={{ flexWrap: 'wrap', gap: '8px' }}>
            <div className="feed-tabs" style={{ margin: 0 }}>
              <button
                className={`feed-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                All Rates ({allAvailableRates.length})
              </button>
              <button
                className={`feed-tab-btn ${activeTab === 'i' ? 'active' : ''}`}
                onClick={() => setActiveTab('i')}
              >
                My i-Rates ({myRates.length})
              </button>
              <button
                className={`feed-tab-btn ${activeTab === 'expiring' ? 'active' : ''}`}
                onClick={() => setActiveTab('expiring')}
              >
                <Clock size={11} style={{ verticalAlign: '-1px' }} /> Expiring Soon (
                {allAvailableRates.filter((r) => isExpiringSoon(r.valid)).length})
              </button>
            </div>

            <div className="feed-search-box" style={{ width: '220px' }}>
              <Search size={13} className="search-icon" />
              <input
                type="text"
                placeholder="Filter port, carrier…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Full-width rates table matching reference image */}
          <div className="tablewrap flush" style={{ overflowX: 'auto', width: '100%' }}>
            <table className="table" style={{ fontSize: '11px', tableLayout: 'auto', width: '100%', borderCollapse: 'collapse', minWidth: '1400px' }}>
              <colgroup>
                <col style={{ width: '36px' }} />
                <col style={{ width: '36px' }} />
                <col style={{ width: '110px' }} />
                <col style={{ width: '80px' }} />
                <col style={{ width: '80px' }} />
                <col style={{ width: '110px' }} />
                <col style={{ width: '110px' }} />
                <col style={{ width: '80px' }} />
                <col style={{ width: '70px' }} />
                <col style={{ width: '80px' }} />
                <col style={{ width: '70px' }} />
                <col style={{ width: '75px' }} />
                <col style={{ width: '80px' }} />
                <col style={{ width: '80px' }} />
                <col style={{ width: '65px' }} />
                <col style={{ width: '120px' }} />
                <col style={{ minWidth: '120px' }} />
                <col style={{ width: '80px' }} />
              </colgroup>
              <thead>
                {/* Header row */}
                <tr style={{ background: '#2c3e7a' }}>
                  <th style={{ color: '#fff', fontSize: '10px', padding: '6px 4px', textAlign: 'center' }}>CMP</th>
                  <th style={{ color: '#fff', fontSize: '10px', padding: '6px 4px', textAlign: 'center' }}>SEQ</th>
                  <th style={{ color: '#fff', fontSize: '10px', padding: '6px 4px' }}>SERVICE PROVIDER</th>
                  <th style={{ color: '#fff', fontSize: '10px', padding: '6px 4px' }}>CARRIER</th>
                  <th style={{ color: '#fff', fontSize: '10px', padding: '6px 4px' }}>POR</th>
                  <th style={{ color: '#fff', fontSize: '10px', padding: '6px 4px' }}>POL</th>
                  <th style={{ color: '#fff', fontSize: '10px', padding: '6px 4px' }}>POD</th>
                  <th style={{ color: '#fff', fontSize: '10px', padding: '6px 4px' }}>FPOD</th>
                  <th style={{ color: '#fff', fontSize: '10px', padding: '6px 4px', textAlign: 'right' }}>20DV (USD)</th>
                  <th style={{ color: '#fff', fontSize: '10px', padding: '6px 4px' }}>20TYPE</th>
                  <th style={{ color: '#fff', fontSize: '10px', padding: '6px 4px', textAlign: 'right' }}>40HC (USD)</th>
                  <th style={{ color: '#fff', fontSize: '10px', padding: '6px 4px' }}>40TYPE</th>
                  <th style={{ color: '#fff', fontSize: '10px', padding: '6px 4px' }}>F/T</th>
                  <th style={{ color: '#fff', fontSize: '10px', padding: '6px 4px' }}>DATE</th>
                  <th style={{ color: '#fff', fontSize: '10px', padding: '6px 4px' }}>TYPE</th>
                  <th style={{ color: '#fff', fontSize: '10px', padding: '6px 4px', textAlign: 'right' }}>TT</th>
                  <th style={{ color: '#fff', fontSize: '10px', padding: '6px 4px' }}>ROUTING</th>
                  <th style={{ color: '#fff', fontSize: '10px', padding: '6px 4px' }}>REMARKS</th>
                  <th style={{ color: '#fff', fontSize: '10px', padding: '6px 4px', textAlign: 'center' }}>ACTION</th>
                </tr>
                {/* Per-column search row */}
                <tr style={{ background: '#dbe3f5' }}>
                  <th />
                  <th />
                  <th><input className="input" style={{ fontSize: '10px', height: '24px', padding: '0 4px', width: '100%' }} placeholder="SEARCH" value={colSearch.sp || ''} onChange={(e) => updateColSearch('sp', e.target.value)} /></th>
                  <th><input className="input" style={{ fontSize: '10px', height: '24px', padding: '0 4px', width: '100%' }} placeholder="SEARCH" value={colSearch.carrier || ''} onChange={(e) => updateColSearch('carrier', e.target.value)} /></th>
                  <th><input className="input" style={{ fontSize: '10px', height: '24px', padding: '0 4px', width: '100%' }} placeholder="SEARCH" value={colSearch.por || ''} onChange={(e) => updateColSearch('por', e.target.value)} /></th>
                  <th><input className="input" style={{ fontSize: '10px', height: '24px', padding: '0 4px', width: '100%' }} placeholder="SEARCH" value={colSearch.pol || ''} onChange={(e) => updateColSearch('pol', e.target.value)} /></th>
                  <th><input className="input" style={{ fontSize: '10px', height: '24px', padding: '0 4px', width: '100%' }} placeholder="SEARCH" value={colSearch.pod || ''} onChange={(e) => updateColSearch('pod', e.target.value)} /></th>
                  <th><input className="input" style={{ fontSize: '10px', height: '24px', padding: '0 4px', width: '100%' }} placeholder="SEARCH" value={colSearch.fpod || ''} onChange={(e) => updateColSearch('fpod', e.target.value)} /></th>
                  <th /><th /><th /><th /><th /><th /><th /><th />
                  <th><input className="input" style={{ fontSize: '10px', height: '24px', padding: '0 4px', width: '100%' }} placeholder="SEARCH" value={colSearch.routing || ''} onChange={(e) => updateColSearch('routing', e.target.value)} /></th>
                  <th><input className="input" style={{ fontSize: '10px', height: '24px', padding: '0 4px', width: '100%' }} placeholder="SEARCH" value={colSearch.remarks || ''} onChange={(e) => updateColSearch('remarks', e.target.value)} /></th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filteredRates.map((rate, idx) => {
                  const isCompared = comparedRateIds.includes(rate.id);
                  const isExpiring = isExpiringSoon(rate.valid);
                  const isOwner = myRates.some((mr) => mr.id === rate.id);

                  return (
                    <tr key={rate.id} style={{ background: isCompared ? '#eff6ff' : idx % 2 === 0 ? '#fff' : '#f7f9fd', cursor: 'default' }}
                      onClick={() => {
                        setCarrier(rate.carrier);
                        setPor(rate.por || '');
                        setPol(rate.pol);
                        setPod(rate.pod);
                        setFpod(rate.fpod || '');
                        setD20(rate.d20);
                        setD20Type(rate.d20Type || '');
                        setH40(rate.h40);
                        setH40Type(rate.h40Type || '');
                        setFreeTime(rate.ft);
                        setValidDate(rate.valid);
                        setTransitTime(rate.tt);
                        setRouting(rate.route);
                        setRateType(rate.rateType || 'Direct Spot');
                        setRemarks(rate.remark);
                        setEditingRateId(rate.id);
                      }}
                    >
                      <td style={{ textAlign: 'center', padding: '5px 4px' }}>
                        <input
                          type="checkbox"
                          checked={isCompared}
                          onChange={(e) => { e.stopPropagation(); handleToggleCompare(rate.id); }}
                          title="Select to compare"
                        />
                      </td>
                      <td style={{ textAlign: 'center', color: 'var(--mut)', padding: '5px 4px', fontSize: '10.5px' }}>{idx + 1}</td>
                      <td style={{ padding: '5px 4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: isOwner ? 700 : 400 }}>{rate.sp}</span>
                        {isOwner && <span style={{ fontSize: '9px', color: 'var(--brand)', display: 'block' }}>i-Rate</span>}
                      </td>
                      <td style={{ padding: '5px 4px', fontWeight: 600, fontSize: '11px' }}>{rate.carrier}</td>
                      <td style={{ padding: '5px 4px', fontSize: '10.5px' }}>{rate.por || rate.pol}</td>
                      <td style={{ padding: '5px 4px', fontSize: '10.5px' }}>{rate.pol}</td>
                      <td style={{ padding: '5px 4px', fontSize: '10.5px' }}>{rate.pod}</td>
                      <td style={{ padding: '5px 4px', fontSize: '10.5px' }}>{rate.fpod || rate.pod}</td>
                      <td style={{ padding: '5px 4px', textAlign: 'right', fontWeight: 700, color: 'var(--brand)', fontSize: '11.5px' }}>${rate.d20.toLocaleString()}</td>
                      <td style={{ padding: '5px 4px', fontSize: '10.5px', color: 'var(--mut)' }}>{rate.d20Type || 'Dry Std'}</td>
                      <td style={{ padding: '5px 4px', textAlign: 'right', fontWeight: 700, color: 'var(--teal)', fontSize: '11.5px' }}>${rate.h40.toLocaleString()}</td>
                      <td style={{ padding: '5px 4px', fontSize: '10.5px', color: 'var(--mut)' }}>{rate.h40Type || 'HC'}</td>
                      <td style={{ padding: '5px 4px', fontSize: '10.5px' }}>{rate.ft}</td>
                      <td style={{ padding: '5px 4px' }}>
                        <span style={{ fontSize: '10px', color: isExpiring ? 'var(--amber)' : 'var(--ink-secondary)', fontWeight: isExpiring ? 700 : 400 }}>{rate.valid}</span>
                      </td>
                      <td style={{ padding: '5px 4px' }}>
                        <span className={`badge ${isOwner ? 'blue' : 'grey'}`} style={{ fontSize: '9px', padding: '2px 5px' }}>{rate.rateType || 'Spot'}</span>
                      </td>
                      <td style={{ padding: '5px 4px', textAlign: 'right', fontSize: '10.5px' }}>{rate.tt}</td>
                      <td style={{ padding: '5px 4px', fontSize: '10.5px', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={rate.route}>{rate.route}</td>
                      <td style={{ padding: '5px 4px', fontSize: '10px', color: 'var(--mut)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={rate.remark}>{rate.remark}</td>
                      <td style={{ padding: '5px 4px' }}>
                        <div style={{ display: 'flex', gap: '3px', justifyContent: 'center' }}>
                          <button className="btn secondary sm" style={{ padding: '2px 5px' }} onClick={(e) => { e.stopPropagation(); setSelectedRateDetail(rate); }} title="View Rate Detail">
                            <Eye size={11} />
                          </button>
                          <button className="btn secondary sm" style={{ padding: '2px 5px' }} onClick={(e) => { e.stopPropagation(); handleCopyQuote(rate); }} title="Copy Structured Quote Breakdown">
                            <Copy size={11} />
                          </button>
                          <button className="btn secondary sm" style={{ padding: '2px 5px' }} onClick={(e) => { e.stopPropagation(); handleOpenEmailModal(rate); }} title="Email Rate Quote to Service Provider">
                            <Mail size={11} />
                          </button>
                          <button className="btn secondary sm" style={{ padding: '2px 5px' }} onClick={(e) => { e.stopPropagation(); handleToggleCompare(rate.id); }} title="Compare">
                            <ArrowRightLeft size={11} />
                          </button>
                          {isOwner && (
                            <button className="btn danger sm" style={{ padding: '2px 5px' }} onClick={(e) => { e.stopPropagation(); deleteMyRate(rate.id); }} title="Delete">
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Pagination footer */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10px 16px', borderTop: '1px solid var(--line)', gap: '12px', fontSize: '12px', color: 'var(--mut)' }}>
            <span>Showing {filteredRates.length} of {allAvailableRates.length} rates</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              {['‹ Prev', '1', '2', '3', '4', '5', '…', 'Next ›'].map((p, i) => (
                <button key={i} className="btn secondary sm" style={{ fontSize: '11px', padding: '2px 7px', minWidth: 'unset' }}>{p}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
